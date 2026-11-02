import os
import sqlite3

# Initial 80 default keywords organized by domain niche
KEYWORDS = [
    # General editor
    "video editor",
    "video editing",
    "editor needed",
    "editor required",
    "editor wanted",
    "hiring editor",
    "hire an editor",
    "need an editor",
    "need editor",
    "looking for an editor",
    "looking for editor",
    "searching for an editor",
    "editor vacancy",
    "editor job",
    "editing job",
    "video editing job",

    # YouTube
    "youtube editor",
    "youtube video editor",
    "youtube editing",
    "youtube videos",
    "youtube channel editor",
    "long form editor",
    "long-form editor",
    "long form video editor",

    # Shorts / Reels
    "reels editor",
    "reel editor",
    "instagram reels editor",
    "shorts editor",
    "youtube shorts editor",
    "short form editor",
    "short-form editor",
    "shorts editing",
    "reels editing",
    "short form video editor",

    # Social media
    "social media editor",
    "content editor",
    "content creator editor",
    "creator editor",
    "instagram editor",
    "tiktok editor",
    "social media videos",

    # Real estate
    "real estate editor",
    "real estate video editor",
    "property video editor",
    "real estate reels",
    "real estate videos",

    # Other common niches
    "podcast editor",
    "podcast video editor",
    "wedding video editor",
    "gaming video editor",
    "documentary editor",
    "cinematic editor",
    "faceless video editor",
    "ugc video editor",
    "ad video editor",
    "commercial video editor",

    # Software / skills
    "premiere pro editor",
    "premiere pro",
    "after effects editor",
    "after effects",
    "motion graphics",
    "davinci resolve",
    "capcut editor",

    # Hiring / payment signals
    "freelance editor",
    "freelancer editor",
    "paid editor",
    "paid editing",
    "paid work",
    "editor for hire",
    "long term editor",
    "long-term editor",
    "monthly editor",
    "per video",
    "budget",
    "paid",
    "payment",
    "salary",
    "rate",
    "remote editor",
    "work from home editor"
]

MIN_SCORE = int(os.getenv("MIN_SCORE", "45"))
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "leads.db")


def get_active_keywords():
    """Retrieve all enabled keywords dynamically from the SQLite database,

    falling back to KEYWORDS if the database is not yet initialized.
    """
    if not os.path.exists(DB_PATH):
        return KEYWORDS

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT keyword FROM keywords WHERE enabled = 1")
        rows = cursor.fetchall()
        conn.close()
        if rows:
            return [r[0] for r in rows]
    except Exception:
        pass

    return KEYWORDS
