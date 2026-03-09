## Unified Impact Platform (Full‑Stack)

Project title: **A Unified Digital Platform for Bridging the Gap between NGOs, Corporate Donors, and Individual Contributors**

This repository contains:
- **Backend**: Flask REST API gateway (`backend/app.py`) + SQLite DB via SQLAlchemy
- **AI/ML engine**: Pandas/NumPy/scikit‑learn matching + fairness adjustment (`backend/ml_engine/fairness_matching.py`)
- **Frontend**: React SPA (CDN) served as static files (`frontend/index.html`)
- **Chatbot**: AI-powered assistant using LLM APIs for NGO information

---

## Features

- **NGO Catalog**: Browse and search NGOs by sector, location, and mission
- **AI Matching**: Fairness-aware recommendations for donors
- **Social Features**: Posts, comments, likes, and networking
- **Analytics Dashboard**: Track impact and contributions
- **Chatbot**: Ask questions about NGOs and get AI-powered recommendations

---

## Requirements

- **Python 3.9+** (recommended)
- Internet connection (frontend loads React from CDN)
- **API Key** (optional): Set `GOOGLE_API_KEY` or `OPENAI_API_KEY` for full chatbot functionality

---

## Chatbot Setup

The chatbot is integrated into the home page with a chat icon (💬) in the bottom-right corner.

### Features:
- **No API Key Required**: Basic queries about specific NGOs work without setup
- **Smart Fallback**: If AI API fails, it searches the NGO catalog directly
- **Country Queries**: Ask about NGOs in specific countries (e.g., "India vs New Zealand")
- **Comparison Support**: Handle "vs" queries for comparing countries or sectors
- **AI-Powered**: With API keys, provides intelligent responses

### To enable full AI responses:

1. **Google Gemini API** (recommended):
   ```powershell
   $env:GOOGLE_API_KEY = "your_actual_api_key_here"
   ```

2. **OpenAI API**:
   ```powershell
   $env:OPENAI_API_KEY = "your_api_key_from_openai"
   ```

Get API keys from:
- [Google AI Studio](https://makersuite.google.com/app/apikey) for Gemini
- [OpenAI Platform](https://platform.openai.com/api-keys) for GPT

**Without API keys, you can still ask about specific NGOs like "What is the sector of Divya Deepa Charitable Trust?" or "India vs New Zealand"**
- [OpenAI Platform](https://platform.openai.com/api-keys) for GPT

---

## How to run (Windows PowerShell)

### Recommended: single command for full stack

Open PowerShell in the project root:

```powershell
cd "c:\Users\Administrator\Desktop\fyp_website\fyp"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\backend\requirements.txt
python .\main.py
```

This starts **both** the backend API and the React SPA from a single Flask process at:

- **`http://127.0.0.1:5000`**

You can now open the browser directly at `http://127.0.0.1:5000` and use the app.

### Legacy (two-process) setup

If you prefer to keep backend and frontend servers separate, you can still use:

```powershell
# Window 1: backend API
cd "c:\Users\Administrator\Desktop\fyp_website\fyp"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\backend\requirements.txt
python .\backend\app.py

### Recommended: single command for full stack

Open PowerShell in the project root:

```powershell
cd "c:\Users\Administrator\Desktop\fyp_website\fyp"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\backend\requirements.txt
python .\main.py
```

This starts **both** the backend API and the React SPA from a single Flask process at:

- **`http://127.0.0.1:5000`**

You can now open the browser directly at `http://127.0.0.1:5000` and use the app.

### Legacy (two-process) setup

If you prefer to keep backend and frontend servers separate, you can still use:

```powershell
# Window 1: backend API
cd "c:\Users\Administrator\Desktop\fyp_website\fyp"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\backend\requirements.txt
python .\backend\app.py

# Window 2: static frontend
cd "c:\Users\Administrator\Desktop\fyp_website\fyp\frontend"
python -m http.server 5173
```

In this mode the backend runs at **`http://127.0.0.1:5000`** and the SPA is served at **`http://127.0.0.1:5173`**.

---

## Pages (SPA routes)

The app uses hash routes:
- `#/home` – Landing page
- `#/login` – Login + Registration
- `#/ngo-portal` – NGO dashboard (NGO role only)
- `#/donor-portal` – Donor dashboard with integrated AI Matching (Corporate/Individual only)
- `#/networking` – Networking directory (follow/unfollow NGOs)
- `#/social-feed` – Social feed (post, like, comment, share)
- `#/gamification` – Badges + sample leaderboard
- `#/analytics` – Funding analytics dashboards

---

## Quick demo steps

1) Go to `#/login` and **Register** an NGO account (Role: NGO).
2) Register a donor account (Role: Corporate Donor or Individual).
3) Login as NGO → go to **NGO Portal** → publish a few updates.
4) Login as donor → go to **Networking** → follow an NGO.
5) Go to **Social Feed** → like/comment/share NGO posts.
6) Go to **AI Matching** → enter sector/location/budget → click **Find NGOs**.
7) In the recommendations, click **Donate** to record a transaction.
8) Open **Analytics** to see sector and NGO totals update.

---

## Notes

- Authentication is intentionally lightweight for an academic prototype: the frontend stores the returned `token` (user id) and sends it in the `X-User-Id` header.
- The AI engine applies a fairness multiplier to underfunded NGOs by comparing each NGO’s funding to the **median funding within its sector** over the last 365 days.

