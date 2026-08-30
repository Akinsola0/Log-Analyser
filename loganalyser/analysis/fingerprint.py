"""Turn a log message into a stable signature so repeats collapse together.

"Payment failed for order 55123" and "Payment failed for order 88214" are
the same problem seen twice. Stripping the variable parts is what lets the
report say "this happened 4,000 times" instead of printing 4,000 lines.
"""
from __future__ import annotations

import hashlib
import re
from typing import List, Tuple

# Order matters: the most specific shapes are replaced first so that, say,
# a UUID is not partly eaten by the plain-number rule.
_SUBSTITUTIONS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", re.I), "<uuid>"),
    (re.compile(r"\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?"), "<time>"),
    (re.compile(r"\b\d{2}:\d{2}:\d{2}(?:[.,]\d+)?\b"), "<time>"),
    (re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b"), "<ip>"),
    (re.compile(r"\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b", re.I), "<mac>"),
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "<email>"),
    (re.compile(r"\bhttps?://[^\s\"'<>]+"), "<url>"),
    (re.compile(r"(?:[A-Za-z]:\\|\\\\)[^\s\"'<>|]+"), "<path>"),        # windows paths
    (re.compile(r"(?<![\w.])/(?:[\w.@-]+/)+[\w.@-]*"), "<path>"),        # unix paths
    (re.compile(r"\b0x[0-9a-f]+\b", re.I), "<hex>"),
    (re.compile(r"\b[0-9a-f]{16,}\b", re.I), "<hash>"),
    (re.compile(r"'[^']{0,120}'"), "<str>"),
    (re.compile(r'"[^"]{0,120}"'), "<str>"),
    (re.compile(r"\b\d+(?:\.\d+)?(?:ms|s|m|h|kb|mb|gb|tb|%)\b", re.I), "<qty>"),
    (re.compile(r"\b\d[\d,._]*\b"), "<n>"),
]

_WHITESPACE = re.compile(r"\s+")
# A trailing 'Caused by' chain is part of the identity of a Java failure,
# but only the exception names matter, not the line numbers.
_FRAME = re.compile(r"^\s*(?:at\s+|File\s+)", re.MULTILINE)


def normalise(message: str, max_length: int = 320) -> str:
    """Collapse the variable parts of a message into placeholders."""
    text = message.strip()
    for pattern, replacement in _SUBSTITUTIONS:
        text = pattern.sub(replacement, text)
    text = _WHITESPACE.sub(" ", text).strip()
    return text[:max_length]


def signature(message: str, detail: str = "", exception: str = "",
              culprit: str = "") -> str:
    """Human-readable identity of a failure.

    Two records share a signature when they are the same failure, even if
    the ids, timings and paths inside them differ.
    """
    parts = [normalise(message)]
    if exception:
        parts.append(exception)
    if culprit:
        parts.append(culprit)
    if not exception and detail:
        # Fall back to the first non-frame line of the detail block.
        for line in detail.splitlines():
            if line.strip() and not _FRAME.match(line):
                parts.append(normalise(line, 160))
                break
    return " | ".join(p for p in parts if p)


def fingerprint(message: str, detail: str = "", exception: str = "",
                culprit: str = "") -> str:
    sig = signature(message, detail, exception, culprit)
    return hashlib.sha1(sig.encode("utf-8", "replace")).hexdigest()[:12]
