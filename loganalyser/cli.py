"""Command-line entry point, for when you are on a server without a browser."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .analysis.engine import Analyser
from .ai import explain as ai
from .web.app import _decode

_COLOURS = {"critical": "\033[31;1m", "high": "\033[31m", "medium": "\033[33m",
            "low": "\033[32m", "reset": "\033[0m", "dim": "\033[2m", "bold": "\033[1m"}


def _paint(text: str, style: str, enabled: bool) -> str:
    return f"{_COLOURS.get(style, '')}{text}{_COLOURS['reset']}" if enabled else text


def _report(report, colour: bool, limit: int) -> None:
    bold = lambda s: _paint(s, "bold", colour)
    dim = lambda s: _paint(s, "dim", colour)

    print()
    print(bold(report.headline()))
    print(dim(f"  {report.filename or 'log'} - read as {report.detected_format}, "
              f"{len(report.entries):,} records, {report.error_count:,} errors, "
              f"{report.warning_count:,} warnings"))
    if report.span["start"]:
        print(dim(f"  covering {report.span['start']} to {report.span['end']}"))

    if report.incidents:
        print("\n" + bold("Incidents"))
        for incident in report.incidents:
            print(f"  {incident.start}  {incident.error_count} errors over "
                  f"{incident.duration_seconds:.0f}s (peak {incident.peak})")

    print("\n" + bold("Problems, most likely cause first"))
    if not report.groups:
        print("  none found")
        return

    for index, group in enumerate(report.groups[:limit], start=1):
        rule = group.rule
        severity = "cascade" if group.is_cascade else (rule.severity if rule else "medium")
        title = rule.title if rule else (
            group.trace.root_exception if group.trace and group.trace.root_exception
            else "Unrecognised error")
        marker = " (likely a downstream symptom)" if group.is_cascade else ""
        print(f"\n{index}. {_paint(title, severity, colour)}  "
              f"{_paint(f'x{group.count}', 'bold', colour)}{dim(marker)}")
        print(f"   {dim('line ' + str(group.first_line))}  {group.sample.message[:150]}")
        if rule:
            meaning = " ".join(rule.meaning.split())
            print(f"   {meaning[:400]}")
            for check in rule.checks[:3]:
                print(f"     - {check}")
        if group.trace and group.trace.culprit:
            print(f"   {dim('look at:')} {group.trace.culprit}")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog="loganalyser",
        description="Analyse an application, syslog or Windows Event Log file.")
    parser.add_argument("path", nargs="?", help="Log file to analyse ('-' for stdin).")
    parser.add_argument("--format", default="auto",
                        choices=["auto", "plaintext", "syslog", "winevent"])
    parser.add_argument("--json", action="store_true", help="Emit the full report as JSON.")
    parser.add_argument("--html", metavar="PATH",
                        help="Write a self-contained HTML report ('-' for stdout). "
                             "The file needs no network connection to view.")
    parser.add_argument("--top", type=int, default=10, help="How many problems to show.")
    parser.add_argument("--ai", action="store_true",
                        help="Explain unrecognised errors with Claude (needs ANTHROPIC_API_KEY).")
    parser.add_argument("--rules", help="Extra rules file or directory to load.")
    parser.add_argument("--no-colour", action="store_true")
    parser.add_argument("--serve", action="store_true", help="Start the web app instead.")
    args = parser.parse_args(argv)

    if args.serve:
        from .web.app import main as serve
        serve()
        return 0

    if not args.path:
        parser.error("give a log file path, or use --serve for the web app")

    if args.path == "-":
        lines, name = sys.stdin.read().splitlines(), "stdin"
    else:
        path = Path(args.path)
        if not path.is_file():
            print(f"No such file: {path}", file=sys.stderr)
            return 2
        lines, name = _decode(path.read_bytes()), path.name

    analyser = Analyser(extra_rule_dirs=[Path(args.rules)] if args.rules else None)
    report = analyser.analyse(lines, fmt=args.format, filename=name)

    if args.ai:
        if not ai.is_available():
            print(f"AI explanations unavailable: {ai.status()['detail']}", file=sys.stderr)
        else:
            ai.explain_groups(report.groups, limit=5)

    if args.html:
        from . import report_html
        if args.html == "-":
            sys.stdout.write(report_html.render(report))
        else:
            written = report_html.write(report, Path(args.html))
            print(f"Wrote {written} ({written.stat().st_size:,} bytes, self-contained).",
                  file=sys.stderr)

    if args.json:
        print(json.dumps(report.to_dict(max_groups=args.top), indent=2))
    elif not args.html or args.html != "-":
        _report(report, colour=sys.stdout.isatty() and not args.no_colour, limit=args.top)

    # Exit 1 when errors were found, so this can gate a check in a script.
    return 1 if report.error_count else 0


if __name__ == "__main__":
    sys.exit(main())
