"""The analysis engine: raw log text in, structured findings out.

Pipeline
    parse -> enrich (stack traces + rules) -> group -> timeline
          -> incidents -> rank root-cause candidates -> report
"""
from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Sequence

from ..parsers.base import LEVEL_RANK, LogEntry, is_error
from ..parsers.detect import parse_lines
from ..rules.loader import Rule, RuleEngine
from . import fingerprint as fp
from . import stacktrace, timeline

_SEVERITY_WEIGHT = {"critical": 4.0, "high": 3.0, "medium": 1.5, "low": 0.5}


@dataclass
class ErrorGroup:
    """One distinct failure, and every occurrence of it."""

    key: str
    signature: str
    level: str
    count: int = 0
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    first_line: int = 0
    sample: Optional[LogEntry] = None
    trace: Optional[stacktrace.StackTrace] = None
    rules: List[Rule] = field(default_factory=list)
    loggers: Counter = field(default_factory=Counter)
    hosts: Counter = field(default_factory=Counter)
    lines: List[int] = field(default_factory=list)
    score: float = 0.0
    reasons: List[str] = field(default_factory=list)
    explanation: Optional[object] = None   # set by the optional AI layer

    @property
    def rule(self) -> Optional[Rule]:
        return self.rules[0] if self.rules else None

    @property
    def explained_by(self) -> Optional[dict]:
        """Rule match if we have one, otherwise an AI explanation if present."""
        if self.rules:
            return self.rules[0].to_dict()
        if self.explanation is not None:
            return self.explanation.to_dict()
        return None

    @property
    def is_cascade(self) -> bool:
        return bool(self.rule and self.rule.cascade)

    def add(self, entry: LogEntry) -> None:
        self.count += 1
        if entry.timestamp:
            if self.first_seen is None or entry.timestamp < self.first_seen:
                self.first_seen = entry.timestamp
            if self.last_seen is None or entry.timestamp > self.last_seen:
                self.last_seen = entry.timestamp
        if entry.logger:
            self.loggers[entry.logger] += 1
        if entry.host:
            self.hosts[entry.host] += 1
        if len(self.lines) < 50:
            self.lines.append(entry.line_no)

    def to_dict(self) -> dict:
        rule = self.rule
        return {
            "key": self.key,
            "signature": self.signature,
            "level": self.level,
            "count": self.count,
            "first_seen": self.first_seen.isoformat() if self.first_seen else None,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "first_line": self.first_line,
            "lines": self.lines,
            "message": self.sample.message if self.sample else "",
            "detail": (self.sample.detail if self.sample else "")[:4000],
            "event_id": self.sample.event_id if self.sample else None,
            "logger": self.loggers.most_common(1)[0][0] if self.loggers else None,
            "hosts": [h for h, _ in self.hosts.most_common(5)],
            "trace": self.trace.to_dict() if self.trace else None,
            "rule": self.explained_by,
            "rule_source": "rules" if rule else ("ai" if self.explanation else None),
            "other_rules": [r.to_dict() for r in self.rules[1:3]],
            "score": round(self.score, 2),
            "reasons": self.reasons,
            "is_cascade": self.is_cascade,
        }


class Analyser:
    def __init__(self, rule_engine: Optional[RuleEngine] = None,
                 extra_rule_dirs: Optional[Sequence[Path]] = None):
        self.rules = rule_engine or RuleEngine(extra_dirs=extra_rule_dirs)

    # -- enrichment ---------------------------------------------------------------
    def _enrich(self, entries: List[LogEntry]) -> None:
        """Attach stack-trace and rule information to each record."""
        for entry in entries:
            text = entry.full_text
            entry.extra["_trace"] = stacktrace.parse(text) if entry.detail or entry.is_error else None
            # Run rule matching on warnings and above, on anything carrying an
            # exception, and on records with no severity field at all. That
            # last case matters: kernel syslog lines like "Out of memory:
            # Killed process" carry no level, and skipping them would hide
            # the single most important event in the file.
            level_rank = LEVEL_RANK.get(entry.level or "", -1)
            if level_rank >= LEVEL_RANK["WARN"] or entry.extra["_trace"] or entry.level is None:
                entry.extra["_rules"] = self.rules.match(text[:6000], entry.event_id, entry.logger)
            else:
                entry.extra["_rules"] = []

            # A serious known signature promotes an unlabelled record so it
            # is counted and ranked rather than silently dropped.
            if entry.level is None and entry.extra["_rules"]:
                top = entry.extra["_rules"][0]
                if top.severity == "critical":
                    entry.level = "CRITICAL"
                elif top.severity == "high":
                    entry.level = "ERROR"
                elif top.severity == "medium":
                    entry.level = "WARN"

    # -- grouping -----------------------------------------------------------------
    def _group(self, entries: List[LogEntry]) -> List[ErrorGroup]:
        groups: Dict[str, ErrorGroup] = {}
        for entry in entries:
            if LEVEL_RANK.get(entry.level or "", -1) < LEVEL_RANK["WARN"]:
                continue
            trace = entry.extra.get("_trace")
            exception = trace.root_exception if trace else ""
            culprit = str(trace.culprit) if trace and trace.culprit else ""
            key = fp.fingerprint(entry.message, entry.detail, exception or "", culprit)

            group = groups.get(key)
            if group is None:
                group = ErrorGroup(
                    key=key,
                    signature=fp.signature(entry.message, entry.detail, exception or "", culprit),
                    level=entry.level or "ERROR",
                    first_line=entry.line_no,
                    sample=entry,
                    trace=trace,
                    rules=list(entry.extra.get("_rules") or []),
                )
                groups[key] = group
            else:
                # Keep the richest sample - the one that carries a stack trace.
                if group.trace is None and trace is not None:
                    group.trace, group.sample = trace, entry
                if not group.rules and entry.extra.get("_rules"):
                    group.rules = list(entry.extra["_rules"])
                if LEVEL_RANK.get(entry.level or "", -1) > LEVEL_RANK.get(group.level, -1):
                    group.level = entry.level
            group.add(entry)
        return list(groups.values())

    # -- ranking ------------------------------------------------------------------
    def _score(self, groups: List[ErrorGroup], incidents: List[timeline.Incident],
               span_start: Optional[datetime]) -> None:
        """Rank groups by how likely each is to be the thing that started it.

        Earliest-in-the-incident matters most: the failure that fires first is
        usually the cause and the rest are consequences of it.
        """
        window_start = incidents[0].start if incidents else span_start

        for group in groups:
            score = 0.0
            reasons: List[str] = []

            rule = group.rule
            if rule:
                score += _SEVERITY_WEIGHT.get(rule.severity, 1.0) * rule.confidence
                reasons.append(f"Matches known signature: {rule.title}")

            if is_error(group.level):
                score += 1.0
            if group.level in ("CRITICAL", "FATAL"):
                score += 1.0

            # Onset relative to the incident: the first thing to break leads.
            if window_start and group.first_seen:
                delta = (group.first_seen - window_start).total_seconds()
                if delta <= 0:
                    score += 3.0
                    reasons.append("Was already failing when the incident began")
                elif delta <= 60:
                    score += 3.0 - (delta / 60.0)
                    reasons.append(f"Started {int(delta)}s into the incident")

            # A trace pointing at a specific line is actionable.
            if group.trace and group.trace.culprit and not group.trace.culprit.is_library:
                score += 0.75
                reasons.append(f"Points at {group.trace.culprit}")
            if group.trace and group.trace.causes:
                score += 0.5
                reasons.append(f"Underlying cause: {group.trace.root_exception}")

            # Volume helps, with diminishing returns so a noisy warning does
            # not outrank a single fatal error.
            if group.count > 1:
                score += min(1.5, 0.35 * (group.count ** 0.5))

            # Symptoms (timeouts, retries, breakers) are demoted: they are
            # what the real fault looks like from downstream.
            if group.is_cascade:
                score -= 2.0
                reasons.append("Looks like a downstream symptom rather than the cause")

            group.score = max(score, 0.0)
            group.reasons = reasons

        groups.sort(key=lambda g: (g.score, g.count), reverse=True)

    # -- public API ---------------------------------------------------------------
    def analyse(self, lines: List[str], fmt: Optional[str] = None,
                filename: Optional[str] = None) -> "Report":
        entries, detected, confidence = parse_lines(lines, fmt)
        self._enrich(entries)

        # Sort by time where available so timeline and onset logic are correct.
        if any(e.timestamp for e in entries):
            entries.sort(key=lambda e: (e.timestamp is None, e.timestamp or datetime.min, e.line_no))

        groups = self._group(entries)
        buckets, width = timeline.build(entries)
        incidents = timeline.find_incidents(entries, buckets, width) if buckets else []
        span = timeline.summarise_span(entries)
        start = None
        if span["start"]:
            start = datetime.fromisoformat(span["start"])
        self._score(groups, incidents, start)

        return Report(
            filename=filename,
            entries=entries,
            groups=groups,
            buckets=buckets,
            bucket_seconds=width,
            incidents=incidents,
            span=span,
            detected_format=detected,
            format_confidence=confidence,
        )

    def analyse_text(self, text: str, **kwargs) -> "Report":
        return self.analyse(text.splitlines(), **kwargs)


@dataclass
class Report:
    filename: Optional[str]
    entries: List[LogEntry]
    groups: List[ErrorGroup]
    buckets: List[timeline.Bucket]
    bucket_seconds: int
    incidents: List[timeline.Incident]
    span: dict
    detected_format: str
    format_confidence: float

    @property
    def level_counts(self) -> Dict[str, int]:
        counts = Counter(e.level or "UNKNOWN" for e in self.entries)
        return dict(counts)

    @property
    def error_count(self) -> int:
        return sum(1 for e in self.entries if is_error(e.level))

    @property
    def warning_count(self) -> int:
        return sum(1 for e in self.entries if e.level == "WARN")

    @property
    def root_cause(self) -> Optional[ErrorGroup]:
        """Best candidate for what started the trouble."""
        real = [g for g in self.groups if is_error(g.level) and not g.is_cascade]
        return (real or self.groups or [None])[0]

    def headline(self) -> str:
        """One sentence a support engineer can paste into a ticket."""
        if not self.groups:
            return "No warnings or errors were found in this log."
        cause = self.root_cause
        if cause is None:
            return "No errors were found, but some warnings were logged."
        when = cause.first_seen.strftime("%Y-%m-%d %H:%M:%S") if cause.first_seen else f"line {cause.first_line}"
        what = cause.rule.title if cause.rule else (
            cause.trace.root_exception if cause.trace and cause.trace.root_exception
            else cause.sample.message[:120] if cause.sample else cause.signature[:120])
        times = "once" if cause.count == 1 else f"{cause.count} times"
        return f"Most likely starting point: {what} - first seen at {when}, occurring {times}."

    def to_dict(self, max_groups: int = 60, max_context: int = 0) -> dict:
        return {
            "filename": self.filename,
            "detected_format": self.detected_format,
            "format_confidence": round(self.format_confidence, 2),
            "headline": self.headline(),
            "span": self.span,
            "totals": {
                "records": len(self.entries),
                "errors": self.error_count,
                "warnings": self.warning_count,
                "distinct_problems": len(self.groups),
                "levels": self.level_counts,
            },
            "timeline": {
                "bucket_seconds": self.bucket_seconds,
                "buckets": [b.to_dict() for b in self.buckets],
            },
            "incidents": [i.to_dict() for i in self.incidents],
            "root_cause": self.root_cause.to_dict() if self.root_cause else None,
            "groups": [g.to_dict() for g in self.groups[:max_groups]],
            "truncated_groups": max(0, len(self.groups) - max_groups),
        }
