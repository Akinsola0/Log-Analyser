"""Flask app: drop a log file in the browser, get a triage report.

Runs locally by default. Log files routinely contain customer data, so the
server binds to 127.0.0.1 unless you deliberately override it, and nothing
is written to disk - uploads are analysed in memory and discarded.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List

from flask import Flask, jsonify, render_template, request

from ..analysis.engine import Analyser
from ..ai import explain as ai
from ..rules.loader import load_rules

MAX_UPLOAD_MB = int(os.environ.get("LOGANALYSER_MAX_MB", "256"))
# Beyond this we still analyse, but stop holding every raw line in memory.
MAX_LINES = int(os.environ.get("LOGANALYSER_MAX_LINES", "2000000"))


def _decode(data: bytes) -> List[str]:
    """Decode an uploaded log, tolerating whatever encoding it arrived in.

    Windows tooling commonly exports UTF-16 with a BOM; falling back to
    latin-1 guarantees we never fail outright on a stray byte.
    """
    for encoding in ("utf-8-sig", "utf-16", "utf-8", "cp1252", "latin-1"):
        try:
            text = data.decode(encoding)
        except (UnicodeDecodeError, UnicodeError):
            continue
        # A UTF-16 misread shows up as interleaved NULs.
        if text.count("\x00") > len(text) // 8:
            continue
        return text.splitlines()
    return data.decode("latin-1", "replace").splitlines()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024
    analyser = Analyser()

    @app.get("/")
    def index():
        return render_template("index.html",
                               ai_status=ai.status(),
                               rule_count=len(analyser.rules.rules),
                               max_mb=MAX_UPLOAD_MB)

    @app.get("/favicon.ico")
    def favicon():
        # A tiny inline icon, so the browser stops asking for one.
        svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>"
               "<rect width='16' height='16' rx='3' fill='#2f6fed'/>"
               "<path d='M3 11h2V5H3zm4 0h2V3H7zm4 0h2V7h-2z' fill='#fff'/></svg>")
        return svg, 200, {"Content-Type": "image/svg+xml"}

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "rules": len(analyser.rules.rules),
                        "ai": ai.status()})

    @app.get("/api/rules")
    def rules():
        return jsonify([r.to_dict() for r in analyser.rules.rules])

    @app.post("/api/analyse")
    def analyse():
        fmt = request.form.get("format") or request.args.get("format") or "auto"
        use_ai = (request.form.get("use_ai") or "").lower() in ("1", "true", "on", "yes")
        filename = None
        lines: List[str] = []

        upload = request.files.get("file")
        if upload and upload.filename:
            filename = upload.filename
            lines = _decode(upload.read())
        else:
            pasted = request.form.get("text", "")
            if pasted.strip():
                filename = "pasted-log"
                lines = pasted.splitlines()

        if not lines:
            return jsonify({"error": "No log content received. Choose a file or paste some text."}), 400

        truncated = 0
        if len(lines) > MAX_LINES:
            truncated = len(lines) - MAX_LINES
            lines = lines[:MAX_LINES]

        try:
            report = analyser.analyse(lines, fmt=fmt, filename=filename)
        except Exception as exc:  # a bad log should never 500 silently
            app.logger.exception("analysis failed")
            return jsonify({"error": f"Could not analyse this log: {exc}"}), 500

        ai_used = 0
        if use_ai and ai.is_available():
            ai_used = ai.explain_groups(report.groups, limit=5)

        payload = report.to_dict()
        payload["truncated_lines"] = truncated
        payload["ai_explanations"] = ai_used
        return jsonify(payload)

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": f"That file is larger than the {MAX_UPLOAD_MB}MB limit. "
                                 f"Split it, or raise LOGANALYSER_MAX_MB."}), 413

    return app


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Start the Log Analyser web app.")
    parser.add_argument("--host", default="127.0.0.1",
                        help="Bind address (default 127.0.0.1 - local only).")
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    app = create_app()
    if args.host not in ("127.0.0.1", "localhost"):
        print(f"  WARNING: binding to {args.host} exposes uploaded logs to your network.")
    print(f"\n  Log Analyser running at http://{args.host}:{args.port}")
    print(f"  {len(load_rules())} error signatures loaded | AI: {ai.status()['detail']}\n")
    app.run(host=args.host, port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()
