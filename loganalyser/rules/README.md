# Rules

Each `.yaml` file here is a set of error signatures. Files load in
alphabetical order and a later rule with the same `id` replaces an earlier
one, so you can override a built-in rule from your own file.

Your own rules should live outside this directory so upgrades don't touch
them — point at them with `--rules <path>` or `LOGANALYSER_RULES=<path>`.

## Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Unique identifier. Reuse a built-in id to override it. |
| `title` | yes | Short name shown as the problem heading. |
| `meaning` | yes | Plain-English explanation of what the error means. |
| `patterns` | one of these | Regex list; **any** match fires the rule. |
| `all_of` | " | Regex list; **all** must match. |
| `event_ids` | " | Windows Event IDs, as strings. |
| `not` | no | Regex list; any match suppresses the rule. |
| `causes` | no | Bullet list of the usual reasons this happens. |
| `checks` | no | Bullet list of what to check or run next. |
| `severity` | no | `low` \| `medium` \| `high` \| `critical`. Default `medium`. |
| `cascade` | no | `true` if this is usually a downstream symptom. Default `false`. |
| `confidence` | no | 0–1, used for ranking. Default `0.8`. |
| `category` | no | Free-form grouping, e.g. `database`, `network`. |

Patterns are matched case-insensitively against the record's full text —
the message plus any stack trace attached to it.

## Writing a good rule

- **Match on something stable.** An error code (`ACME-4471`) or a fixed
  phrase beats a sentence that includes an order number.
- **Set `cascade: true` for symptoms.** Timeouts, retries and circuit
  breakers describe what a failure looks like from downstream. Marking them
  demotes them below the real cause in the ranking.
- **Put the diagnosis in `meaning`, the actions in `checks`.** The person
  reading it wants to know what to do in the next two minutes.
- **Use `not` to avoid false positives.** For example, a rule matching
  `timeout` might exclude `timeout configured` from a startup banner.
