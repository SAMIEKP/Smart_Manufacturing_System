from flask import Flask, jsonify, request
import sqlite3
from pathlib import Path

app = Flask(__name__)

DB_PATH = Path(__file__).resolve().parent / "smart_manufacturing.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
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

    cur.execute(
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

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS thresholds (
            key TEXT PRIMARY KEY,
            criticalTemp REAL NOT NULL,
            vibrationTolerance REAL NOT NULL
        )
        """
    )

    cur.execute(
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

    cur.execute(
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

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS shift_assignments (
            id TEXT PRIMARY KEY,
            line TEXT NOT NULL,
            day TEXT NOT NULL,
            operatorId TEXT NOT NULL
        )
        """
    )

    # Seed thresholds if empty
    cur.execute("SELECT key FROM thresholds WHERE key='default'")
    if cur.fetchone() is None:
        cur.execute(
            "INSERT INTO thresholds(key, criticalTemp, vibrationTolerance) VALUES('default', ?, ?)",
            (85, 2.4),
        )

    conn.commit()
    conn.close()


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


# ===== Alerts =====
@app.get("/api/alerts")
def list_alerts():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM alerts ORDER BY time DESC").fetchall()
        return jsonify([dict(r) for r in rows])


@app.post("/api/alerts/ack")
def ack_alerts():
    data = request.get_json(force=True)
    ids = data.get("ids")
    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "ids must be a non-empty list"}), 400

    with get_conn() as conn:
        conn.executemany(
            "UPDATE alerts SET acknowledged=1 WHERE id=?",
            [(i,) for i in ids],
        )
        conn.commit()
    return jsonify({"ok": True, "acknowledged": len(ids)})


# ===== Operators =====
@app.get("/api/operators")
def list_operators():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM operators").fetchall()
        # Stored expertise/tags as JSON strings; return as-is for now.
        return jsonify([dict(r) for r in rows])


# ===== Thresholds =====
@app.get("/api/thresholds")
def get_thresholds():
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM thresholds WHERE key='default'").fetchone()
        return jsonify(dict(row) if row else None)


@app.post("/api/thresholds")
def update_thresholds():
    data = request.get_json(force=True)
    criticalTemp = data.get("criticalTemp")
    vibrationTolerance = data.get("vibrationTolerance")
    if criticalTemp is None or vibrationTolerance is None:
        return jsonify({"error": "criticalTemp and vibrationTolerance required"}), 400

    with get_conn() as conn:
        conn.execute(
            "UPDATE thresholds SET criticalTemp=?, vibrationTolerance=? WHERE key='default'",
            (criticalTemp, vibrationTolerance),
        )
        conn.commit()
    return jsonify({"ok": True})


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)

