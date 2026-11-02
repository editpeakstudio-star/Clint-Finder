import sqlite3
from database import get_connection, init_db


def list_keywords(search="", status=None, sort="alpha"):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM keywords WHERE 1=1"
    params = []

    if search:
        query += " AND (keyword LIKE ? OR category LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    if status == "enabled":
        query += " AND enabled = 1"
    elif status == "disabled":
        query += " AND enabled = 0"

    if sort == "alpha":
        query += " ORDER BY keyword ASC"
    elif sort == "priority":
        query += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, keyword ASC"
    elif sort == "newest":
        query += " ORDER BY created_at DESC"
    else:
        query += " ORDER BY id ASC"

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]

    # Stats
    cursor.execute("SELECT COUNT(*) FROM keywords")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM keywords WHERE enabled = 1")
    enabled_count = cursor.fetchone()[0]
    disabled_count = total - enabled_count

    conn.close()
    return {
        "keywords": rows,
        "total": total,
        "enabled": enabled_count,
        "disabled": disabled_count
    }


def add_keyword(keyword, category="Custom", priority="normal"):
    kw = keyword.strip().lower()
    if not kw:
        raise ValueError("Keyword cannot be empty")

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO keywords (keyword, category, priority, enabled) VALUES (?, ?, ?, 1)",
            (kw, category or "Custom", priority or "normal")
        )
        new_id = cursor.lastrowid
        conn.commit()
        return {"id": new_id, "keyword": kw, "category": category, "priority": priority, "enabled": 1}
    except sqlite3.IntegrityError:
        raise ValueError(f"Keyword '{kw}' already exists")
    finally:
        conn.close()


def update_keyword(keyword_id, enabled=None, priority=None, category=None):
    conn = get_connection()
    cursor = conn.cursor()

    updates = []
    params = []
    if enabled is not None:
        updates.append("enabled = ?")
        params.append(1 if enabled else 0)
    if priority is not None:
        updates.append("priority = ?")
        params.append(priority)
    if category is not None:
        updates.append("category = ?")
        params.append(category)

    if not updates:
        conn.close()
        return False

    params.append(keyword_id)
    query = f"UPDATE keywords SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(query, params)
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def delete_keyword(keyword_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM keywords WHERE id = ?", (keyword_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0
