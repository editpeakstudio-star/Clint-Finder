import os
import asyncio
import base64
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from config import MIN_SCORE
from database import init_db, save_lead, get_connection
from lead_analyzer import analyze
from notifier import send_lead

# Initialize database schemas and seeds immediately
init_db()

API_ID_ENV = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")

API_ID = int(API_ID_ENV) if API_ID_ENV and API_ID_ENV.isdigit() else None

SESSION_FILE = "editpeak_session.session"
SESSION_B64 = os.getenv("TELEGRAM_SESSION_B64")

if SESSION_B64 and not os.path.exists(SESSION_FILE):
    try:
        with open(SESSION_FILE, "wb") as f:
            f.write(base64.b64decode(SESSION_B64.strip()))
    except Exception as e:
        print(f"⚠️ Warning decoding TELEGRAM_SESSION_B64: {e}")

# Base sources list (preserved and extensible)
DEFAULT_SOURCES = [
    "Editpeakstudio",
    "Freelancing_Video_Editing",
    "redgs",
    "editing_material7",
    "@letsgrow10",
    "@NOXXCUT",
    "@techjailbreakofficial",
]


def get_monitored_sources():
    """Retrieve enabled sources from SQLite database, falling back to DEFAULT_SOURCES."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sources WHERE enabled = 1 AND status = 'active'")
        rows = cursor.fetchall()
        conn.close()
        if rows:
            return [r[0] for r in rows]
    except Exception:
        pass
    return DEFAULT_SOURCES


async def handle_incoming_text(text, source, sender_name, message_id, link=""):
    """Core analysis and pipeline function callable from Telegram listener or test events."""
    if not text:
        return None

    score, category = analyze(text)
    matched_kws = getattr(analyze(text), "matched", [])
    matched_str = ", ".join(matched_kws) if matched_kws else ""

    print()
    print("╔══════════════════════════════════════════════════════╗")
    print(f"📩 SOURCE   : {source}")
    print(f"👤 USERNAME : {sender_name}")
    print(f"🆔 MESSAGE  : {message_id}")
    print(f"📝 TEXT     : {text[:100]}...")
    print(f"🎯 MATCHED  : {matched_str}")
    print(f"{category} SCORE: {score}/100")
    print("╚══════════════════════════════════════════════════════╝")
    print()

    if score < MIN_SCORE:
        return None

    saved = save_lead(
        source=source,
        message_id=message_id,
        text=text,
        score=score,
        category=category,
        matched_keywords=matched_str,
        link=link
    )

    if saved:
        await send_lead(
            source=source,
            text=text,
            score=score,
            category=category,
            link=link
        )
    return saved


async def main():
    print("""
==================================================
       CLIENT FINDER V2 — PRIVATE INTELLIGENCE
       EditPeak Studio Autonomous Listener
==================================================
""")

    if not API_ID or not API_HASH:
        print("ℹ️ Telegram Listener Status: STANDBY")
        print("   API_ID or API_HASH is not set.")
        print("   The web dashboard is fully running with SQLite.")
        print("   To stream live Telegram leads, obtain your API credentials from https://my.telegram.org")
        print("   and configure API_ID and API_HASH.")
        return

    if not os.path.exists(SESSION_FILE):
        print("ℹ️ Telegram Session Status: SESSION REQUIRED")
        print("   The Telegram session file 'editpeak_session.session' is not present.")
        print("   Run the local session generator: python generate_session.py")
        print("   Or provide the base64 string in TELEGRAM_SESSION_B64.")
        print("   The application continues operating in standalone database mode.")
        return

    try:
        from telethon import TelegramClient, events
    except ImportError:
        print("❌ Telethon is not installed in this environment.")
        print("   Run: pip install telethon")
        return

    sources = get_monitored_sources()
    print(f"📡 Monitored Sources ({len(sources)}): {', '.join(sources)}")

    try:
        client = TelegramClient(
            "editpeak_session",
            API_ID,
            API_HASH
        )

        @client.on(events.NewMessage(chats=sources))
        async def handle_message(event):
            text = event.raw_text
            if not text:
                return

            chat = await event.get_chat()
            sender = await event.get_sender()

            username = "Unknown"
            if sender:
                if getattr(sender, "username", None):
                    username = "@" + sender.username
                elif getattr(sender, "first_name", None):
                    username = sender.first_name

            source = "Telegram"
            link = ""
            if getattr(chat, "username", None):
                source = "@" + chat.username
                link = f"https://t.me/{chat.username}/{event.message.id}"
            elif getattr(chat, "title", None):
                source = chat.title

            await handle_incoming_text(text, source, username, event.message.id, link)

        print("📡 Connecting to Telegram...")
        await client.start()
        print("✅ Client Finder V2 Telegram listener is online and streaming leads.")
        await client.run_until_disconnected()

    except Exception as e:
        print(f"⚠️ Telegram client connection warning: {e}")
        print("   Verify that your session file has not expired and API_ID/API_HASH are valid.")
        print("   Run 'python generate_session.py' to generate a fresh session.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown requested by operator.")
    except Exception as e:
        print(f"⚠️ Startup note: {e}")

