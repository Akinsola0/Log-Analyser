"""Timeline bucketing and incident (error burst) detection.

The first question on any support ticket is "when did it start going
wrong". We bucket the log by time, find the stretches where errors spike
above the file's own baseline, and call those incidents.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional, Sequence

from ..parsers.base import LogEntry, is_error, is_warn_or_worse

# Candidate bucket widths, smallest first.
_WIDTHS = [1, 5, 15, 30, 60, 300, 900, 1800, 3600, 10800, 21600, 86400]


@dataclass
class Bucket:
    start: datetime
    total: int = 0
    errors: int = 0
    warnings: int = 0

    def to_dict(self) -> dict:
        return {"start": self.start.isoformat(), "total": self.total,
                "errors": self.errors, "warnings": self.warnings}


@dataclass
class Incident:
    start: datetime
    end: datetime
    error_count: int
    peak: int
    entries: List[LogEntry] = field(default_factory=list)

    @property
    def duration_seconds(self) -> float:
        return max((self.end - self.start).total_seconds(), 0.0)

    def to_dict(self) -> dict:
        return {
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "duration_seconds": self.duration_seconds,
            "error_count": self.error_count,
            "peak": self.peak,
            "first_error_line": self.entries[0].line_no if self.entries else None,
        }


def choose_width(span_seconds: float, target_buckets: int = 60) -> int:
    """Pick a bucket width that yields roughly `target_buckets` columns."""
    if span_seconds <= 0:
        return 1
    ideal = span_seconds / target_buckets
    for width in _WIDTHS:
        if width >= ideal:
            return width
    return _WIDTHS[-1]


def _floor(moment: datetime, width: int, origin: datetime) -> datetime:
    offset = int((moment - origin).total_seconds() // width) * width
    return origin + timedelta(seconds=offset)


def build(entries: Sequence[LogEntry], target_buckets: int = 60):
    """Return (buckets, width_seconds) for entries that carry a timestamp."""
    timed = [e for e in entries if e.timestamp]
    if not timed:
        return [], 0

    start, end = timed[0].timestamp, timed[-1].timestamp
    if end < start:
        start, end = end, start
    width = choose_width((end - start).total_seconds(), target_buckets)
    origin = _floor(start, width, start)

    buckets: List[Bucket] = []
    index = {}
    cursor = origin
    while cursor <= end:
        index[cursor] = len(buckets)
        buckets.append(Bucket(start=cursor))
        cursor += timedelta(seconds=width)
    if not buckets:
        buckets.append(Bucket(start=origin))
        index[origin] = 0

    for entry in timed:
        slot = index.get(_floor(entry.timestamp, width, origin))
        if slot is None:
            continue
        bucket = buckets[slot]
        bucket.total += 1
        if is_error(entry.level):
            bucket.errors += 1
        elif entry.level == "WARN":
            bucket.warnings += 1
    return buckets, width


def find_incidents(entries: Sequence[LogEntry], buckets: Sequence[Bucket],
                   width: int, max_incidents: int = 5) -> List[Incident]:
    """Group error spikes into incidents.

    A bucket is 'hot' when its error count clears both the file's own
    average and a small absolute floor, so a log that is uniformly noisy
    doesn't report every bucket as an incident.
    """
    errored = [b for b in buckets if b.errors]
    if not errored:
        return []

    counts = sorted(b.errors for b in buckets)
    median = counts[len(counts) // 2]
    mean = sum(counts) / len(counts)
    threshold = max(median * 2, mean * 1.5, 1)

    runs: List[List[Bucket]] = []
    current: List[Bucket] = []
    gap = 0
    for bucket in buckets:
        if bucket.errors >= threshold:
            current.append(bucket)
            gap = 0
        elif current:
            gap += 1
            # Allow one quiet bucket inside an incident before closing it.
            if gap > 1:
                runs.append(current)
                current, gap = [], 0
            else:
                current.append(bucket)
    if current:
        runs.append(current)

    incidents: List[Incident] = []
    for run in runs:
        window_start = run[0].start
        window_end = run[-1].start + timedelta(seconds=width)
        members = [e for e in entries
                   if e.timestamp and window_start <= e.timestamp < window_end
                   and is_error(e.level)]
        if not members:
            continue
        incidents.append(Incident(
            start=members[0].timestamp,
            end=members[-1].timestamp,
            error_count=len(members),
            peak=max(b.errors for b in run),
            entries=members,
        ))

    incidents.sort(key=lambda i: (i.error_count, i.peak), reverse=True)
    return incidents[:max_incidents]


def summarise_span(entries: Sequence[LogEntry]) -> dict:
    timed = [e for e in entries if e.timestamp]
    if not timed:
        return {"start": None, "end": None, "duration_seconds": 0}
    start, end = timed[0].timestamp, timed[-1].timestamp
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "duration_seconds": max((end - start).total_seconds(), 0.0),
    }
