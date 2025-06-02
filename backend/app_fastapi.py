import os
from dotenv import load_dotenv
import requests
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI()

# Set up templates and static files
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

class EmailRequest(BaseModel):
    email: str
    tone: str = "professional"

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/rewrite")
async def rewrite_email(email_request: EmailRequest):
    # In a real application, you would call an AI service here
    # For now, we'll just return a placeholder response
    rewritten_email = f"This is a placeholder for the rewritten email in a {email_request.tone} tone."
    
    return {
        "original": email_request.email,
        "rewritten": rewritten_email,
        "tone": email_request.tone
    }

if __name__ == "__main__":
    uvicorn.run("app_fastapi:app", host="0.0.0.0", port=8000, reload=True)
