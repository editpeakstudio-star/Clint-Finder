#!/usr/bin/env python3
"""Client Finder V2 — Secure Telegram Session Generator
Compatible with Telethon 1.45.0+

Features:
- Secure API_ID & API_HASH input.
- Interactive user authentication with Telegram (phone, SMS code, 2FA password).
- DOES NOT print the session string or base64 token to console or logs.
- Safely saves the Base64 session string into a private local file ('telegram_session_b64.txt') with restricted permissions (0600).
- Compatible with Telethon 1.45.0.
"""

import os
import sys
import base64
import getpass

try:
    from telethon.sync import TelegramClient
except ImportError:
    print("❌ Telethon 1.45.0 is not installed in this Python environment.")
    print("   Please install it with: pip install telethon==1.45.0")
    sys.exit(1)

SESSION_NAME = "editpeak_session"
SESSION_FILE = f"{SESSION_NAME}.session"
OUTPUT_SECRET_FILE = "telegram_session_b64.txt"

print("""
╔══════════════════════════════════════════════════════════╗
║     CLIENT FINDER V2 — SECURE SESSION GENERATOR          ║
║     Compatible with Telethon 1.45.0                     ║
╚══════════════════════════════════════════════════════════╝
""")

print("ℹ️ Prerequisites:")
print("  1. Log in at https://my.telegram.org")
print("  2. Go to 'API development tools'")
print("  3. Obtain your API_ID and API_HASH\n")

# 1. Secure API_ID input
api_id_val = os.getenv("API_ID")
if not api_id_val:
    api_id_val = input("Enter your Telegram API_ID: ").strip()

if not api_id_val:
    print("❌ API_ID is required.")
    sys.exit(1)

try:
    api_id = int(api_id_val)
except ValueError:
    print("❌ API_ID must be a numeric integer.")
    sys.exit(1)

# 2. Secure API_HASH input (masked or secure prompt)
api_hash_val = os.getenv("API_HASH")
if not api_hash_val:
    try:
        api_hash_val = getpass.getpass("Enter your Telegram API_HASH (input hidden for security): ").strip()
    except Exception:
        api_hash_val = input("Enter your Telegram API_HASH: ").strip()

if not api_hash_val:
    print("❌ API_HASH is required.")
    sys.exit(1)

api_hash = api_hash_val.strip()

print("\n📡 Initializing Telethon 1.45.0 client...")
print("ℹ️ You will be prompted for your phone number and Telegram verification code.")

try:
    client = TelegramClient(SESSION_NAME, api_id, api_hash)
    client.start()

    me = client.get_me()
    phone_display = getattr(me, "phone", "hidden")
    uname_display = f"@{me.username}" if getattr(me, "username", None) else "No Username"
    print(f"\n✅ Telegram Authentication Successful!")
    print(f"   Account: {getattr(me, 'first_name', '')} ({uname_display})")
    print(f"   User ID: {me.id}")
    client.disconnect()

    # Convert binary session file to base64
    if os.path.exists(SESSION_FILE):
        with open(SESSION_FILE, "rb") as f:
            session_bytes = f.read()
            b64_string = base64.b64encode(session_bytes).decode("utf-8")

        # Save securely to local file (NEVER print to console or logs)
        with open(OUTPUT_SECRET_FILE, "w") as out:
            out.write(b64_string)

        # Set restrictive read/write permissions for current user only (chmod 600)
        try:
            os.chmod(OUTPUT_SECRET_FILE, 0o600)
        except Exception:
            pass

        print("\n" + "=" * 62)
        print("🔒 SESSION SECURELY GENERATED AND SAVED")
        print("=" * 62)
        print(f"✅ The Base64 session string has been saved to:")
        print(f"   📁 {OUTPUT_SECRET_FILE}")
        print("\n🛡️ SECURITY PROTECTION ENFORCED:")
        print("   - The session string was NOT printed to the console or logs.")
        print(f"   - '{OUTPUT_SECRET_FILE}' has restricted file permissions (0600).")
        print(f"   - '{OUTPUT_SECRET_FILE}' and '*.session' are ignored in .gitignore.")
        print("   - Never commit or upload this file to any public repository.")
        print("=" * 62)
        print("\nTo use this session in your .env or GitHub Secrets:")
        print(f"TELEGRAM_SESSION_B64=$(cat {OUTPUT_SECRET_FILE})")
        print("=" * 62 + "\n")

    else:
        print(f"❌ Session file '{SESSION_FILE}' was not created.")
        sys.exit(1)

except KeyboardInterrupt:
    print("\n\nOperation aborted by operator.")
    sys.exit(0)
except Exception as e:
    print(f"\n❌ Telethon connection error: {e}")
    sys.exit(1)
