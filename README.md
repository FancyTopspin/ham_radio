# 📻 Ham Radio Prep — FCC Amateur Radio License Exam Preparation Platform

[![Live App](https://img.shields.io/badge/🌐_Live_Website-hamradio.privatedns.org-2563eb?style=for-the-badge&logo=google-chrome&logoColor=white)](https://hamradio.privatedns.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-61dafb?logo=react)](frontend/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Backend-Django%205%20%7C%20Django%20Ninja-092e20?logo=django)](backend/)
[![IndexedDB](https://img.shields.io/badge/Offline--First-Dexie.js%20(IndexedDB)-purple)](https://dexie.org/)
[![FCC / NCVEC Pools](https://img.shields.io/badge/Question%20Pools-Technician%20%7C%20General%20%7C%20Extra-green)](#license-question-pools-covered)

---

### 🌐 Live Web Application

> ### 🔗 Access the Live App: [**https://hamradio.privatedns.org**](https://hamradio.privatedns.org)
>
> **Instant Browser Access** — Study the complete official FCC question pools directly in your browser with zero setup, full offline support, and automatic cloud progress synchronization.

---

A modern, high-performance, offline-first web platform engineered to help candidates prepare for and pass all three tiers of the **United States Federal Communications Commission (FCC) Amateur Radio Service** examinations. 

Built with **React 18, TypeScript, Tailwind CSS, Dexie.js, Django 5, and Django Ninja REST API**, the application delivers zero-friction learning through structured syllabus lessons, conceptual explanations, spaced repetition, smart choice shuffling, and official blueprint mock exams.

---

## 🎯 License Question Pools Covered

The application includes the complete, official **National Council of Volunteer Examiner Coordinators (NCVEC)** question pools with all question codes, diagrams, answer keys, and rule citations:

| License Tier | Exam Element | Official Pool Cycle | Total Questions in Pool | Exam Length | Passing Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Technician Class** | Element 2 | 2022 – 2026 | **412** questions | 35 questions | **26 / 35 (74%)** |
| **General Class** | Element 3 | 2023 – 2027 | **429** questions | 35 questions | **26 / 35 (74%)** |
| **Amateur Extra Class** | Element 4 | 2024 – 2028 | **618** questions | 50 questions | **37 / 50 (74%)** |

---

## 🚀 Key Features

### 1. Structured Topic & Lesson Curriculum
- **Official FCC Syllabus Hierarchy**: Questions are systematically categorized into FCC **SubElements** (e.g., `E1 Commission Rules`, `E2 Operating Procedures`) and subdivided into **SubGroup Lessons** (e.g., `Lesson 1: E1A Frequency Privileges`, `Lesson 2: E1B Operating Rules`).
- **Circular Mastery Gauges**: Visual circular progress rings (`0%` to `100%`) for every individual lesson, mirroring top mobile learning applications.
- **Instant Search & Filter**: Filter lessons by SubElement or search dynamically by keyword (e.g., *Satellite*, *Propagation*, *Smith Chart*).
- **Official Schematic & Circuit Diagrams**: High-resolution diagrams (Figures T-1..T-3, G7-1, E5-1..E9-3) rendered directly in study cards, practice quizzes, and blueprint mock exams, with Django Admin manual upload override support.

### 2. Dual Learning Modes
- 📖 **Read & Study Mode (Passive Review)**:
  - Browse questions within any topic with the **correct answer pre-selected and highlighted in green** with a `✓ Correct Answer` pill.
  - Comprehensive **conceptual explanations, formula derivations, schematic figures, and FCC Part 97 rule citations** are displayed directly underneath each question.
  - **View Flexibility**: Toggle seamlessly between **Full Scrollable List** and **Card-by-Card** step view (with keyboard arrow shortcuts).
- ✏️ **Interactive Practice Quiz (Active Recall)**:
  - Practice questions one-by-one with smart choice position shuffling.
  - **Instant Feedback**: Immediate visual confirmation (green/red) upon clicking an answer.
  - Streak tracking, live mastery advancement, and comprehensive summary screens upon completing each lesson.

### 3. Smart Spaced Repetition System (SRS)
- **4-Stage Mastery Buckets**: Tracks question mastery across `Unseen`, `Needs Work`, `Learning`, and `Mastered`.
- **Promotion / Demotion Logic**: 2 consecutive correct answers advance a question to the next mastery tier; a single incorrect answer demotes it.
- **7-Day Retention Decay**: Automatically reintroduces mastered questions into the learning queue after 7 days without practice to prevent forgetting.
- **Customizable Focus Presets**: Switch between *Balanced (50% Review, 30% Learning, 20% New)*, *Learn New (70% Unseen)*, or *Review Weaknesses (80% Needs Work)*.

### 4. Official Blueprint Mock Exams
- **Strict FCC VEC Quotas**: Generates realistic practice exams selecting exactly 1 question per SubGroup according to official NCVEC syllabus formulas (35 questions for Tech/General, 50 questions for Extra).
- **Exam Features**: Timed countdown clock, color-coded question navigator palette, question flagging for review, instant scoring, and pass/fail assessment.

### 5. 🔥 Daily 5-Question Challenge & Streak Engine
- **Deterministic Daily Blitz**: 5 distinct questions drawn daily across diverse syllabus subelements for each license pool, ensuring quick, consistent habit formation.
- **Daily Streak Tracking**: Animated streak flame (`🔥 1 Day`, `🔥 7 Days`, etc.), longest streak record, and daily XP bonuses (+50 XP).
- **Instant Mastery Integration**: Answers seamlessly feed into the Leitner SRS engine and mistake drills.

### 6. 🏆 Community Leaderboard & Amateur Callbook
- **National Rankings**: Compete with fellow amateur radio candidates and licensed operators across the nation based on **Total XP**, **Questions Mastered**, or **Daily Streak**.
- **Amateur Radio Callsigns**: Operators can register or customize their FCC Callsign (e.g., `W1AW`, `KC3WSO`) or custom Elmer handle.
- **Top 3 Podium & Standing Banner**: Displays gold, silver, and bronze podium finishers with avatar badges and a persistent personal rank banner.
- **Multi-Class Filtering**: Filter standings by `All Pools`, `Technician`, `General`, or `Amateur Extra`.

### 7. Mistakes Queue & Weak-Spot Isolation
- Any missed question is automatically isolated into a dedicated **Mistakes Queue**.
- Questions remain in the drill queue until answered correctly **twice consecutively**, ensuring stubborn knowledge gaps are eradicated.

### 8. Offline-First Architecture & Cloud Sync
- **Local IndexedDB Hydration**: Powered by **Dexie.js**. Complete question pools, choices, and explanations are hydrated locally, enabling lightning-fast, latency-free practice even without an internet connection.
- **Background Cloud Synchronization**: Automatically syncs question attempts and study states with the Django backend whenever connectivity is restored.

### 9. Google OAuth & Account Management
- **Single Sign-On (SSO)**: One-click registration and sign-in via **Google OAuth 2.0** (`django-allauth`), alongside standard username/password authentication.

### 10. Multi-Channel Feedback & Community System
- In-app feedback system for reporting typos, question inaccuracies, or feature requests.
- "I Passed My Exam!" celebration flow for sharing success stories.

### 11. Printable VE Handout Flyer (PDF)
- Automatically generated 1-page printable PDF flyer with QR codes, licensing checklist, and local club notes for Volunteer Examiners (VEs) and ham radio club events.

---

## 🛠️ Architecture & Tech Stack

```
ham_radio_web_app/
├── backend/                  # Django 5 backend & Ninja REST API
│   ├── config/               # Settings, WSGI, URLs, Ninja API router
│   ├── core/                 # Auth, custom allauth adapters, feedback models
│   ├── questions/            # Pool models, SubElements, SubGroups, syllabus API
│   ├── study/                # Spaced repetition, attempt logging, sync API
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React 18 SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── components/       # CircularProgress, StudyCard, Navbar, Modals
│   │   ├── context/          # AppContext global state provider
│   │   ├── db/               # Dexie.js IndexedDB schema & pool hydration
│   │   ├── engine/           # Shuffler, SRS engine, Topic curriculum engine
│   │   ├── pages/            # DashboardView, TopicsView, TopicStudyView, MockExamView
│   │   └── types/            # TypeScript data models
│   └── package.json
└── scripts/                  # Pool scrapers, VE flyer generator
```

### Technology Highlights
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Dexie.js (IndexedDB), KaTeX (LaTeX math rendering), Lucide Icons, Canvas Confetti.
- **Backend**: Python 3.12, Django 5, Django Ninja (fast OpenAPI/Pydantic endpoints), django-allauth (OAuth2), PyJWT, Cryptography, SQLite / MySQL via `dj-database-url`.
- **Infrastructure**: Gunicorn, Nginx reverse proxy with HTTP/2 and SSL/TLS, systemd daemon service, GoAccess real-time analytics.

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/FancyTopspin/ham_radio.git
cd ham_radio
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# (Optional) Create superuser
python manage.py createsuperuser

# Start Django development server
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will run on `http://localhost:5173`, with proxy routing to the Django backend on `http://localhost:8000`.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

### Attribution
Amateur Radio question pools, figures, and syllabus outlines are released by the **National Council of Volunteer Examiner Coordinators (NCVEC)** into the public domain under Title 47 of the Code of Federal Regulations (47 CFR Part 97).
