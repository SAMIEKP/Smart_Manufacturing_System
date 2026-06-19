import json
import sqlite3
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = Path(__file__).resolve().parent / "smart_manufacturing.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def parse_json_field(value):
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.get("/api/alerts")
def list_alerts():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM alerts ORDER BY time DESC").fetchall()
        return jsonify([dict(row) for row in rows])


@app.post("/api/alerts/ack")
def acknowledge_alerts():
    data = request.get_json(force=True)
    ids = data.get("ids")
    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "ids must be a non-empty list"}), 400

    with get_conn() as conn:
        conn.executemany("UPDATE alerts SET acknowledged = 1 WHERE id = ?", [(item,) for item in ids])
        conn.commit()

    return jsonify({"ok": True, "acknowledged": len(ids)})


@app.get("/api/operators")
def list_operators():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM operators").fetchall()

    operators = []
    for row in rows:
        operator = dict(row)
        operator["tags"] = parse_json_field(operator.get("tags"))
        operator["expertise"] = parse_json_field(operator.get("expertise"))
        operators.append(operator)

    return jsonify(operators)


@app.post("/api/operators")
def create_operator():
    data = request.get_json(force=True)
    required_fields = ["id", "name", "role", "email", "lastShift", "status", "initials"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} required"}), 400

    tags_json = json.dumps(data.get("tags")) if data.get("tags") is not None else None
    expertise_json = json.dumps(data.get("expertise")) if data.get("expertise") is not None else None

    try:
        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO operators(id, name, role, email, lastShift, status, initials, level, tags, expertise)
                VALUES(?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    data["id"],
                    data["name"],
                    data["role"],
                    data["email"],
                    data["lastShift"],
                    data["status"],
                    data["initials"],
                    data.get("level"),
                    tags_json,
                    expertise_json,
                ),
            )
            conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "operator id already exists"}), 409

    return jsonify({"ok": True})


@app.put("/api/operators/<op_id>")
def update_operator(op_id: str):
    data = request.get_json(force=True)
    allowed_fields = [
        "name",
        "role",
        "email",
        "lastShift",
        "status",
        "initials",
        "level",
    ]

    set_clauses = []
    params = []
    for field in allowed_fields:
        if field in data:
            set_clauses.append(f"{field} = ?")
            params.append(data[field])

    if "tags" in data:
        set_clauses.append("tags = ?")
        params.append(json.dumps(data.get("tags")))

    if "expertise" in data:
        set_clauses.append("expertise = ?")
        params.append(json.dumps(data.get("expertise")))

    if not set_clauses:
        return jsonify({"error": "no fields to update"}), 400

    params.append(op_id)
    with get_conn() as conn:
        cur = conn.execute(f"UPDATE operators SET {', '.join(set_clauses)} WHERE id = ?", params)
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "operator not found"}), 404

    return jsonify({"ok": True})


@app.delete("/api/operators/<op_id>")
def delete_operator(op_id: str):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM operators WHERE id = ?", (op_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "operator not found"}), 404

    return jsonify({"ok": True})


@app.get("/api/thresholds")
def get_thresholds():
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM thresholds WHERE key = 'default'").fetchone()
        return jsonify(dict(row) if row else None)


@app.post("/api/thresholds")
def update_thresholds():
    data = request.get_json(force=True)
    if data.get("criticalTemp") is None or data.get("vibrationTolerance") is None:
        return jsonify({"error": "criticalTemp and vibrationTolerance required"}), 400

    with get_conn() as conn:
        conn.execute(
            "UPDATE thresholds SET criticalTemp = ?, vibrationTolerance = ? WHERE key = 'default'",
            (data["criticalTemp"], data["vibrationTolerance"]),
        )
        conn.commit()

    return jsonify({"ok": True})


@app.get("/api/inspections")
def list_inspections():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM inspections ORDER BY timestamp DESC").fetchall()
        return jsonify([dict(row) for row in rows])


@app.post("/api/inspections")
def create_inspection():
    data = request.get_json(force=True)
    required_fields = ["id", "timestamp", "partId", "type", "status", "severity"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} required"}), 400

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO inspections(id, timestamp, partId, type, status, severity, line, cycleTime)
            VALUES(?,?,?,?,?,?,?,?)
            """,
            (
                data["id"],
                data["timestamp"],
                data["partId"],
                data["type"],
                data["status"],
                data["severity"],
                data.get("line"),
                data.get("cycleTime"),
            ),
        )
        conn.commit()

    return jsonify({"ok": True})


@app.get("/api/maintenance")
def list_maintenance():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM maintenance_events ORDER BY dueDate ASC").fetchall()
        return jsonify([dict(row) for row in rows])


@app.post("/api/maintenance")
def create_maintenance():
    data = request.get_json(force=True)
    required_fields = ["id", "machineName", "machineCode", "serviceType", "status", "dueDate", "priority"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} required"}), 400

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO maintenance_events(id, machineName, machineCode, serviceType, status, dueDate, technicianId, notes, priority)
            VALUES(?,?,?,?,?,?,?,?,?)
            """,
            (
                data["id"],
                data["machineName"],
                data["machineCode"],
                data["serviceType"],
                data["status"],
                data["dueDate"],
                data.get("technicianId"),
                data.get("notes"),
                data["priority"],
            ),
        )
        conn.commit()

    return jsonify({"ok": True})


@app.put("/api/maintenance/<event_id>")
def update_maintenance(event_id: str):
    data = request.get_json(force=True)
    allowed_fields = [
        "machineName",
        "machineCode",
        "serviceType",
        "status",
        "dueDate",
        "technicianId",
        "notes",
        "priority",
    ]

    set_clauses = []
    params = []
    for field in allowed_fields:
        if field in data:
            set_clauses.append(f"{field} = ?")
            params.append(data[field])

    if not set_clauses:
        return jsonify({"error": "no fields to update"}), 400

    params.append(event_id)
    with get_conn() as conn:
        cur = conn.execute(f"UPDATE maintenance_events SET {', '.join(set_clauses)} WHERE id = ?", params)
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "maintenance event not found"}), 404

    return jsonify({"ok": True})


@app.delete("/api/maintenance/<event_id>")
def delete_maintenance(event_id: str):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM maintenance_events WHERE id = ?", (event_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "maintenance event not found"}), 404

    return jsonify({"ok": True})


@app.get("/api/shift-assignments")
def list_shift_assignments():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM shift_assignments ORDER BY day ASC").fetchall()
        return jsonify([dict(row) for row in rows])


@app.post("/api/shift-assignments")
def create_shift_assignment():
    data = request.get_json(force=True)
    required_fields = ["id", "line", "day", "operatorId"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} required"}), 400

    with get_conn() as conn:
        conn.execute(
            "INSERT INTO shift_assignments(id, line, day, operatorId) VALUES(?,?,?,?)",
            (data["id"], data["line"], data["day"], data["operatorId"]),
        )
        conn.commit()

    return jsonify({"ok": True})


@app.delete("/api/shift-assignments/<assignment_id>")
def delete_shift_assignment(assignment_id: str):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM shift_assignments WHERE id = ?", (assignment_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "shift assignment not found"}), 404

    return jsonify({"ok": True})


def seed_if_empty():
    with get_conn() as conn:
        if conn.execute("SELECT COUNT(*) AS c FROM alerts").fetchone()["c"] == 0:
            conn.executemany(
                "INSERT INTO alerts(id, type, title, message, time, line, acknowledged) VALUES(?,?,?,?,?,?,?)",
                [
                    (
                        "alt-1",
                        "critical",
                        "W-102: Servo Overheat",
                        "Primary axis motor exceeding 85°C. Cooling systems activated.",
                        "14:32",
                        "Line A",
                        0,
                    ),
                    (
                        "alt-2",
                        "warning",
                        "Pressure Dip - Line B",
                        "Hydraulic pump 4 showing 5% deviation from nominal.",
                        "14:28",
                        "Line B",
                        0,
                    ),
                    (
                        "alt-3",
                        "info",
                        "Line C - Shift Started",
                        "Team Blue checked in. Target: 4,200 units.",
                        "14:15",
                        "Line C",
                        0,
                    ),
                    (
                        "alt-4",
                        "system",
                        "Backup Complete",
                        "Daily controller logs and cloud sync compiled successfully.",
                        "13:30",
                        None,
                        1,
                    ),
                ],
            )

        if conn.execute("SELECT COUNT(*) AS c FROM operators").fetchone()["c"] == 0:
            conn.executemany(
                "INSERT INTO operators(id, name, role, email, lastShift, status, initials, level, tags, expertise) VALUES(?,?,?,?,?,?,?,?,?,?)",
                [
                    (
                        "op-1",
                        "Marcus Kane",
                        "Senior Engineer",
                        "m.kane@titanops.com",
                        "Today, 06:30",
                        "active",
                        "MK",
                        "Lvl 3 Specialist",
                        json.dumps(["Line A", "Safety+"]),
                        json.dumps({"CNC ALPHA-1": "Expert", "PRESS DELTA-04": "Intermediate", "LATHE SIGMA-1": "Beginner", "MILL GAMMA-2": "Expert"}),
                    ),
                    (
                        "op-2",
                        "Sarah Rossi",
                        "Shift Lead",
                        "s.rossi@titanops.com",
                        "Yesterday, 14:00",
                        "offline",
                        "SR",
                        "QC Lead",
                        json.dumps(["Line B", "ISO 9001"]),
                        json.dumps({"CNC ALPHA-1": "Beginner", "PRESS DELTA-04": "Expert", "LATHE SIGMA-1": "Intermediate", "MILL GAMMA-2": "None"}),
                    ),
                    (
                        "op-3",
                        "John Doe",
                        "Specialist",
                        "j.doe@autofab.com",
                        "Today, 08:00",
                        "active",
                        "JD",
                        "Lvl 3 Specialist",
                        json.dumps(["Line A", "Safety+"]),
                        json.dumps({"CNC ALPHA-1": "Expert", "PRESS DELTA-04": "None", "LATHE SIGMA-1": "Expert", "MILL GAMMA-2": "Beginner"}),
                    ),
                ],
            )

        if conn.execute("SELECT COUNT(*) AS c FROM thresholds").fetchone()["c"] == 0:
            conn.execute(
                "INSERT INTO thresholds(key, criticalTemp, vibrationTolerance) VALUES(?,?,?)",
                ("default", 85, 2.4),
            )

        if conn.execute("SELECT COUNT(*) AS c FROM inspections").fetchone()["c"] == 0:
            conn.executemany(
                "INSERT INTO inspections(id, timestamp, partId, type, status, severity, line, cycleTime) VALUES(?,?,?,?,?,?,?,?)",
                [
                    ("insp-1", "14:32:05", "CH-9942-X", "Weld Integrity", "PASS", "N/A", "Line A", 45),
                    ("insp-2", "14:30:12", "PT-4421-B", "Paint Thickness", "FAIL", "CRITICAL", "Line B", 52),
                    ("insp-3", "14:28:45", "CH-9941-X", "Weld Integrity", "PASS", "N/A", "Line A", 44),
                ],
            )

        if conn.execute("SELECT COUNT(*) AS c FROM maintenance_events").fetchone()["c"] == 0:
            conn.executemany(
                "INSERT INTO maintenance_events(id, machineName, machineCode, serviceType, status, dueDate, technicianId, notes, priority) VALUES(?,?,?,?,?,?,?,?,?)",
                [
                    (
                        "maint-1",
                        "CNC ALPHA-1",
                        "SV-102-A1",
                        "Axis 3 Servomotor Realignment",
                        "Overdue",
                        "2026-06-12",
                        "op-5",
                        "vibration sensor feedback exceeded limits by 14% on last shift.",
                        "high",
                    ),
                    (
                        "maint-2",
                        "PRESS DELTA-04",
                        "PR-92",
                        "Hydraulic Seal & Fluid Swap",
                        "In Progress",
                        "2026-06-16",
                        "op-1",
                        "Standard 500-hour system overhaul.",
                        "medium",
                    ),
                    (
                        "maint-3",
                        "Precision Laser",
                        "LS-004-W1",
                        "Lens Cleaning & Defocus Alignment",
                        "Scheduled",
                        "2026-06-18",
                        None,
                        "Calibration checks display minor weld gap tolerance drifting.",
                        "high",
                    ),
                ],
            )

        if conn.execute("SELECT COUNT(*) AS c FROM shift_assignments").fetchone()["c"] == 0:
            conn.executemany(
                "INSERT INTO shift_assignments(id, line, day, operatorId) VALUES(?,?,?,?)",
                [
                    ("sa-1", "Line A", "MON 23", "op-3"),
                    ("sa-2", "Line A", "MON 23", "op-4"),
                    ("sa-3", "Line B", "TUE 24", "op-1"),
                ],
            )

        conn.commit()


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                time TEXT NOT NULL,
                line TEXT,
                acknowledged INTEGER NOT NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS operators (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                email TEXT NOT NULL,
                lastShift TEXT NOT NULL,
                status TEXT NOT NULL,
                initials TEXT NOT NULL,
                level TEXT,
                tags TEXT,
                expertise TEXT
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS thresholds (
                key TEXT PRIMARY KEY,
                criticalTemp REAL NOT NULL,
                vibrationTolerance REAL NOT NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS inspections (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                partId TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                severity TEXT NOT NULL,
                line TEXT,
                cycleTime INTEGER
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS maintenance_events (
                id TEXT PRIMARY KEY,
                machineName TEXT NOT NULL,
                machineCode TEXT NOT NULL,
                serviceType TEXT NOT NULL,
                status TEXT NOT NULL,
                dueDate TEXT NOT NULL,
                technicianId TEXT,
                notes TEXT,
                priority TEXT NOT NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS shift_assignments (
                id TEXT PRIMARY KEY,
                line TEXT NOT NULL,
                day TEXT NOT NULL,
                operatorId TEXT NOT NULL
            )
            """
        )
        conn.commit()

    seed_if_empty()


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
