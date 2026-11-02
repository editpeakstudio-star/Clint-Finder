import re
import sqlite3
from database import get_connection


def clean_telegram_target(target):
    """Parses telegram inputs like:

    - https://t.me/Editpeakstudio -> (@Editpeakstudio, 'public')
    - t.me/Editpeakstudio -> (@Editpeakstudio, 'public')
    - @Editpeakstudio -> (@Editpeakstudio, 'public')
    - Editpeakstudio -> (@Editpeakstudio, 'public')
    - https://t.me/+abc123xyz -> (https://t.me/+abc123xyz, 'private')
    - https://t.me/joinchat/xyz -> (https://t.me/joinchat/xyz, 'private')
    """
    target = target.strip()
    if not target:
        raise ValueError("Group link or username cannot be empty")

    # Private invite link pattern: t.me/+... or t.me/joinchat/...
    if re.search(r'(t\.me/\+|t\.me/joinchat/|telegram\.me/\+|telegram\.me/joinchat/)', target):
        return target, "private"

    # Public group link or handle
    match = re.search(r'(?:https?://)?(?:www\.)?(?:t\.me|telegram\.me)/([a-zA-Z0-9_]+)', target)
    if match:
        return f"@{match.group(1)}", "public"

    if target.startswith("@"):
        clean_handle = target
        if not re.match(r'^@[a-zA-Z0-9_]{3,32}$', clean_handle):
            raise ValueError("Invalid Telegram username format. Must be 3-32 alphanumeric characters.")
        return clean_handle, "public"

    # Bare username
    if re.match(r'^[a-zA-Z0-9_]{3,32}$', target):
        return f"@{target}", "public"

    raise ValueError("Unrecognized Telegram format. Provide @username, t.me/username, or invite link.")


def list_groups(search="", status=None):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM groups WHERE 1=1"
    params = []

    if search:
        query += " AND (username LIKE ? OR title LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status.lower())

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]

    # Stats
    cursor.execute("SELECT COUNT(*) FROM groups")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM groups WHERE status = 'active'")
    active = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM groups WHERE status = 'paused'")
    paused = cursor.fetchone()[0]

    conn.close()
    return {
        "groups": rows,
        "total": total,
        "active": active,
        "paused": paused
    }


def add_group(target, title=None):
    clean_target, gtype = clean_telegram_target(target)
    conn = get_connection()
    cursor = conn.cursor()

    # Derived title if not provided
    display_title = title.strip() if title and title.strip() else clean_target.lstrip('@')

    # Initial status: For private groups, initial is 'join_required' or 'pending_validation'
    initial_status = "active" if gtype == "public" else "pending_validation"

    try:
        cursor.execute(
            """
            INSERT INTO groups (username, title, type, status, lead_count, last_checked)
            VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            """,
            (clean_target, display_title, gtype, initial_status)
        )
        new_id = cursor.lastrowid

        # Also add or sync in sources table
        source_name = clean_target.lstrip('@')
        cursor.execute(
            """
            INSERT OR IGNORE INTO sources (name, type, status, enabled, lead_count, last_sync)
            VALUES (?, ?, ?, 1, 0, CURRENT_TIMESTAMP)
            """,
            (source_name, f"Telegram {'Group' if gtype == 'public' else 'Private Channel'}", initial_status)
        )

        conn.commit()
        return {
            "id": new_id,
            "username": clean_target,
            "title": display_title,
            "type": gtype,
            "status": initial_status
        }
    except sqlite3.IntegrityError:
        raise ValueError(f"Group '{clean_target}' is already registered")
    finally:
        conn.close()


def toggle_group(group_id, new_status=None):
    conn = get_connection()
    cursor = conn.cursor()

    if new_status:
        target_status = new_status
    else:
        cursor.execute("SELECT status FROM groups WHERE id = ?", (group_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False
        current = row[0]
        target_status = "paused" if current == "active" else "active"

    cursor.execute("UPDATE groups SET status = ? WHERE id = ?", (target_status, group_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def delete_group(group_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM groups WHERE id = ?", (group_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
    username = row[0]

    cursor.execute("DELETE FROM groups WHERE id = ?", (group_id,))
    affected = cursor.rowcount
    # Also remove from sources if present
    cursor.execute("DELETE FROM sources WHERE name = ? OR name = ?", (username, username.lstrip('@')))
    conn.commit()
    conn.close()
    return affected > 0
