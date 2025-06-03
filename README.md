# AI Email Rewriter & Prompt Management System

This project is a web application that rewrites emails using AI and includes a system for dynamically managing the prompts used by the AI. It features a Python FastAPI backend and a React frontend.

## Key Features

*   **AI-Powered Email Rewriting:** Submit an email and have it rewritten in various tones (e.g., professional, friendly).
*   **Dynamic Prompt Management:**
    *   Centralized database (SQLite) for storing and managing AI prompt components.
    *   UI to view and update the active base prompt.
    *   UI to view, update, and create custom tones with specific instructions.
    *   History tracking for all changes made to prompts and tones.
*   **Prompt Analysis & Suggestions:**
    *   Leverages GPT-4 to analyze the effectiveness of current prompts based on rewrite history.
    *   Displays structured suggestions for improving the base prompt and tone instructions.
    *   Allows users to apply these suggestions directly to the database with a confirmation step.

## Project Structure

-   `backend/`: Contains the Python FastAPI application (`app_fastapi.py`) and database logic (`database/`).
    -   `backend/database/prompts.db`: SQLite database file (automatically created).
    -   `backend/database/schema.sql`: SQL schema for the database.
-   `frontend/`: Contains the React application (built with Vite).
-   `rewrite_history.json`: Logs email rewrite operations for analysis.
-   `.env`: Environment variable configuration file (needs to be created from `.env.example`).

## Getting Started

### Prerequisites

-   Python 3.9+ (FastAPI and its dependencies)
-   Node.js and npm (or yarn) for the frontend.
-   Access to OpenAI (for GPT-4) and Google Gemini APIs, with corresponding API keys.

### Backend Setup (`app_fastapi.py`)

1.  **Navigate to the project root directory.**
2.  **Create and activate a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install Python dependencies:**
    ```bash
    cd backend
    pip install -r requirements.txt
    cd ..
    ```
    *(Ensure `backend/requirements.txt` is up-to-date with `fastapi`, `uvicorn[standard]`, `python-dotenv`, `google-generativeai`, `openai`)*

4.  **Set up environment variables:**
    *   In the **project root directory** (e.g., where `rewrite_history.json` is), create a file named `.env`.
    *   Copy the contents from `backend/.env.example` into this new `.env` file.
    *   Update the `GEMINI_API_KEY` and `OPENAI_API_KEY` with your actual API keys.
    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
    ```

5.  **Database Initialization:**
    The SQLite database (`backend/database/prompts.db`) and its schema will be automatically created and initialized with default data (base prompt, initial tones) the first time you run the backend application if the file does not already exist.

6.  **Run the backend server:**
    From the **project root directory**, run the FastAPI application as a module:
    ```bash
    python -m backend.app_fastapi
    ```
    The backend will typically be available at `http://localhost:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or if you prefer yarn
    # yarn install
    ```
3.  **Run the frontend development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The frontend will typically be available at `http://localhost:5173` (or another port if 5173 is busy).
    The frontend is configured to connect to the backend at `http://localhost:8000`.

## Using the Application

Once both backend and frontend servers are running, open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).

### Main Features in the UI

1.  **Rewrite Tab:**
    *   Enter email content, select a tone, and get an AI-generated rewrite.
    *   After a rewrite, a "Review Prompts & Suggest Improvements" button appears. Clicking this triggers a GPT-4 analysis of recent rewrites and the current prompts.
    *   The analysis results, including suggestions, are displayed below.

2.  **Prompt Review Display (within Rewrite Tab):**
    *   Shows GPT-4's analysis: overall summary, tone effectiveness, a suggested revised base prompt, and a list of detailed improvement suggestions for base/tones.
    *   Each actionable suggestion (revised base prompt or individual detailed suggestions) has an "Apply" button.
    *   Clicking "Apply" will show a confirmation dialog. If confirmed, the suggestion is saved to the database, and the prompt management UI will reflect the change.

3.  **Prompt Management Tab:**
    *   **Base Prompt Editor:** View and edit the currently active base prompt. Changes require a reason and are logged.
    *   **Tones List:** View all active tones and their instructions. Edit existing tones or create new ones.
        *   **Tone Editor:** Modify instructions for a specific tone. Changes require a reason and are logged.
        *   **Create Tone Form:** Add a new custom tone with a unique keyword, label, and instructions.
    *   **Prompt Change History:** View a log of all modifications made to the base prompt and tones, including reasons and timestamps.

4.  **History Tab:**
    *   Displays the history of email rewrite operations from `rewrite_history.json`.

## Backend API Endpoints (`app_fastapi.py`)

The backend provides several API endpoints, including:

*   `POST /rewrite`: Rewrites an email.
*   `POST /analyse_prompt`: Triggers GPT-4 analysis of prompts.
*   `GET /prompts/base`: Get the active base prompt.
*   `PUT /prompts/base`: Update the active base prompt.
*   `GET /prompts/tones`: Get all active tones.
*   `POST /prompts/tones`: Create a new tone.
*   `PUT /prompts/tones/{keyword}`: Update a specific tone.
*   `GET /prompts/history`: Get the history of prompt changes.
*   `POST /prompts/apply-suggestion`: Applies a GPT-4 suggestion to the database.
*   `GET /history`: Gets the email rewrite history.

## Contributing

Contributions are welcome. Please follow standard coding practices and provide documentation for new features.

## License

This project is currently unlicensed. Add an appropriate open-source license file (e.g., MIT, Apache 2.0) if you plan to distribute or share this codebase.
