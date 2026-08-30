"""Timestamp recognition.

Support engineers get logs from every stack under the sun, so we try a
battery of formats rather than assuming one. Each pattern is anchored to
where timestamps actually appear (start of line, optionally bracketed).
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Optional, Tuple

_MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}


def _int(value: Optional[str], default: int = 0) -> int:
    return int(value) if value else default


def _micros(frac: Optional[str]) -> int:
    if not frac:
        return 0
    digits = frac.strip(".,")[:6]
    return int(digits.ljust(6, "0"))


def _tz(offset: Optional[str]):
    if not offset:
        return None
    if offset.upper() == "Z":
        return timezone.utc
    sign = 1 if offset[0] == "+" else -1
    body = offset[1:].replace(":", "")
    hours, minutes = int(body[:2]), int(body[2:4] or 0)
    from datetime import timedelta
    return timezone(sign * timedelta(hours=hours, minutes=minutes))


# ISO-ish: 2024-01-15 10:23:45,123  /  2024-01-15T10:23:45.123456Z  /  +01:00
_ISO = re.compile(
    r"(?P<y>\d{4})-(?P<mo>\d{2})-(?P<d>\d{2})[T ]"
    r"(?P<h>\d{2}):(?P<mi>\d{2}):(?P<s>\d{2})(?P<frac>[.,]\d{1,9})?"
    r"(?P<tz>Z|[+-]\d{2}:?\d{2})?")

# Syslog RFC3164: Jan 15 10:23:45  (no year - inferred)
_SYSLOG = re.compile(
    r"(?P<mon>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+"
    r"(?P<d>\d{1,2})\s+(?P<h>\d{2}):(?P<mi>\d{2}):(?P<s>\d{2})(?P<frac>\.\d+)?",
    re.IGNORECASE)

# Common Log Format: 15/Jan/2024:10:23:45 +0000
_CLF = re.compile(
    r"(?P<d>\d{2})/(?P<mon>[A-Za-z]{3})/(?P<y>\d{4}):"
    r"(?P<h>\d{2}):(?P<mi>\d{2}):(?P<s>\d{2})(?:\s+(?P<tz>[+-]\d{4}))?")

# US / Windows Event Viewer: 1/15/2024 10:23:45 AM  or 01/15/2024 22:23:45
_US = re.compile(
    r"(?P<mo>\d{1,2})/(?P<d>\d{1,2})/(?P<y>\d{4})[ ,T]+"
    r"(?P<h>\d{1,2}):(?P<mi>\d{2})(?::(?P<s>\d{2}))?(?P<frac>\.\d+)?"
    r"(?:\s*(?P<ampm>[AP]M))?", re.IGNORECASE)

# European / UK: 15-01-2024 10:23:45  or 15.01.2024 10:23:45
_EU = re.compile(
    r"(?P<d>\d{2})[-.](?P<mo>\d{2})[-.](?P<y>\d{4})[ T]"
    r"(?P<h>\d{2}):(?P<mi>\d{2}):(?P<s>\d{2})(?P<frac>[.,]\d+)?")

# Compact: 20240115 102345  /  20240115T102345
_COMPACT = re.compile(
    r"(?P<y>\d{4})(?P<mo>\d{2})(?P<d>\d{2})[ T_-]?"
    r"(?P<h>\d{2}):?(?P<mi>\d{2}):?(?P<s>\d{2})(?P<frac>[.,]\d+)?")


def _build(g: dict, default_year: int) -> Optional[datetime]:
    try:
        month = g.get("mo")
        if month is None and g.get("mon"):
            month = _MONTHS[g["mon"][:3].lower()]
        hour = _int(g.get("h"))
        if g.get("ampm"):
            meridiem = g["ampm"].upper()
            if meridiem == "PM" and hour < 12:
                hour += 12
            elif meridiem == "AM" and hour == 12:
                hour = 0
        return datetime(
            year=_int(g.get("y"), default_year),
            month=int(month),
            day=_int(g.get("d")),
            hour=hour,
            minute=_int(g.get("mi")),
            second=_int(g.get("s")),
            microsecond=_micros(g.get("frac")),
            tzinfo=_tz(g.get("tz")),
        )
    except (ValueError, KeyError, TypeError):
        return None


def _roll_back_year(value: datetime) -> datetime:
    """Syslog omits the year, so we assume the current one.

    Near a year boundary that puts December records in the future; if the
    result is clearly ahead of now, it belongs to the previous year.
    """
    now = datetime.now()
    if (value - now).days > 1:
        try:
            return value.replace(year=value.year - 1)
        except ValueError:  # 29 Feb in a non-leap year
            return value.replace(year=value.year - 1, day=28)
    return value


# Order matters: most specific / least ambiguous first.
_PATTERNS = [("iso", _ISO), ("clf", _CLF), ("eu", _EU), ("us", _US),
             ("compact", _COMPACT), ("syslog", _SYSLOG)]

# A timestamp must start within this many characters of the line start,
# otherwise it is data inside the message rather than the record's own time.
# 20 leaves room for a leading bracket, syslog priority (<11>) or a short
# level/PID prefix without matching dates quoted mid-sentence.
_HEAD = 20


def extract(line: str, default_year: Optional[int] = None) -> Tuple[Optional[datetime], int, Optional[str]]:
    """Return (timestamp, end_offset, pattern_name) for a line's leading timestamp.

    end_offset is where the timestamp finished, so callers can carry on
    parsing the rest of the record from there.
    """
    year = default_year or datetime.now().year
    best = None
    for name, pattern in _PATTERNS:
        match = pattern.search(line, 0, _HEAD + 30)
        if not match or match.start() > _HEAD:
            continue
        parsed = _build(match.groupdict(), year)
        if parsed is None:
            continue
        if not match.groupdict().get("y"):
            parsed = _roll_back_year(parsed)
        # Prefer the match that starts earliest; tie-break on the longer match.
        key = (match.start(), -(match.end() - match.start()))
        if best is None or key < best[0]:
            best = (key, parsed, match.end(), name)
    if best is None:
        return None, 0, None
    return best[1], best[2], best[3]


def has_timestamp(line: str) -> bool:
    return extract(line)[0] is not None


def make_naive(value: Optional[datetime]) -> Optional[datetime]:
    """Drop tzinfo (converting to UTC first) so mixed-source logs sort together."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)
