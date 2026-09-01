# Vendored skills

Skills checked into this repository so every session — local, web, or anyone
else's clone — picks them up automatically. Claude Code loads them from
`.claude/skills/<name>/SKILL.md` at session start.

## ui-ux-pro-max

| | |
|---|---|
| Source | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |
| Version | 2.13.0 |
| Commit | `f2326710` (2026-08-31) |
| Licence | MIT — © 2024 Next Level Builder (see the upstream `LICENSE`) |
| Size | ~3.3 MB, mostly CSV data |

Searchable local design data — UI styles, product colour palettes, font
pairings, UX guidelines, icons, motion presets, chart types and per-stack
implementation notes — queried through a Python script that needs only the
standard library:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system
```

### What was changed from upstream

Two things, both deliberate:

1. **Invocation paths in `SKILL.md`** use `${CLAUDE_PLUGIN_ROOT:-.}` instead of
   `${CLAUDE_PLUGIN_ROOT}`. That variable is only set when the skill is
   installed as a plugin; vendored like this it is empty, and the command would
   resolve to `/.claude/...` and fail. The fallback makes it work from the
   repository root either way.
2. **`scripts/tests/` removed** — upstream's own test suite, not needed to run
   the skill.

Nothing else is modified, so upgrading is a re-copy of
`.claude/skills/ui-ux-pro-max/` from a fresh clone plus those two edits.

### Upgrading

```bash
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git /tmp/uupm
rm -rf .claude/skills/ui-ux-pro-max
cp -r /tmp/uupm/.claude/skills/ui-ux-pro-max .claude/skills/
rm -rf .claude/skills/ui-ux-pro-max/scripts/tests
# then re-apply the ${CLAUDE_PLUGIN_ROOT:-.} edit in SKILL.md
```
