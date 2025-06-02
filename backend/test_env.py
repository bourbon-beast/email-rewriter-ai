from dotenv import load_dotenv
from pathlib import Path
import os

print("🐍 Running test file...")

# Define the path BEFORE printing it
dotenv_path = Path(__file__).parent / '.env'
print("Looking for .env at:", dotenv_path)

load_dotenv(dotenv_path)

api_key = os.getenv("GEMINI_API_KEY")
print("Loaded key:", api_key if api_key else "❌ Not found!")
print("TEST_KEY =", os.getenv("TEST_KEY"))

