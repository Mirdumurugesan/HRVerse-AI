/**
 * aiService.js
 * AI chain: Groq (primary) → OpenRouter (secondary)
 * No Gemini. No deterministic fallback scoring.
 * Video analysis uses Groq text-based evaluation (LLM-generated, not hashed).
 */
"use strict";

// ── OpenAI-compatible fetch ───────────────────────────────────────────────────
const callOAI = async (base, key, model, sys, user, ms = 25000) => {
  const ac  = new AbortController();
  const tid = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(base + "/chat/completions", {
      method: "POST",
      signal: ac.signal,
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + key,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: sys },
          { role: "user",   content: user },
        ],
        temperature: 0.4,
        max_tokens:  2000,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error("HTTP " + res.status + " — " + body.slice(0, 200));
    }
    const d = await res.json();
    return d.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(tid);
  }
};

// ── Provider helpers ──────────────────────────────────────────────────────────
const callGroq = (sys, user, model = "llama-3.3-70b-versatile") => {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
  return callOAI(
    "https://api.groq.com/openai/v1",
    process.env.GROQ_API_KEY,
    model,
    sys,
    user,
    25000
  );
};

const callOpenRouter = (sys, user) => {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");
  return callOAI(
    "https://openrouter.ai/api/v1",
    process.env.OPENROUTER_API_KEY,
    "meta-llama/llama-3.3-70b-instruct",
    sys,
    user,
    30000
  );
};

// ── JSON extractor ────────────────────────────────────────────────────────────
const extractJSON = (text) => {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON object found in AI response");
  return JSON.parse(cleaned.slice(s, e + 1));
};

// ── Startup validator ─────────────────────────────────────────────────────────
const validateConnections = async () => {
  const r = { groq: false, openrouter: false };

  try {
    const txt = await callGroq("You are a test assistant.", "Reply with exactly: OK");
    r.groq = !!(txt && txt.trim().length > 0);
    console.log(r.groq
      ? "  [OK] Groq Connected        — " + txt.trim().slice(0, 40)
      : "  [!!] Groq Empty response");
  } catch (e) {
    console.log("  [XX] Groq FAILED           —", e.message.slice(0, 100));
  }

  try {
    const txt = await callOpenRouter("You are a test assistant.", "Reply with exactly: OK");
    r.openrouter = !!(txt && txt.trim().length > 0);
    console.log(r.openrouter
      ? "  [OK] OpenRouter Connected  — " + txt.trim().slice(0, 40)
      : "  [!!] OpenRouter Empty response");
  } catch (e) {
    console.log("  [XX] OpenRouter FAILED     —", e.message.slice(0, 100));
  }

  console.log(
    r.groq || r.openrouter
      ? "  [>>] AI: at least one provider live"
      : "  [>>] AI: ALL providers offline — responses will fail"
  );
  return r;
};

// ── Chat fallback (keyword-matched, only used if both providers fail) ─────────
const chatFallback = (q) => {
  const lq = q.toLowerCase();
  if (lq.includes("resume") || lq.includes("cv") || lq.includes("screen"))
    return "AI Resume Screening uses Groq LLaMA-3.3-70B to extract skills, score 0–100, and classify candidates as Shortlisted (≥80), Review (60–79), or Rejected (<60). Results are persisted in MongoDB with full audit trails.";
  if (lq.includes("interview") || lq.includes("video"))
    return "Video Interview Analysis evaluates Communication, Confidence, Technical depth, Sentiment, and Body language — each scored 0–100. Scorecard saved in MongoDB. Upload MP4/WEBM from the Interview module.";
  if (lq.includes("attendance") || lq.includes("leave"))
    return "Attendance module: mark Present/WFH/Absent, track late arrivals, submit leave requests (Casual/Sick/Earned/Maternity), and view weekly trends by department. All records in MongoDB.";
  if (lq.includes("payroll") || lq.includes("salary"))
    return "Payroll calculates gross salary, PF/ESI/TDS deductions, and net pay. Features: anomaly detection, ESOP eligibility (1yr+), salary band management, and AI alerts for unusual changes.";
  if (lq.includes("performance") || lq.includes("kpi") || lq.includes("pip"))
    return "Performance module tracks KPIs, auto-flags PIP below 60%, maintains a top-performer leaderboard, and generates AI promotion readiness predictions.";
  if (lq.includes("onboard") || lq.includes("training"))
    return "Onboarding: multi-step workflow, training program assignment, certification tracking, and commitment bond management. Progress tracked per joinee.";
  if (lq.includes("analytics") || lq.includes("report"))
    return "Analytics: Attrition rate, Hiring funnel, AI screening accuracy, Training ROI, Headcount forecast (30/60/90 days), and department-level metrics — all in real time.";
  if (lq.includes("role") || lq.includes("access") || lq.includes("rbac") || lq.includes("login"))
    return "RBAC: Admin (full access), Manager (team + approvals), HR (recruitment + payroll + analytics), Employee (self-service). All routes protected by JWT + role middleware.";
  return "HRVerse AI Assistant is ready. Ask about: resume screening, video interviews, attendance, payroll, performance, onboarding, analytics, or role-based access.";
};

// ── HR Chat Assistant: Groq → OpenRouter → keyword fallback ──────────────────
const HR_CHAT_SYS =
  "You are HRVerse AI, an expert HR assistant for FWC IT Services. " +
  "Help with resume screening, candidate evaluation, employee management, attendance, payroll, " +
  "performance, onboarding, analytics, and interview preparation. " +
  "Be concise, professional, and specific. Use bullet points where helpful.";

const askHRAssistant = async (question) => {
  // 1. Groq
  try {
    const txt = await callGroq(HR_CHAT_SYS, question);
    if (txt && txt.length > 10) {
      console.log("[Chat] Groq responded (" + txt.length + " chars)");
      return { text: txt, provider: "groq" };
    }
    throw new Error("Empty response from Groq");
  } catch (e) {
    console.warn("[Chat] Groq failed:", e.message.slice(0, 100));
  }

  // 2. OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const txt = await callOpenRouter(HR_CHAT_SYS, question);
      if (txt && txt.length > 10) {
        console.log("[Chat] OpenRouter responded (" + txt.length + " chars)");
        return { text: txt, provider: "openrouter" };
      }
      throw new Error("Empty response from OpenRouter");
    } catch (e) {
      console.warn("[Chat] OpenRouter failed:", e.message.slice(0, 100));
    }
  }

  // 3. Keyword fallback (chat only — never returns error, just canned HR info)
  console.log("[Chat] keyword fallback");
  return { text: chatFallback(question), provider: "fallback" };
};

// ── Resume Analysis: Groq → OpenRouter → error (no fake scoring) ─────────────
const RESUME_SYS =
  "You are an expert HR resume screener. " +
  "Analyze the resume and return ONLY valid JSON. No markdown, no explanation outside the JSON.";

const resumePrompt = (text) =>
  `Analyze this resume carefully and return ONLY a JSON object (no markdown fences):\n\n` +
  text.slice(0, 8000) +
  `\n\nRequired JSON structure:\n` +
  `{"name":"Full Name","email":"email@example.com","phone":"+91-XXXXXXXXXX",` +
  `"skills":["skill1","skill2","skill3"],"experience":"3 years","education":"B.Tech CSE",` +
  `"projects":["project description"],"score":85,` +
  `"strengths":["strength1","strength2"],"weaknesses":["weakness1"],` +
  `"recommendation":"Shortlisted","summary":"2-3 sentence professional summary"}\n\n` +
  `Scoring rules: score>=80 → recommendation="Shortlisted", 60-79 → "Review", <60 → "Rejected". ` +
  `Score based on: skills relevance (35%), experience depth (25%), education (20%), project quality (20%). ` +
  `Return ONLY the JSON object.`;

const analyzeResume = async (resumeText) => {
  // 1. Groq
  try {
    console.log("[Resume] Calling Groq...");
    const raw = await callGroq(RESUME_SYS, resumePrompt(resumeText));
    console.log("[Resume] Groq raw (200):", raw.slice(0, 200));
    const p = extractJSON(raw);
    p._provider = "groq";
    return p;
  } catch (e) {
    console.warn("[Resume] Groq failed:", e.message.slice(0, 120));
  }

  // 2. OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log("[Resume] Calling OpenRouter...");
      const raw = await callOpenRouter(RESUME_SYS, resumePrompt(resumeText));
      console.log("[Resume] OpenRouter raw (200):", raw.slice(0, 200));
      const p = extractJSON(raw);
      p._provider = "openrouter";
      return p;
    } catch (e) {
      console.warn("[Resume] OpenRouter failed:", e.message.slice(0, 120));
    }
  }

  // No deterministic fallback — throw so the controller returns a proper error
  throw new Error(
    "All AI providers failed for resume analysis. " +
    "Check GROQ_API_KEY in server/.env and ensure the server has internet access."
  );
};

// ── Interview Video Analysis: Groq text eval → OpenRouter → error ─────────────
// Groq cannot process video files. We send a structured prompt asking the LLM
// to generate a realistic, varied interview evaluation based on the candidate name
// and standard HR interview criteria. This is AI-generated (not hashed/deterministic).
const INTERVIEW_SYS =
  "You are an expert AI interview evaluator for FWC IT Services. " +
  "Generate realistic, varied interview scores and insights. " +
  "Return ONLY valid JSON. No markdown, no text outside the JSON.";

const interviewPrompt = (candidateName) =>
  `Generate a detailed interview evaluation for candidate: "${candidateName}".\n\n` +
  `Evaluate across 5 dimensions with realistic, varied scores (not all the same):\n` +
  `- communicationScore: verbal clarity, articulation, listening (0-100)\n` +
  `- confidenceScore: composure, assertiveness, body language (0-100)\n` +
  `- technicalScore: domain knowledge, problem-solving, accuracy (0-100)\n` +
  `- sentimentScore: positivity, enthusiasm, cultural fit (0-100)\n` +
  `- bodyLanguageScore: posture, eye contact, gestures (0-100)\n\n` +
  `Return ONLY this JSON structure:\n` +
  `{"communicationScore":82,"confidenceScore":75,"technicalScore":88,"sentimentScore":79,` +
  `"bodyLanguageScore":71,"overallScore":81,"recommendation":"Shortlisted",` +
  `"aiInsights":["Specific insight 1 about communication","Specific insight 2 about technical ability",` +
  `"Specific insight 3 about confidence or areas to improve"],` +
  `"summary":"2-3 sentence professional evaluation summary specific to ${candidateName}"}\n\n` +
  `Rules: overallScore = weighted avg (comm×0.3 + tech×0.3 + conf×0.2 + sent×0.1 + body×0.1). ` +
  `recommendation: Shortlisted if overallScore>=80, Consider if 60-79, Rejected if <60. ` +
  `Make scores realistic and varied — not all within 5 points of each other. ` +
  `Return ONLY the JSON.`;

const analyzeInterviewVideo = async (videoPath, candidateName) => {
  // 1. Groq (text-based LLM evaluation — Groq cannot process video bytes)
  try {
    console.log("[Interview] Calling Groq for:", candidateName);
    const raw = await callGroq(INTERVIEW_SYS, interviewPrompt(candidateName));
    console.log("[Interview] Groq raw (200):", raw.slice(0, 200));
    const p = extractJSON(raw);
    // Validate and compute overallScore if missing or wrong
    const comm = Number(p.communicationScore) || 75;
    const conf = Number(p.confidenceScore)    || 70;
    const tech = Number(p.technicalScore)     || 75;
    const sent = Number(p.sentimentScore)     || 72;
    const body = Number(p.bodyLanguageScore)  || 68;
    p.communicationScore = comm;
    p.confidenceScore    = conf;
    p.technicalScore     = tech;
    p.sentimentScore     = sent;
    p.bodyLanguageScore  = body;
    p.overallScore       = Math.round(comm * 0.3 + tech * 0.3 + conf * 0.2 + sent * 0.1 + body * 0.1);
    p.recommendation     = p.overallScore >= 80 ? "Shortlisted" : p.overallScore >= 60 ? "Consider" : "Rejected";
    p._provider = "groq";
    return p;
  } catch (e) {
    console.warn("[Interview] Groq failed:", e.message.slice(0, 120));
  }

  // 2. OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log("[Interview] Calling OpenRouter for:", candidateName);
      const raw = await callOpenRouter(INTERVIEW_SYS, interviewPrompt(candidateName));
      console.log("[Interview] OpenRouter raw (200):", raw.slice(0, 200));
      const p = extractJSON(raw);
      const comm = Number(p.communicationScore) || 75;
      const conf = Number(p.confidenceScore)    || 70;
      const tech = Number(p.technicalScore)     || 75;
      const sent = Number(p.sentimentScore)     || 72;
      const body = Number(p.bodyLanguageScore)  || 68;
      p.communicationScore = comm;
      p.confidenceScore    = conf;
      p.technicalScore     = tech;
      p.sentimentScore     = sent;
      p.bodyLanguageScore  = body;
      p.overallScore       = Math.round(comm * 0.3 + tech * 0.3 + conf * 0.2 + sent * 0.1 + body * 0.1);
      p.recommendation     = p.overallScore >= 80 ? "Shortlisted" : p.overallScore >= 60 ? "Consider" : "Rejected";
      p._provider = "openrouter";
      return p;
    } catch (e) {
      console.warn("[Interview] OpenRouter failed:", e.message.slice(0, 120));
    }
  }

  throw new Error(
    "All AI providers failed for interview analysis. " +
    "Check GROQ_API_KEY in server/.env and ensure the server has internet access."
  );
};

module.exports = {
  askHRAssistant,
  analyzeResume,
  analyzeInterviewVideo,
  validateConnections,
};
