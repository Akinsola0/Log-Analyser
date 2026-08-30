"""Syslog parsers: RFC3164 (BSD) and RFC5424, plus systemd journal output."""
from __future__ import annotations

import re
from typing import Iterable, Iterator, List, Optional

from .base import LEVEL_RANK, LogEntry, normalise_level, sniff_level
from . import timestamps as ts

# Numeric priority -> severity, per RFC5424 section 6.2.1.
_SEVERITY = {
    0: "FATAL", 1: "FATAL", 2: "CRITICAL", 3: "ERROR",
    4: "WARN", 5: "NOTICE", 6: "INFO", 7: "DEBUG",
}
_FACILITY = {
    0: "kernel", 1: "user", 2: "mail", 3: "daemon", 4: "auth", 5: "syslog",
    6: "lpr", 7: "news", 8: "uucp", 9: "cron", 10: "authpriv", 11: "ftp",
    16: "local0", 17: "local1", 18: "local2", 19: "local3",
    20: "local4", 21: "local5", 22: "local6", 23: "local7",
}

_PRI = re.compile(r"^<(\d{1,3})>")
# RFC5424: <34>1 2024-01-15T10:23:45Z host app procid msgid [sd] message
_RFC5424 = re.compile(
    r"^<(?P<pri>\d{1,3})>1\s+(?P<time>\S+)\s+(?P<host>\S+)\s+(?P<app>\S+)\s+"
    r"(?P<procid>\S+)\s+(?P<msgid>\S+)\s+(?P<rest>.*)$")
# RFC3164 tail after the timestamp: host tag[pid]: message
_BSD_TAIL = re.compile(
    r"^(?P<host>[\w.:-]+)\s+(?P<tag>[^\s:\[]{1,48})(?:\[(?P<pid>\d+)\])?:\s*(?P<msg>.*)$")

_STRUCTURED_DATA = re.compile(r"^(?:\[[^\]]*\]\s*)+")
# Databases and other daemons print their own severity first: "FATAL: ..."
_OWN_SEVERITY = re.compile(r"^\s*([A-Z]{3,11})\s*:\s+")


def _escalate(level, message):
    """Trust an explicit severity in the message when it outranks the priority.

    postgres logs "FATAL: ..." through a facility whose syslog priority only
    says ERROR; the daemon knows better than the transport does.
    """
    own = _OWN_SEVERITY.match(message)
    if not own:
        return level
    candidate = normalise_level(own.group(1))
    if candidate is None:
        return level
    if level is None or LEVEL_RANK.get(candidate, -1) > LEVEL_RANK.get(level, -1):
        return candidate
    return level


class SyslogParser:
    name = "syslog"

    def __init__(self, default_year: Optional[int] = None):
        self.default_year = default_year

    @staticmethod
    def looks_like(lines: List[str]) -> float:
        """Confidence in [0,1] that these lines are syslog."""
        sample = [line for line in lines[:200] if line.strip()]
        if not sample:
            return 0.0
        hits = 0
        for line in sample:
            if _PRI.match(line):
                hits += 1
                continue
            stamp, offset, name = ts.extract(line)
            if name == "syslog" and stamp and _BSD_TAIL.match(line[offset:].strip()):
                hits += 1
        return hits / len(sample)

    def _from_pri(self, value: str):
        pri = int(value)
        return _SEVERITY.get(pri & 0x07), _FACILITY.get(pri >> 3)

    def parse(self, lines: Iterable[str]) -> Iterator[LogEntry]:
        current: Optional[LogEntry] = None
        for number, raw in enumerate(lines, start=1):
            line = raw.rstrip("\n\r")
            if not line.strip():
                continue

            entry = self._parse_line(number, line)
            if entry is None:
                # Continuation of a multi-line message (e.g. a kernel trace).
                if current is not None:
                    current.add_detail(line)
                    continue
                entry = LogEntry(line_no=number, raw=line, message=line.strip(),
                                 level=sniff_level(line), source_format=self.name)
            if current is not None:
                yield current
            current = entry
        if current is not None:
            yield current

    def _parse_line(self, number: int, line: str) -> Optional[LogEntry]:
        modern = _RFC5424.match(line)
        if modern:
            level, facility = self._from_pri(modern.group("pri"))
            stamp, _, _ = ts.extract(modern.group("time"), self.default_year)
            body = _STRUCTURED_DATA.sub("", modern.group("rest")).strip()
            return LogEntry(
                line_no=number, raw=line, message=body or modern.group("rest"),
                timestamp=ts.make_naive(stamp), level=level,
                logger=None if modern.group("app") == "-" else modern.group("app"),
                host=None if modern.group("host") == "-" else modern.group("host"),
                process=None if modern.group("procid") == "-" else modern.group("procid"),
                source_format="rfc5424", extra={"facility": facility},
            )

        level = facility = None
        rest = line
        pri = _PRI.match(line)
        if pri:
            level, facility = self._from_pri(pri.group(1))
            rest = line[pri.end():]

        stamp, offset, name = ts.extract(rest, self.default_year)
        if not stamp:
            return None
        tail = rest[offset:].strip()
        bsd = _BSD_TAIL.match(tail)
        if not bsd:
            if name != "syslog" and not pri:
                return None
            return LogEntry(line_no=number, raw=line, message=tail,
                            timestamp=ts.make_naive(stamp),
                            level=level or sniff_level(tail), source_format=self.name,
                            extra={"facility": facility})
        message = bsd.group("msg")
        return LogEntry(
            line_no=number, raw=line, message=message,
            timestamp=ts.make_naive(stamp),
            level=_escalate(level or sniff_level(message), message),
            logger=bsd.group("tag"), host=bsd.group("host"), process=bsd.group("pid"),
            source_format="rfc3164", extra={"facility": facility},
        )


def parse_text(text: str, **kwargs) -> List[LogEntry]:
    return list(SyslogParser(**kwargs).parse(text.splitlines()))
