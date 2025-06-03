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
import sqlite3 # Added import

from backend.database.prompt_db import PromptDatabase # Added import

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

# Initialize database connection
# Ensure this path correctly points to where you want the database file to live.
# If app_fastapi.py is in /backend, and prompts.db should be in /backend/database/prompts.db
db_path = Path(__file__).parent / "database" / "prompts.db"
db = PromptDatabase(db_path=str(db_path))

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
# BRAND_TONE_GUIDANCE has been removed; will be fetched from DB.

class PromptAnalysisRequest(BaseModel):
    prompt: str

class EmailRequest(BaseModel):
    email: str
    tone: str = "professional"

class BasePromptUpdateRequest(BaseModel):
    content: str
    reason: str

class ToneInstructionsUpdateRequest(BaseModel):
    instructions: str
    reason: str

class ToneCreateRequest(BaseModel):
    keyword: str
    label: str
    instructions: str

class ApplySuggestionRequest(BaseModel):
    component_type: str         # e.g., 'base' or 'tone'
    component_id: str           # e.g., 'active_base_prompt' or tone keyword like 'professional'
    new_content: str
    reason: str                 # Reason for applying the suggestion

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/rewrite")
async def rewrite_email(email_request: EmailRequest):
    active_base_prompt = db.get_active_base_prompt()
    if not active_base_prompt:
        # Fallback if no active base prompt is found
        active_base_prompt = "You are a helpful writing assistant. Please rewrite the provided email."
        # Consider logging this event.
        print("WARNING: No active base prompt found in DB, using fallback for /rewrite endpoint.")

    tone_details = db.get_tone_by_keyword(email_request.tone)
    tone_instructions_segment = "" # Use a different variable name to avoid conflict with a potential 'tone_instructions' in tone_details
    if tone_details and tone_details.get('instructions'):
        tone_instructions_segment = f"Apply the following tone guidance for '{tone_details.get('label', email_request.tone)}':\n{tone_details['instructions']}\n\n"
    else:
        # Optional: log if specific tone instructions are not found
        print(f"INFO: No specific instructions found for tone '{email_request.tone}', using base prompt and general instructions.")
        # Even if no specific instructions, we still want the tone to be part of the general instruction.

    # Reconstruct the detailed multi-step prompt using fetched components
    prompt = f"""{active_base_prompt}

{tone_instructions_segment}The user has submitted the following email and would like it rewritten in a "{email_request.tone}" tone. The original email is:

--- ORIGINAL EMAIL ---
{email_request.email}
----------------------

Please complete the following tasks:

1. Briefly analyze the tone and effectiveness of the original email (1–2 sentences) against the desired "{email_request.tone}" tone. This analysis should help the user understand areas for improvement in their original draft when aiming for this specific tone.
2. Suggest a concise and fitting subject line for the rewritten email that reflects the "{email_request.tone}" tone.
3. Rewrite the email in the specified "{email_request.tone}" tone, ensuring the core message and intent of the original email are preserved.

Respond using the following exact format, including the labels ANALYSIS:, SUBJECT:, and REWRITTEN EMAIL: (do not add any other text or markdown like ```json or ```):

ANALYSIS:
[Your analysis here]

SUBJECT:
[Your subject line here]

REWRITTEN EMAIL:
[Your rewritten email here]
    """
    # Ensure this `prompt` variable is the one used in `model.generate_content(prompt)`
    # and logged in `log_entry["final_prompt"] = prompt`.

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
        active_base_prompt = db.get_active_base_prompt()
        if not active_base_prompt:
            # Handle case where no active base prompt is found
            # Return an error or use a system-default message if appropriate
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Active base prompt not found in database. Cannot perform analysis."}
            )

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
        gpt4_prompt = f"""The current active base prompt is:
--- BEGIN ACTIVE BASE PROMPT ---
{active_base_prompt}
--- END ACTIVE BASE PROMPT ---

Review the provided active base prompt and the recent email rewrite examples below. We want to improve our prompt system (base prompt + per-tone instructions).

{examples_by_tone_str}

--- Analysis Task for GPT-4 ---
Based on the provided active base prompt and the examples:

1.  **Overall Summary**: Briefly summarize the general effectiveness of the current base prompt and tone instructions across all examples.
2.  **Tone Effectiveness Analysis**: For each tone (professional, friendly, concise, action-oriented), analyze how well the Gemini responses aligned with the requested tone and the active base prompt. Identify any common misalignments or areas for improvement for each specific tone.
3.  **Improvement Suggestions (Structured)**: Provide specific, actionable suggestions to improve the prompt system. Format these as a list of JSON objects. Each object in the list should have the following keys:
    *   `id`: A unique integer for this suggestion (e.g., 1, 2, 3).
    *   `component_type`: STRING - Either 'base' (for the main base prompt) or 'tone' (for specific tone instructions).
    *   `component_keyword`: STRING - If `component_type` is 'tone', specify the tone keyword (e.g., 'professional', 'friendly'). If 'base', this can be null or 'active_base_prompt'.
    *   `suggestion_type`: STRING - Type of suggestion, e.g., 'modification', 'addition', 'clarification', 'removal'.
    *   `description`: STRING - A clear explanation of the suggestion and why it's needed.
    *   `current_text_snippet`: STRING (Optional) - A relevant snippet of the current text that the suggestion applies to (e.g., a sentence from the base prompt or a current tone instruction).
    *   `suggested_replacement_text`: STRING - The suggested new or modified text. For a 'removal', this might be empty or describe what to remove.
    *   `priority`: STRING - Suggested priority: 'high', 'medium', or 'low'.
4.  **Revised Base Prompt**: Provide a single, complete, revised **base prompt** that incorporates all your *high-priority* 'base' component suggestions. This revised base prompt should be ready to use. Do not include per-tone instructions in this revised base prompt.

Return your response as **valid JSON** with these exact top-level keys and structure:

{{
    "overall_summary": "Your brief overview here.",
    "tone_effectiveness_analysis": {{
        "professional": "Your analysis for professional tone...",
        "friendly": "Your analysis for friendly tone...",
        "concise": "Your analysis for concise tone...",
        "action-oriented": "Your analysis for action-oriented tone..."
    }},
    "improvement_suggestions": [
        {{
            "id": 1,
            "component_type": "base",
            "component_keyword": "active_base_prompt",
            "suggestion_type": "modification",
            "description": "Example: Clarify the target audience for more precise language.",
            "current_text_snippet": "Use clear, confident language...",
            "suggested_replacement_text": "Use clear, confident language, remembering the target audience is primarily HR professionals.",
            "priority": "high"
        }},
        {{
            "id": 2,
            "component_type": "tone",
            "component_keyword": "friendly",
            "suggestion_type": "addition",
            "description": "Example: Add guidance on using emojis for friendly tone.",
            "current_text_snippet": null,
            "suggested_replacement_text": "Consider using appropriate positive emojis sparingly to enhance warmth.",
            "priority": "medium"
        }}
        // ... more suggestion objects ...
    ],
    "revised_base_prompt": "Your complete revised base prompt text here, incorporating high-priority base suggestions."
}}

**Important Reminders:**
- Ensure the output is a single, valid JSON object.
- Do not include any markdown formatting (like ```json), comments, or surrounding text outside the main JSON object.
- For `improvement_suggestions`, provide at least one suggestion, even if it's minor.
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

# --- Prompt Management Endpoints ---

@app.get("/prompts/base")
async def get_base_prompt_endpoint():
    content = db.get_active_base_prompt()
    if content is None:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"error": "Active base prompt not found."})
    return {"content": content}

@app.get("/prompts/tones")
async def get_tones_endpoint():
    tones = db.get_active_tones() # Assuming this returns a list of dicts
    return tones

@app.get("/prompts/history")
async def get_prompt_history_endpoint():
    try:
        history = db.get_prompt_history() # Assuming this returns a list of dicts/objects
        return history
    except Exception as e:
        # Log the exception e
        print(f"Error fetching prompt history: {e}")
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": str(e)})

@app.put("/prompts/base")
async def update_base_prompt_endpoint(request: BasePromptUpdateRequest):
    try:
        db.update_base_prompt(content=request.content, reason=request.reason)
        return {"message": "Base prompt updated successfully."}
    except Exception as e:
        # Log the exception e
        print(f"Error updating base prompt: {e}")
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": str(e)})

@app.put("/prompts/tones/{keyword}")
async def update_tone_instructions_endpoint(keyword: str, request: ToneInstructionsUpdateRequest):
    try:
        # Check if tone exists before attempting update
        tone = db.get_tone_by_keyword(keyword)
        if not tone:
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"error": f"Tone with keyword '{keyword}' not found."})
        db.update_tone_instructions(keyword=keyword, instructions=request.instructions, reason=request.reason)
        return {"message": f"Tone '{keyword}' updated successfully."}
    except Exception as e:
        # Log the exception e
        print(f"Error updating tone {keyword}: {e}")
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": str(e)})

@app.post("/prompts/tones")
async def create_tone_endpoint(request: ToneCreateRequest):
    try:
        db.create_tone(keyword=request.keyword, label=request.label, instructions=request.instructions)
        # Fetch the created tone to return it, or construct the response manually
        created_tone = db.get_tone_by_keyword(request.keyword) # Assuming create_tone makes it active
        if not created_tone:
             # Should ideally not happen if create_tone was successful and makes it active
             return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": "Tone created but could not be retrieved."})
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=created_tone)
    except sqlite3.IntegrityError: # Specific error for duplicate keyword
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"error": f"Tone with keyword '{request.keyword}' already exists."})
    except Exception as e:
        # Log the exception e
        print(f"Error creating tone {request.keyword}: {e}")
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": str(e)})

@app.post("/prompts/apply-suggestion")
async def apply_suggestion_endpoint(request: ApplySuggestionRequest):
    try:
        if request.component_type == 'base':
            # For base prompt, component_id might not be strictly needed by db.update_base_prompt
            # if it always updates the single active one or creates a new active one.
            # We use 'active_base_prompt' as a convention from the frontend.
            db.update_base_prompt(content=request.new_content, reason=request.reason)
            return {"message": "Base prompt updated successfully based on suggestion."}

        elif request.component_type == 'tone':
            tone_keyword = request.component_id
            # Check if the tone exists before attempting to update
            existing_tone = db.get_tone_by_keyword(tone_keyword)
            if not existing_tone:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"error": f"Tone with keyword '{tone_keyword}' not found. Cannot apply suggestion."}
                )
            db.update_tone_instructions(keyword=tone_keyword, instructions=request.new_content, reason=request.reason)
            return {"message": f"Tone '{tone_keyword}' updated successfully based on suggestion."}

        else:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": f"Invalid component_type: {request.component_type}. Must be 'base' or 'tone'."}
            )

    except Exception as e:
        print(f"Error applying suggestion: {e}") # Log the full error server-side
        # Check if e has specific attributes like e.detail for more specific client messages
        error_message = str(e)
        # Attempt to get a more specific message if it's a custom exception or has 'detail'
        if hasattr(e, 'detail'):
             error_message = e.detail

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Failed to apply suggestion: {error_message}"}
        )

if __name__ == "__main__":
    uvicorn.run("backend.app_fastapi:app", host="0.0.0.0", port=8000, reload=True)
