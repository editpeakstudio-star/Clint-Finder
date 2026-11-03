import os
import sqlite3
import json
import hashlib
import secrets
from datetime import datetime, timedelta

def hash_password(password: str) -> str:
    try:
        import bcrypt
        salt = bcrypt.gensalt(10)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    except ImportError:
        salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"pbkdf2:sha256:100000${salt}${key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    if stored_hash.startswith('$2a$') or stored_hash.startswith('$2b$'):
        try:
            import bcrypt
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        except ImportError:
            pass
    if stored_hash.startswith('pbkdf2:sha256:'):
        try:
            parts = stored_hash.split('$')
            salt = parts[1]
            expected = parts[2]
            computed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return computed.hex() == expected
        except Exception:
            return False
    return False

# Local default; Render can set DATABASE_DIR=/var/data
DB_DIR = os.getenv(
    "DATABASE_DIR",
    os.path.join(os.path.dirname(__file__), "data")
)
DB = os.path.join(DB_DIR, "leads.db")

# Default 80 keywords with their categories
INITIAL_80_KEYWORDS = [
    # General editor
    ("video editor", "General editor", "high"),
    ("video editing", "General editor", "normal"),
    ("editor needed", "General editor", "high"),
    ("editor required", "General editor", "high"),
    ("editor wanted", "General editor", "high"),
    ("hiring editor", "General editor", "high"),
    ("hire an editor", "General editor", "high"),
    ("need an editor", "General editor", "high"),
    ("need editor", "General editor", "high"),
    ("looking for an editor", "General editor", "high"),
    ("looking for editor", "General editor", "high"),
    ("searching for an editor", "General editor", "high"),
    ("editor vacancy", "General editor", "normal"),
    ("editor job", "General editor", "normal"),
    ("editing job", "General editor", "normal"),
    ("video editing job", "General editor", "normal"),

    # YouTube
    ("youtube editor", "YouTube", "high"),
    ("youtube video editor", "YouTube", "high"),
    ("youtube editing", "YouTube", "normal"),
    ("youtube videos", "YouTube", "normal"),
    ("youtube channel editor", "YouTube", "high"),
    ("long form editor", "YouTube", "high"),
    ("long-form editor", "YouTube", "high"),
    ("long form video editor", "YouTube", "high"),

    # Shorts / Reels
    ("reels editor", "Shorts / Reels", "high"),
    ("reel editor", "Shorts / Reels", "high"),
    ("instagram reels editor", "Shorts / Reels", "high"),
    ("shorts editor", "Shorts / Reels", "high"),
    ("youtube shorts editor", "Shorts / Reels", "high"),
    ("short form editor", "Shorts / Reels", "high"),
    ("short-form editor", "Shorts / Reels", "high"),
    ("shorts editing", "Shorts / Reels", "normal"),
    ("reels editing", "Shorts / Reels", "normal"),
    ("short form video editor", "Shorts / Reels", "high"),

    # Social media
    ("social media editor", "Social media", "normal"),
    ("content editor", "Social media", "normal"),
    ("content creator editor", "Social media", "high"),
    ("creator editor", "Social media", "normal"),
    ("instagram editor", "Social media", "normal"),
    ("tiktok editor", "Social media", "high"),
    ("social media videos", "Social media", "low"),

    # Real estate
    ("real estate editor", "Real estate", "high"),
    ("real estate video editor", "Real estate", "high"),
    ("property video editor", "Real estate", "normal"),
    ("real estate reels", "Real estate", "normal"),
    ("real estate videos", "Real estate", "normal"),

    # Other common niches
    ("podcast editor", "Other niches", "high"),
    ("podcast video editor", "Other niches", "high"),
    ("wedding video editor", "Other niches", "normal"),
    ("gaming video editor", "Other niches", "normal"),
    ("documentary editor", "Other niches", "high"),
    ("cinematic editor", "Other niches", "normal"),
    ("faceless video editor", "Other niches", "high"),
    ("ugc video editor", "Other niches", "high"),
    ("ad video editor", "Other niches", "high"),
    ("commercial video editor", "Other niches", "high"),

    # Software / skills
    ("premiere pro editor", "Software / skills", "normal"),
    ("premiere pro", "Software / skills", "normal"),
    ("after effects editor", "Software / skills", "high"),
    ("after effects", "Software / skills", "normal"),
    ("motion graphics", "Software / skills", "high"),
    ("davinci resolve", "Software / skills", "normal"),
    ("capcut editor", "Software / skills", "normal"),

    # Hiring / payment signals
    ("freelance editor", "Hiring / payment", "high"),
    ("freelancer editor", "Hiring / payment", "normal"),
    ("paid editor", "Hiring / payment", "high"),
    ("paid editing", "Hiring / payment", "high"),
    ("paid work", "Hiring / payment", "high"),
    ("editor for hire", "Hiring / payment", "high"),
    ("long term editor", "Hiring / payment", "high"),
    ("long-term editor", "Hiring / payment", "high"),
    ("monthly editor", "Hiring / payment", "high"),
    ("per video", "Hiring / payment", "normal"),
    ("budget", "Hiring / payment", "normal"),
    ("paid", "Hiring / payment", "normal"),
    ("payment", "Hiring / payment", "normal"),
    ("salary", "Hiring / payment", "normal"),
    ("rate", "Hiring / payment", "normal"),
    ("remote editor", "Hiring / payment", "high"),
    ("work from home editor", "Hiring / payment", "high")
]

INITIAL_SOURCES = [
    ("Editpeakstudio", "Telegram Community", 1, "active"),
    ("Freelancing_Video_Editing", "Telegram Channel", 1, "active"),
    ("redgs", "Telegram Channel", 1, "active"),
    ("editing_material7", "Telegram Channel", 1, "active"),
    ("@letsgrow10", "Telegram Group", 1, "active"),
    ("@NOXXCUT", "Telegram Group", 1, "active"),
    ("@techjailbreakofficial", "Telegram Channel", 1, "active")
]

INITIAL_GROUPS = [
    ("@Editpeakstudio", "EditPeak Studio Official", "public", "active"),
    ("@Freelancing_Video_Editing", "Freelancing Video Editing Hub", "public", "active"),
    ("@redgs", "RED Graphic & Motion Studio", "public", "active"),
    ("@editing_material7", "Video Editing Resources & Gigs", "public", "active"),
    ("@letsgrow10", "Lets Grow Media Creators", "public", "active"),
    ("@NOXXCUT", "NoxxCut Video Creators Hub", "public", "active"),
    ("@techjailbreakofficial", "Tech & Creative Gigs Channel", "public", "active")
]


def get_connection():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Leads table (Preserves original schema and adds matched_keywords, link)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT,
        message_id INTEGER,
        text TEXT,
        score INTEGER,
        category TEXT,
        matched_keywords TEXT,
        link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source, message_id)
    )
    """)

    # Check if matched_keywords or link need to be added to existing table
    cursor.execute("PRAGMA table_info(leads)")
    columns = [row[1] for row in cursor.fetchall()]
    if "matched_keywords" not in columns:
        try:
            cursor.execute("ALTER TABLE leads ADD COLUMN matched_keywords TEXT")
        except Exception:
            pass
    if "link" not in columns:
        try:
            cursor.execute("ALTER TABLE leads ADD COLUMN link TEXT")
        except Exception:
            pass

    # 2. Keywords table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT UNIQUE NOT NULL,
        category TEXT,
        priority TEXT DEFAULT 'normal',
        enabled INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 3. Groups table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        title TEXT,
        type TEXT DEFAULT 'public',
        status TEXT DEFAULT 'active',
        lead_count INTEGER DEFAULT 0,
        last_checked TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 4. Sources table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        type TEXT DEFAULT 'Telegram Channel',
        status TEXT DEFAULT 'active',
        enabled INTEGER DEFAULT 1,
        lead_count INTEGER DEFAULT 0,
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 5. Notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 6. Users table for Private Authentication
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 7. Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Seed Admin User if not exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'Hacker'")
    if cursor.fetchone()[0] == 0:
        admin_pass = os.getenv("ADMIN_PASSWORD", "Hackerx")
        hashed = hash_password(admin_pass)
        cursor.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (os.getenv("ADMIN_USERNAME", "Hacker"), hashed, "admin")
        )

    # Seed Keywords (All 80 Keywords Preserved)
    cursor.execute("SELECT COUNT(*) FROM keywords")
    if cursor.fetchone()[0] == 0:
        for kw, cat, prio in INITIAL_80_KEYWORDS:
            try:
                cursor.execute(
                    "INSERT INTO keywords (keyword, category, priority, enabled) VALUES (?, ?, ?, 1)",
                    (kw, cat, prio)
                )
            except sqlite3.IntegrityError:
                pass

    # Seed Sources
    cursor.execute("SELECT COUNT(*) FROM sources")
    if cursor.fetchone()[0] == 0:
        for name, stype, enabled, status in INITIAL_SOURCES:
            try:
                cursor.execute(
                    "INSERT INTO sources (name, type, enabled, status, lead_count, last_sync) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)",
                    (name, stype, enabled, status)
                )
            except sqlite3.IntegrityError:
                pass

    # Seed Groups
    cursor.execute("SELECT COUNT(*) FROM groups")
    if cursor.fetchone()[0] == 0:
        for uname, title, gtype, status in INITIAL_GROUPS:
            try:
                cursor.execute(
                    "INSERT INTO groups (username, title, type, status, lead_count, last_checked) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)",
                    (uname, title, gtype, status)
                )
            except sqlite3.IntegrityError:
                pass

    # Seed Initial Notifications
    cursor.execute("SELECT COUNT(*) FROM notifications")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO notifications (type, title, message, read, created_at)
        VALUES
        ('system', 'System Online', 'Client Finder V2 intelligence daemon initialized.', 0, CURRENT_TIMESTAMP),
        ('system', 'Sources Connected', '7 Telegram sources and 80 core keywords loaded.', 0, CURRENT_TIMESTAMP)
        """)

    # Seed Default Settings
    defaults = {
        "min_score": "45",
        "refresh_interval": "15",
        "notification_sound": "true",
        "hot_alerts": "true",
        "warm_alerts": "true",
        "theme": "navy-dark"
    }
    for k, v in defaults.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    # Seed rich initial leads if leads table is empty
    cursor.execute("SELECT COUNT(*) FROM leads")
    if cursor.fetchone()[0] == 0:
        seed_leads = [
            (
                "Editpeakstudio", 1001,
                "🔥 URGENT: Looking for a high-retention YouTube video editor for long-term collaboration. Needs Premiere Pro and After Effects skills. Budget is ₹25,000 to ₹40,000/month or $30 per video. Must know how to pace talking head videos and motion graphics.",
                88, "🔥 HOT", "youtube editor, premiere pro, after effects, long term, budget, ₹",
                "https://t.me/Editpeakstudio/1001"
            ),
            (
                "Freelancing_Video_Editing", 1002,
                "Need an editor for Instagram reels and TikTok shorts. We produce 20-30 short form videos a month. Pay is $20 per reel. DM with your portfolio, no spam.",
                75, "🔥 HOT", "need an editor, reels editor, shorts editor, per video, $",
                "https://t.me/Freelancing_Video_Editing/1002"
            ),
            (
                "redgs", 1003,
                "Hiring video editor for our luxury real estate agency channel. Need cinematic property tour edits, drone color grading, and Premiere Pro transitions. Rate: ₹4,000 per video.",
                82, "🔥 HOT", "hiring video editor, real estate editor, cinematic editor, premiere pro, rate, ₹",
                "https://t.me/redgs/1003"
            ),
            (
                "editing_material7", 1004,
                "Looking for editor to help with documentary-style YouTube video edits (MagnatesMedia / Johnny Harris style). Fast turnaround required. Budget negotiable based on skills.",
                68, "🟡 WARM", "looking for editor, youtube video editor, documentary editor, budget",
                "https://t.me/editing_material7/1004"
            ),
            (
                "@letsgrow10", 1005,
                "Podcast editor needed for weekly 45-minute episodes. Audio cleanup, multicam sync, and vertical clip extraction for shorts. Remote / work from home. Paid work.",
                78, "🔥 HOT", "podcast editor, editor needed, shorts editor, remote, work from home, paid work",
                "https://t.me/letsgrow10/1005"
            ),
            (
                "@NOXXCUT", 1006,
                "Searching for an editor specialized in gaming video edits and montage sync for Apex Legends and Valorant. CapCut or Premiere. $15 per video.",
                62, "🟡 WARM", "searching for an editor, gaming video editor, capcut editor, per video, $",
                "https://t.me/NOXXCUT/1006"
            ),
            (
                "@techjailbreakofficial", 1007,
                "Editor wanted for tech product review channel. Monthly salary ₹35,000 full-time remote. Experience with DaVinci Resolve or Premiere Pro required.",
                84, "🔥 HOT", "editor wanted, monthly editor, salary, remote, premiere pro, davinci resolve, ₹",
                "https://t.me/techjailbreakofficial/1007"
            ),
            (
                "Editpeakstudio", 1008,
                "Anyone available for video editing help on an ad video project this weekend? Drop rates.",
                52, "🟡 WARM", "video editing, ad video editor, rate",
                "https://t.me/Editpeakstudio/1008"
            ),
            (
                "Freelancing_Video_Editing", 1009,
                "General discussion: What are the current industry rates for freelance editor in 2026?",
                40, "⚪ LOW", "freelance editor, rate",
                "https://t.me/Freelancing_Video_Editing/1009"
            )
        ]
        for src, mid, txt, sc, cat, kws, lnk in seed_leads:
            try:
                cursor.execute(
                    "INSERT INTO leads (source, message_id, text, score, category, matched_keywords, link) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (src, mid, txt, sc, cat, kws, lnk)
                )
            except Exception:
                pass

        # Update lead counts on sources
        cursor.execute("UPDATE sources SET lead_count = (SELECT COUNT(*) FROM leads WHERE leads.source = sources.name)")
        cursor.execute("UPDATE groups SET lead_count = (SELECT COUNT(*) FROM leads WHERE leads.source = groups.username OR leads.source = '@' || groups.username)")

    conn.commit()
    conn.close()


def save_lead(source, message_id, text, score, category, matched_keywords=None, link=""):
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO leads
            (source, message_id, text, score, category, matched_keywords, link)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (source, message_id, text, score, category, matched_keywords, link)
        )
        # Update source stats
        conn.execute(
            "UPDATE sources SET lead_count = lead_count + 1, last_sync = CURRENT_TIMESTAMP WHERE name = ? OR name = ?",
            (source, source.lstrip('@'))
        )
        conn.execute(
            "UPDATE groups SET lead_count = lead_count + 1 WHERE username = ? OR username = ?",
            (source, source.lstrip('@'))
        )
        # If hot or warm lead, insert dashboard notification
        if score >= 70:
            conn.execute(
                "INSERT INTO notifications (type, title, message, read) VALUES ('lead_hot', ?, ?, 0)",
                (f"🔥 HOT Lead Detected ({score}/100)", f"New lead in {source}: {text[:100]}...")
            )
        elif score >= 45:
            conn.execute(
                "INSERT INTO notifications (type, title, message, read) VALUES ('lead_warm', ?, ?, 0)",
                (f"🟡 WARM Lead Detected ({score}/100)", f"New lead in {source}: {text[:100]}...")
            )

        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_leads(search="", category="", source="", min_score=None, sort="newest", page=1, limit=15):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM leads WHERE 1=1"
    params = []

    if search:
        query += " AND (text LIKE ? OR source LIKE ? OR matched_keywords LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if category and category != "ALL":
        if category == "HOT":
            query += " AND category LIKE '%HOT%'"
        elif category == "WARM":
            query += " AND category LIKE '%WARM%'"
        elif category == "LOW":
            query += " AND category LIKE '%LOW%'"

    if source and source != "ALL":
        query += " AND (source = ? OR source = ?)"
        params.extend([source, source.lstrip('@')])

    if min_score is not None:
        query += " AND score >= ?"
        params.append(min_score)

    # Count total
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total_leads = cursor.fetchone()[0]

    # Order
    if sort == "oldest":
        query += " ORDER BY created_at ASC, id ASC"
    elif sort == "score_desc":
        query += " ORDER BY score DESC, created_at DESC"
    elif sort == "score_asc":
        query += " ORDER BY score ASC, created_at DESC"
    else:
        query += " ORDER BY created_at DESC, id DESC"

    # Pagination
    offset = (page - 1) * limit
    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return {
        "leads": rows,
        "total": total_leads,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total_leads + limit - 1) // limit)
    }


def delete_lead(lead_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def bulk_delete_leads(lead_ids):
    if not lead_ids:
        return 0
    conn = get_connection()
    cursor = conn.cursor()
    placeholders = ",".join("?" for _ in lead_ids)
    cursor.execute(f"DELETE FROM leads WHERE id IN ({placeholders})", lead_ids)
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected
