# Unified Impact Platform (Full‑Stack)

**A Unified Digital Platform for Bridging the Gap between NGOs, Corporate Donors, and Individual Contributors**

## 🚀 About the Project
This project is a comprehensive, full-stack digital platform designed to seamlessly connect NGOs with potential corporate and individual donors. By leveraging a custom NLP-powered recommendation engine and real-time analytics, it solves the visibility gap for underrepresented NGOs and guides donors toward high-impact philanthropic investments. The platform features an AI matchmaking system that applies a fairness-adjustment algorithm to recommend NGOs without bias, an interactive networking & social feed layout, and a smart chatbot that utilizes local processing and LLM APIs to answer questions and analyze funding targets.

## 💻 Tech Stack
- **Backend Framework:** Python, Flask (RESTful architecture)
- **Frontend Stack:** React (SPA served via CDN), HTML, CSS, JavaScript
- **Database:** SQLite with SQLAlchemy ORM
- **Machine Learning & AI:** 
  - Scikit-Learn, Pandas, NumPy (Matching engine & Fairness adjustments)
  - Sentence Transformers / Sentence-BERT (Semantic search & text embeddings)
- **LLM Integrations:** Groq API, Google Gemini API, OpenAI API (NLP Chatbot)
- **Data Engineering:** Automated web scraping pipelines (Crisis Scraper) for real-time relevance

## ✨ Key Features
- **AI Matching Engine:** Generates data-driven NGO recommendations matching a donor’s budget, sector, and region. Applies a fairness multiplier algorithm to surface underfunded organizations compared to the sector median.
- **Smart NLP Chatbot:** Context-aware assistant utilizing Groq / Gemini / OpenAI to answer complex questions about NGO catalogs, compare countries/sectors, and serve as an interactive guide. Implements a smart fallback engine if APIs are unreachable.
- **Interactive Social Feed:** Built-in networking directory allowing users to Follow organizations, Post updates, Like, Share, and Comment. 
- **Real-Time Analytics Dashboard:** Tracks donor contributions and displays analytical charts on platform-wide funding and sector-level impact.
- **Gamification:** Rewards users with impact badges and an integrated leaderboard system for top contributors.
- **Role-Based Portals:** Dedicated dashboards for NGOs (campaign management) and Donors (discovery & matching).

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.9+** (recommended)

### Recommended: Single Command for Full Stack
Open PowerShell in the project root:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\backend\requirements.txt
python .\main.py
```
This starts **both** the backend API and the React SPA from a single process at: **`http://127.0.0.1:5000`**

### Chatbot Setup (Optional)
To enable the full AI responses and complex comparisons, set your API keys:
```powershell
$env:GROQ_API_KEY = "your_actual_api_key_here"
# OR
$env:GOOGLE_API_KEY = "your_actual_api_key_here"
```

---

## 📄 Resume Snippets
*If you are looking to add this project to your resume, here are a few ways to format it based on your desired focus:*

**Option 1: General / Full-Stack Focus**
> **Unified Impact Platform** | *Python, Flask, React, SQLite, Scikit-learn, LLMs*
> - Engineered a full-stack digital platform connecting NGOs and donors using a React SPA and Flask REST API.
> - Developed a fairness-aware AI matchmaking system utilizing Scikit-Learn, Pandas, and Sentence-BERT to generate unbiased, data-driven NGO recommendations for donors.
> - Built an NLP-powered chatbot integrating Groq/LLM APIs and a custom query engine to help users discover NGOs, compare sectors, and analyze impact.

**Option 2: AI & Data Science Focus**
> **AI-Powered Philanthropy Matchmaking Engine** | *Python, Scikit-Learn, Sentence-BERT, NLP, Groq API*
> - Designed and deployed a machine learning recommendation engine to match corporate donors with relevant NGOs based on semantic similarity and historical data.
> - Developed a fairness-adjustment algorithm to ensure unbiased distribution of donor funds, mitigating recommendation echo chambers.
> - Integrated conversational AI utilizing Groq/Gemini APIs with localized custom NLP query processing to handle dynamic semantic searches.
> - Built a data ingestion pipeline to dynamically fetch real-time global crisis data, feeding it directly into the matching models.

---

## 🛤️ Application Structure (SPA Routes)
The app uses hash-based routing:
- `#/home` – Landing page with chatbot widget
- `#/login` – Authentication (Login / Register) roles
- `#/ngo-portal` – Dashboard for NGO campaign management
- `#/donor-portal` – Discovery portal featuring AI Matchmaking 
- `#/networking` – Directory to follow/unfollow and browse NGOs
- `#/social-feed` – Feed to create and engage with posts
- `#/gamification` – Badges & impact leaderboards
- `#/analytics` – Funding dashboards and charts


