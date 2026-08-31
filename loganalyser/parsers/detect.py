"""Format auto-detection and the single entry point every caller should use.

A support engineer should not have to tell the tool what kind of log they
just dropped on it, so we score each parser against a sample of the file
and run the winner.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import List, Optional, Tuple

from .base import LogEntry
from .plaintext import PlaintextParser
from .syslog import SyslogParser
from .winevent import WinEventParser
from . import timestamps as ts

_YEAR_BEARING = re.compile(r"(?:19|20)\d{2}")
# A dated timestamp anywhere in the line, not just at its start. Syslog files
# often carry one inside an embedded access-log line, which is the only clue
# to the real year.
_ANY_DATED = re.compile(
    r"(?:(?P<y1>(?:19|20)\d{2})-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}"
    r"|\d{2}/[A-Za-z]{3}/(?P<y2>(?:19|20)\d{2}):\d{2}:\d{2}:\d{2})")


def infer_year(lines: List[str], limit: int = 400) -> Optional[int]:
    """Pick a default year for formats (syslog) that omit it.

    Without this, a file mixing dated and undated records scatters across
    two years and the timeline becomes meaningless.
    """
    for line in lines[:limit]:
        stamp, _, name = ts.extract(line)
        if stamp and name != "syslog" and _YEAR_BEARING.search(line[:40]):
            return stamp.year
    # Nothing dated at the start of a line; fall back to any dated timestamp
    # embedded further in, which is common in syslog-wrapped access logs.
    for line in lines[:limit]:
        found = _ANY_DATED.search(line)
        if found:
            year = found.group("y1") or found.group("y2")
            if year:
                return int(year)
    return None


def detect(lines: List[str]) -> Tuple[str, float]:
    """Return (format_name, confidence)."""
    scores = {
        "winevent": WinEventParser.looks_like(lines),
        "syslog": SyslogParser.looks_like(lines),
    }
    best = max(scores, key=scores.get)
    if scores[best] >= 0.4:
        return best, scores[best]
    return "plaintext", 1.0 - max(scores.values())


def parse_lines(lines: List[str], fmt: Optional[str] = None) -> Tuple[List[LogEntry], str, float]:
    """Parse lines with the detected (or forced) parser."""
    if fmt in (None, "", "auto"):
        fmt, confidence = detect(lines)
    else:
        confidence = 1.0
    year = infer_year(lines)
    parser = {
        "winevent": WinEventParser,
        "syslog": SyslogParser,
        "plaintext": PlaintextParser,
    }[fmt](default_year=year)
    entries = list(parser.parse(lines))

    # Fall back if the chosen parser produced almost nothing useful.
    if fmt != "plaintext" and len(entries) < max(1, len([l for l in lines if l.strip()]) // 20):
        entries = list(PlaintextParser(default_year=year).parse(lines))
        fmt, confidence = "plaintext", 0.5
    return entries, fmt, confidence


def parse_text(text: str, fmt: Optional[str] = None):
    return parse_lines(text.splitlines(), fmt)
