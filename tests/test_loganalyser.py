"""Test suite. Run with: python -m unittest discover -s tests -v"""
import sys
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loganalyser.analysis import fingerprint, stacktrace, timeline
from loganalyser.analysis.engine import Analyser
from loganalyser.ai import explain as ai
from loganalyser.parsers import timestamps as ts
from loganalyser.parsers.base import normalise_level, sniff_level
from loganalyser.parsers.detect import parse_text
from loganalyser.rules.loader import RuleEngine, load_rules
from loganalyser.web.app import _decode, create_app

SAMPLES = Path(__file__).parent / "sample_logs"


class TestTimestamps(unittest.TestCase):
    def test_common_formats(self):
        cases = {
            "2024-01-15 10:23:45,123 ERROR x": datetime(2024, 1, 15, 10, 23, 45, 123000),
            "2024-01-15T10:23:45.500Z INFO x": datetime(2024, 1, 15, 10, 23, 45, 500000),
            "15/Jan/2024:10:23:45 +0000 GET /": datetime(2024, 1, 15, 10, 23, 45),
            "15-01-2024 10:23:45 WARN x": datetime(2024, 1, 15, 10, 23, 45),
            "[2024-01-15 10:23:45] ERROR x": datetime(2024, 1, 15, 10, 23, 45),
        }
        for line, expected in cases.items():
            stamp = ts.make_naive(ts.extract(line)[0])
            self.assertEqual(stamp, expected, line)

    def test_us_format_am_pm(self):
        self.assertEqual(ts.extract("1/15/2024 1:05:00 PM,Error")[0],
                         datetime(2024, 1, 15, 13, 5, 0))
        self.assertEqual(ts.extract("1/15/2024 12:30:00 AM,Error")[0],
                         datetime(2024, 1, 15, 0, 30, 0))

    def test_ignores_non_timestamps(self):
        for line in ("\tat com.foo.Bar.run(Bar.java:42)", "plain message", "  File \"x.py\", line 3"):
            self.assertIsNone(ts.extract(line)[0], line)

    def test_syslog_year_not_in_future(self):
        stamp = ts.extract("Dec 31 23:59:59 host app: msg")[0]
        self.assertLessEqual((stamp - datetime.now()).days, 1)


class TestLevels(unittest.TestCase):
    def test_aliases(self):
        self.assertEqual(normalise_level("Warning"), "WARN")
        self.assertEqual(normalise_level("SEVERE"), "ERROR")
        self.assertEqual(normalise_level("Information"), "INFO")

    def test_word_error_in_body_is_not_the_level(self):
        self.assertEqual(sniff_level("2024-01-15 10:00:00 INFO user reported an error"), "INFO")


class TestPlaintextParser(unittest.TestCase):
    def test_stack_trace_attaches_to_its_record(self):
        text = ("2024-01-15 10:00:00 ERROR [svc] boom\n"
                "java.lang.IllegalStateException: bad\n"
                "\tat com.acme.A.run(A.java:1)\n"
                "2024-01-15 10:00:01 INFO [svc] next\n")
        entries, fmt, _ = parse_text(text)
        self.assertEqual(fmt, "plaintext")
        self.assertEqual(len(entries), 2)
        self.assertIn("IllegalStateException", entries[0].detail)
        self.assertEqual(entries[1].message, "next")

    def test_bare_stack_trace_is_treated_as_an_error(self):
        entries, _, _ = parse_text(
            "2024-01-15 10:00:00 java.lang.IllegalStateException: no level field here\n"
            "\tat com.acme.A.run(A.java:1)\n")
        self.assertEqual(entries[0].level, "ERROR")

    def test_fields(self):
        entries, _, _ = parse_text("2024-01-15 10:00:00,001 ERROR [order-service] (http-1) failed\n")
        entry = entries[0]
        self.assertEqual((entry.level, entry.logger, entry.thread), ("ERROR", "order-service", "http-1"))


class TestSyslogParser(unittest.TestCase):
    def test_rfc3164_and_5424(self):
        text = ("<34>1 2024-01-15T10:23:45Z web01 nginx 1234 ID47 - upstream timed out\n"
                "Jan 15 10:23:46 web01 sshd[4321]: Failed password for admin from 10.0.0.9\n")
        entries, fmt, _ = parse_text(text)
        self.assertIn(fmt, ("syslog", "rfc5424"))
        self.assertEqual(entries[0].host, "web01")
        self.assertEqual(entries[1].logger, "sshd")
        self.assertEqual(entries[1].process, "4321")

    def test_daemon_severity_beats_transport_priority(self):
        entries, _, _ = parse_text(
            "<11>Jan 15 10:23:47 db01 postgres[900]: FATAL: too many clients\n")
        self.assertEqual(entries[0].level, "FATAL")


class TestWindowsParser(unittest.TestCase):
    def test_xml_export_is_identified_by_event_id(self):
        report = Analyser().analyse_text((SAMPLES / "winevent.xml").read_text())
        self.assertEqual(report.root_cause.rule.id, "win-service-crashed")

    def test_all_three_export_shapes(self):
        for name in ("winevent.csv", "winevent.txt", "winevent.xml"):
            entries, fmt, _ = parse_text((SAMPLES / name).read_text())
            with self.subTest(name):
                self.assertEqual(fmt, "winevent")
                self.assertTrue(entries)
                self.assertTrue(any(e.event_id == "7031" for e in entries))

    def test_description_survives_a_colon_in_the_body(self):
        entries, _, _ = parse_text((SAMPLES / "winevent.txt").read_text())
        target = [e for e in entries if e.event_id == "1026"][0]
        self.assertIn("SqlException", target.message)


class TestFingerprint(unittest.TestCase):
    def test_variable_parts_collapse(self):
        a = fingerprint.fingerprint("Order 55123 failed from 10.0.0.1 in 250ms")
        b = fingerprint.fingerprint("Order 88214 failed from 10.0.0.9 in 91ms")
        self.assertEqual(a, b)

    def test_different_failures_stay_apart(self):
        self.assertNotEqual(fingerprint.fingerprint("Disk full on /var"),
                            fingerprint.fingerprint("Order 1 failed"))


class TestStackTrace(unittest.TestCase):
    def test_java_root_cause_and_culprit(self):
        trace = stacktrace.parse(
            "java.lang.NullPointerException: nope\n"
            "\tat org.springframework.web.Dispatcher.doDispatch(Dispatcher.java:1)\n"
            "\tat com.acme.PaymentHandler.charge(PaymentHandler.java:88)\n"
            "Caused by: java.sql.SQLException: pool empty\n")
        self.assertEqual(trace.exception, "java.lang.NullPointerException")
        self.assertEqual(trace.root_exception, "java.sql.SQLException")
        self.assertEqual(trace.culprit.file, "PaymentHandler.java")
        self.assertEqual(trace.culprit.line, 88)

    def test_python_skips_site_packages(self):
        trace = stacktrace.parse(
            'Traceback (most recent call last):\n'
            '  File "/usr/lib/python3.11/site-packages/flask/app.py", line 1, in run\n'
            '  File "/app/billing/charge.py", line 88, in charge\n'
            'ZeroDivisionError: division by zero\n')
        self.assertEqual(trace.culprit.file, "/app/billing/charge.py")
        self.assertEqual(trace.language, "python")

    def test_no_trace_returns_none(self):
        self.assertIsNone(stacktrace.parse("just an ordinary message"))


class TestRules(unittest.TestCase):
    def setUp(self):
        self.engine = RuleEngine()

    def test_rules_load(self):
        self.assertGreater(len(load_rules()), 40)

    def test_known_signatures(self):
        cases = {
            "HikariPool-1 - Connection is not available, request timed out after 30000ms": "db-pool-exhausted",
            "java.lang.OutOfMemoryError: Java heap space": "jvm-heap-oom",
            "No space left on device": "disk-full",
            "java.net.UnknownHostException: db.internal": "dns-failure",
            "SSLHandshakeException: PKIX path building failed": "tls-handshake-failure",
            "Address already in use": "port-in-use",
            "deadlock detected": "db-deadlock",
            "CircuitBreaker 'x' is OPEN and does not permit further calls": "circuit-breaker-open",
            "Failed password for invalid user admin from 10.0.0.9": "host-auth-failure",
        }
        for text, expected in cases.items():
            with self.subTest(text):
                self.assertEqual(self.engine.best(text).id, expected)

    def test_windows_event_id_matching(self):
        rule = self.engine.best("The Acme service terminated unexpectedly.", event_id="7031")
        self.assertEqual(rule.id, "win-service-crashed")

    def test_event_id_matches_without_message_text(self):
        """XML exports carry an id and raw parameters, but no readable message."""
        rule = self.engine.best("param1=Acme Order Service | param2=60000", event_id="7031")
        self.assertEqual(rule.id, "win-service-crashed")

    def test_message_text_matches_without_an_event_id(self):
        rule = self.engine.best("The Acme service terminated unexpectedly.")
        self.assertEqual(rule.id, "win-service-crashed")

    def test_generic_event_ids_require_the_right_source(self):
        text = "An error was detected on device during a paging operation."
        self.assertEqual(self.engine.best(text, event_id="51", source_name="Disk").id,
                         "win-disk-error")
        self.assertIsNone(self.engine.best("Something else entirely",
                                           event_id="51", source_name="MyApp"))

    def test_unknown_error_matches_nothing(self):
        self.assertIsNone(self.engine.best("ACME-9931 widget desynchronised"))

    def test_cascade_rules_are_flagged(self):
        self.assertTrue(self.engine.best("Read timed out").cascade)


class TestTimeline(unittest.TestCase):
    def test_bucket_width_scales_with_span(self):
        self.assertLessEqual(timeline.choose_width(60), 5)
        self.assertGreaterEqual(timeline.choose_width(86400), 900)


class TestEngineEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = Analyser().analyse_text(
            (SAMPLES / "incident.log").read_text(), filename="incident.log")

    def test_identifies_the_root_cause_not_the_symptom(self):
        self.assertEqual(self.report.root_cause.rule.id, "db-pool-exhausted")

    def test_groups_identical_errors(self):
        pool = [g for g in self.report.groups if g.rule and g.rule.id == "db-pool-exhausted"][0]
        self.assertEqual(pool.count, 4)

    def test_symptoms_rank_below_the_cause(self):
        ranked = [g.rule.id if g.rule else "?" for g in self.report.groups]
        self.assertLess(ranked.index("db-pool-exhausted"), ranked.index("circuit-breaker-open"))

    def test_finds_the_incident_window(self):
        self.assertEqual(len(self.report.incidents), 1)
        self.assertGreaterEqual(self.report.incidents[0].error_count, 6)

    def test_report_serialises(self):
        data = self.report.to_dict()
        self.assertIn("headline", data)
        self.assertEqual(data["root_cause"]["rule"]["id"], "db-pool-exhausted")

    def test_empty_log_is_handled(self):
        report = Analyser().analyse_text("")
        self.assertEqual(report.error_count, 0)
        self.assertIn("No warnings or errors", report.headline())

    def test_severe_record_without_a_level_field_is_not_lost(self):
        """Kernel syslog lines carry no severity word - an OOM kill must still surface."""
        report = Analyser().analyse_text(
            "Jan 15 10:22:30 web01 kernel: Out of memory: Killed process 3312 (java)\n")
        self.assertEqual(report.error_count, 1)
        self.assertEqual(report.groups[0].rule.id, "linux-oom-killer")

    def test_year_inferred_from_a_date_embedded_mid_line(self):
        report = Analyser().analyse_text(
            'Jan 15 10:20:44 web01 nginx[1]: 10.0.0.5 - - [15/Jan/2024:10:20:44 +0000] "GET / HTTP/1.1" 200 4\n'
            "Jan 15 10:22:30 web01 kernel: Out of memory: Killed process 3312 (java)\n")
        self.assertTrue(report.span["start"].startswith("2024-"))

    def test_log_with_no_timestamps(self):
        report = Analyser().analyse_text("ERROR something broke\nINFO fine\nERROR something broke\n")
        self.assertEqual(report.error_count, 2)
        self.assertTrue(report.groups)


class TestRedaction(unittest.TestCase):
    def test_secrets_are_stripped(self):
        out = ai.redact("password=hunter2 Authorization: Bearer sk-ant-api03-abcdefghijkl "
                        "user=bob@corp.com token: eyJhbGciOiJIUzI1NiJ9abcdefghijkl")
        for secret in ("hunter2", "sk-ant-api03", "bob@corp.com", "eyJhbGci"):
            self.assertNotIn(secret, out)

    def test_ai_is_optional(self):
        self.assertIsInstance(ai.status()["available"], bool)


class TestDecoding(unittest.TestCase):
    def test_utf16_windows_export(self):
        data = "Level,Event ID\nError,7031\n".encode("utf-16")
        self.assertEqual(_decode(data)[0], "Level,Event ID")

    def test_invalid_bytes_do_not_crash(self):
        self.assertTrue(_decode(b"ERROR bad byte \xff\xfe here"))


class TestWebApp(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def test_index_loads(self):
        self.assertEqual(self.client.get("/").status_code, 200)

    def test_health(self):
        body = self.client.get("/api/health").get_json()
        self.assertEqual(body["status"], "ok")
        self.assertGreater(body["rules"], 40)

    def test_analyse_pasted_text(self):
        response = self.client.post("/api/analyse", data={
            "text": (SAMPLES / "incident.log").read_text(), "format": "auto"})
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body["root_cause"]["rule"]["id"], "db-pool-exhausted")
        self.assertEqual(body["totals"]["errors"], 7)

    def test_analyse_uploaded_file(self):
        import io
        data = {"file": (io.BytesIO((SAMPLES / "winevent.csv").read_bytes()), "winevent.csv")}
        response = self.client.post("/api/analyse", data=data, content_type="multipart/form-data")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["detected_format"], "winevent")

    def test_empty_request_is_rejected(self):
        response = self.client.post("/api/analyse", data={"text": "  "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.get_json())


if __name__ == "__main__":
    unittest.main(verbosity=2)
