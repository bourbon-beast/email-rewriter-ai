import os
from dotenv import load_dotenv
import google.generativeai as genai
import requests
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
import uvicorn

# Load env vars
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Configure Gemini model
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("models/gemini-2.0-flash")


app = FastAPI()

# Set up templates and static files
templates = Jinja2Templates(directory="templates")
BASE_DIR = Path(__file__).resolve().parent.parent  # goes up from /backend
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

class EmailRequest(BaseModel):
    email: str
    tone: str = "professional"

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/rewrite")
async def rewrite_email(email_request: EmailRequest):
    prompt = f"""Rewrite the following email in a {email_request.tone} tone.
Maintain the same intent and meaning, but change the style.

Original:
{email_request.email}

Rewritten ({email_request.tone} tone):"""

    try:
        response = model.generate_content(prompt)
        rewritten_email = response.text.strip()

        return {
            "original": email_request.email,
            "rewritten": rewritten_email,
            "tone": email_request.tone
        }
    except Exception as e:
        return {
            "error": f"Failed to generate email: {str(e)}"
        }

if __name__ == "__main__":
    uvicorn.run("app_fastapi:app", host="0.0.0.0", port=8000, reload=True)
