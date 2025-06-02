# ✉️ Smart Email Rewriter

An AI-powered tool that takes a rough or generic email and rewrites it in different tones—friendly, concise, professional, action-oriented—using Google's Gemini API.

## 🧹 Features

* Enter a plain-text email
* Choose a tone (e.g., Friendly, Concise, Professional, Action-Oriented)
* Submit to backend via REST API
* Receive a rewritten version with the same intent but adjusted style
* Clean, fast, local deployment (React + Python)

---

## 🛠️ Tech Stack

* **Frontend:** React + Axios + TailwindCSS
* **Backend:** Python (Flask)
* **AI Model:** Google Gemini API (`gemini-pro`)
* **Auth:** API Key (via env)

---

## 🚀 Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/email-rewriter-ai.git
cd email-rewriter-ai
```

### 2. Backend Setup (Python + Gemini)

#### Requirements

* Python 3.9+
* `pip install -r backend/requirements.txt`

#### Environment Variables

Create a `.env` file in `/backend` (use the provided `.env.example` as a template):

```env
GEMINI_API_KEY=your_api_key_here
```

#### Run Backend

```bash
cd backend
python app.py
```

The backend will be available at http://localhost:5000

### 3. Frontend Setup (React)

#### Requirements

* Node.js 18+
* Install dependencies from `/frontend` folder

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

---

## 🔄 Example Flow

1. User enters:

   ```
   Dear Customer, your subscription has expired. Please update payment details.
   ```
2. Chooses tone: `Friendly`
3. Gets result:

   ```
   Hey there! Just a heads-up—your subscription's expired. Update your payment info to keep things rolling. Cheers!
   ```

---

## 📁 Project Structure

```
/email-rewriter-ai
├── /frontend         # React app
│   ├── src/          # React components and logic
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── /backend          # Flask app
│   ├── app.py        # Main Flask application with Gemini API integration
│   ├── .env.example  # Template for environment variables
│   └── requirements.txt # Python dependencies
└── README.md        # Project documentation
```

---

## ✅ Future Enhancements

* Add user authentication
* Implement email templates
* Add grammar and spelling checks
* Support for multiple languages
* History of previous rewrites
* Customizable tone settings

---

## 📜 License

MIT – free to use and build on.

---

## 🤖 Credits

Built using:

* [Google Gemini API](https://ai.google.dev/)
* [React](https://reactjs.org/)
* [Flask](https://flask.palletsprojects.com/)
* [TailwindCSS](https://tailwindcss.com/)

