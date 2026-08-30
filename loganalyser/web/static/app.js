"use strict";

const $ = (sel) => document.querySelector(sel);
const drop = $("#drop"), fileInput = $("#file"), runBtn = $("#run");
const results = $("#results"), errorBox = $("#error");
let chosenFile = null;

/* ---------- input handling ---------- */
drop.addEventListener("click", () => fileInput.click());
["dragenter", "dragover"].forEach(ev =>
  drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(ev =>
  drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", e => { if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]); });
fileInput.addEventListener("change", () => { if (fileInput.files.length) setFile(fileInput.files[0]); });

function setFile(file) {
  chosenFile = file;
  drop.querySelector("strong").textContent = file.name;
  drop.querySelector("span").textContent = fmtBytes(file.size) + " — ready to analyse";
  runBtn.disabled = false;
}

$("#toggle-paste").addEventListener("click", () => {
  $("#paste-area").classList.toggle("hidden");
  $("#text").focus();
});
$("#text").addEventListener("input", e => { runBtn.disabled = !e.target.value.trim() && !chosenFile; });

runBtn.addEventListener("click", analyse);

async function analyse() {
  const body = new FormData();
  if (chosenFile) body.append("file", chosenFile);
  else body.append("text", $("#text").value);
  body.append("format", $("#format").value);
  body.append("use_ai", $("#use-ai").checked ? "1" : "0");

  runBtn.disabled = true;
  runBtn.innerHTML = '<span class="spinner"></span> Analysing';
  errorBox.classList.add("hidden");

  try {
    const res = await fetch("/api/analyse", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    render(data);
  } catch (err) {
    results.classList.add("hidden");
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "Analyse";
  }
}

/* ---------- formatting helpers ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmtBytes(n) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}
function fmtTime(iso, withDate) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const t = d.toLocaleTimeString([], { hour12: false });
  return withDate ? `${d.toLocaleDateString()} ${t}` : t;
}
function fmtDuration(seconds) {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.round(seconds % 60);
  return [h && `${h}h`, m && `${m}m`, (s || (!h && !m)) && `${s}s`].filter(Boolean).join(" ");
}

/* ---------- rendering ---------- */
function render(data) {
  const t = data.totals;
  const parts = [];

  parts.push(`<div class="panel pad headline">
      <h2>${esc(data.headline)}</h2>
      <p>${esc(data.filename || "log")} — read as <strong>${esc(data.detected_format)}</strong>,
         covering ${fmtTime(data.span.start, true)} to ${fmtTime(data.span.end, true)}
         (${fmtDuration(data.span.duration_seconds)})
         ${data.truncated_lines ? ` — first ${t.records.toLocaleString()} records only, ${data.truncated_lines.toLocaleString()} lines skipped` : ""}
      </p>
    </div>`);

  parts.push(`<div class="stats">
      ${stat(t.records.toLocaleString(), "records")}
      ${stat(t.errors.toLocaleString(), "errors", "err")}
      ${stat(t.warnings.toLocaleString(), "warnings", "warn")}
      ${stat(t.distinct_problems.toLocaleString(), "distinct problems")}
      ${stat(data.incidents.length, "incidents")}
    </div>`);

  if (data.timeline.buckets.length > 1) {
    parts.push(`<div class="section-title">When it went wrong</div>
      <div class="panel pad">${chart(data)}</div>`);
  }

  if (data.incidents.length) {
    parts.push(`<div class="section-title">Incidents</div><div class="panel pad">${
      data.incidents.map(i => `<div style="margin:4px 0">
        <strong>${fmtTime(i.start, true)}</strong> — ${i.error_count} errors over ${fmtDuration(i.duration_seconds)}
        (peak ${i.peak} in one interval)${i.first_error_line ? `, from line ${i.first_error_line}` : ""}
      </div>`).join("")
    }</div>`);
  }

  parts.push(`<div class="section-title">Problems, most likely cause first</div>
    <div class="filters">
      <input type="search" id="filter" placeholder="Filter problems…">
      <label class="check"><input type="checkbox" id="hide-cascade"> Hide downstream symptoms</label>
      <label class="check"><input type="checkbox" id="errors-only"> Errors only</label>
    </div>
    <div id="groups">${data.groups.map(groupCard).join("") || '<div class="panel empty">No warnings or errors found.</div>'}</div>
    ${data.truncated_groups ? `<div class="hint">${data.truncated_groups} further distinct problems not shown.</div>` : ""}`);

  results.innerHTML = parts.join("");
  results.classList.remove("hidden");
  wireFilters();
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

const stat = (n, k, cls = "") =>
  `<div class="panel stat ${cls}"><div class="n">${n}</div><div class="k">${k}</div></div>`;

function chart(data) {
  const buckets = data.timeline.buckets;
  const W = 1000, H = 132, padB = 20, padT = 8;
  const max = Math.max(1, ...buckets.map(b => b.total));
  const bw = W / buckets.length;
  const y = (v) => padT + (H - padB - padT) * (1 - v / max);

  const bars = buckets.map((b, i) => {
    const x = i * bw, w = Math.max(bw - 0.6, 0.8);
    const seg = (val, cls, base) => val
      ? `<rect class="${cls}" x="${x.toFixed(2)}" y="${y(base + val).toFixed(2)}"
             width="${w.toFixed(2)}" height="${((H - padB - padT) * val / max).toFixed(2)}"><title>${
             fmtTime(b.start, true)} — ${b.total} records, ${b.errors} errors, ${b.warnings} warnings</title></rect>`
      : "";
    const other = b.total - b.errors - b.warnings;
    return seg(other, "bar-total", b.errors + b.warnings) +
           seg(b.warnings, "bar-warn", b.errors) +
           seg(b.errors, "bar-err", 0);
  }).join("");

  const ticks = [0, Math.floor(buckets.length / 2), buckets.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(i => `<text class="axis" x="${Math.min(Math.max(i * bw, 2), W - 46).toFixed(1)}"
                     y="${H - 6}">${fmtTime(buckets[i].start)}</text>`).join("");

  return `<svg id="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
            role="img" aria-label="Log volume over time, errors highlighted">
      ${bars}<line x1="0" y1="${H - padB}" x2="${W}" y2="${H - padB}" stroke="var(--border)"/>${ticks}
    </svg>
    <div class="hint">Each bar is ${fmtDuration(data.timeline.bucket_seconds)}. Red = errors, amber = warnings.</div>`;
}

function groupCard(g, index) {
  const rule = g.rule;
  const sev = g.is_cascade ? "cascade" : (rule ? rule.severity : "medium");
  const title = rule ? rule.title : (g.trace?.root_exception || "Unrecognised error");

  const tags = [
    `<span class="tag count">${g.count}×</span>`,
    `<span class="tag">${esc(g.level)}</span>`,
    g.first_seen ? `<span class="tag">first ${fmtTime(g.first_seen)}</span>` : "",
    `<span class="tag">line ${g.first_line}</span>`,
    g.logger ? `<span class="tag">${esc(g.logger)}</span>` : "",
    g.event_id ? `<span class="tag">Event ID ${esc(g.event_id)}</span>` : "",
    g.rule_source === "ai" ? `<span class="tag ai">AI explained</span>` : "",
    g.is_cascade ? `<span class="tag cascade">likely a downstream symptom</span>` : "",
  ].filter(Boolean).join("");

  const list = (items, heading) => items?.length
    ? `<h4>${heading}</h4><ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : "";

  let trace = "";
  if (g.trace) {
    const frames = (g.trace.frames || []).map(f =>
      f === g.trace.culprit ? `<span class="culprit">${esc(f)}</span>` : esc(f)).join("\n  at ");
    trace = `<h4>Stack trace</h4><pre class="trace">${esc(g.trace.exception || "")}${
      g.trace.exception_detail ? ": " + esc(g.trace.exception_detail) : ""}${
      frames ? "\n  at " + frames : ""}${
      g.trace.causes?.length ? "\nCaused by: " + g.trace.causes.map(esc).join("\nCaused by: ") : ""}</pre>`;
    if (g.trace.culprit) {
      trace += `<div class="hint">Most likely the line to look at: <span class="culprit mono">${esc(g.trace.culprit)}</span></div>`;
    }
  }

  const detail = g.detail && !g.trace
    ? `<h4>Detail</h4><pre class="trace">${esc(g.detail.slice(0, 1500))}</pre>` : "";

  return `<details class="panel group" data-search="${esc((title + " " + g.message + " " + g.signature).toLowerCase())}"
            data-cascade="${g.is_cascade}" data-level="${esc(g.level)}" ${index === 0 ? "open" : ""}>
    <summary>
      <span class="rank">${index + 1}</span>
      <span class="sev ${sev}"></span>
      <span class="g-main">
        <div class="g-title">${esc(title)}</div>
        <div class="g-msg">${esc(g.message.slice(0, 240))}</div>
        <div class="g-meta">${tags}</div>
      </span>
    </summary>
    <div class="body">
      ${rule ? `<p class="meaning">${esc(rule.meaning)}</p>` : `<p class="meaning">No known signature matched this error. The stack trace and surrounding lines below are the best place to start.</p>`}
      ${list(rule?.causes, "Common causes")}
      ${list(rule?.checks, "What to check next")}
      ${list(g.reasons, "Why this is ranked here")}
      ${trace}${detail}
      <h4>Occurrences</h4>
      <div class="hint">${g.count}× between ${fmtTime(g.first_seen, true)} and ${fmtTime(g.last_seen, true)}${
        g.hosts?.length ? ` on ${g.hosts.map(esc).join(", ")}` : ""} — lines ${g.lines.slice(0, 20).join(", ")}${
        g.lines.length < g.count ? ", …" : ""}</div>
    </div>
  </details>`;
}

/* ---------- filtering ---------- */
function wireFilters() {
  const filter = $("#filter"), hideCascade = $("#hide-cascade"), errorsOnly = $("#errors-only");
  const apply = () => {
    const q = filter.value.trim().toLowerCase();
    document.querySelectorAll(".group").forEach(el => {
      const okText = !q || el.dataset.search.includes(q);
      const okCascade = !hideCascade.checked || el.dataset.cascade !== "true";
      const okLevel = !errorsOnly.checked || !["WARN", "NOTICE"].includes(el.dataset.level);
      el.classList.toggle("hidden", !(okText && okCascade && okLevel));
    });
  };
  [filter, hideCascade, errorsOnly].forEach(el => el.addEventListener("input", apply));
}
