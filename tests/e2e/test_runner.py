"""Unit checks for the runner itself. These do not claim to execute MySQL/Docker."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from contextlib import redirect_stdout
from io import StringIO
import http.server
import threading

spec = importlib.util.spec_from_file_location("admin_e2e", Path(__file__).with_name("admin_e2e.py"))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
ENV = {"E2E_MODE": "isolated", "E2E_DB_HOST": "mysql-e2e", "E2E_BASE_URL": "http://frontend",
    "E2E_RUN_ID": "unit-test-run", "E2E_DB_PASSWORD": "unit-db-secret", "E2E_ADMIN_PASSWORD": "unit-admin-secret", "E2E_USER_PASSWORD": "unit-user-secret"}


class RunnerTests(unittest.TestCase):
    def test_external_database_is_refused(self):
        with patch.dict(os.environ, {**ENV, "E2E_DB_HOST": "production"}, clear=True):
            with self.assertRaises(RuntimeError): runner.require_isolated_environment()

    def test_external_api_is_refused(self):
        with patch.dict(os.environ, {**ENV, "E2E_BASE_URL": "https://example.invalid"}, clear=True):
            with self.assertRaises(RuntimeError): runner.require_isolated_environment()

    def test_missing_run_id_is_refused(self):
        env = dict(ENV); env.pop("E2E_RUN_ID")
        with patch.dict(os.environ, env, clear=True):
            with self.assertRaises(RuntimeError): runner.require_isolated_environment()

    def test_synthetic_environment_is_accepted(self):
        with patch.dict(os.environ, ENV, clear=True): runner.require_isolated_environment()

    def test_fixture_has_no_original_accounts(self):
        fixture = Path(__file__).with_name("fixture.sql").read_text()
        self.assertNotIn("INSERT INTO `users` VALUES", fixture)
        self.assertNotIn("INSERT INTO `analytics_events` VALUES", fixture)
        self.assertIn("CREATE TABLE `users`", fixture)
        self.assertIn("INSERT INTO `pois` VALUES", fixture)

    def test_case_failure_does_not_become_pass(self):
        with patch.dict(os.environ, ENV, clear=True):
            checks = runner.Checks()
            with redirect_stdout(StringIO()): checks.case("intentional failure", lambda: checks.equal(1, 2, "numbers"))
            self.assertEqual(checks.results[0]["status"], "FAIL")

    def test_failure_message_redacts_secrets_and_tokens(self):
        with patch.dict(os.environ, ENV, clear=True):
            checks = runner.Checks(); checks.tokens["ADMIN"] = "unit-access-token"
            def fail(): raise AssertionError("unit-admin-secret unit-db-secret unit-access-token")
            with redirect_stdout(StringIO()): checks.case("redaction", fail)
            self.assertNotIn("unit-admin-secret", checks.results[0]["reason"])
            self.assertNotIn("unit-db-secret", checks.results[0]["reason"])
            self.assertNotIn("unit-access-token", checks.results[0]["reason"])

    def test_summary_comparator_checks_every_counter(self):
        keys = ["pageViews", "uniqueVisitors", "sessions", "activeSessions", "qrOpens", "poiViews", "tourStarts", "audioPlays", "totalEvents", "qrPoiOpens", "legacyQrOpens"]
        body = {name: i for i, name in enumerate(keys)}
        with patch.dict(os.environ, ENV, clear=True), patch.object(runner, "sql", return_value=(tuple(range(11)),)):
            checks = runner.Checks()
            with patch.object(checks, "request", return_value=body): checks.compare_summary()
            for key in keys:
                bad = {**body, key: -1}
                with patch.object(checks, "request", return_value=bad):
                    with self.assertRaises(AssertionError, msg=key): checks.compare_summary()

    def test_report_keeps_fatal_setup_failure(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {**ENV, "E2E_REPORT_DIR": folder}, clear=True):
            result = runner.write_report([], "setup failed")
            self.assertEqual(result["passed"], 0)
            self.assertTrue(result["fatal"])
            saved = json.loads((Path(folder)/"admin-e2e-results.json").read_text())
            self.assertEqual(saved["runId"], ENV["E2E_RUN_ID"])

    def test_request_preserves_unicode_and_bearer(self):
        received = {}
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                received["body"] = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                received["authorization"] = self.headers.get("Authorization")
                self.send_response(201); self.end_headers(); self.wfile.write(b'{"id":1}')
            def log_message(self, *args): pass
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            with patch.dict(os.environ, ENV, clear=True):
                checks = runner.Checks(); checks.base = f"http://127.0.0.1:{server.server_port}"
                checks.tokens["ADMIN"] = "unit-token"
                self.assertEqual(checks.request("POST", "/test", 201, {"name":"Địa điểm"}, "ADMIN"), {"id":1})
                self.assertEqual(received["body"]["name"], "Địa điểm")
                self.assertEqual(received["authorization"], "Bearer unit-token")
        finally:
            server.shutdown(); server.server_close(); thread.join()

    def test_request_does_not_accept_wrong_http_status(self):
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(403); self.end_headers(); self.wfile.write(b'{"detail":"denied"}')
            def log_message(self, *args): pass
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            with patch.dict(os.environ, ENV, clear=True):
                checks = runner.Checks(); checks.base = f"http://127.0.0.1:{server.server_port}"
                with self.assertRaises(AssertionError): checks.request("GET", "/test", 200)
        finally:
            server.shutdown(); server.server_close(); thread.join()

    def test_spa_html_is_not_accepted_as_audio(self):
        class Response:
            status = 200
            headers = {"Content-Type": "text/html"}
            def read(self): return b"<!doctype html>" + b"x" * 200
            def __enter__(self): return self
            def __exit__(self, *args): pass
        with patch.dict(os.environ, ENV, clear=True):
            checks = runner.Checks()
            with patch.object(checks.opener, "open", return_value=Response()):
                with self.assertRaises(AssertionError): checks.asset("/audio/missing.mp3", "audio")
            with self.assertRaises(AssertionError): checks.asset("https://example.invalid/a.mp3", "audio")

    def test_fresh_device_failure_includes_database_age(self):
        with patch.dict(os.environ, ENV, clear=True), patch.object(runner, "sql", return_value=((-500000, 0),)):
            checks = runner.Checks()
            devices = [{"deviceId": str(i), "lastSeenEpochMs": 1000000, "active": False} for i in range(7)]
            with patch.object(checks, "emit"), patch.object(checks, "request", return_value=devices), patch.object(runner.time, "time", return_value=1000):
                with self.assertRaisesRegex(AssertionError, "SQL age_us=-500000"):
                    checks.seed_devices()

    def test_top_poi_uses_api_views_and_checks_all_sql_rows(self):
        with patch.dict(os.environ, ENV, clear=True), patch.object(runner, "sql", return_value=((3, 2), (4, 1))):
            checks = runner.Checks(); checks.poi = {"id": 3}
            with patch.object(checks, "emit"), patch.object(checks, "request", return_value=[{"poiId": 3, "views": 2}, {"poiId": 4, "views": 1}]):
                checks.top_poi()
            for bad in [[{"poiId": 3, "views": 2}], [{"poiId": 3, "views": 9}, {"poiId": 4, "views": 1}], [{"poiId": 3, "views": 2}, {"poiId": 3, "views": 2}, {"poiId": 4, "views": 1}]]:
                with patch.object(checks, "emit"), patch.object(checks, "request", return_value=bad):
                    with self.assertRaises(AssertionError): checks.top_poi()

    def test_markdown_includes_escaped_failure_reason(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {**ENV, "E2E_REPORT_DIR": folder}, clear=True):
            runner.write_report([{"name": "register", "status": "FAIL", "reason": "HTTP 401 | expected 403"}])
            text = (Path(folder)/"admin-e2e-results.md").read_text()
            self.assertIn("HTTP 401", text)
            self.assertIn("expected 403", text)
            self.assertIn("Reason", text)

    def test_launcher_avoids_fixture_exit_abort(self):
        root = Path(__file__).parents[2]
        ps = (root/"Run-AdminE2E.ps1").read_text()
        self.assertIn("run --rm --no-deps admin-e2e", ps)
        self.assertIn("--project-name", ps)
        self.assertIn("Report run ID does not match", ps)
        self.assertNotIn("up --build --abort-on-container-exit", ps)
        self.assertIn("$previous[$key]", ps)


if __name__ == "__main__": unittest.main()
