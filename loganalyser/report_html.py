"""Render a Report as a single self-contained HTML file.

Everything - CSS, the timeline chart, the small filter script - is inlined,
so the file opens from disk, from an email attachment, or on a tablet with
no server and no network. Nothing is fetched at view time.

The content is rendered server-side into real HTML rather than hydrated by
JavaScript, so the report is still fully readable with scripting disabled;
the inline script only adds filtering.
"""
from __future__ import annotations

import html
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

_STATIC = Path(__file__).parent / "web" / "static"

# Kept small and inline: filtering is a convenience, never a requirement.
_SCRIPT = """
(function () {
  var filter = document.getElementById('filter');
  var cascade = document.getElementById('hide-cascade');
  var errors = document.getElementById('errors-only');
  if (!filter) return;
  var groups = Array.prototype.slice.call(document.querySelectorAll('.group'));
  function apply() {
    var q = filter.value.trim().toLowerCase();
    groups.forEach(function (el) {
      var okText = !q || el.dataset.search.indexOf(q) !== -1;
      var okCascade = !cascade.checked || el.dataset.cascade !== 'true';
      var okLevel = !errors.checked || ['WARN', 'NOTICE'].indexOf(el.dataset.level) === -1;
      el.classList.toggle('hidden', !(okText && okCascade && okLevel));
    });
  }
  [filter, cascade, errors].forEach(function (el) {
    el.addEventListener('input', apply);
  });
})();
"""


def _e(value) -> str:
    return html.escape("" if value is None else str(value), quote=True)


def _fmt_time(iso: Optional[str], with_date: bool = False) -> str:
    if not iso:
        return "&mdash;"
    try:
        moment = datetime.fromisoformat(iso)
    except (ValueError, TypeError):
        return _e(iso)
    return moment.strftime("%Y-%m-%d %H:%M:%S" if with_date else "%H:%M:%S")


def _fmt_duration(seconds: Optional[float]) -> str:
    seconds = int(seconds or 0)
    if seconds <= 0:
        return "0s"
    hours, rest = divmod(seconds, 3600)
    minutes, secs = divmod(rest, 60)
    parts = []
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    if secs or not parts:
        parts.append(f"{secs}s")
    return " ".join(parts)


def _stat(number, label, css: str = "") -> str:
    return (f'<div class="panel stat {css}"><div class="n">{_e(number)}</div>'
            f'<div class="k">{_e(label)}</div></div>')


def _chart(timeline: dict) -> str:
    """Inline SVG bar chart - no chart library, no runtime dependency."""
    buckets = timeline.get("buckets") or []
    if len(buckets) < 2:
        return ""
    width, height, pad_bottom, pad_top = 1000, 132, 20, 8
    peak = max(1, max(b["total"] for b in buckets))
    bar_width = width / len(buckets)
    plot = height - pad_bottom - pad_top

    def y_for(value):
        return pad_top + plot * (1 - value / peak)

    pieces = []
    for index, bucket in enumerate(buckets):
        x = index * bar_width
        w = max(bar_width - 0.6, 0.8)
        other = bucket["total"] - bucket["errors"] - bucket["warnings"]
        stack = (
            (other, "bar-total", bucket["errors"] + bucket["warnings"]),
            (bucket["warnings"], "bar-warn", bucket["errors"]),
            (bucket["errors"], "bar-err", 0),
        )
        title = (f'{_fmt_time(bucket["start"], True)} &mdash; {bucket["total"]} records, '
                 f'{bucket["errors"]} errors, {bucket["warnings"]} warnings')
        for value, css, base in stack:
            if value <= 0:
                continue
            pieces.append(
                f'<rect class="{css}" x="{x:.2f}" y="{y_for(base + value):.2f}" '
                f'width="{w:.2f}" height="{plot * value / peak:.2f}">'
                f'<title>{title}</title></rect>')

    ticks = []
    for index in sorted({0, len(buckets) // 2, len(buckets) - 1}):
        tick_x = min(max(index * bar_width, 2), width - 46)
        ticks.append(f'<text class="axis" x="{tick_x:.1f}" y="{height - 6}">'
                     f'{_fmt_time(buckets[index]["start"])}</text>')

    return (
        f'<div class="section-title">When it went wrong</div><div class="panel pad">'
        f'<svg id="chart" viewBox="0 0 {width} {height}" preserveAspectRatio="none" '
        f'role="img" aria-label="Log volume over time, errors highlighted">'
        f'{"".join(pieces)}'
        f'<line x1="0" y1="{height - pad_bottom}" x2="{width}" y2="{height - pad_bottom}" '
        f'stroke="var(--border)"/>{"".join(ticks)}</svg>'
        f'<div class="hint">Each bar is {_fmt_duration(timeline.get("bucket_seconds"))}. '
        f'Red = errors, amber = warnings.</div></div>')


def _bullets(items: Optional[List[str]], heading: str) -> str:
    if not items:
        return ""
    entries = "".join(f"<li>{_e(item)}</li>" for item in items)
    return f"<h4>{_e(heading)}</h4><ul>{entries}</ul>"


def _trace_block(group: dict) -> str:
    trace = group.get("trace")
    if not trace:
        detail = (group.get("detail") or "").strip()
        if not detail:
            return ""
        return f'<h4>Detail</h4><pre class="trace">{_e(detail[:1500])}</pre>'

    lines = []
    head = trace.get("exception") or ""
    if trace.get("exception_detail"):
        head = f"{head}: {trace['exception_detail']}" if head else trace["exception_detail"]
    if head:
        lines.append(_e(head))
    culprit = trace.get("culprit")
    for frame in trace.get("frames") or []:
        rendered = _e(frame)
        if culprit and frame == culprit:
            rendered = f'<span class="culprit">{rendered}</span>'
        lines.append(f"  at {rendered}")
    for cause in trace.get("causes") or []:
        lines.append(f"Caused by: {_e(cause)}")

    block = f'<h4>Stack trace</h4><pre class="trace">{chr(10).join(lines)}</pre>'
    if culprit:
        block += (f'<div class="hint">Most likely the line to look at: '
                  f'<span class="culprit mono">{_e(culprit)}</span></div>')
    return block


def _group_card(group: dict, index: int) -> str:
    rule = group.get("rule")
    cascade = bool(group.get("is_cascade"))
    severity = "cascade" if cascade else (rule.get("severity") if rule else "medium")
    title = rule["title"] if rule else (
        (group.get("trace") or {}).get("root_exception") or "Unrecognised error")

    tags = [f'<span class="tag count">{group["count"]}&times;</span>',
            f'<span class="tag">{_e(group["level"])}</span>']
    if group.get("first_seen"):
        tags.append(f'<span class="tag">first {_fmt_time(group["first_seen"])}</span>')
    tags.append(f'<span class="tag">line {group["first_line"]}</span>')
    if group.get("logger"):
        tags.append(f'<span class="tag">{_e(group["logger"])}</span>')
    if group.get("event_id"):
        tags.append(f'<span class="tag">Event ID {_e(group["event_id"])}</span>')
    if group.get("rule_source") == "ai":
        tags.append('<span class="tag ai">AI explained</span>')
    if cascade:
        tags.append('<span class="tag cascade">likely a downstream symptom</span>')

    meaning = (rule["meaning"] if rule else
               "No known signature matched this error. The stack trace and "
               "surrounding lines below are the best place to start.")

    lines = group.get("lines") or []
    shown = ", ".join(str(n) for n in lines[:20]) + (", &hellip;" if len(lines) < group["count"] else "")
    hosts = group.get("hosts") or []
    where = f" on {_e(', '.join(hosts))}" if hosts else ""

    search = _e(f"{title} {group.get('message', '')} {group.get('signature', '')}".lower())

    return f'''<details class="panel group" data-search="{search}"
  data-cascade="{str(cascade).lower()}" data-level="{_e(group["level"])}" {"open" if index == 0 else ""}>
  <summary>
    <span class="rank">{index + 1}</span>
    <span class="sev {_e(severity)}"></span>
    <span class="g-main">
      <div class="g-title">{_e(title)}</div>
      <div class="g-msg">{_e((group.get("message") or "")[:240])}</div>
      <div class="g-meta">{"".join(tags)}</div>
    </span>
  </summary>
  <div class="body">
    <p class="meaning">{_e(meaning)}</p>
    {_bullets(rule.get("causes") if rule else None, "Common causes")}
    {_bullets(rule.get("checks") if rule else None, "What to check next")}
    {_bullets(group.get("reasons"), "Why this is ranked here")}
    {_trace_block(group)}
    <h4>Occurrences</h4>
    <div class="hint">{group["count"]}&times; between {_fmt_time(group.get("first_seen"), True)}
      and {_fmt_time(group.get("last_seen"), True)}{where} &mdash; lines {shown}</div>
  </div>
</details>'''


def render(report, max_groups: int = 200) -> str:
    """Build the complete standalone HTML document for a Report."""
    data = report.to_dict(max_groups=max_groups)
    totals = data["totals"]
    span = data["span"]
    css = (_STATIC / "report.css").read_text(encoding="utf-8")
    generated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    incidents = ""
    if data["incidents"]:
        rows = []
        for item in data["incidents"]:
            origin = ""
            if item.get("first_error_line"):
                origin = f', from line {item["first_error_line"]}'
            rows.append(
                f'<div style="margin:4px 0">'
                f'<strong>{_fmt_time(item["start"], True)}</strong> &mdash; '
                f'{item["error_count"]} errors over {_fmt_duration(item["duration_seconds"])} '
                f'(peak {item["peak"]} in one interval){origin}</div>')
        incidents = ('<div class="section-title">Incidents</div>'
                     f'<div class="panel pad">{"".join(rows)}</div>')

    cards = "".join(_group_card(g, i) for i, g in enumerate(data["groups"]))
    if not cards:
        cards = '<div class="panel empty">No warnings or errors found.</div>'

    truncated = ""
    if data.get("truncated_groups"):
        truncated = (f'<div class="hint">{data["truncated_groups"]} further distinct '
                     f'problems are not shown in this export.</div>')

    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Log report &mdash; {_e(data.get("filename") or "log")}</title>
<style>
{css}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <h1>Log Analyser report</h1>
    <span class="sub">{_e(data.get("filename") or "log")} &middot; generated {generated}</span>
  </header>

  <div class="panel pad headline">
    <h2>{_e(data["headline"])}</h2>
    <p>Read as <strong>{_e(data["detected_format"])}</strong>, covering
      {_fmt_time(span.get("start"), True)} to {_fmt_time(span.get("end"), True)}
      ({_fmt_duration(span.get("duration_seconds"))}).</p>
  </div>

  <div class="stats">
    {_stat(f'{totals["records"]:,}', "records")}
    {_stat(f'{totals["errors"]:,}', "errors", "err")}
    {_stat(f'{totals["warnings"]:,}', "warnings", "warn")}
    {_stat(f'{totals["distinct_problems"]:,}', "distinct problems")}
    {_stat(len(data["incidents"]), "incidents")}
  </div>

  {_chart(data["timeline"])}
  {incidents}

  <div class="section-title">Problems, most likely cause first</div>
  <div class="filters no-print">
    <input type="search" id="filter" placeholder="Filter problems&hellip;">
    <label class="check"><input type="checkbox" id="hide-cascade"> Hide downstream symptoms</label>
    <label class="check"><input type="checkbox" id="errors-only"> Errors only</label>
  </div>
  {cards}
  {truncated}

  <div class="hint" style="margin-top:26px">
    Generated by Log Analyser. This file is self-contained &mdash; it needs no
    network connection and can be emailed or archived as-is.
  </div>
</div>
<script>{_SCRIPT}</script>
</body>
</html>
'''


def write(report, path: Path, max_groups: int = 200) -> Path:
    path = Path(path)
    path.write_text(render(report, max_groups=max_groups), encoding="utf-8")
    return path
