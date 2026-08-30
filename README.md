# Log Analyser

A local tool for support engineers. Drop in a log file and it tells you
**when** things went wrong, **what broke first**, and **what the error
actually means** — instead of leaving you to scroll through thousands of
lines looking for the first red line.

It runs entirely on your machine. Nothing is uploaded, and nothing is
written to disk.

## What it does

- **Reads the log formats you actually get sent** — plain-text application
  logs (with Java/.NET/Python/Node stack traces), syslog, and Windows Event
  Log exports (CSV, XML, or `wevtutil` text). It works out which one it is
  by itself.
- **Groups repeats into one problem.** 4,000 lines of the same failure with
  different order ids become a single entry saying "4,000×".
- **Finds where the problem is coming from.** It reads the stack trace,
  skips framework and library frames, and names the line in *your* code —
  and unwraps `Caused by:` chains so you see the real failure, not the
  wrapper exception.
- **Explains what the error is saying.** 50+ built-in signatures cover the
  common ones (connection pool exhaustion, OOM, disk full, TLS expiry,
  deadlocks, service crashes, logon failures…) with a plain-English
  explanation, the usual causes, and what to check next.
- **Separates causes from symptoms.** Timeouts, retries and circuit
  breakers are marked as downstream symptoms and ranked *below* whatever
  actually broke, so the top of the list is the thing worth investigating.
- **Shows when it happened** on a timeline, and detects incident windows —
  the stretches where the error rate spiked above the file's own baseline.

## Quick start

```bash
pip install -r requirements.txt
python run.py
```

Then open <http://127.0.0.1:5000> and drop in a log file.

There's also a command-line version, for when you're on a server:

```bash
python -m loganalyser.cli /var/log/myapp/application.log
python -m loganalyser.cli app.log --top 20
python -m loganalyser.cli app.log --json > report.json
cat app.log | python -m loganalyser.cli -
```

It exits `1` when errors were found and `0` when clean, so you can use it
in a script or a health check.

## Shareable reports (and reading them on a tablet)

Both interfaces can export the whole report as a **single self-contained
HTML file** — all styling and the timeline chart are inlined, so it opens
with no server, no network and no dependencies. Email it, attach it to a
ticket, or archive it with the case.

```bash
python -m loganalyser.cli app.log --html report.html
python -m loganalyser.cli app.log --html - > report.html    # to stdout
```

In the web app, analyse a log and click **Download report**.

This is also the answer if you want to read reports on an iPad or phone:
generate the file on a machine that can run Python, then open the file
anywhere. It is responsive, respects light and dark mode, prints cleanly,
and stays readable with JavaScript disabled — the inline script only adds
the filter box.

## What a report looks like

```
Most likely starting point: Database connection pool exhausted -
first seen at 2024-01-15 10:22:03, occurring 4 times.

1. Database connection pool exhausted  x4
   line 7  Failed to process order 55010
   Every connection in the pool was already in use and a new request waited
   past its timeout. The database itself may be perfectly healthy - the
   bottleneck is that connections are not being returned fast enough.
     - Look for slow query warnings just before the first pool timeout
     - Compare pool max size against peak concurrent requests
   look at: com.acme.repository.OrderRepository.save (OrderRepository.java:112)

3. Thread starvation or a stalled event loop  x1
4. Slow query - a database call took far longer than expected  x1
5. Connection or read timed out  x2 (likely a downstream symptom)
6. Circuit breaker open - calls short-circuited  x1 (likely a downstream symptom)
```

Read top to bottom, that is the story of the outage: queries got slow,
threads starved, the pool ran dry, and everything downstream then timed out.

## Adding your own error signatures

This is the part worth investing in — the built-in rules only know about
generic infrastructure errors, not *your* product's. Put a YAML file
anywhere and point the tool at it:

```bash
python -m loganalyser.cli app.log --rules ./my-rules
export LOGANALYSER_RULES=/path/to/my-rules   # picked up by the web app too
```

A rule looks like this:

```yaml
- id: acme-licence-check-failed
  title: Licence server unreachable at startup
  category: config
  severity: critical
  cascade: false          # true if this is usually a downstream symptom
  patterns:               # any match fires the rule (regex, case-insensitive)
    - 'ACME-4471'
    - 'licence server did not respond'
  meaning: >
    The service could not reach the licence server during startup, so it
    started in reduced-functionality mode. Feature errors after this point
    are consequences of it.
  causes:
    - Licence server down or the firewall rule was changed
    - Wrong licence URL after an environment refresh
  checks:
    - Check ACME_LICENCE_URL in the service configuration
    - Confirm port 8443 is open from the app server to the licence host
```

Use the same `id` as a built-in rule to override it. For Windows events you
can match on the event id directly with `event_ids: ["7031", "7034"]`.

Every ticket you close is a candidate for a new rule. That is how this gets
genuinely useful for your product rather than just for generic errors.

## Optional: AI explanations

For errors no rule recognises, the tool can ask Claude to interpret them.
This is off by default and entirely optional — everything above works
offline.

```bash
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...
```

Then tick "Explain unknown errors with AI" in the web app, or pass `--ai`
on the command line. Only the unmatched errors are sent, and passwords,
tokens, API keys, JWTs, card numbers and email addresses are stripped out
first (see `loganalyser/ai/explain.py`).

Set `LOGANALYSER_MODEL` to use a different model.

## Layout

```
loganalyser/
  parsers/      timestamps, plain text, syslog, Windows Event Log, detection
  analysis/     fingerprinting, stack traces, timeline, the scoring engine
  rules/        the YAML knowledge base - add your own alongside these
  ai/           optional Claude explanations, with redaction
  web/          Flask app, template, CSS and front-end JS
  report_html.py  standalone self-contained HTML report renderer
  cli.py        command-line interface
tests/          58 tests plus sample logs
```

## Running the tests

```bash
python -m unittest discover -s tests -v
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `LOGANALYSER_RULES` | – | Extra rules file or directory |
| `LOGANALYSER_MODEL` | `claude-sonnet-4-5` | Model for AI explanations |
| `LOGANALYSER_MAX_MB` | `256` | Upload size limit |
| `LOGANALYSER_MAX_LINES` | `2000000` | Line cap per analysis |
| `ANTHROPIC_API_KEY` | – | Enables AI explanations |

## A note on log privacy

Logs usually contain customer data. The web app binds to `127.0.0.1` so it
is only reachable from your own machine — if you pass `--host 0.0.0.0` it
warns you, because that exposes uploaded logs to your whole network.
Uploads are analysed in memory and never written to disk. The only case
where log content leaves your machine is if you explicitly turn on AI
explanations.
