"""Windows Event Log parser.

Customers send event logs in whichever shape Event Viewer or the CLI gave
them, so we accept all three of the common ones:

  * CSV  - "Save All Events As..." / Export from Event Viewer
  * XML  - wevtutil qe /f:xml, or per-event "Details -> XML view"
  * TEXT - wevtutil qe /f:text, block-per-event key/value output
"""
from __future__ import annotations

import csv
import io
import re
from typing import Iterable, Iterator, List, Optional
from xml.etree import ElementTree

from .base import LogEntry, normalise_level, sniff_level
from . import timestamps as ts

_XML_NS = re.compile(r"\{[^}]*\}")
_EVENT_TAG = re.compile(r"<Event\b[^>]*>", re.IGNORECASE)
_TEXT_BLOCK = re.compile(r"^Event\[\d+\]:\s*$", re.IGNORECASE)
_KV = re.compile(r"^\s{0,4}([A-Za-z][A-Za-z ]{2,30}):\s*(.*)$")

# Only these keys end a Description block. Without this allow-list, a body
# line like "Application: Acme.exe Unhandled Exception: ..." reads as a new
# field and the whole description - the useful part - is discarded.
_KNOWN_KEYS = {
    "log name", "source", "date", "date and time", "event id", "task",
    "task category", "level", "opcode", "keywords", "user", "user name",
    "computer", "description", "correlation", "channel", "provider",
    "provider name", "record id", "process id", "thread id", "version",
    "qualifiers", "security", "message", "type", "entry type", "category",
}

# Event Viewer CSV headers vary by locale/version; match on the ones we need.
_CSV_FIELDS = {
    "level": {"level", "type", "entry type", "entrytype"},
    "timestamp": {"date and time", "datetime", "time created", "timecreated",
                  "date", "timegenerated"},
    "source": {"source", "provider name", "providername"},
    "event_id": {"event id", "eventid", "instance id", "id"},
    "category": {"task category", "category", "taskcategory"},
    "message": {"message", "description", "details"},
    "host": {"computer", "computername", "machine name"},
    "user": {"user", "username"},
}


def _canonical(header: str) -> Optional[str]:
    key = header.strip().strip('"').lower()
    for field, aliases in _CSV_FIELDS.items():
        if key in aliases:
            return field
    return None


class WinEventParser:
    name = "winevent"

    def __init__(self, default_year: Optional[int] = None):
        self.default_year = default_year

    # -- detection ---------------------------------------------------------------
    @staticmethod
    def looks_like(lines: List[str]) -> float:
        sample = [l for l in lines[:300] if l.strip()]
        if not sample:
            return 0.0
        head = "\n".join(sample[:40])
        if _EVENT_TAG.search(head) and "<System>" in head:
            return 1.0
        if any(_TEXT_BLOCK.match(l) for l in sample[:60]) and "Log Name:" in head:
            return 1.0
        first = sample[0].lower()
        if "," in first:
            headers = [_canonical(h) for h in next(csv.reader([sample[0]]), [])]
            named = {h for h in headers if h}
            if {"level", "event_id"} <= named or {"timestamp", "source", "event_id"} <= named:
                return 1.0
        # Text-form blocks without the Log Name header still score partially.
        if any(_TEXT_BLOCK.match(l) for l in sample[:60]):
            return 0.6
        return 0.0

    # -- dispatch ----------------------------------------------------------------
    def parse(self, lines: Iterable[str]) -> Iterator[LogEntry]:
        rows = list(lines)
        head = "\n".join(l for l in rows[:40] if l.strip())
        if _EVENT_TAG.search(head):
            yield from self._parse_xml(rows)
        elif any(_TEXT_BLOCK.match(l) for l in rows[:80]):
            yield from self._parse_text_blocks(rows)
        else:
            yield from self._parse_csv(rows)

    # -- CSV ---------------------------------------------------------------------
    def _parse_csv(self, rows: List[str]) -> Iterator[LogEntry]:
        reader = csv.reader(io.StringIO("\n".join(rows)))
        try:
            header = next(reader)
        except StopIteration:
            return
        mapping = {index: _canonical(name) for index, name in enumerate(header)}
        if not any(mapping.values()):
            return
        for offset, row in enumerate(reader, start=2):
            if not any(cell.strip() for cell in row):
                continue
            data = {}
            for index, cell in enumerate(row):
                field = mapping.get(index)
                if field and cell.strip():
                    data[field] = cell.strip()
            yield self._build(offset, ",".join(row), data)

    # -- XML ---------------------------------------------------------------------
    def _parse_xml(self, rows: List[str]) -> Iterator[LogEntry]:
        text = "\n".join(rows)
        # wevtutil emits a bare sequence of <Event> elements with no root.
        if not text.lstrip().startswith("<?xml") or "<Events>" not in text:
            text = f"<Events>{text}</Events>"
        try:
            root = ElementTree.fromstring(text)
        except ElementTree.ParseError:
            # Salvage whatever individual events parse cleanly.
            root = None
        events = []
        if root is not None:
            events = [el for el in root.iter() if _XML_NS.sub("", el.tag) == "Event"]
        else:
            for chunk in re.findall(r"<Event\b.*?</Event>", text, re.DOTALL | re.IGNORECASE):
                try:
                    events.append(ElementTree.fromstring(chunk))
                except ElementTree.ParseError:
                    continue

        for index, event in enumerate(events, start=1):
            data, parts = {}, []
            for node in event.iter():
                tag = _XML_NS.sub("", node.tag)
                value = (node.text or "").strip()
                if tag == "Provider":
                    data["source"] = node.get("Name") or data.get("source")
                elif tag == "TimeCreated":
                    data["timestamp"] = node.get("SystemTime") or ""
                elif tag == "EventID" and value:
                    data["event_id"] = value
                elif tag == "Level" and value:
                    data["level_code"] = value
                elif tag == "Computer" and value:
                    data["host"] = value
                elif tag == "Execution":
                    data["process"] = node.get("ProcessID")
                elif tag in ("Data", "Message", "RenderingInfo") and value:
                    name = node.get("Name")
                    parts.append(f"{name}={value}" if name else value)
            if parts:
                data["message"] = " | ".join(parts)
            yield self._build(index, f"<Event #{index}>", data)

    # -- wevtutil text blocks ----------------------------------------------------
    def _parse_text_blocks(self, rows: List[str]) -> Iterator[LogEntry]:
        block: dict = {}
        start = 1
        description: List[str] = []
        in_description = False

        def flush(line_no, data, desc):
            if not data and not desc:
                return None
            if desc:
                data = dict(data)
                data["message"] = " ".join(d.strip() for d in desc if d.strip())
            return self._build(line_no, "", data) if data else None

        for number, raw in enumerate(rows, start=1):
            line = raw.rstrip("\n\r")
            if _TEXT_BLOCK.match(line):
                done = flush(start, block, description)
                if done:
                    yield done
                block, description, in_description, start = {}, [], False, number
                continue
            match = _KV.match(line)
            if match and (match.group(1).strip().lower() in _KNOWN_KEYS or not in_description):
                key, value = match.group(1).strip().lower(), match.group(2).strip()
                if in_description and key not in _KNOWN_KEYS:
                    description.append(line)
                    continue
                in_description = key == "description"
                if in_description:
                    if value:
                        description.append(value)
                    continue
                field = _canonical(key)
                if field and value:
                    block[field] = value
                elif key == "date" and value:
                    block["timestamp"] = value
            elif in_description and line.strip():
                description.append(line)
        done = flush(start, block, description)
        if done:
            yield done

    # -- shared construction -----------------------------------------------------
    _LEVEL_CODES = {"1": "FATAL", "2": "ERROR", "3": "WARN", "4": "INFO", "5": "TRACE", "0": "INFO"}

    def _build(self, line_no: int, raw: str, data: dict) -> LogEntry:
        stamp = None
        if data.get("timestamp"):
            stamp, _, _ = ts.extract(data["timestamp"], self.default_year)
        level = normalise_level(data.get("level"))
        if level is None and data.get("level_code"):
            level = self._LEVEL_CODES.get(str(data["level_code"]).strip())
        message = data.get("message") or data.get("category") or ""
        if level is None:
            level = sniff_level(message) or "INFO"

        source = data.get("source")
        extra = {k: v for k, v in data.items()
                 if k in ("category", "user", "level_code") and v}
        return LogEntry(
            line_no=line_no,
            raw=raw or message,
            message=message.strip() or f"Event {data.get('event_id', '?')} from {source or 'unknown source'}",
            timestamp=ts.make_naive(stamp),
            level=level,
            logger=source,
            host=data.get("host"),
            process=data.get("process"),
            event_id=str(data["event_id"]) if data.get("event_id") else None,
            source_format=self.name,
            extra=extra,
        )


def parse_text(text: str, **kwargs) -> List[LogEntry]:
    return list(WinEventParser(**kwargs).parse(text.splitlines()))
