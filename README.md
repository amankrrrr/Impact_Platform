## Unified Impact Platform (Full‑Stack)

Project title: **A Unified Digital Platform for Bridging the Gap between NGOs, Corporate Donors, and Individual Contributors**

This repository contains:
- **Backend**: Flask REST API gateway (`backend/app.py`) + SQLite DB via SQLAlchemy
- **AI/ML engine**: Pandas/NumPy/scikit‑learn matching + fairness adjustment (`backend/ml_engine/fairness_matching.py`)
- **Frontend**: React SPA (CDN) served as static files (`frontend/index.html`)

---

## Requirements

- **Python 3.9+** (recommended)
- Internet connection (frontend loads React from CDN)

---

## How to run (Windows PowerShell)

### 1) Start the backend API

Open PowerShell in the project root:

```powershell
cd "c:\Users\Administrator\Desktop\fyp_website\fyp"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\backend\requirements.txt
python .\backend\app.py
```

Backend will run at **`http://127.0.0.1:5000`** and automatically create a local SQLite DB file named `platform.db`.

### 2) Start the frontend (static server)

Open a **second** PowerShell window:

```powershell
cd "c:\Users\Administrator\Desktop\fyp_website\fyp\frontend"
python -m http.server 5173
```

Now open the app in your browser:
- **`http://127.0.0.1:5173`**

---

## Pages (SPA routes)

The app uses hash routes:
- `#/home` – Landing page
- `#/login` – Login + Registration
- `#/ngo-portal` – NGO dashboard (NGO role only)
- `#/donor-portal` – Donor dashboard (Corporate/Individual only)
- `#/ai-matching` – AI Matching (Corporate/Individual only)
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

