"""Rule loading and matching.

A rule turns a raw error string into something a support engineer can act
on: what it means, what usually causes it, and what to check next. Rules
live in YAML so you can add your own product's error signatures without
touching any Python.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional, Sequence

import yaml

BUILTIN_DIR = Path(__file__).parent
# Where a user drops their own rule files; every .yaml in here is loaded.
USER_RULES_ENV = "LOGANALYSER_RULES"


@dataclass
class Rule:
    id: str
    title: str
    meaning: str
    category: str = "general"
    severity: str = "medium"          # low | medium | high | critical
    cascade: bool = False             # True = usually a downstream symptom
    confidence: float = 0.8
    causes: List[str] = field(default_factory=list)
    checks: List[str] = field(default_factory=list)
    patterns: List[re.Pattern] = field(default_factory=list)
    all_of: List[re.Pattern] = field(default_factory=list)
    not_patterns: List[re.Pattern] = field(default_factory=list)
    event_ids: List[str] = field(default_factory=list)
    sources: List[re.Pattern] = field(default_factory=list)
    source: str = "builtin"

    def matches(self, text: str, event_id: Optional[str] = None,
                source_name: Optional[str] = None) -> bool:
        """Fire when the event id OR the message text identifies this error.

        The two are alternatives, not a conjunction: the same Windows event
        arrives as a parsed id from a CSV export and as free text from a
        wevtutil dump, and an XML export often carries an id with no
        readable message at all.
        """
        if any(p.search(text) for p in self.not_patterns):
            return False
        if self.all_of and not all(p.search(text) for p in self.all_of):
            return False
        # `sources` narrows event ids that are too generic to stand alone.
        if self.sources:
            if not source_name or not any(p.search(source_name) for p in self.sources):
                return False

        by_id = bool(self.event_ids and event_id is not None
                     and str(event_id) in self.event_ids)
        by_text = bool(self.patterns and any(p.search(text) for p in self.patterns))
        if self.event_ids or self.patterns:
            return by_id or by_text
        return bool(self.all_of)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "title": self.title, "meaning": self.meaning,
            "category": self.category, "severity": self.severity,
            "cascade": self.cascade, "causes": self.causes,
            "checks": self.checks, "source": self.source,
        }


def _compile(values: Optional[Iterable[str]], rule_id: str, field_name: str) -> List[re.Pattern]:
    compiled = []
    for value in values or []:
        try:
            compiled.append(re.compile(value, re.IGNORECASE))
        except re.error as exc:
            raise ValueError(
                f"rule '{rule_id}' has an invalid regex in {field_name}: {value!r} ({exc})"
            ) from exc
    return compiled


def load_file(path: Path) -> List[Rule]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or []
    if isinstance(raw, dict):
        raw = raw.get("rules", [])
    rules = []
    for item in raw:
        if not isinstance(item, dict) or not item.get("id"):
            continue
        rule_id = str(item["id"])
        rules.append(Rule(
            id=rule_id,
            title=item.get("title", rule_id),
            meaning=(item.get("meaning") or "").strip(),
            category=item.get("category", "general"),
            severity=item.get("severity", "medium"),
            cascade=bool(item.get("cascade", False)),
            confidence=float(item.get("confidence", 0.8)),
            causes=list(item.get("causes") or []),
            checks=list(item.get("checks") or []),
            patterns=_compile(item.get("patterns"), rule_id, "patterns"),
            all_of=_compile(item.get("all_of"), rule_id, "all_of"),
            not_patterns=_compile(item.get("not"), rule_id, "not"),
            event_ids=[str(v) for v in (item.get("event_ids") or [])],
            sources=_compile(item.get("sources"), rule_id, "sources"),
            source=path.name,
        ))
    return rules


def load_rules(extra_dirs: Optional[Sequence[Path]] = None) -> List[Rule]:
    """Load built-in rules, then any user rules (which can override by id)."""
    rules: List[Rule] = []
    for path in sorted(BUILTIN_DIR.glob("*.yaml")):
        rules.extend(load_file(path))

    directories = list(extra_dirs or [])
    env_dir = os.environ.get(USER_RULES_ENV)
    if env_dir:
        directories.append(Path(env_dir))
    for directory in directories:
        directory = Path(directory)
        if directory.is_file():
            rules.extend(load_file(directory))
        elif directory.is_dir():
            for path in sorted(directory.glob("*.yaml")) + sorted(directory.glob("*.yml")):
                rules.extend(load_file(path))

    # Later definitions of the same id win, so users can override a builtin.
    by_id = {}
    for rule in rules:
        by_id[rule.id] = rule
    return list(by_id.values())


class RuleEngine:
    def __init__(self, rules: Optional[Sequence[Rule]] = None,
                 extra_dirs: Optional[Sequence[Path]] = None):
        self.rules = list(rules) if rules is not None else load_rules(extra_dirs)

    def match(self, text: str, event_id: Optional[str] = None,
              source_name: Optional[str] = None) -> List[Rule]:
        """All rules that fire, most severe and most confident first."""
        order = {"critical": 3, "high": 2, "medium": 1, "low": 0}
        hits = [r for r in self.rules if r.matches(text, event_id, source_name)]
        hits.sort(key=lambda r: (order.get(r.severity, 1), r.confidence), reverse=True)
        return hits

    def best(self, text: str, event_id: Optional[str] = None,
             source_name: Optional[str] = None) -> Optional[Rule]:
        hits = self.match(text, event_id, source_name)
        return hits[0] if hits else None
