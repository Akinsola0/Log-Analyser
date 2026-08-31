"""Core data model shared by every parser."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Canonical severity ordering. Everything a parser sees is mapped onto this.
LEVELS = ["TRACE", "DEBUG", "INFO", "NOTICE", "WARN", "ERROR", "CRITICAL", "FATAL"]
LEVEL_RANK = {name: i for i, name in enumerate(LEVELS)}

# Real-world spellings -> canonical level.
LEVEL_ALIASES = {
    "TRACE": "TRACE", "FINEST": "TRACE", "FINER": "TRACE", "VERBOSE": "TRACE",
    "DEBUG": "DEBUG", "FINE": "DEBUG", "DBG": "DEBUG",
    "INFO": "INFO", "INFORMATION": "INFO", "INFORMATIONAL": "INFO", "INF": "INFO",
    "NOTICE": "NOTICE", "AUDIT_SUCCESS": "NOTICE", "SUCCESSAUDIT": "NOTICE",
    "WARN": "WARN", "WARNING": "WARN", "WRN": "WARN", "AUDIT_FAILURE": "WARN",
    "FAILUREAUDIT": "WARN",
    "ERROR": "ERROR", "ERR": "ERROR", "SEVERE": "ERROR", "EXCEPTION": "ERROR",
    "FAIL": "ERROR", "FAILED": "ERROR",
    "CRITICAL": "CRITICAL", "CRIT": "CRITICAL",
    "FATAL": "FATAL", "EMERG": "FATAL", "EMERGENCY": "FATAL", "ALERT": "FATAL",
    "PANIC": "FATAL",
}

_LEVEL_TOKEN = re.compile(
    r"(?<![A-Za-z])(" + "|".join(sorted(LEVEL_ALIASES, key=len, reverse=True)) + r")(?![A-Za-z])",
    re.IGNORECASE,
)


def normalise_level(token: Optional[str]) -> Optional[str]:
    if not token:
        return None
    return LEVEL_ALIASES.get(token.strip().upper().replace(" ", "_"))


def sniff_level(text: str, window: int = 160) -> Optional[str]:
    """Find the first severity word near the start of a line.

    Bounded to a window so that the word 'error' buried deep inside a long
    message body doesn't get mistaken for the line's severity field.
    """
    match = _LEVEL_TOKEN.search(text[:window])
    return normalise_level(match.group(1)) if match else None


def is_error(level: Optional[str]) -> bool:
    return level is not None and LEVEL_RANK.get(level, -1) >= LEVEL_RANK["ERROR"]


def is_warn_or_worse(level: Optional[str]) -> bool:
    return level is not None and LEVEL_RANK.get(level, -1) >= LEVEL_RANK["WARN"]


@dataclass
class LogEntry:
    """One logical log record.

    A record can span many physical lines: a Java stack trace or a Windows
    event description is one entry whose continuation lines live in `detail`.
    """

    line_no: int
    raw: str
    message: str
    timestamp: Optional[datetime] = None
    level: Optional[str] = None
    logger: Optional[str] = None      # component / service / event source
    host: Optional[str] = None
    process: Optional[str] = None
    thread: Optional[str] = None
    event_id: Optional[str] = None    # Windows Event ID, or app-specific code
    detail: str = ""                  # continuation lines (stack trace, description)
    source_format: str = "unknown"
    extra: dict = field(default_factory=dict)

    @property
    def full_text(self) -> str:
        return self.message if not self.detail else f"{self.message}\n{self.detail}"

    @property
    def is_error(self) -> bool:
        return is_error(self.level)

    def add_detail(self, line: str) -> None:
        self.detail = f"{self.detail}\n{line}" if self.detail else line

    def to_dict(self) -> dict:
        return {
            "line_no": self.line_no,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "level": self.level,
            "logger": self.logger,
            "host": self.host,
            "process": self.process,
            "thread": self.thread,
            "event_id": self.event_id,
            "message": self.message,
            "detail": self.detail,
            "source_format": self.source_format,
        }
