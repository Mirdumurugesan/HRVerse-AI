const express   = require("express");
const router    = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const Candidate = require("../models/Candidate");

const hrAdmin = ["Admin","HR"];

// GET /api/candidates?page=1&limit=50&status=Shortlisted&search=name
router.get("/", protect, authorize(...hrAdmin), async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const skip   = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const filter = {};
    if (search) filter.$or = [
      { name:     { $regex: search, $options: "i" } },
      { email:    { $regex: search, $options: "i" } },
      { skills:   { $regex: search, $options: "i" } },
    ];
    if (status) filter.status = status;

    const [candidates, total] = await Promise.all([
      Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);

    // Return flat array for backward compat with existing frontend
    // Include pagination metadata in headers
    res.set("X-Total-Count", total);
    res.set("X-Page",        page);
    res.set("X-Pages",       Math.ceil(total / limit));
    res.json(candidates);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", protect, authorize(...hrAdmin), async (req, res) => {
  try {
    const c = await Candidate.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Not found" });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id/status", protect, authorize(...hrAdmin), async (req, res) => {
  try {
    const c = await Candidate.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/candidates/:id/scan — AI deep analysis via Groq
router.post("/:id/scan", protect, authorize(...hrAdmin), async (req, res) => {
  try {
    const c = await Candidate.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Not found" });

    const prompt = `You are an expert HR AI. Analyze this candidate and return ONLY valid JSON.

Candidate: ${c.name}
Skills: ${(c.skills || []).join(", ")}
AI Score: ${c.aiScore || c.score || 0}%
Status: ${c.status}
College: ${c.college || "Not provided"}
Role: ${c.jobTitle || c.role || "Full Stack Developer"}

Return this exact JSON (no markdown, no extra text):
{"overallVerdict":"Strong Hire","strengths":["skill1","skill2","skill3"],"gaps":["gap1","gap2"],"interviewFocus":["area1","area2","area3"],"salaryEstimate":"₹8-12 LPA","recommendation":"2 sentence recommendation here"}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      await Candidate.findByIdAndUpdate(req.params.id, { aiInsight: analysis.recommendation });
      return res.json({ ...analysis, candidateName: c.name, aiScore: c.aiScore || c.score });
    }

    // Fallback if Groq returns non-JSON
    res.json({
      overallVerdict: c.aiScore >= 80 ? "Strong Hire" : c.aiScore >= 65 ? "Hire" : "Consider",
      strengths: (c.skills || []).slice(0, 3),
      gaps: ["Detailed assessment needed"],
      interviewFocus: ["Technical depth", "Problem solving", "Team fit"],
      salaryEstimate: c.aiScore >= 80 ? "₹10-15 LPA" : "₹6-10 LPA",
      recommendation: c.aiInsight || "Candidate has relevant skills for the role.",
      candidateName: c.name,
      aiScore: c.aiScore || c.score,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
