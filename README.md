# Project README

This project is a web application with a Python backend (Flask and FastAPI options) and a React frontend.

## Project Structure

The project is organized into the following main directories:

- `backend/`: Contains the Python backend applications (Flask and FastAPI).
- `frontend/`: Contains the React application built with Vite.
- `static/`: Contains static assets (CSS, JS), primarily used by the `app_fastapi.py` (FastAPI) application.
- `templates/`: Contains HTML templates, primarily used by the `app_fastapi.py` (FastAPI) application to serve a simple frontend.

## Getting Started

### Prerequisites

- Python 3.7+
- Node.js and npm (or yarn)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up environment variables:**
    Copy `.env.example` to `.env` and update the variables as needed.
    ```bash
    cp .env.example .env
    ```
5.  **Run the backend server:**
    The `backend` directory contains two different web server applications:
    - `app.py`: A Flask application that uses the Google Gemini API to rewrite email content. This application provides the core AI functionality.
    - `app_fastapi.py`: A FastAPI application that includes a placeholder `/rewrite` endpoint. It also serves a simple HTML page from the `templates` directory and static files from the `static` directory.

    **Running the Flask application (`app.py` - with AI features):**
    To run the Flask application, which provides the email rewriting functionality:
    ```bash
    python app.py
    ```
    The Flask backend will typically be available at `http://127.0.0.1:5000` (Flask's default port). This is the recommended backend for using the email rewriting functionality.

    **Running the FastAPI application (`app_fastapi.py`):**
    To run the FastAPI application:
    ```bash
    uvicorn app_fastapi:app --reload
    ```
    The FastAPI backend will typically be available at `http://127.0.0.1:8000`. Note that its `/rewrite` endpoint currently returns placeholder data and it primarily serves a basic HTML interface using the `templates/` and `static/` directories.

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
    The frontend will typically be available at `http://localhost:5173`.

## Usage

Once the chosen backend server (preferably `app.py` for the AI features) and the frontend React server (`frontend/`) are running, open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).

The React application (`frontend/`) is designed to interact with one of the backend applications. You may need to verify or adjust the API endpoint configuration within the frontend code (typically in a file like `frontend/src/api.js` or a similar service/configuration file) to ensure it points to the correct backend address and port:
- For `app.py` (Flask with AI features): `http://127.0.0.1:5000`
- For `app_fastapi.py` (FastAPI with placeholder): `http://127.0.0.1:8000`

For the email rewriting functionality, ensure the frontend is configured to communicate with `app.py`. The `frontend/src/api.js` file is typically responsible for making the actual HTTP request to the backend's `/rewrite` endpoint.

## AI Email Rewriting API (`app.py`)

The Flask backend (`app.py`) provides an endpoint for rewriting email content using the Google Gemini API.

### Endpoint: `/rewrite`

-   **Method:** `POST`
-   **Description:** Accepts an original email and a desired tone, then returns the rewritten email.
-   **Request Body (JSON):**
    ```json
    {
        "email": "Your original email content here...",
        "tone": "professional"
    }
    ```
    -   `email` (string, required): The email text to be rewritten.
    -   `tone` (string, optional, default: "professional"): The desired tone for the rewritten email (e.g., "formal", "casual", "friendly").
-   **Response Body (JSON):**
    On success (HTTP 200):
    ```json
    {
        "original": "Your original email content here...",
        "rewritten": "The rewritten email content by Gemini API...",
        "tone": "professional"
    }
    ```
    On error (e.g., HTTP 400 for missing email, HTTP 500 for API errors):
    ```json
    {
        "error": "Error message describing the issue"
    }
    ```
-   **Underlying Mechanism:** This endpoint constructs a prompt using the provided email and tone, then calls the Google Gemini Pro model (`gemini-pro`) to generate the rewritten version of the email. The `GEMINI_API_KEY` environment variable must be correctly configured for this to work.

## Contributing

Details on how to contribute to the project will be added here.

## License

Information about the project's license will be added here. If you plan to use or contribute to this project, please ensure you add an appropriate open-source license file (e.g., MIT, Apache 2.0).
