const fs        = require("fs");
const path      = require("path");
const pdf       = require("pdf-parse");
const mammoth   = require("mammoth");
const Candidate = require("../models/Candidate");
const AILog     = require("../models/AILog");
const { analyzeResume } = require("../services/aiService");

// Extract raw text from PDF or DOCX
const extractText = async (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data   = await pdf(buffer);
    return data.text;
  }
  if (ext === ".docx" || ext === ".doc") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new Error("Unsupported file type: " + ext + ". Upload PDF or DOCX.");
};

const resolveStatus = (score) => {
  if (score >= 80) return "Shortlisted";
  if (score >= 60) return "Review";
  return "Rejected";
};

// POST /api/resume/upload
const uploadResume = async (req, res) => {
  const filePath = req.file ? req.file.path : null;
  const t0 = Date.now();

  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    // Extract text
    let resumeText = "";
    try {
      resumeText = await extractText(filePath, req.file.originalname);
    } catch (extractErr) {
      fs.unlink(filePath, () => {});
      return res.status(400).json({ message: extractErr.message });
    }

    if (!resumeText || resumeText.trim().length < 50) {
      fs.unlink(filePath, () => {});
      return res.status(400).json({
        message: "Could not extract readable text. Ensure the file is not a scanned image.",
      });
    }

    // AI analysis: Groq -> OpenRouter -> throws if all fail
    const aiResult = await analyzeResume(resumeText);
    const latencyMs  = Date.now() - t0;
    const aiProvider = aiResult._provider || "groq";
    delete aiResult._provider;

    const score  = Number(aiResult.score) || 0;
    const status = resolveStatus(score);

    // Upsert candidate in MongoDB
    let candidate;
    const existing = await Candidate.findOne({ email: aiResult.email });
    if (existing) {
      candidate = await Candidate.findByIdAndUpdate(
        existing._id,
        {
          name:           aiResult.name           || existing.name,
          phone:          aiResult.phone          || existing.phone,
          skills:         aiResult.skills         || existing.skills,
          experience:     parseInt(aiResult.experience) || existing.experience,
          education:      aiResult.education      || existing.education,
          resume:         req.file.filename,
          aiScore:        score,
          summary:        aiResult.summary        || existing.summary,
          strengths:      aiResult.strengths      || existing.strengths,
          weaknesses:     aiResult.weaknesses     || existing.weaknesses,
          recommendation: aiResult.recommendation || existing.recommendation,
          status,
        },
        { new: true }
      );
    } else {
      candidate = await Candidate.create({
        name:           aiResult.name           || "Unknown Candidate",
        email:          aiResult.email          || "candidate" + Date.now() + "@mail.com",
        phone:          aiResult.phone          || "",
        skills:         aiResult.skills         || [],
        experience:     parseInt(aiResult.experience) || 0,
        education:      aiResult.education      || "",
        resume:         req.file.filename,
        aiScore:        score,
        summary:        aiResult.summary        || "",
        strengths:      aiResult.strengths      || [],
        weaknesses:     aiResult.weaknesses     || [],
        recommendation: aiResult.recommendation || "Review",
        status,
      });
    }

    // Log AI result to MongoDB
    AILog.create({
      type:      "resume",
      provider:  aiProvider,
      input:     req.file.originalname,
      output:    { ...aiResult, score, candidateId: candidate._id },
      userId:    req.user?._id,
      latencyMs,
      success:   true,
    }).catch(err => console.warn("[AILog] resume write failed:", err.message));

    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.warn("Could not delete upload:", err.message);
    });

    return res.status(200).json({
      success:    true,
      message:    "Resume screened successfully",
      aiProvider,
      aiAnalysis: { ...aiResult, score },
      candidate,
    });
  } catch (error) {
    console.error("uploadResume error:", error);
    if (filePath) fs.unlink(filePath, () => {});
    AILog.create({
      type:    "resume",
      provider:"error",
      input:   req.file?.originalname || "",
      output:  null,
      userId:  req.user?._id,
      latencyMs: Date.now() - t0,
      success: false,
      error:   error.message,
    }).catch(() => {});
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { uploadResume };
