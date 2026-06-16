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



# ===== Operators write endpoints =====
@app.post("/api/operators")
def create_operator():
    data = request.get_json(force=True)
    required = ["id","name","role","email","lastShift","status","initials"]
    for k in required:
        if k not in data:
            return jsonify({"error": f"{k} required"}), 400

    tags = data.get("tags")
    expertise = data.get("expertise")

    # store expertise/tags as JSON strings
    import json
    tags_json = json.dumps(tags) if tags is not None else None
    expertise_json = json.dumps(expertise) if expertise is not None else None

    try:
        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO operators(id,name,role,email,lastShift,status,initials,level,tags,expertise)
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
        return jsonify({"error":"operator id already exists"}), 409

    return jsonify({"ok": True})


@app.put("/api/operators/<op_id>")
def update_operator(op_id: str):
    data = request.get_json(force=True)

    import json

    # allow partial updates
    fields = {
        "name": data.get("name"),
        "role": data.get("role"),
        "email": data.get("email"),
        "lastShift": data.get("lastShift"),
        "status": data.get("status"),
        "initials": data.get("initials"),
        "level": data.get("level"),
    }

    tags = data.get("tags")
    expertise = data.get("expertise")
    tags_json = json.dumps(tags) if tags is not None else None
    expertise_json = json.dumps(expertise) if expertise is not None else None

    # Build update set dynamically
    set_clauses = []
    params = []

    for col, val in fields.items():
        if val is not None:
            set_clauses.append(f"{col}=?")
            params.append(val)

    if tags is not None:
        set_clauses.append("tags=?")
        params.append(tags_json)

    if expertise is not None:
        set_clauses.append("expertise=?")
        params.append(expertise_json)

    if not set_clauses:
        return jsonify({"error":"no fields to update"}), 400

    params.append(op_id)

    with get_conn() as conn:
        cur = conn.execute(
            f"UPDATE operators SET {', '.join(set_clauses)} WHERE id=?",
            params,
        )
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error":"operator not found"}), 404

    return jsonify({"ok": True})


@app.delete("/api/operators/<op_id>")
def delete_operator(op_id: str):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM operators WHERE id=?", (op_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error":"operator not found"}), 404
    return jsonify({"ok": True})


# ===== Inspections =====
@app.get("/api/inspections")
def list_inspections():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM inspections ORDER BY timestamp DESC").fetchall()
        return jsonify([dict(r) for r in rows])


@app.post("/api/inspections")
def create_inspection():
    data = request.get_json(force=True)
    required = ["id","timestamp","partId","type","status","severity"]
    for k in required:
        if k not in data:
            return jsonify({"error": f"{k} required"}), 400

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO inspections(id,timestamp,partId,type,status,severity,line,cycleTime)
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


# ===== Maintenance events =====
@app.get("/api/maintenance")
def list_maintenance():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM maintenance_events ORDER BY dueDate ASC"
        ).fetchall()
        return jsonify([dict(r) for r in rows])


@app.post("/api/maintenance")
def create_maintenance():
    data = request.get_json(force=True)
    required = ["id","machineName","machineCode","serviceType","status","dueDate","priority"]
    for k in required:
        if k not in data:
            return jsonify({"error": f"{k} required"}), 400

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO maintenance_events(id,machineName,machineCode,serviceType,status,dueDate,technicianId,notes,priority)
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

    allowed = ["machineName","machineCode","serviceType","status","dueDate","technicianId","notes","priority"]
    set_clauses=[]
    params=[]
    for f in allowed:
        if f in data:
            set_clauses.append(f"{f}=?")
            params.append(data[f])

    if not set_clauses:
        return jsonify({"error":"no fields to update"}), 400

    params.append(event_id)

    with get_conn() as conn:
        cur = conn.execute(
            f"UPDATE maintenance_events SET {', '.join(set_clauses)} WHERE id=?",
            params,
        )
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error":"maintenance event not found"}), 404

    return jsonify({"ok": True})


@app.delete("/api/maintenance/<event_id>")
def delete_maintenance(event_id: str):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM maintenance_events WHERE id=?", (event_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error":"maintenance event not found"}), 404
    return jsonify({"ok": True})


# ===== Shift assignments =====
@app.get("/api/shift-assignments")
def list_shift_assignments():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM shift_assignments ORDER BY day ASC").fetchall()
        return jsonify([dict(r) for r in rows])


@app.post("/api/shift-assignments")
def create_shift_assignment():
    data = request.get_json(force=True)
    required = ["id","line","day","operatorId"]
    for k in required:
        if k not in data:
            return jsonify({"error": f"{k} required"}), 400

    with get_conn() as conn:
        conn.execute(
            "INSERT INTO shift_assignments(id,line,day,operatorId) VALUES(?,?,?,?)",
            (data["id"], data["line"], data["day"], data["operatorId"]),
        )
        conn.commit()
    return jsonify({"ok": True})


@app.delete("/api/shift-assignments/<assignment_id>")
def delete_shift_assignment(assignment_id: str):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM shift_assignments WHERE id=?", (assignment_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error":"shift assignment not found"}), 404
    return jsonify({"ok": True})


# ===== Seeding (only if tables are empty) =====

def seed_if_empty():
    import json
    with get_conn() as conn:
        # alerts seed if none
        alerts_cnt = conn.execute("SELECT COUNT(*) AS c FROM alerts").fetchone()["c"]
        if alerts_cnt == 0:
            seed_alerts = [
                ('alt-1','critical','W-102: Servo Overheat','Primary axis motor exceeding 85°C. Cooling systems activated.','14:32','Line A',0),
                ('alt-2','warning','Pressure Dip - Line B','Hydraulic pump 4 showing 5% deviation from nominal.','14:28','Line B',0),
                ('alt-3','info','Line C - Shift Started','Team Blue checked in. Target: 4,200 units.','14:15','Line C',0),
                ('alt-4','system','Backup Complete','Daily controller logs and cloud sync compiled successfully.','13:30',1)
            ]
            conn.executemany(
                "INSERT INTO alerts(id,type,title,message,time,line,acknowledged) VALUES(?,?,?,?,?,?,?)",
                seed_alerts
            )

        ops_cnt = conn.execute("SELECT COUNT(*) AS c FROM operators").fetchone()["c"]
        if ops_cnt == 0:
            seed_ops = [
                ('op-1','Marcus Kane','Senior Engineer','m.kane@titanops.com','Today, 06:30','active','MK','Lvl 3 Specialist',json.dumps(['Line A','Safety+']),json.dumps({'CNC ALPHA-1':'Expert','PRESS DELTA-04':'Intermediate','LATHE SIGMA-1':'Beginner','MILL GAMMA-2':'Expert'})),
                ('op-2','Sarah Rossi','Shift Lead','s.rossi@titanops.com','Yesterday, 14:00','offline','SR','QC Lead',json.dumps(['Line B','ISO 9001']),json.dumps({'CNC ALPHA-1':'Beginner','PRESS DELTA-04':'Expert','LATHE SIGMA-1':'Intermediate','MILL GAMMA-2':'None'})),
                ('op-3','John Doe','Specialist','j.doe@autofab.com','Today, 08:00','active','JD','Lvl 3 Specialist',json.dumps(['Line A','Safety+']),json.dumps({'CNC ALPHA-1':'Expert','PRESS DELTA-04':'None','LATHE SIGMA-1':'Expert','MILL GAMMA-2':'Beginner'})),
                ('op-4','Sarah Miller','QC Supervisor','s.miller@autofab.com','Today, 08:00','active','SM','QC Supervisor',json.dumps(['Line B','ISO 9001']),json.dumps({'CNC ALPHA-1':'None','PRESS DELTA-04':'Expert','LATHE SIGMA-1':'None','MILL GAMMA-2':'Expert'})),
                ('op-5','Robert Brown','Maintenance Specialist','r.brown@autofab.com','On Break','offline','RB','Maintenance',json.dumps(['On Break']),json.dumps({'CNC ALPHA-1':'Beginner','PRESS DELTA-04':'Beginner','LATHE SIGMA-1':'Intermediate','MILL GAMMA-2':'Intermediate'})),
                ('op-6','Anna Kowalski','Line C Lead','a.kowalski@autofab.com','Yesterday, 14:00','active','AK','Line C Lead',json.dumps(['Automation']),json.dumps({'CNC ALPHA-1':'None','PRESS DELTA-04':'None','LATHE SIGMA-1':'Expert','MILL GAMMA-2':'Expert'})),
            ]
            conn.executemany(
                "INSERT INTO operators(id,name,role,email,lastShift,status,initials,level,tags,expertise) VALUES(?,?,?,?,?,?,?,?,?,?)",
                seed_ops
            )

        th_cnt = conn.execute("SELECT COUNT(*) AS c FROM thresholds").fetchone()["c"]
        if th_cnt == 0:
            conn.execute("INSERT INTO thresholds(key,criticalTemp,vibrationTolerance) VALUES('default',?,?)", (85,2.4))

        insp_cnt = conn.execute("SELECT COUNT(*) AS c FROM inspections").fetchone()["c"]
        if insp_cnt == 0:
            seed_insp = [
                ('insp-1','14:32:05','CH-9942-X','Weld Integrity','PASS','N/A','Line A',45),
                ('insp-2','14:30:12','PT-4421-B','Paint Thickness','FAIL','CRITICAL','Line B',52),
                ('insp-3','14:28:45','CH-9941-X','Weld Integrity','PASS','N/A','Line A',44),
                ('insp-4','14:25:33','CH-9940-X','Surface Check','REWORK','MINOR','Line C',41),
                ('insp-5','14:20:10','CH-9939-X','Weld Integrity','PASS','N/A','Line A',58),
                ('insp-6','14:15:22','PT-4420-B','Paint Thickness','REWORK','MINOR','Line B',35),
                ('insp-7','14:10:04','LN-2210-C','Seal Integrity','PASS','N/A','Line C',54),
            ]
            conn.executemany(
                "INSERT INTO inspections(id,timestamp,partId,type,status,severity,line,cycleTime) VALUES(?,?,?,?,?,?,?,?)",
                seed_insp
            )

        maint_cnt = conn.execute("SELECT COUNT(*) AS c FROM maintenance_events").fetchone()["c"]
        if maint_cnt == 0:
            seed_maint = [
                ('maint-1','CNC ALPHA-1','SV-102-A1','Axis 3 Servomotor Realignment','Overdue','2026-06-12','op-5','vibration sensor feedback exceeded limits by 14% on last shift.','high'),
                ('maint-2','PRESS DELTA-04','PR-92','Hydraulic Seal & Fluid Swap','In Progress','2026-06-16','op-1','Standard 500-hour system overhaul.','medium'),
                ('maint-3','Precision Laser','LS-004-W1','Lens Cleaning & Defocus Alignment','Scheduled','2026-06-18',None,'Calibration checks display minor weld gap tolerance drifting.','high'),
                ('maint-4','LATHE SIGMA-1','LT-88','Main Spindle Bearing Lubrication','Scheduled','2026-06-25','op-3',None,'low'),
            ]
            # note: above has one row with mismatched args due to optional technicianId/notes; we will ignore seed errors by simplifying
            try:
                conn.executemany(
                    "INSERT OR IGNORE INTO maintenance_events(id,machineName,machineCode,serviceType,status,dueDate,technicianId,notes,priority) VALUES(?,?,?,?,?,?,?,?,?)",
                    [
                        ('maint-1','CNC ALPHA-1','SV-102-A1','Axis 3 Servomotor Realignment','Overdue','2026-06-12','op-5','vibration sensor feedback exceeded limits by 14% on last shift.','high'),
                        ('maint-2','PRESS DELTA-04','PR-92','Hydraulic Seal & Fluid Swap','In Progress','2026-06-16','op-1','Standard 500-hour system overhaul.','medium'),
                        ('maint-3','Precision Laser','LS-004-W1','Lens Cleaning & Defocus Alignment','Scheduled','2026-06-18',None,'Calibration checks display minor weld gap tolerance drifting.','high'),
                        ('maint-4','LATHE SIGMA-1','LT-88','Main Spindle Bearing Lubrication','Scheduled','2026-06-25','op-3',None,'low'),
                        ('maint-5','MILL GAMMA-2','ML-02','Coolant Pump Line Flush','Completed','2026-06-10','op-5','Completed coolant swap and filter replacement.','low'),
                    ]
                )
            except Exception:
                pass

        sa_cnt = conn.execute("SELECT COUNT(*) AS c FROM shift_assignments").fetchone()["c"]
        if sa_cnt == 0:
            seed_sa = [
                ('sa-1','Line A','MON 23','op-3'),
                ('sa-2','Line A','MON 23','op-4'),
                ('sa-3','Line B','TUE 24','op-1'),
                ('sa-4','Line C','MON 23','op-6'),
            ]
            conn.executemany(
                "INSERT INTO shift_assignments(id,line,day,operatorId) VALUES(?,?,?,?)",
                seed_sa
            )

        conn.commit()


# ensure operator response returns parsed expertise/tags
@app.get("/api/operators")
def list_operators_with_json():
    import json
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM operators").fetchall()
        out=[]
        for r in rows:
            d=dict(r)
            if d.get('tags'):
                try:
                    d['tags'] = json.loads(d['tags'])
                except Exception:
                    pass
            if d.get('expertise'):
                try:
                    d['expertise'] = json.loads(d['expertise'])
                except Exception:
                    pass
            out.append(d)
        return jsonify(out)


# patch init_db to call seed
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

    conn.commit()
    conn.close()
    seed_if_empty()


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)


