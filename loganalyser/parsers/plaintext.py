"""Parser for plain-text application logs.

Handles the shape most application frameworks emit:

    2024-01-15 10:23:45,123 ERROR [order-service] (http-8080-3) Payment failed
    java.lang.NullPointerException: Cannot invoke "Order.getId()"
        at com.acme.PaymentHandler.charge(PaymentHandler.java:88)

The first line starts a record; the indented / untimestamped lines that
follow belong to it. Getting that grouping right is what makes stack
traces readable instead of 40 separate "errors".
"""
from __future__ import annotations

import re
from typing import Iterable, Iterator, List, Optional

from .base import LogEntry, normalise_level, sniff_level
from . import timestamps as ts

# [component] or (thread) or logger.name - style fields following the level.
_BRACKET = re.compile(r"^\s*[\[\(<]([^\]\)>]{1,80})[\]\)>]")
# A dotted/slashed logger name followed by a separator: com.acme.Service -
_DOTTED_LOGGER = re.compile(r"^\s*([\w$.]{3,80}(?:\.[\w$]+){1,}|[\w.-]{3,60})\s*[-:]\s+")
_LEVEL_AT_START = re.compile(
    r"^\s*[\[\(]?\s*([A-Za-z]{3,12})\s*[\]\)]?\s*[-:]?\s+")
_PID = re.compile(r"\bpid[=: ]+(\d+)\b", re.IGNORECASE)

# Lines that continue the previous record rather than starting a new one.
_CONTINUATION = re.compile(
    r"^(?:"
    r"\s+"                                  # any indented line
    r"|(?:Caused by|Suppressed|\.{3})\b"     # java chained causes
    r"|(?:at\s+\S+\()"                       # bare 'at Foo.bar(' frames
    r"|(?:File\s+\"[^\"]+\",\s+line\s+\d+)"  # python traceback frames
    r"|(?:Traceback \(most recent call last\))"
    r"|(?:\s*--- End of )"                   # .NET async trace markers
    r"|[}\])]"                               # closing brace of a dumped object
    r")")

# An exception class name, e.g. java.lang.IllegalStateException or ValueError
_EXCEPTION_HEAD = re.compile(
    r"^\s*(?:[\w.$]+\.)?([A-Z][A-Za-z0-9_]*(?:Exception|Error|Throwable|Fault))\b")


class PlaintextParser:
    """Streaming parser: yields one LogEntry per logical record."""

    name = "plaintext"

    def __init__(self, default_year: Optional[int] = None, max_detail_lines: int = 200):
        self.default_year = default_year
        self.max_detail_lines = max_detail_lines

    # -- record boundary decision -------------------------------------------------
    def starts_record(self, line: str) -> bool:
        if not line.strip():
            return False
        if ts.has_timestamp(line):
            return True
        if _CONTINUATION.match(line):
            return False
        # No timestamp anywhere in the file? Then a leading level word starts one.
        return sniff_level(line, window=40) is not None

    # -- field extraction ---------------------------------------------------------
    def _parse_head(self, line: str) -> dict:
        stamp, offset, _ = ts.extract(line, self.default_year)
        rest = line[offset:] if stamp else line
        rest = rest.lstrip(" \t|,-:")

        level = None
        match = _LEVEL_AT_START.match(rest)
        if match:
            level = normalise_level(match.group(1))
            if level:
                rest = rest[match.end():]
        if level is None:
            level = sniff_level(line)

        logger = thread = None
        # Up to two bracketed fields usually mean [logger] (thread) or [thread] [logger]
        for _ in range(2):
            bracket = _BRACKET.match(rest)
            if not bracket:
                break
            value = bracket.group(1).strip()
            if not value:
                break
            if logger is None:
                logger = value
            elif thread is None:
                thread = value
            rest = rest[bracket.end():]

        if logger is None:
            dotted = _DOTTED_LOGGER.match(rest)
            if dotted and not _EXCEPTION_HEAD.match(rest):
                logger = dotted.group(1)
                rest = rest[dotted.end():]

        pid = _PID.search(line)
        return {
            "timestamp": ts.make_naive(stamp),
            "level": level,
            "logger": logger,
            "thread": thread,
            "process": pid.group(1) if pid else None,
            "message": rest.strip() or line.strip(),
        }

    def parse(self, lines: Iterable[str]) -> Iterator[LogEntry]:
        current: Optional[LogEntry] = None
        detail_count = 0

        for number, raw in enumerate(lines, start=1):
            line = raw.rstrip("\n\r")
            if not line.strip():
                continue

            if self.starts_record(line) or current is None:
                if current is not None:
                    yield self._finalise(current)
                fields = self._parse_head(line)
                current = LogEntry(line_no=number, raw=line, source_format=self.name, **fields)
                detail_count = 0
            else:
                if detail_count < self.max_detail_lines:
                    current.add_detail(line)
                elif detail_count == self.max_detail_lines:
                    current.add_detail("    ... (truncated)")
                detail_count += 1

        if current is not None:
            yield self._finalise(current)

    def _finalise(self, entry: LogEntry) -> LogEntry:
        """Promote severity when a record carries an exception but no level field.

        Plenty of logs print a bare stack trace with no ERROR token; treating
        those as INFO would hide the very thing we are looking for.
        """
        if entry.level in (None, "INFO", "DEBUG", "TRACE"):
            head = _EXCEPTION_HEAD.match(entry.message)
            if head or "Traceback (most recent call last)" in entry.detail:
                if entry.level is None or entry.level in ("DEBUG", "TRACE", "INFO"):
                    entry.level = "ERROR"
            elif entry.level is None and _EXCEPTION_HEAD.search(entry.detail[:200] or ""):
                entry.level = "ERROR"
        return entry


def parse_text(text: str, **kwargs) -> List[LogEntry]:
    return list(PlaintextParser(**kwargs).parse(text.splitlines()))
