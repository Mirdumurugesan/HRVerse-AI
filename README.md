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

## Screenshots

> Add screenshots to a `screenshots/` folder before final submission.

| Page | File |
|------|------|
| Admin Dashboard | `screenshots/dashboard-admin.png` |
| HR Dashboard | `screenshots/dashboard-hr.png` |
| Resume Screening | `screenshots/resume-screening.png` |
| Video Interview Analysis | `screenshots/interview-analysis.png` |
| Analytics | `screenshots/analytics.png` |
| Employee Directory | `screenshots/employees.png` |
| Attendance | `screenshots/attendance.png` |
| Payroll | `screenshots/payroll.png` |
| AI Assistant | `screenshots/ai-assistant.png` |

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

## FWC Hackathon Compliance

This section maps every FWC JD requirement to the exact implementation in HRVerse AI.

| # | Requirement | Implementation | Key Files |
|---|-------------|---------------|-----------|
| 1 | **AI Resume Screening** | Groq LLaMA-3.3-70B scores PDF/DOCX on skills, experience, education, communication. Returns structured JSON: score 0–100, strengths[], weaknesses[], recommendation (Shortlisted/Consider/Rejected). | `aiService.js → analyzeResume()` `resumeController.js` `ResumeScreening.jsx` |
| 2 | **AI Video Interview Analysis** | 5-dimension scoring: communication, confidence, technical depth, sentiment, body language (each 0–100). Aggregated overallScore. AI-generated textual insights. | `aiService.js → analyzeInterview()` `interviewController.js` `InterviewAnalysis.jsx` |
| 3 | **Analytics Dashboard** | 12 analytics API endpoints. Charts: hiring funnel (bar), skill distribution (bar), score distribution (bar), attendance trends (line), payroll trends (line), performance distribution (bar), interview analytics. CSV export. | `analyticsRoutes.js` `analyticsController.js` `Analytics.jsx` |
| 4 | **Onboarding Workflow** | 7-step structured pipeline: Offer Letter Signed → IT Asset Allocation → System Access → Training Enrollment → Buddy Assignment → Bond Signing → Team Introduction. % completion per employee. | `Onboarding.js` `onboardingController.js` `Onboarding.jsx` |
| 5 | **Multi-User Login + RBAC** | 4 roles: Admin, Manager, HR, Employee. JWT-based stateless auth. Every route protected by `protect` middleware with DB-backed user lookup + `authorize(...roles)` factory. Frontend RoleGuard prevents unauthorised page access. | `rbac.js` `authController.js` `RoleGuard.jsx` `App.jsx` |
| 6 | **AI Assistant** | LLaMA-3.3-70B chatbot with HR-specific system prompt. Markdown-rendered responses. Supports queries about employees, payroll, candidates, attendance, HR policy. | `aiAssistantController.js` `aiAssistantRoutes.js` `AIAssistant.jsx` |
| 7 | **Attendance Management** | 300,000+ records. Daily summary with present/absent/WFH/rate. Check-in and check-out times. Late arrival detection with `lateMinutes`. Statuses: Present/Absent/Half Day/Leave. | `Attendance.js` `attendanceController.js` `AttendanceReplica.jsx` |
| 8 | **Payroll Processing** | 30,000+ records. Anomaly detection flag. Status lifecycle: Pending → Processed → Paid. Payroll total and trend analytics. Department-level breakdowns. | `Payroll.js` `payrollController.js` `Payroll.jsx` |
| 9 | **Performance Reviews** | 30,000+ quarterly reviews. AI score per review. PIP tracking (reason, progress %, start date). Promotion-ready flag for scores ≥ 90. Quarter-over-quarter trend charts. | `Performance.js` `performanceController.js` `Performance.jsx` |
| 10 | **Scalability (5000+ employees)** | 15,000 employees, 300,000+ attendance, 30,000+ payroll/performance. All list endpoints paginated. MongoDB aggregation pipelines for KPIs (no in-memory full-table scans). Atlas auto-scales. | `seedAll.js`, all paginated controllers |

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

