import os
from dotenv import load_dotenv
import google.generativeai as genai
import requests
from fastapi import FastAPI, Request, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from datetime import datetime
import openai

print(f"DEBUG: Current Working Directory: {os.getcwd()}")

LOG_PATH = Path("rewrite_history.json")
print(f"DEBUG: Resolved LOG_PATH: {LOG_PATH.resolve()}")

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
    """
    Retrieves the rewrite history.
    Handles cases where the history file might be missing, empty, or malformed.
    """
    if not LOG_PATH.exists():
        # If the log file doesn't exist, return an empty list.
        # This is a common and often user-friendly way to indicate no history.
        return []

    try:
        history_content = LOG_PATH.read_text(encoding="utf-8")
        if not history_content.strip():
            # If the file exists but is empty (or contains only whitespace),
            # return an empty list or an appropriate message.
            # Returning an empty list is consistent with "no history entries".
            return []

        history_data = json.loads(history_content)
        return history_data
    except json.JSONDecodeError as e:
        # Specific handling for JSON parsing errors.
        print(f"ERROR: Failed to parse {LOG_PATH}: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Failed to parse rewrite_history.json", "details": str(e)}
        )
    except Exception as e:
        # Catch-all for other potential errors (e.g., permission issues).
        print(f"ERROR: Failed to read {LOG_PATH}: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Failed to read rewrite_history.json", "details": str(e)}
        )

# Placeholder for a potential request model if needed, for now, not strictly used.
# class AnalysisTriggerRequest(BaseModel):
#     trigger: bool = True

@app.post("/analyse_prompt")
async def analyse_prompt(): # Removed req: PromptAnalysisRequest
    try:
        # 1. Read rewrite_history.json
        if not LOG_PATH.exists():
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "rewrite_history.json not found."}
            )

        history_content = LOG_PATH.read_text(encoding="utf-8")
        if not history_content:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "rewrite_history.json is empty."}
            )

        try:
            history_data = json.loads(history_content)
            if not isinstance(history_data, list) or not history_data:
                 return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": "rewrite_history.json does not contain a valid list of entries or is empty."}
                )
        except json.JSONDecodeError as e:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": f"Failed to parse rewrite_history.json: {str(e)}"}
            )

        # 2. Group entries by tone
        history_by_tone = {}
        for entry in history_data:
            tone = entry.get("tone")
            if tone:
                if tone not in history_by_tone:
                    history_by_tone[tone] = []
                history_by_tone[tone].append(entry)

        if not history_by_tone:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "No entries with 'tone' found in history data."}
            )

        # 3. For each tone, select up to 3 recent examples
        examples_by_tone_str = ""
        for tone, entries in history_by_tone.items():
            examples_by_tone_str += f"\n--- Examples for '{tone}' tone ---\n"
            # Select up to 3 most recent entries
            recent_entries = entries[-3:]
            for i, entry in enumerate(recent_entries):
                original_email = entry.get('original_email', 'N/A')
                final_prompt = entry.get('final_prompt', 'N/A') # Assuming this key exists from previous logging
                gemini_response = entry.get('gemini_response', 'N/A') # Assuming this key exists
                examples_by_tone_str += (
                    f"\nExample {i+1}:\n"
                    f"Original Email:\n{original_email}\n\n"
                    f"Final Prompt (for Gemini):\n{final_prompt}\n\n"
                    f"Gemini Response:\n{gemini_response}\n"
                )
            if not recent_entries:
                examples_by_tone_str += "No examples found for this tone.\n"

        # Construct the prompt for GPT-4 (Steps 4 & 5 from plan)
        # This is a simplified version for now, will be expanded
        gpt4_prompt = f"""{BRAND_TONE_GUIDANCE}

The following are recent examples of email rewrites by another AI (Gemini), grouped by the requested tone.  
We want to analyze how effective the prompts given to Gemini were in achieving the desired tone and outcome,  
and how we can improve our overall system prompt or per-tone instructions.

{examples_by_tone_str}

--- Analysis Task for GPT-4 ---
Based on the provided brand guidance and the examples:

1. For each tone, analyze the effectiveness of the prompts used for Gemini. Were the Gemini responses aligned with the requested tone and brand guidance?
2. Suggest specific improvements to the main `BRAND_TONE_GUIDANCE` to make it more effective.
3. Suggest specific per-tone instructions or modifications that could be added to the prompt for Gemini to improve results for each tone.
4. Provide a single, revised, complete system prompt that incorporates all improvements and is ready to use immediately with Gemini (no placeholders).

Return your response as **valid JSON** with these exact keys and structure:

{{
    "overall_summary": "Brief overview of prompt effectiveness across all rewrites",
    "tone_effectiveness": {{
        "professional": "Analysis of professional tone effectiveness",
        "friendly": "Analysis of friendly tone effectiveness", 
        "concise": "Analysis of concise tone effectiveness",
        "action-oriented": "Analysis of action-oriented tone effectiveness"
    }},
    "improvement_suggestions": "Specific suggestions for improving the current prompt structure",
    "revised_prompt": "A complete, ready-to-use system prompt with no placeholders that incorporates all improvements"
}}

**Important:**  
- Return only a valid JSON object.  
- Do not include any markdown formatting, explanations, or surrounding text.
"""

        # Send this prompt to GPT-4 (Step 6 from plan)
        response = openai.ChatCompletion.create(
            model="gpt-4", # Or "gpt-4-turbo" or other preferred model
            messages=[
                {"role": "system", "content": "You are an expert prompt engineer and AI writing assistant."},
                {"role": "user", "content": gpt4_prompt}
            ],
            temperature=0.7 # Adjust as needed
        )

        # Return the raw text output from GPT-4 (Step 7 from plan)
         # Parse the JSON response from GPT-4
        gpt_response = response.choices[0].message.content.strip()
        
        # Parse the JSON string into a Python object
        analysis_result = json.loads(gpt_response)
        
        # Return the parsed object directly (Flask will JSON-encode it)
        return analysis_result

    except Exception as e:
        # Log the exception for server-side debugging
        print(f"ERROR in /analyse_prompt: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"An unexpected error occurred during prompt analysis: {str(e)}"}
        )


if __name__ == "__main__":
    uvicorn.run("app_fastapi:app", host="0.0.0.0", port=8000, reload=True)
