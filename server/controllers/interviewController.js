const fs        = require("fs");
const Interview = require("../models/Interview");
const AILog     = require("../models/AILog");
const { analyzeInterviewVideo } = require("../services/aiService");

// POST /api/interview/upload
const uploadInterview = async (req, res) => {
  const filePath = req.file ? req.file.path : null;
  const t0 = Date.now();

  try {
    if (!req.file)
      return res.status(400).json({ message: "No video file uploaded" });

    const candidateName = (req.body.candidateName || "Unknown Candidate").trim();

    // aiService: Groq → OpenRouter → throws if all fail
    const aiResult = await analyzeInterviewVideo(filePath, candidateName);
    console.log("[Interview] Analysis succeeded for:", candidateName, "| provider:", aiResult._provider || "groq");

    const latencyMs  = Date.now() - t0;
    const aiProvider = aiResult._provider || "groq";
    delete aiResult._provider;

    const interview = await Interview.create({
      candidateName,
      video:              req.file.filename,
      communicationScore: aiResult.communicationScore || 0,
      confidenceScore:    aiResult.confidenceScore    || 0,
      technicalScore:     aiResult.technicalScore     || 0,
      sentimentScore:     aiResult.sentimentScore     || 0,
      bodyLanguageScore:  aiResult.bodyLanguageScore  || 0,
      overallScore:       aiResult.overallScore       || 0,
      recommendation:     aiResult.recommendation     || "Pending",
      aiInsights:         aiResult.aiInsights         || [],
      status:             "Completed",
    });

    // Log to MongoDB
    AILog.create({
      type:      "interview",
      provider:  aiProvider,
      input:     candidateName,
      output:    { ...aiResult, interviewId: interview._id },
      userId:    req.user?._id,
      latencyMs,
      success:   true,
    }).catch(err => console.warn("[AILog] interview write failed:", err.message));

    // Clean up video from disk
    fs.unlink(filePath, (err) => {
      if (err) console.warn("Could not delete video upload:", err.message);
    });

    return res.status(201).json({
      message:    "Interview analyzed successfully",
      aiProvider,
      interview,
    });
  } catch (error) {
    console.error("uploadInterview error:", error);
    if (filePath) fs.unlink(filePath, () => {});
    AILog.create({
      type:    "interview",
      provider:"error",
      input:   req.body?.candidateName || "",
      output:  null,
      userId:  req.user?._id,
      latencyMs: Date.now() - t0,
      success: false,
      error:   error.message,
    }).catch(() => {});
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/interview
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ createdAt: -1 });
    res.status(200).json(interviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadInterview, getInterviews };
