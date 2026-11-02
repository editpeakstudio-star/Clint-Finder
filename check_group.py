import asyncio
import os

from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

API_ID = int(os.getenv("API_ID"))
API_HASH = os.getenv("API_HASH")

client = TelegramClient(
    "editpeak_session",
    API_ID,
    API_HASH
)

GROUPS = [
    "@Editpeakstudio",
    "@Freelancing_Video_Editing",
    "@redgs",
    "@editing_material7",
]


async def main():
    await client.start()

    for username in GROUPS:
        print("\nChecking:", username)

        try:
            entity = await client.get_entity(username)

            print("✅ FOUND")
            print("Title:", getattr(entity, "title", "Unknown"))
            print("ID:", entity.id)
            print("Username:", getattr(entity, "username", None))

        except Exception as e:
            print("❌ NOT FOUND")
            print(type(e).__name__, e)

    await client.disconnect()


asyncio.run(main())
