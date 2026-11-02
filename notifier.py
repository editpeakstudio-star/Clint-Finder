import os
import sqlite3
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BOT_TOKEN = os.getenv("BOT_TOKEN")
OWNER_ID = os.getenv("OWNER_ID")

bot = None
if BOT_TOKEN:
    try:
        from telegram import Bot
        bot = Bot(BOT_TOKEN)
    except Exception as e:
        print(f"⚠️ Telegram Bot initialization warning: {e}")


async def send_lead(
    source,
    text,
    score,
    category,
    link=""
):
    """Sends notification to Telegram bot if configured, and always records notification

    in SQLite database for the dashboard.
    """
    message = f"""
{category} LEAD

📊 Score: {score}/100
📢 Source: {source}

━━━━━━━━━━━━━━

{text[:2500]}

━━━━━━━━━━━━━━
"""
    if link:
        message += f"\n🔗 Original post:\n{link}"

    # 1. Send via Telegram Bot if credentials are valid
    if bot and OWNER_ID:
        try:
            owner_int = int(OWNER_ID)
            await bot.send_message(
                chat_id=owner_int,
                text=message
            )
        except Exception as e:
            print(f"⚠️ Failed to send Telegram notification to owner {OWNER_ID}: {e}")

    # 2. Persist notification in database
    try:
        from database import get_connection
        conn = get_connection()
        conn.execute(
            """
            INSERT INTO notifications (type, title, message, read, created_at)
            VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
            """,
            (
                "lead_hot" if score >= 70 else "lead_warm",
                f"{category} Lead Detected ({score}/100)",
                f"Source {source}: {text[:140]}..."
            )
        )
        conn.commit()
        conn.close()
    except Exception:
        pass
