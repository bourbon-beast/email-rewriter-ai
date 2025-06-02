import os
from dotenv import load_dotenv
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
# Load environment variables
from pathlib import Path
dotenv_path = Path(__file__).parent / '.env'
print("Loading .env from:", dotenv_path)
load_dotenv(dotenv_path)
print("DEBUG: GEMINI_API_KEY =", os.getenv("GEMINI_API_KEY"))


# Configure Google Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/rewrite', methods=['POST'])
def rewrite_email():
    data = request.json
    original_email = data.get('email', '')
    tone = data.get('tone', 'professional')
    
    if not original_email:
        return jsonify({
            'error': 'Email content is required'
        }), 400
    
    try:
        # Create a prompt for Gemini based on the tone
        prompt = f"""Rewrite the following email in a {tone} tone. 
        Maintain the same information and intent, but adjust the style to be more {tone}.
        
        Original email:
        {original_email}
        
        Rewritten email in {tone} tone:"""
        
        # Call Gemini API
        response = model.generate_content(prompt)
        rewritten_email = response.text
        
        return jsonify({
            'original': original_email,
            'rewritten': rewritten_email,
            'tone': tone
        })
    except Exception as e:
        return jsonify({
            'error': f'Error rewriting email: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
