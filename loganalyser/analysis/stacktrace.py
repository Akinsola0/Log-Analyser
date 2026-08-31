"""Pull the useful facts out of a stack trace.

For a support engineer the question is "which line of whose code blew up",
so we extract the exception type, the full Caused-by chain, and the
deepest frame that belongs to the application rather than a framework.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Optional

# Java / Kotlin:   at com.acme.Foo.bar(Foo.java:88)
_JAVA_FRAME = re.compile(
    r"^\s*at\s+(?P<symbol>[\w$.<>]+)\((?P<file>[^):]+)(?::(?P<line>\d+))?\)")
# Python:  File "/app/worker.py", line 88, in run
_PY_FRAME = re.compile(
    r'^\s*File\s+"(?P<file>[^"]+)",\s+line\s+(?P<line>\d+),\s+in\s+(?P<symbol>\S+)')
# .NET:  at Acme.Order.Charge() in C:\src\Order.cs:line 88
_NET_FRAME = re.compile(
    r"^\s*at\s+(?P<symbol>[\w`.<>+]+)\([^)]*\)(?:\s+in\s+(?P<file>.+?):line\s+(?P<line>\d+))?")
# Node:  at charge (/app/src/pay.js:88:15)
_NODE_FRAME = re.compile(
    r"^\s*at\s+(?P<symbol>[\w$.<> \[\]]+?)\s+\((?P<file>[^()]+?):(?P<line>\d+):\d+\)")

_EXCEPTION = re.compile(
    r"(?:^|\s)(?P<type>(?:[\w$]+\.)*[A-Z][\w$]*(?:Exception|Error|Throwable|Fault))"
    r"(?::\s*(?P<detail>.*))?")
_CAUSED_BY = re.compile(r"^\s*Caused by:\s*(.*)$", re.MULTILINE)

# Frames belonging to platforms and libraries rather than the application.
_LIBRARY_PREFIXES = (
    "java.", "javax.", "jakarta.", "sun.", "jdk.", "com.sun.", "kotlin.",
    "scala.", "org.springframework.", "org.apache.", "org.hibernate.",
    "org.jboss.", "io.netty.", "ch.qos.", "org.slf4j.", "com.zaxxer.",
    "org.eclipse.", "org.junit.", "org.mockito.", "com.fasterxml.",
    "System.", "Microsoft.", "Newtonsoft.",
    "node:", "internal/",
)
_LIBRARY_PATH_HINTS = (
    "/site-packages/", "/dist-packages/", "/node_modules/", "/lib/python",
    "\\site-packages\\", "\\node_modules\\", "/usr/lib/", "<frozen ",
)


@dataclass
class Frame:
    symbol: str
    file: Optional[str] = None
    line: Optional[int] = None
    is_library: bool = False

    def __str__(self) -> str:
        where = f"{self.file}:{self.line}" if self.file and self.line else (self.file or "")
        return f"{self.symbol} ({where})" if where else self.symbol


@dataclass
class StackTrace:
    exception: Optional[str] = None
    exception_detail: Optional[str] = None
    causes: List[str] = field(default_factory=list)
    frames: List[Frame] = field(default_factory=list)
    language: Optional[str] = None

    @property
    def culprit(self) -> Optional[Frame]:
        """The deepest application frame - the most useful place to look."""
        app = [f for f in self.frames if not f.is_library]
        return app[0] if app else (self.frames[0] if self.frames else None)

    @property
    def root_exception(self) -> Optional[str]:
        """The last 'Caused by' is the real failure; the first is the wrapper."""
        return self.causes[-1] if self.causes else self.exception

    def to_dict(self) -> dict:
        culprit = self.culprit
        return {
            "exception": self.exception,
            "exception_detail": self.exception_detail,
            "root_exception": self.root_exception,
            "causes": self.causes,
            "language": self.language,
            "culprit": str(culprit) if culprit else None,
            "culprit_file": culprit.file if culprit else None,
            "culprit_line": culprit.line if culprit else None,
            "frames": [str(f) for f in self.frames[:12]],
        }


def _is_library(symbol: str, path: Optional[str]) -> bool:
    if symbol.startswith(_LIBRARY_PREFIXES):
        return True
    if path and any(hint in path for hint in _LIBRARY_PATH_HINTS):
        return True
    return False


def parse(text: str) -> Optional[StackTrace]:
    """Extract a StackTrace from a record's text, or None if there isn't one."""
    if not text:
        return None

    trace = StackTrace()
    for line in text.splitlines():
        for pattern, language in ((_JAVA_FRAME, "java"), (_PY_FRAME, "python"),
                                  (_NODE_FRAME, "node"), (_NET_FRAME, "dotnet")):
            match = pattern.match(line)
            if not match:
                continue
            groups = match.groupdict()
            symbol = (groups.get("symbol") or "").strip()
            path = groups.get("file")
            trace.frames.append(Frame(
                symbol=symbol, file=path,
                line=int(groups["line"]) if groups.get("line") else None,
                is_library=_is_library(symbol, path),
            ))
            trace.language = trace.language or language
            break

    head = _EXCEPTION.search(text[:4000])
    if head:
        trace.exception = head.group("type")
        detail = (head.group("detail") or "").strip()
        trace.exception_detail = detail[:300] or None

    for cause in _CAUSED_BY.findall(text):
        cause_match = _EXCEPTION.search(cause)
        trace.causes.append(cause_match.group("type") if cause_match else cause.strip()[:120])

    if not trace.frames and not trace.exception:
        return None
    if not trace.language and "Traceback (most recent call last)" in text:
        trace.language = "python"
    return trace
