"""Admin HTTP + MySQL checks. Mutation is allowed only in the marked, isolated test DB."""
import argparse
import json
import os
from pathlib import Path
import time
import uuid
import threading
from concurrent.futures import ThreadPoolExecutor
import urllib.error
import urllib.request
from datetime import datetime, timezone
from contextlib import contextmanager

ADMIN_EMAIL = "e2e-admin@example.invalid"
USER_EMAIL = "e2e-user@example.invalid"
BASELINE_COUNTS = {"poi_db.pois": 7, "audio_db.audio": 35, "localization_db.poi_localizations": 35}


def require_isolated_environment():
    if os.environ.get("E2E_MODE") != "isolated" or os.environ.get("E2E_DB_HOST") != "mysql-e2e":
        raise RuntimeError("Refusing to use an unmarked or external database")
    if os.environ.get("E2E_BASE_URL") != "http://frontend":
        raise RuntimeError("Refusing an external API endpoint")
    for key in ["E2E_RUN_ID", "E2E_DB_PASSWORD", "E2E_ADMIN_PASSWORD", "E2E_USER_PASSWORD"]:
        if not os.environ.get(key):
            raise RuntimeError(f"Required E2E setting is missing: {key}")


@contextmanager
def database(multi=False):
    import pymysql
    from pymysql.constants import CLIENT
    connection = pymysql.connect(host=os.environ["E2E_DB_HOST"], user="root",
        password=os.environ["E2E_DB_PASSWORD"], charset="utf8mb4", autocommit=True,
        connect_timeout=10, read_timeout=15, write_timeout=15,
        client_flag=CLIENT.MULTI_STATEMENTS if multi else 0)
    try:
        yield connection
    finally:
        connection.close()


def sql(statement, params=None):
    with database() as connection, connection.cursor() as cursor:
        cursor.execute(statement, params)
        return cursor.fetchall() if cursor.description else ()


def prepare():
    require_isolated_environment()
    with database(multi=True) as connection, connection.cursor() as cursor:
        # A previously used test volume is refused. No DROP/RESET is run against an unknown DB.
        cursor.execute("SHOW DATABASES")
        names = {row[0] for row in cursor.fetchall()}
        if names - {"mysql", "information_schema", "performance_schema", "sys"}:
            raise RuntimeError("Expected a fresh isolated test volume; refusing to reset existing schemas")
        import bcrypt
        fixture = Path(__file__).with_name("fixture.sql").read_text(encoding="utf-8-sig")
        if "INSERT INTO `users` VALUES" in fixture or "INSERT INTO `analytics_events` VALUES" in fixture:
            raise RuntimeError("Fixture must not contain original accounts or visitor events")
        cursor.execute(fixture)
        while cursor.nextset():
            pass
        # Running twice verifies that the additive migration remains repeatable.
        for name in ("metadata.sql", "category.sql"):
            migration = Path(__file__).with_name(name).read_text(encoding="utf-8-sig")
            for _ in range(2):
                cursor.execute(migration)
                while cursor.nextset():
                    pass
        cursor.execute("SELECT COUNT(*) FROM identity_db.users")
        if cursor.fetchone()[0] != 0:
            raise RuntimeError("Fixture unexpectedly contains user accounts")
        for email, role, key in [(ADMIN_EMAIL, "ADMIN", "E2E_ADMIN_PASSWORD"), (USER_EMAIL, "USER", "E2E_USER_PASSWORD")]:
            hashed = bcrypt.hashpw(os.environ[key].encode(), bcrypt.gensalt(rounds=10)).decode()
            cursor.execute("INSERT INTO identity_db.users(email,full_name,password,role) VALUES(%s,%s,%s,%s)",
                (email, f"E2E {role}", hashed, role))
        cursor.execute("CREATE DATABASE e2e_control")
        cursor.execute("CREATE TABLE e2e_control.run_marker(run_id VARCHAR(64) PRIMARY KEY)")
        cursor.execute("INSERT INTO e2e_control.run_marker VALUES(%s)", (os.environ["E2E_RUN_ID"],))
    print("Prepared isolated fixture, two synthetic accounts and repeatable metadata migration", flush=True)


class Checks:
    def __init__(self):
        self.results = []
        self.tokens = {}
        self.base = os.environ["E2E_BASE_URL"]
        self.poi = None
        self.localization = None
        self.audio = None
        self.session_ids = []
        self.device_ids = []
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    def request(self, method, path, expected=200, payload=None, role=None, raw=False, token=None, status_only=False):
        headers = {"Accept": "application/json"}
        if payload is not None:
            headers["Content-Type"] = "application/json"
        bearer = token if token is not None else self.tokens.get(role)
        if bearer:
            headers["Authorization"] = f"Bearer {bearer}"
        request = urllib.request.Request(self.base + path, method=method, headers=headers,
            data=None if payload is None else json.dumps(payload, ensure_ascii=False).encode())
        try:
            with self.opener.open(request, timeout=20) as response:
                status, body = response.status, response.read()
        except urllib.error.HTTPError as error:
            status, body = error.code, error.read()
        allowed = expected if isinstance(expected, tuple) else (expected,)
        if status not in allowed:
            raise AssertionError(f"{method} {path}: HTTP {status}, expected {expected}")
        if status_only:
            return status
        if raw:
            return body.decode("utf-8", errors="replace")
        return json.loads(body) if body else None

    def asset(self, path, kind):
        if not isinstance(path, str) or not path.startswith("/") or path.startswith("//"):
            raise AssertionError("Fixture asset must be a same-origin relative URL")
        with self.opener.open(self.base + path, timeout=20) as response:
            body = response.read()
            mime = response.headers.get("Content-Type", "").lower()
            if response.status != 200 or not mime.startswith(kind + "/") or len(body) < 100:
                raise AssertionError(f"Invalid {kind} asset response: {path}")
            if body.lstrip().lower().startswith((b"<!doctype html", b"<html")):
                raise AssertionError(f"SPA HTML returned instead of media: {path}")

    def check_media(self):
        pois = self.request("GET", "/api/pois")
        audio_count = 0
        for poi in pois:
            self.asset(poi["imageUrl"], "image")
            rows = self.request("GET", f"/api/audio?poiId={poi['id']}")
            for audio in rows:
                self.asset(audio["audioUrl"], "audio")
                audio_count += 1
        self.equal(len(pois), 7, "fixture image coverage")
        self.equal(audio_count, 35, "fixture audio coverage")

    def wait_ready(self):
        deadline = time.monotonic() + 180
        while time.monotonic() < deadline:
            try:
                if isinstance(self.request("GET", "/api/pois"), list):
                    self.request("POST", "/api/v1/auth/login", payload={"email": ADMIN_EMAIL, "password": os.environ["E2E_ADMIN_PASSWORD"]})
                    self.request("GET", "/api/localizations?poiId=3&lang=vi")
                    self.request("GET", "/api/audio?poiId=3&lang=vi")
                    return
            except Exception:
                pass
            time.sleep(2)
        raise RuntimeError("Services did not become ready within 180 seconds")

    def case(self, name, action):
        started = time.monotonic()
        try:
            action()
            result = {"name": name, "status": "PASS"}
        except Exception as error:
            # Do not put request bodies, credentials, tokens or SQL parameters in the report.
            message = str(error) if isinstance(error, AssertionError) else type(error).__name__
            for value in [*self.tokens.values(), os.environ.get("E2E_DB_PASSWORD"), os.environ.get("E2E_ADMIN_PASSWORD"), os.environ.get("E2E_USER_PASSWORD")]:
                if value:
                    message = message.replace(value, "[REDACTED]")
            result = {"name": name, "status": "FAIL", "reason": message[:300]}
        result["seconds"] = round(time.monotonic() - started, 3)
        self.results.append(result)
        print(f"{result['status']} {name}", flush=True)

    @staticmethod
    def equal(actual, expected, label):
        if actual != expected:
            raise AssertionError(f"Mismatch: {label}")

    def login(self, role):
        email, key = (ADMIN_EMAIL, "E2E_ADMIN_PASSWORD") if role == "ADMIN" else (USER_EMAIL, "E2E_USER_PASSWORD")
        result = self.request("POST", "/api/v1/auth/login", payload={"email": email, "password": os.environ[key]})
        self.equal(result.get("role"), role, "login role")
        if not isinstance(result.get("accessToken"), str) or not result["accessToken"]:
            raise AssertionError("Login did not return a token")
        self.tokens[role] = result["accessToken"]

    def register_user(self):
        body = {"email": "e2e-created@example.invalid", "password": os.environ["E2E_USER_PASSWORD"], "fullName": "E2E Created User"}
        result = self.request("POST", "/api/v1/auth/register", payload=body, role="ADMIN")
        self.equal(result.get("role"), "USER", "new account role")
        row = sql("SELECT role,password FROM identity_db.users WHERE email=%s", (body["email"],))[0]
        self.equal(row[0], "USER", "new account SQL role")
        if row[1] == body["password"]:
            raise AssertionError("Password was stored in plaintext")
        import bcrypt
        if not bcrypt.checkpw(body["password"].encode(), row[1].encode()):
            raise AssertionError("Stored password does not verify as bcrypt")

    def create_poi(self):
        body = self.poi_payload()
        self.poi = self.request("POST", "/api/pois", 201, body, "ADMIN")
        if not isinstance(self.poi.get("id"), int):
            raise AssertionError("Missing created POI ID")
        row = sql("SELECT name,description,image_url FROM poi_db.pois WHERE id=%s", (self.poi["id"],))
        self.equal(row[0], (body["name"], body["description"], body["imageUrl"]), "POI SQL persistence and Unicode")
        self.equal(sql("SELECT created_at IS NOT NULL AND updated_at IS NOT NULL FROM poi_db.pois WHERE id=%s", (self.poi["id"],))[0][0], 1, "POI timestamps")

    def poi_payload(self):
        return {"name": "Địa điểm kiểm thử E2E", "description": "Mô tả tiếng Việt có dấu", "qrCode": "E2E_" + os.environ["E2E_RUN_ID"],
            "latitude": 15.8770873, "longitude": 108.3260704, "radius": 30, "status": "ACTIVE", "imageUrl": "/Images/Chua-cau-Hoi-An.jpg"}

    def update_poi(self, clear=False):
        body = self.poi_payload()
        if clear:
            body["imageUrl"] = None
        else:
            body.pop("imageUrl")
        body["description"] = "Mô tả đã cập nhật"
        self.request("PUT", f"/api/pois/{self.poi['id']}", 200, body, "ADMIN")
        expected = None if clear else self.poi_payload()["imageUrl"]
        self.equal(sql("SELECT image_url FROM poi_db.pois WHERE id=%s", (self.poi["id"],))[0][0], expected, "update image preservation/clear")

    def inactive_policy(self):
        body = self.poi_payload()
        body["status"] = "INACTIVE"
        self.request("PUT", f"/api/pois/{self.poi['id']}", 200, body, "ADMIN")
        self.request("GET", f"/api/pois/{self.poi['id']}", 404)
        self.request("GET", "/api/pois/qr/" + body["qrCode"], 404)
        self.request("GET", f"/api/pois/{self.poi['id']}", role="ADMIN")
        public = self.request("GET", "/api/pois")
        if any(row["id"] == self.poi["id"] for row in public):
            raise AssertionError("Inactive POI leaked in public list")
        admin = self.request("GET", "/api/admin/pois", role="ADMIN")
        if not any(row["id"] == self.poi["id"] for row in admin):
            raise AssertionError("Admin cannot manage inactive POI")
        self.request("PUT", f"/api/pois/{self.poi['id']}", 200, self.poi_payload(), "ADMIN")

    def localization_payload(self, poi_id=None):
        return {"poiId": self.poi["id"] if poi_id is None else poi_id, "languageCode": "vi", "localizedName": "Tên bản dịch E2E", "localizedDescription": "Nội dung bản dịch tiếng Việt"}

    def create_localization(self):
        body = self.localization_payload()
        self.localization = self.request("POST", "/api/localizations", 201, body, "ADMIN")
        self.equal(sql("SELECT localized_name FROM localization_db.poi_localizations WHERE id=%s", (self.localization["id"],))[0][0], body["localizedName"], "localization SQL persistence")

    def update_localization(self):
        body = self.localization_payload()
        body["localizedDescription"] = "Bản dịch đã sửa E2E"
        self.request("PUT", f"/api/localizations/{self.localization['id']}", 200, body, "ADMIN")
        self.equal(sql("SELECT localized_description FROM localization_db.poi_localizations WHERE id=%s", (self.localization["id"],))[0][0], body["localizedDescription"], "localization update SQL")

    def audio_payload(self, poi_id=None):
        return {"poiId": self.poi["id"] if poi_id is None else poi_id, "languageCode": "vi", "audioUrl": "/audio/3-vi.mp3", "durationSeconds": 45}

    def create_audio(self):
        body = self.audio_payload()
        self.audio = self.request("POST", "/api/audio", 201, body, "ADMIN")
        self.equal(sql("SELECT audio_url,duration_seconds FROM audio_db.audio WHERE id=%s", (self.audio["id"],))[0], (body["audioUrl"], 45), "audio SQL persistence")

    def update_audio(self):
        body = self.audio_payload()
        body["durationSeconds"] = 46
        self.request("PUT", f"/api/audio/{self.audio['id']}", 200, body, "ADMIN")
        self.equal(sql("SELECT duration_seconds FROM audio_db.audio WHERE id=%s", (self.audio["id"],))[0][0], 46, "audio update SQL")

    def emit(self, kind, source="e2e", session_id=None, device_id=None, poi_id=3):
        body = {"eventType": kind, "visitorId": str(uuid.uuid4()), "sessionId": session_id or str(uuid.uuid4()),
            "deviceId": device_id or str(uuid.uuid4()), "deviceType": "MOBILE", "platform": "Android", "browserName": "Chrome",
            "pagePath": "/", "source": source, "poiId": poi_id}
        return self.request("POST", "/api/analytics/events", 202, body)

    def inactive_content(self):
        body = self.poi_payload()
        body["status"] = "INACTIVE"
        self.request("PUT", f"/api/pois/{self.poi['id']}", payload=body, role="ADMIN")
        try:
            for path in [f"/api/localizations?poiId={self.poi['id']}&lang=vi",
                         f"/api/localizations/{self.localization['id']}",
                         f"/api/audio?poiId={self.poi['id']}&lang=vi",
                         f"/api/audio/{self.audio['id']}"]:
                self.request("GET", path, 404)
                self.request("GET", path, role="ADMIN")
        finally:
            self.request("PUT", f"/api/pois/{self.poi['id']}", payload=self.poi_payload(), role="ADMIN")

    def category_policy(self):
        expected = {3: "history", 4: "oldhouse", 5: "assembly", 6: "market", 7: "assembly", 8: "oldhouse", 9: "assembly"}
        actual = {row["id"]: row["category"] for row in self.request("GET", "/api/pois") if row["id"] in expected}
        self.equal(actual, expected, "repeatable sample category migration")
        body = {**self.poi_payload(), "category": "market"}
        self.request("PUT", f"/api/pois/{self.poi['id']}", payload=body, role="ADMIN")
        self.request("PUT", f"/api/pois/{self.poi['id']}", payload=self.poi_payload(), role="ADMIN")
        self.equal(sql("SELECT category FROM poi_db.pois WHERE id=%s", (self.poi["id"],))[0][0], "market", "omitted category preserves previous value")

    def concurrent_child_and_delete(self):
        # Race actual HTTP writers through the shared MySQL named lock. Both
        # outcomes are valid: child wins and deletion conflicts, or parent is
        # deleted and the child is rejected. Neither may leave an orphan.
        for kind in ("localizations", "audio"):
            for attempt in range(3):
                parent = self.request("POST", "/api/pois", 201,
                    {**self.poi_payload(), "qrCode": f"RACE_{kind}_{attempt}_{os.environ['E2E_RUN_ID']}"}, "ADMIN")
                gate = threading.Barrier(2)
                path = "/api/" + kind
                payload = self.localization_payload(parent["id"]) if kind == "localizations" else self.audio_payload(parent["id"])
                def create():
                    gate.wait(timeout=10)
                    return self.request("POST", path, (201, 400, 409), payload, "ADMIN", status_only=True)
                def delete():
                    gate.wait(timeout=10)
                    return self.request("DELETE", f"/api/pois/{parent['id']}", (204, 409), role="ADMIN", status_only=True)
                with ThreadPoolExecutor(max_workers=2) as pool:
                    creation = pool.submit(create)
                    deletion = pool.submit(delete)
                    codes = (creation.result(timeout=30), deletion.result(timeout=30))
                if codes not in ((201, 409), (400, 204), (409, 204)):
                    raise AssertionError(f"Unexpected race outcome: {codes}")
                for table in ("localization_db.poi_localizations", "audio_db.audio"):
                    self.equal(sql(f"SELECT COUNT(*) FROM {table} c LEFT JOIN poi_db.pois p ON p.id=c.poi_id WHERE p.id IS NULL")[0][0], 0, "no orphan after concurrent writes")
                if codes[0] == 201:
                    rows = self.request("GET", path + f"?poiId={parent['id']}", role="ADMIN")
                    for row in rows:
                        self.request("DELETE", path + f"/{row['id']}", 204, role="ADMIN")
                    self.request("DELETE", f"/api/pois/{parent['id']}", 204, role="ADMIN")

    def timestamp_normalization(self):
        ident = self.localization["id"]
        sql("UPDATE localization_db.poi_localizations SET updated_at=TIMESTAMPADD(DAY,-1,created_at) WHERE id=%s", (ident,))
        original = sql("SELECT created_at,updated_at FROM localization_db.poi_localizations WHERE id=%s", (ident,))[0]
        migration = Path(__file__).with_name("normalize-timestamps.sql").read_text(encoding="utf-8-sig")
        for _ in range(2):
            with database(multi=True) as connection, connection.cursor() as cursor:
                cursor.execute(migration)
                while cursor.nextset():
                    pass
        self.equal(sql("SELECT created_at,updated_at FROM localization_db.poi_localizations WHERE id=%s", (ident,))[0], (original[0], original[0]), "timestamps normalized")
        self.equal(sql("SELECT original_created_at,original_updated_at,normalized_updated_at FROM localization_db.timestamp_normalization_audit WHERE localization_id=%s", (ident,)), ((original[0], original[1], original[0]),), "original timestamps retained exactly once")

    def invalid_poi(self, field, value):
        self.request("PUT", f"/api/pois/{self.poi['id']}", 400, {**self.poi_payload(), field: value}, "ADMIN")

    def nginx_body_limit(self):
        self.request("POST", "/api/analytics/events", 413, {"padding": "x" * 5000}, status_only=True)

    def nginx_event_rate_limit(self):
        payload = {"eventType": "page_view", "sessionId": str(uuid.uuid4()), "pagePath": "/", "source": "test"}
        def send(_):
            return self.request("POST", "/api/analytics/events", (202, 429), payload, status_only=True)
        with ThreadPoolExecutor(max_workers=16) as pool:
            codes = list(pool.map(send, range(100)))
        if 429 not in codes:
            raise AssertionError("Nginx did not enforce the analytics burst rate limit")
        # Let the shared client-IP bucket recover for subsequent checks.
        time.sleep(5)

    def seed_devices(self):
        # Isolated DB only. Old events have no device metadata, leaving seven reproducible device records.
        for _ in range(7):
            session_id, device_id = str(uuid.uuid4()), str(uuid.uuid4())
            self.session_ids.append(session_id)
            self.device_ids.append(device_id)
            self.emit("page_view", session_id=session_id, device_id=device_id, poi_id=None)
        devices = self.request("GET", "/api/analytics/admin/devices?limit=100&activeWithinSeconds=30", role="ADMIN")
        self.equal(len(devices), 7, "seven device records")
        for device in devices:
            if abs(time.time() * 1000 - device["lastSeenEpochMs"]) > 15_000:
                raise AssertionError("Device epoch differs from current clock; inspect timezone handling")
            if device["active"] is not True:
                age, db_active = sql("""SELECT
                    TIMESTAMPDIFF(MICROSECOND, MAX(created_at), CURRENT_TIMESTAMP(6)),
                    MAX(created_at) BETWEEN TIMESTAMPADD(SECOND,-30,CURRENT_TIMESTAMP(6)) AND CURRENT_TIMESTAMP(6)
                    FROM poi_db.analytics_events WHERE device_id=%s""", (device["deviceId"],))[0]
                raise AssertionError(f"Fresh device active={device['active']}; SQL active={db_active}; SQL age_us={age}")

    def compare_summary(self):
        body = self.request("GET", "/api/analytics/admin/summary", role="ADMIN")
        # Same filter and 30-second definition as the backend. Separate landing, POI and legacy QR.
        row = sql("""SELECT
            COALESCE(SUM(event_type='page_view'),0),
            COUNT(DISTINCT CASE WHEN event_type='page_view' THEN visitor_id END),
            COUNT(DISTINCT CASE WHEN event_type='page_view' THEN session_id END),
            COUNT(DISTINCT CASE WHEN created_at BETWEEN TIMESTAMPADD(SECOND,-30,CURRENT_TIMESTAMP(6)) AND CURRENT_TIMESTAMP(6) THEN session_id END),
            COALESCE(SUM(event_type='qr_open' AND LOWER(TRIM(source))='qr_landing_verified'),0),
            COALESCE(SUM(event_type='poi_view'),0), COALESCE(SUM(event_type='tour_start'),0),
            COALESCE(SUM(event_type='audio_play'),0), COUNT(*),
            COALESCE(SUM(event_type='qr_open' AND LOWER(TRIM(source))='qr_poi_verified'),0),
            COALESCE(SUM(event_type='qr_open' AND LOWER(TRIM(source))='qr_verified'),0)
            FROM poi_db.analytics_events WHERE source IS NULL OR LOWER(TRIM(source)) NOT IN ('test','browser-test')""")[0]
        names = ["pageViews", "uniqueVisitors", "sessions", "activeSessions", "qrOpens", "poiViews", "tourStarts", "audioPlays", "totalEvents", "qrPoiOpens", "legacyQrOpens"]
        for name, count in zip(names, row):
            self.equal(body.get(name), int(count), f"summary field {name}")

    def old_device(self):
        sql("UPDATE poi_db.analytics_events SET created_at=TIMESTAMPADD(SECOND,-60,CURRENT_TIMESTAMP) WHERE device_id=%s", (self.device_ids[0],))
        devices = self.request("GET", "/api/analytics/admin/devices?limit=100&activeWithinSeconds=30", role="ADMIN")
        device = next(row for row in devices if row["deviceId"] == self.device_ids[0])
        self.equal(device["active"], False, "idle device active flag")
        self.equal(device["status"], "OFFLINE", "idle device status")

    def qr_separation(self):
        before = self.request("GET", "/api/analytics/admin/summary", role="ADMIN")
        for source in ["qr_landing_verified", "qr_poi_verified", "qr_verified"]:
            self.emit("qr_open", source=source)
        after = self.request("GET", "/api/analytics/admin/summary", role="ADMIN")
        for name in ["qrOpens", "qrPoiOpens", "legacyQrOpens"]:
            self.equal(after[name], before[name] + 1, f"separate QR metric {name}")

    def exclude_test_sources(self):
        before = self.request("GET", "/api/analytics/admin/summary", role="ADMIN")
        for source in ["test", "browser-test", " TEST "]:
            self.emit("page_view", source=source)
        after = self.request("GET", "/api/analytics/admin/summary", role="ADMIN")
        for name in ["totalEvents", "pageViews", "uniqueVisitors", "sessions"]:
            self.equal(after[name], before[name], f"test source excluded from {name}")

    def top_poi(self):
        self.emit("poi_view", poi_id=self.poi["id"])
        rows = self.request("GET", "/api/analytics/admin/pois/top?limit=50", role="ADMIN")
        counts = {int(poi_id): int(count) for poi_id, count in sql("SELECT poi_id,COUNT(*) FROM poi_db.analytics_events WHERE event_type='poi_view' AND poi_id IS NOT NULL AND (source IS NULL OR LOWER(TRIM(source)) NOT IN ('test','browser-test')) GROUP BY poi_id")}
        actual = {int(row["poiId"]): int(row["views"]) for row in rows}
        self.equal(len(actual), len(rows), "top POI duplicate IDs")
        self.equal(actual, counts, "top POI IDs and counts")
        if not any(row["poiId"] == self.poi["id"] for row in rows):
            raise AssertionError("New POI is missing from top list")

    def delete_all(self):
        self.request("DELETE", f"/api/localizations/{self.localization['id']}", 204, role="ADMIN")
        self.request("DELETE", f"/api/audio/{self.audio['id']}", 204, role="ADMIN")
        self.request("DELETE", f"/api/pois/{self.poi['id']}", 204, role="ADMIN")
        for table, record in [("poi_db.pois", self.poi), ("audio_db.audio", self.audio), ("localization_db.poi_localizations", self.localization)]:
            self.equal(sql(f"SELECT COUNT(*) FROM {table} WHERE id=%s", (record["id"],))[0][0], 0, f"delete persisted in {table}")
        self.request("GET", f"/api/pois/{self.poi['id']}", 404)

    def run(self):
        require_isolated_environment()
        marker = sql("SELECT run_id FROM e2e_control.run_marker")
        self.equal(marker, ((os.environ["E2E_RUN_ID"],),), "isolated database marker")
        self.wait_ready()
        self.case("Frontend /admin serves SPA HTML", lambda: self.equal('id="root"' in self.request("GET", "/admin", raw=True), True, "SPA route"))
        for table, count in BASELINE_COUNTS.items():
            self.case(f"Fixture count {table}", lambda t=table,c=count: self.equal(sql(f"SELECT COUNT(*) FROM {t}")[0][0], c, "baseline row count"))
        self.case("Seven images and 35 audio URLs serve media through Nginx", self.check_media)
        self.case("ADMIN login", lambda: self.login("ADMIN"))
        self.case("USER login", lambda: self.login("USER"))
        self.case("ADMIN /me", lambda: self.equal(self.request("GET", "/api/v1/auth/me", role="ADMIN")["role"], "ADMIN", "current role"))
        register = {"email": "e2e-refused@example.invalid", "password": os.environ["E2E_USER_PASSWORD"], "fullName": "E2E Refused"}
        self.case("Guest cannot register accounts", lambda: self.request("POST", "/api/v1/auth/register", 401, register))
        self.case("USER cannot register accounts", lambda: self.request("POST", "/api/v1/auth/register", 403, register, "USER"))
        self.case("ADMIN creates USER with bcrypt storage", self.register_user)
        self.case("Wrong password rejected", lambda: self.request("POST", "/api/v1/auth/login", 401, {"email": ADMIN_EMAIL, "password": "invalid-test-password"}))
        self.case("Guest cannot read Admin catalogue", lambda: self.request("GET", "/api/admin/pois", 401))
        self.case("USER cannot read Admin catalogue", lambda: self.request("GET", "/api/admin/pois", 403, role="USER"))
        self.case("Tampered token rejected", lambda: self.request("GET", "/api/admin/pois", 401, token="invalid.token.signature"))
        for path in ["/api/pois", "/api/localizations", "/api/audio"]:
            self.case(f"Guest cannot POST {path}", lambda p=path: self.request("POST", p, 401, {}))
            self.case(f"USER cannot POST {path}", lambda p=path: self.request("POST", p, 403, {}, "USER"))
        for suffix in ["summary", "devices", "sessions", "pois/top"]:
            path = "/api/analytics/admin/" + suffix
            self.case(f"Guest cannot GET {suffix}", lambda p=path: self.request("GET", p, 401))
            self.case(f"USER cannot GET {suffix}", lambda p=path: self.request("GET", p, 403, role="USER"))
        self.case("Create POI and verify SQL Unicode/timestamps", self.create_poi)
        if self.poi is None:
            raise RuntimeError("POI creation failed; dependent CRUD cases cannot run")
        self.case("Duplicate QR returns 409", lambda: self.request("POST", "/api/pois", 409, self.poi_payload(), "ADMIN"))
        invalid = self.poi_payload(); invalid["latitude"] = 91
        self.case("Invalid coordinates return 400", lambda: self.request("PUT", f"/api/pois/{self.poi['id']}", 400, invalid, "ADMIN"))
        self.case("Omitted imageUrl preserves SQL value", self.update_poi)
        self.case("Explicit null clears imageUrl", lambda: self.update_poi(clear=True))
        self.case("INACTIVE hidden from guests, manageable by ADMIN", self.inactive_policy)
        self.case("Create localization and verify SQL", self.create_localization)
        self.case("Update localization and verify SQL", self.update_localization)
        self.case("Duplicate localization returns 409", lambda: self.request("POST", "/api/localizations", 409, self.localization_payload(), "ADMIN"))
        self.case("Unknown localization POI rejected", lambda: self.request("POST", "/api/localizations", 400, self.localization_payload(9_999_999), "ADMIN"))
        self.case("Create local audio URL and verify SQL", self.create_audio)
        self.case("Update audio and verify SQL", self.update_audio)
        self.case("Duplicate audio returns 409", lambda: self.request("POST", "/api/audio", 409, self.audio_payload(), "ADMIN"))
        self.case("Unknown audio POI rejected", lambda: self.request("POST", "/api/audio", 400, self.audio_payload(9_999_999), "ADMIN"))
        blank_duration = self.audio_payload(); blank_duration.pop("durationSeconds")
        self.case("Missing duration returns 400", lambda: self.request("POST", "/api/audio", 400, blank_duration, "ADMIN"))
        unsafe = self.audio_payload(); unsafe["audioUrl"] = "javascript:alert(1)"
        self.case("Unsafe audio URL returns 400", lambda: self.request("POST", "/api/audio", 400, unsafe, "ADMIN"))
        self.case("INACTIVE content reads enforce parent visibility", self.inactive_content)
        self.case("Category persists and omitted update preserves it", self.category_policy)
        self.case("Concurrent child create and POI delete leave no orphan", self.concurrent_child_and_delete)
        self.case("Timestamp normalization retains originals and is repeatable", self.timestamp_normalization)
        for radius in (0.99, 5000.01, 30.123):
            self.case(f"Invalid radius {radius} returns 400", lambda r=radius: self.invalid_poi("radius", r))
        self.case("Overlong Unicode POI description returns 400", lambda: self.invalid_poi("description", "Đ" * 10001))
        self.case("Missing MP3 returns 404 instead of SPA HTML", lambda: self.request("GET", "/audio/missing-e2e.mp3", 404, raw=True))
        self.case("Analytics rejects unknown POI", lambda: self.request("POST", "/api/analytics/events", 400, {"eventType": "poi_view", "sessionId": str(uuid.uuid4()), "pagePath": "/", "poiId": 99999999, "source": "test"}))
        self.case("POI event requires POI ID", lambda: self.request("POST", "/api/analytics/events", 400, {"eventType": "poi_view", "sessionId": str(uuid.uuid4()), "pagePath": "/", "source": "test"}))
        for path in ("/api/localizations?poiId=abc", "/api/audio?poiId=abc", "/api/analytics/admin/pois/top?limit=abc"):
            self.case(f"Invalid query parameter returns 400: {path}", lambda p=path: self.request("GET", p, 400, role="ADMIN"))
        self.case("Delete POI with content returns 409", lambda: self.request("DELETE", f"/api/pois/{self.poi['id']}", 409, role="ADMIN"))
        self.case("Seven real device records and current epoch", self.seed_devices)
        self.case("Native session SQL returns populated rows", lambda: self.equal(len([row for row in self.request("GET", "/api/analytics/admin/sessions?limit=100&activeWithinSeconds=30", role="ADMIN") if row["sessionId"] in self.session_ids]), 7, "native session query"))
        self.case("QR landing/POI/history counters separate", self.qr_separation)
        self.case("Test sources excluded consistently", self.exclude_test_sources)
        self.case("audio_play event accepted with metadata", lambda: self.emit("audio_play", source="e2e-audio"))
        self.case("Top POI matches SQL", self.top_poi)
        self.case("Idle device becomes inactive", self.old_device)
        self.case("All summary counters equal SQL", self.compare_summary)
        self.case("Delete children then POI, verify SQL removal", self.delete_all)
        self.case("Nginx rejects analytics body larger than 4 KiB", self.nginx_body_limit)
        self.case("Nginx returns 429 for analytics burst", self.nginx_event_rate_limit)
        return self.results


def write_report(results, failure=None):
    destination = Path(os.environ.get("E2E_REPORT_DIR", "/reports"))
    destination.mkdir(parents=True, exist_ok=True)
    report = {"executedAt": datetime.now(timezone.utc).isoformat(), "environment": "isolated Docker MySQL 8",
        "runId": os.environ.get("E2E_RUN_ID"), "passed": sum(r["status"] == "PASS" for r in results),
        "failed": sum(r["status"] == "FAIL" for r in results), "fatal": failure, "cases": results}
    (destination/"admin-e2e-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = ["# Admin E2E result", "", "Executed against an isolated MySQL database; not the group's live database.", "",
        f"Pass {report['passed']} / Fail {report['failed']} / Fatal {bool(failure)}", "", "| Case | Result | Reason |", "|---|---|---|"]
    def cell(value):
        return str(value).replace("|", "\\|").replace("\r", " ").replace("\n", " ")
    lines.extend(f"| {cell(r['name'])} | {r['status']} | {cell(r.get('reason', ''))} |" for r in results)
    if failure: lines.extend(["", f"Setup/runner failure: {failure}"])
    (destination/"admin-e2e-results.md").write_text("\n".join(lines)+"\n", encoding="utf-8")
    return report


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--prepare", action="store_true")
    args = parser.parse_args()
    if args.prepare:
        prepare()
        return 0
    checks = Checks()
    fatal = None
    try:
        checks.run()
    except Exception as error:
        fatal = type(error).__name__ + ": setup or dependent check failed; inspect service logs"
        print(f"FATAL {fatal}", flush=True)
    report = write_report(checks.results, fatal)
    print(f"SUMMARY PASS={report['passed']} FAIL={report['failed']} FATAL={bool(fatal)}", flush=True)
    return 1 if fatal or report["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
