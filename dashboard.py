import os
import json
import sqlite3
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, session

from database import (
    get_connection, init_db, get_leads, delete_lead, bulk_delete_leads, save_lead,
    verify_password, hash_password
)
from keyword_manager import list_keywords, add_keyword, update_keyword, delete_keyword
from group_manager import list_groups, add_group, toggle_group, delete_group
from lead_analyzer import analyze

# Initialize database
init_db()

app = Flask(__name__)
app.secret_key = os.getenv("SESSION_SECRET", "editpeak-private-jwt-session-secret-key-32")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # Set True in production HTTPS
    PERMANENT_SESSION_LIFETIME=timedelta(days=7)
)

# In-memory login attempt rate limiting
LOGIN_ATTEMPTS = {}


def rate_limit_check(ip):
    now = datetime.now()
    if ip in LOGIN_ATTEMPTS:
        attempts, window_start = LOGIN_ATTEMPTS[ip]
        if now - window_start < timedelta(minutes=15):
            if attempts >= 5:
                return False
            LOGIN_ATTEMPTS[ip] = (attempts + 1, window_start)
        else:
            LOGIN_ATTEMPTS[ip] = (1, now)
    else:
        LOGIN_ATTEMPTS[ip] = (1, now)
    return True


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"error": "Unauthorized. Please authenticate.", "authenticated": False}), 401
        return f(*args, **kwargs)
    return decorated_function


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    ip = request.remote_addr or "127.0.0.1"
    if not rate_limit_check(ip):
        return jsonify({"error": "Too many failed attempts. Account temporarily locked for 15 minutes."}), 429

    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid username or password credentials."}), 401

    if not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid username or password credentials."}), 401

    # Reset attempts on success
    if ip in LOGIN_ATTEMPTS:
        del LOGIN_ATTEMPTS[ip]

    session.permanent = True
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["role"] = user["role"]

    return jsonify({
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"]
        }
    })


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})


@app.route("/api/auth/me", methods=["GET"])
def api_me():
    if not session.get("user_id"):
        return jsonify({"authenticated": False}), 401
    return jsonify({
        "authenticated": True,
        "user": {
            "id": session.get("user_id"),
            "username": session.get("username"),
            "role": session.get("role")
        }
    })


@app.route("/api/stats", methods=["GET"])
@login_required
def api_stats():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM leads")
    total_leads = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM leads WHERE date(created_at) = date('now')")
    today_leads = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM leads WHERE category LIKE '%HOT%'")
    hot_leads = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM leads WHERE category LIKE '%WARM%'")
    warm_leads = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM leads WHERE category LIKE '%LOW%'")
    low_leads = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM sources WHERE enabled = 1")
    active_sources = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM keywords WHERE enabled = 1")
    active_keywords = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM groups WHERE status = 'active'")
    monitored_groups = cursor.fetchone()[0]

    # Leads over time (past 7 days)
    cursor.execute("""
    SELECT date(created_at) as day, COUNT(*) as count,
           SUM(CASE WHEN category LIKE '%HOT%' THEN 1 ELSE 0 END) as hot_count
    FROM leads
    GROUP BY date(created_at)
    ORDER BY day ASC
    LIMIT 14
    """)
    leads_timeline = [dict(r) for r in cursor.fetchall()]

    # Source performance
    cursor.execute("""
    SELECT source, COUNT(*) as count, AVG(score) as avg_score
    FROM leads
    GROUP BY source
    ORDER BY count DESC
    LIMIT 6
    """)
    source_stats = [dict(r) for r in cursor.fetchall()]

    # Recent 5 leads
    cursor.execute("SELECT * FROM leads ORDER BY created_at DESC LIMIT 5")
    recent_leads = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return jsonify({
        "total_leads": total_leads,
        "today_leads": today_leads,
        "hot_leads": hot_leads,
        "warm_leads": warm_leads,
        "low_leads": low_leads,
        "active_sources": active_sources,
        "active_keywords": active_keywords,
        "monitored_groups": monitored_groups,
        "leads_timeline": leads_timeline,
        "source_stats": source_stats,
        "recent_leads": recent_leads,
        "telegram_listener_status": "standby" if not os.getenv("API_ID") else "streaming",
        "last_sync": datetime.now().isoformat()
    })


@app.route("/api/leads", methods=["GET"])
@login_required
def api_get_leads():
    search = request.args.get("search", "")
    category = request.args.get("category", "")
    source = request.args.get("source", "")
    min_score = request.args.get("min_score", type=int)
    sort = request.args.get("sort", "newest")
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 15, type=int)

    result = get_leads(search, category, source, min_score, sort, page, limit)
    return jsonify(result)


@app.route("/api/leads/<int:lead_id>", methods=["DELETE"])
@login_required
def api_delete_lead(lead_id):
    success = delete_lead(lead_id)
    return jsonify({"success": success})


@app.route("/api/leads/bulk-delete", methods=["POST"])
@login_required
def api_bulk_delete():
    data = request.get_json() or {}
    ids = data.get("ids", [])
    count = bulk_delete_leads(ids)
    return jsonify({"success": True, "deleted_count": count})


@app.route("/api/keywords", methods=["GET", "POST"])
@login_required
def api_keywords():
    if request.method == "POST":
        data = request.get_json() or {}
        kw = data.get("keyword", "")
        cat = data.get("category", "Custom")
        prio = data.get("priority", "normal")
        try:
            created = add_keyword(kw, cat, prio)
            return jsonify({"success": True, "keyword": created})
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    search = request.args.get("search", "")
    status = request.args.get("status")
    sort = request.args.get("sort", "alpha")
    return jsonify(list_keywords(search, status, sort))


@app.route("/api/keywords/<int:keyword_id>", methods=["PUT", "DELETE"])
@login_required
def api_keyword_modify(keyword_id):
    if request.method == "DELETE":
        success = delete_keyword(keyword_id)
        return jsonify({"success": success})

    data = request.get_json() or {}
    success = update_keyword(
        keyword_id,
        enabled=data.get("enabled"),
        priority=data.get("priority"),
        category=data.get("category")
    )
    return jsonify({"success": success})


@app.route("/api/groups", methods=["GET", "POST"])
@login_required
def api_groups():
    if request.method == "POST":
        data = request.get_json() or {}
        target = data.get("target", "")
        title = data.get("title")
        try:
            created = add_group(target, title)
            return jsonify({"success": True, "group": created})
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    search = request.args.get("search", "")
    status = request.args.get("status")
    return jsonify(list_groups(search, status))


@app.route("/api/groups/<int:group_id>/toggle", methods=["PUT"])
@login_required
def api_group_toggle(group_id):
    success = toggle_group(group_id)
    return jsonify({"success": success})


@app.route("/api/groups/<int:group_id>", methods=["DELETE"])
@login_required
def api_group_delete(group_id):
    success = delete_group(group_id)
    return jsonify({"success": success})


@app.route("/api/sources", methods=["GET", "POST"])
@login_required
def api_sources():
    conn = get_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        data = request.get_json() or {}
        name = data.get("name", "").strip().lstrip('@')
        stype = data.get("type", "Telegram Channel")
        if not name:
            conn.close()
            return jsonify({"error": "Source name cannot be empty"}), 400
        try:
            cursor.execute(
                "INSERT INTO sources (name, type, status, enabled, lead_count, last_sync) VALUES (?, ?, 'active', 1, 0, CURRENT_TIMESTAMP)",
                (name, stype)
            )
            new_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return jsonify({"success": True, "id": new_id, "name": name, "type": stype, "status": "active"})
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({"error": f"Source '{name}' already exists"}), 400

    cursor.execute("SELECT * FROM sources ORDER BY id ASC")
    sources = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"sources": sources})


@app.route("/api/sources/<int:source_id>/toggle", methods=["PUT"])
@login_required
def api_source_toggle(source_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT enabled FROM sources WHERE id = ?", (source_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Source not found"}), 404
    new_state = 0 if row[0] == 1 else 1
    cursor.execute("UPDATE sources SET enabled = ? WHERE id = ?", (new_state, source_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "enabled": new_state})


@app.route("/api/sources/<int:source_id>", methods=["DELETE"])
@login_required
def api_source_delete(source_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sources WHERE id = ?", (source_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/notifications", methods=["GET", "POST", "DELETE"])
@login_required
def api_notifications():
    conn = get_connection()
    cursor = conn.cursor()

    if request.method == "DELETE":
        cursor.execute("DELETE FROM notifications")
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "All notifications cleared"})

    if request.method == "POST":
        cursor.execute("UPDATE notifications SET read = 1")
        conn.commit()
        conn.close()
        return jsonify({"success": True})

    cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50")
    notifications = [dict(r) for r in cursor.fetchall()]
    cursor.execute("SELECT COUNT(*) FROM notifications WHERE read = 0")
    unread_count = cursor.fetchone()[0]
    conn.close()
    return jsonify({"notifications": notifications, "unread_count": unread_count})


@app.route("/api/settings", methods=["GET", "POST"])
@login_required
def api_settings():
    conn = get_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        data = request.get_json() or {}
        for k, v in data.items():
            cursor.execute(
                "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP",
                (k, str(v), str(v))
            )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Settings updated"})

    cursor.execute("SELECT key, value FROM settings")
    settings_dict = {r["key"]: r["value"] for r in cursor.fetchall()}
    conn.close()
    return jsonify({"settings": settings_dict})


@app.route("/api/test-analyze", methods=["POST"])
@login_required
def api_test_analyze():
    data = request.get_json() or {}
    text = data.get("text", "")
    res = analyze(text)
    return jsonify({
        "score": res.score,
        "category": res.category,
        "matched": res.matched
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Client Finder V2 Flask Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
