# HRVerse AI

> **Enterprise-grade AI-powered HR Management System built for the FWC Hackathon**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com)
[![AI](https://img.shields.io/badge/AI-Groq_LLaMA_3.3_70B-FF6B35)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## Project Overview

HRVerse AI is a full-stack enterprise HR platform that replaces manual HR processes with an AI-driven pipeline. It automates resume screening, conducts video interview analysis, manages the complete employee lifecycle, and provides real-time analytics — all powered by Groq LLaMA-3.3-70B.

The system is built to scale beyond 15,000+ employees with 300,000+ attendance records in production, and demonstrates every capability required by the FWC JD specification.

---

## Features

### Core HR Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Role-specific dashboards for Admin, Manager, HR, and Employee with real-time KPIs |
| **Candidate Management** | Full applicant tracking with AI scoring, paginated search, and pipeline stages |
| **Employee Management** | 15,000+ employee directory with search, pagination, and KPI aggregations |
| **Attendance** | 300,000+ attendance records with daily summaries, WFH tracking, and late-arrival detection |
| **Payroll** | 30,000+ payroll records with anomaly detection, trend charts, and department breakdowns |
| **Performance** | 30,000+ reviews with PIP tracking, promotion readiness, and quarterly trend charts |
| **Leave Management** | Leave requests with approval workflow, calendar view, and on-leave-today counter |
| **Onboarding** | 7-step onboarding pipeline with real-time progress tracking per employee |
| **Notifications** | Role-targeted notification system covering all 9 event types |

### AI Features

| Feature | Description |
|---------|-------------|
| **AI Resume Screening** | Uploads PDF/DOCX resumes, extracts text, sends to Groq LLaMA-3.3-70B for structured scoring |
| **AI Video Interview Analysis** | Uploads interview videos, AI evaluates communication, confidence, technical depth, sentiment, and body language |
| **AI Assistant** | Natural-language chatbot answering HR queries with live database context |
| **AI Workforce Forecast** | Aggregation-based forecast: high performers, leadership pipeline, upskilling needs |
| **AI Payroll Anomaly Detection** | Flags statistical outliers in payroll data in real time |

---

## AI Architecture

```
Resume / Video Input
        │
        ▼
Text Extraction (pdf-parse / mammoth)
        │
        ▼
Groq LLaMA-3.3-70B  ◄─ PRIMARY (~2s inference)
        │  on failure
        ▼
OpenRouter meta-llama/llama-3.3-70b  ◄─ SECONDARY fallback
        │  on failure
        ▼
Keyword-based scoring fallback  ◄─ TERTIARY (always available)
```

No Gemini. No OpenAI. The AI chain is entirely open-source model-based.

---

## Tech Stack

### Frontend
- **React 19** — latest concurrent rendering
- **Vite 8** — sub-second HMR, optimised production builds
- **React Router 7** — client-side routing with role guards
- **Recharts 3** — responsive charts with dark theme
- **Pure CSS** — zero framework dependency, custom design system

### Backend
- **Node.js + Express 5** — async route handlers
- **Mongoose 9** — schema-validated MongoDB ODM
- **JWT** (jsonwebtoken) — stateless authentication
- **bcryptjs** — password hashing (salt 10)
- **Multer 2** — file uploads up to 200MB
- **Helmet** — 11 security headers
- **pdf-parse + mammoth** — document text extraction

### Database
- **MongoDB Atlas** — cloud-hosted, globally distributed
- **Collections**: Users, Employees, Candidates, Attendance, Payroll, Performance, Leave, Onboarding, Interviews, Notifications, AuditLog

### AI / ML
- **Groq API** — primary LLM provider (LLaMA-3.3-70B, ~2s inference)
- **OpenRouter** — secondary fallback provider

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│               CLIENT  (React 19 + Vite)                  │
│  Login → RoleGuard → Sidebar → Pages → apiFetch()        │
└──────────────────────┬───────────────────────────────────┘
                       │  HTTP REST  (JWT Bearer token)
┌──────────────────────▼───────────────────────────────────┐
│             SERVER  (Express 5 + Mongoose)               │
│  protect() → authorize(roles) → controller → model       │
│                                                          │
│  17 route files · 16 controllers · 11 Mongoose models    │
└──────────────────────┬───────────────────────────────────┘
                       │  Mongoose ODM
┌──────────────────────▼───────────────────────────────────┐
│                  MongoDB Atlas                           │
│  Indexes: _id, email, status, employeeId, date, dept     │
└──────────────────────┬───────────────────────────────────┘
                       │  HTTPS
┌──────────────────────▼───────────────────────────────────┐
│              Groq  LLaMA-3.3-70B                         │
│  Resume scoring · Interview analysis · AI Assistant       │
└──────────────────────────────────────────────────────────┘
```

---

## Database Design

| Collection | Records | Key Fields |
|-----------|---------|-----------|
| Users | 15+ | name, email, password(hashed), role, employeeProfileId |
| Employees | 15,000+ | employeeId, name, department, location, salary, performanceScore, status |
| Candidates | 6,000+ | name, email, skills, aiScore, recommendation, status, appliedRole |
| Attendance | 300,000+ | employeeId, date, status, checkIn, checkOut, workMode, isLate |
| Payroll | 30,000+ | employeeId, basicSalary, bonus, deductions, netSalary, anomaly, status |
| Performance | 30,000+ | employeeId, quarter, rating, aiScore, pip, promotionReady |
| Leave | 24,000+ | employeeId, startDate(string), endDate(string), leaveType, status |
| Onboarding | 3,000+ | employeeId, steps[7], completionPercent, status |
| Interviews | 600+ | candidateName, video, scores[5], overallScore, recommendation, status |
| Notifications | 125+ | role, type, message, read, createdAt |

### RBAC Matrix

| Route | Admin | Manager | HR | Employee |
|-------|:-----:|:-------:|:--:|:--------:|
| Dashboard | ✅ full | ✅ team | ✅ recruitment | ✅ personal |
| Candidates | ✅ | ❌ | ✅ | ❌ |
| Interviews | ✅ | ❌ | ✅ | ❌ |
| Resume Screening | ✅ | ❌ | ✅ | ❌ |
| Employees | ✅ | ✅ | ✅ | ❌ |
| Attendance | ✅ | ✅ | ✅ | ❌ |
| Onboarding | ✅ | ✅ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ❌ |
| Payroll | ✅ | ✅ | ❌ | ❌ |
| Performance | ✅ | ✅ | ❌ | ❌ |
| Leave | ✅ | ✅ | ✅ | ✅ own |
| My Portal | ❌ | ❌ | ❌ | ✅ |
| AI Assistant | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |

---

## Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/HRVerse-AI.git
cd HRVerse-AI
```

### 2. Install dependencies
```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Configure environment
```bash
cd server
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, and GROQ_API_KEY
```

### 4. Seed the database
```bash
cd server
node seedAll.js
# Prints a before/after count table for all 10 collections
# Safe to re-run — idempotent, only tops up what is missing
```

### 5. Start the application
```bash
# Terminal 1 — backend (port 5000)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | Long random secret for signing JWTs |
| `GROQ_API_KEY` | **Yes** | Groq API key for LLaMA-3.3-70B |
| `OPENROUTER_API_KEY` | No | Optional secondary AI fallback |
| `CLIENT_URL` | No | Production CORS origin |

---

## Demo Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **Admin** | admin@fwc.com | Admin@123 | Full system — all modules |
| **Manager** | manager@fwc.com | Manager@123 | Team, payroll, performance, analytics |
| **HR** | hr@fwc.com | HR@123 | Recruitment, onboarding, attendance, analytics |
| **Employee** | *(first seeded employee)* | Employee@123 | My Portal, leave, AI assistant |

---

## Scalability Metrics

| Metric | Value |
|--------|-------|
| Employees in DB | 15,000+ |
| Attendance records | 300,000+ |
| Payroll records | 30,000+ |
| Performance reviews | 30,000+ |
| Leave records | 24,000+ |
| Onboarding records | 3,000+ |
| Candidates | 6,000+ |
| Interviews | 600+ |
| API pagination | Configurable, default 25–50/page |
| Concurrent users | Stateless JWT — horizontal scaling ready |
| AI response time | ~2s Groq primary, ~5s OpenRouter fallback |

---

## Responsive Design

| Breakpoint | Layout Behaviour |
|-----------|----------------|
| > 1300px | Full 220px sidebar + 4-column KPI grid |
| 1000–1300px | 2-column KPI grid, stacked content rows |
| 768–1000px | Collapsed 64px icon-only sidebar rail |
| < 768px | Slide-in hamburger drawer, single-column layout |
| < 480px | Compact card padding, reduced font sizes |

---

## Future Enhancements

- Email notifications via SendGrid
- Real-time updates with WebSocket / Socket.io
- PDF generation for offer letters and payslips
- Calendar integration for interview scheduling
- React Native mobile companion app
- Predictive attrition modelling with time-series data
- Google / Microsoft SSO integration
- Searchable audit log viewer UI
- Multi-tenancy with organisation-level data isolation

---

## Security

- Passwords hashed with bcryptjs (salt rounds: 10)
- JWT tokens signed with `JWT_SECRET` env variable — no secrets in code
- `server/.env` excluded from git via `.gitignore`
- Helmet middleware sets security headers (X-Frame-Options, X-Content-Type, etc.)
- CORS restricted to explicit origin allowlist
- Multer validates file MIME types before processing
- No secrets in repository history — see `server/.env.example` for safe template

---

## Project Structure

```
HRVerse-AI/
├── client/                       # React 19 + Vite frontend
│   └── src/
│       ├── App.jsx               # Router + role guards
│       ├── App.css               # Complete design system (1200 lines)
│       ├── context/
│       │   └── AuthContext.jsx   # JWT auth context + apiFetch helper
│       └── components/
│           ├── Dashboard.jsx     # 4-role dashboard router
│           ├── Candidates.jsx    # Paginated candidate table
│           ├── Employees.jsx     # Employee directory + live KPIs
│           ├── Analytics.jsx     # 12-chart analytics page
│           ├── AttendanceReplica.jsx
│           ├── Payroll.jsx
│           ├── Performance.jsx
│           ├── Leave.jsx
│           ├── Onboarding.jsx
│           ├── Interviews.jsx    # Interview results table
│           ├── ResumeScreening.jsx   # AI resume upload + scoring
│           ├── InterviewAnalysis.jsx # AI video analysis
│           ├── AIAssistant.jsx   # LLaMA chatbot
│           ├── Notifications.jsx
│           └── EmployeePortal.jsx    # Employee self-service portal
│
├── server/                        # Express 5 API
│   ├── server.js                  # App entry point + route mounts
│   ├── config/db.js               # MongoDB Atlas connection
│   ├── middleware/rbac.js         # protect() + authorize() middleware
│   ├── models/                    # 11 Mongoose schemas
│   ├── routes/                    # 17 route files
│   ├── controllers/               # 16 controllers
│   ├── services/aiService.js      # Groq → OpenRouter → fallback chain
│   ├── seedAll.js                 # Master idempotent seed script
│   ├── seed.js                    # User account seed script
│   └── .env.example               # Safe environment template
│
├── .gitignore                     # Excludes .env, node_modules, dist
└── README.md
```

---

## License

MIT — free to use, modify, and distribute.

---

