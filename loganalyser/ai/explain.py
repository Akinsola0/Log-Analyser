"""Optional Claude-powered explanations for errors the rules do not know.

Everything in this module is opt-in. With no API key configured the tool is
fully offline and simply skips this step - the rules engine still produces
the report. When a key is present we ask Claude only about the failures the
rule base could not identify, which keeps cost and data exposure minimal.
"""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import List, Optional, Sequence

MODEL = os.environ.get("LOGANALYSER_MODEL", "claude-sonnet-4-5")
API_KEY_ENV = "ANTHROPIC_API_KEY"

# Redaction applied before anything leaves the machine. Order matters: the
# specific token shapes must run before the generic key=value rule, which
# would otherwise consume only the word "Bearer" and leave the secret behind.
_REDACTIONS = [
    (re.compile(r"\beyJ[A-Za-z0-9._-]{20,}"), "<jwt>"),
    (re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._~+/-]{12,}=*"), "Bearer <redacted>"),
    (re.compile(r"\b(?:sk|pk|ghp|gho|xox[abps])[-_][A-Za-z0-9_-]{12,}"), "<api-key>"),
    (re.compile(r"(?i)\b(password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key"
                r"|client[_-]?secret|authorization)\s*[=:]\s*(?:bearer\s+)?\S+"),
     r"\1=<redacted>"),
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "<email>"),
    (re.compile(r"\b(?:\d[ -]*?){13,19}\b"), "<card-number>"),
]

_SYSTEM = """You are helping a software support engineer triage an application log.

For the error you are shown, reply with a JSON object and nothing else:
{
  "title": "short name for this failure (max 8 words)",
  "meaning": "2-3 sentences in plain English explaining what the error means",
  "causes": ["most likely cause", "another plausible cause"],
  "checks": ["a specific thing to check or run next", "another"],
  "severity": "low|medium|high|critical",
  "cascade": true if this is likely a downstream symptom of another failure
}

Be concrete and practical. If the error text is too vague to interpret,
say so in "meaning" rather than inventing a cause. Never guess at product
internals you cannot see in the text."""


@dataclass
class Explanation:
    title: str
    meaning: str
    causes: List[str]
    checks: List[str]
    severity: str = "medium"
    cascade: bool = False
    source: str = "ai"

    def to_dict(self) -> dict:
        return {
            "id": "ai-explanation", "title": self.title, "meaning": self.meaning,
            "causes": self.causes, "checks": self.checks, "severity": self.severity,
            "cascade": self.cascade, "category": "ai", "source": self.source,
        }


def redact(text: str) -> str:
    """Strip obvious secrets and personal data before sending anything out."""
    for pattern, replacement in _REDACTIONS:
        text = pattern.sub(replacement, text)
    return text


def is_available() -> bool:
    if not os.environ.get(API_KEY_ENV):
        return False
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    return True


def status() -> dict:
    has_key = bool(os.environ.get(API_KEY_ENV))
    try:
        import anthropic  # noqa: F401
        has_sdk = True
    except ImportError:
        has_sdk = False
    if has_key and has_sdk:
        detail = f"Enabled - unmatched errors will be explained by {MODEL}."
    elif not has_sdk:
        detail = "Install the 'anthropic' package to enable AI explanations."
    else:
        detail = f"Set {API_KEY_ENV} to enable AI explanations."
    return {"available": has_key and has_sdk, "model": MODEL, "detail": detail}


def _extract_json(text: str) -> Optional[dict]:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def explain(message: str, detail: str = "", context: str = "",
            timeout: float = 30.0) -> Optional[Explanation]:
    """Ask Claude to interpret one unrecognised error. Returns None on failure."""
    if not is_available():
        return None
    import anthropic

    payload = redact(f"{message}\n{detail}".strip())[:4000]
    if context:
        payload += "\n\nSurrounding log lines:\n" + redact(context)[:2000]

    try:
        client = anthropic.Anthropic(api_key=os.environ[API_KEY_ENV], timeout=timeout)
        response = client.messages.create(
            model=MODEL,
            max_tokens=900,
            system=_SYSTEM,
            messages=[{"role": "user", "content": f"Error from the log:\n\n{payload}"}],
        )
    except Exception:
        # An AI failure must never break the report the rules already produced.
        return None

    text = "".join(block.text for block in response.content if block.type == "text")
    data = _extract_json(text)
    if not data or not data.get("meaning"):
        return None
    return Explanation(
        title=str(data.get("title") or "Unrecognised error")[:120],
        meaning=str(data["meaning"])[:1200],
        causes=[str(c)[:300] for c in (data.get("causes") or [])][:5],
        checks=[str(c)[:300] for c in (data.get("checks") or [])][:5],
        severity=str(data.get("severity") or "medium").lower(),
        cascade=bool(data.get("cascade")),
    )


def explain_groups(groups: Sequence, limit: int = 5) -> int:
    """Explain the top unmatched error groups in place. Returns how many succeeded."""
    if not is_available():
        return 0
    done = 0
    for group in groups:
        if done >= limit:
            break
        if group.rules or not group.sample:
            continue
        result = explain(group.sample.message, group.sample.detail)
        if result:
            group.explanation = result
            done += 1
    return done
