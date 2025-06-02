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
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from datetime import datetime
import openai

LOG_PATH = Path("rewrite_history.json")

def log_rewrite(entry: dict):
    if LOG_PATH.exists():
        with open(LOG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = []

    data.append(entry)

    with open(LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# Load env vars
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")


# Configure Gemini model
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("models/gemini-2.0-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or replace with your frontend origin if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up templates and static files
templates = Jinja2Templates(directory="templates")
BASE_DIR = Path(__file__).resolve().parent.parent  # goes up from /backend
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
BRAND_TONE_GUIDANCE = """
You are an assistant writing on behalf of AcmeHR, an Australian HR and EOR platform.
Use clear, confident language, and follow Australian English spelling and conventions.
Avoid Americanisms like 'organize' or 'color' — prefer 'organise', 'colour', etc.
When referring to business terms, use Australian-appropriate language where applicable.
"""
class PromptAnalysisRequest(BaseModel):
    prompt: str

class EmailRequest(BaseModel):
    email: str
    tone: str = "professional"

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/rewrite")
async def rewrite_email(email_request: EmailRequest):
    prompt = f"""{BRAND_TONE_GUIDANCE}

    The user has submitted the following email and would like it rewritten in a "{email_request.tone}" tone:

    --- ORIGINAL EMAIL ---
    {email_request.email}
    ----------------------

    Please complete the following:

    1. Briefly analyze the tone and effectiveness of the original email (1–2 sentences) against the "{email_request.tone}" tone to help imporve the users next attempt.
    2. Suggest a subject line that fits the email and reflects the "{email_request.tone}" tone.
    3. Rewrite the email in the "{email_request.tone}" tone while maintaining its original intent.

    Respond using this format:

    ANALYSIS:
    [...]

    SUBJECT:
    [...]

    REWRITTEN EMAIL:
    [...]
    """

    try:
        response = model.generate_content(prompt)
        rewritten_email = response.text.strip()

        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "original_email": email_request.email,
            "tone": email_request.tone,
            "final_prompt": prompt,
            "gemini_response": rewritten_email,
            "user_feedback": None
        }

        log_rewrite(log_entry)

        return {
            "original": email_request.email,
            "rewritten": rewritten_email,
            "tone": email_request.tone
        }
    except Exception as e:
        return {
            "error": f"Failed to generate email: {str(e)}"
        }

@app.get("/history")
async def get_history():
    if LOG_PATH.exists():
        return json.loads(LOG_PATH.read_text(encoding="utf-8"))
    return []

@app.post("/analyse_prompt")
async def analyse_prompt(req: PromptAnalysisRequest):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a prompt engineer reviewing the behavior of another AI model."},
                {"role": "user", "content": req.prompt}
            ],
            temperature=0.7
        )
        return {"output": response.choices[0].message.content.strip()}
    except Exception as e:
        return {"error": f"Prompt analysis failed: {str(e)}"}


if __name__ == "__main__":
    uvicorn.run("app_fastapi:app", host="0.0.0.0", port=8000, reload=True)
