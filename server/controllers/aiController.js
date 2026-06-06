const { askHRAssistant } = require("../services/aiService");
const AILog = require("../models/AILog");

// POST /api/ai/chat  (also served at /api/ai-assistant/chat)
const chat = async (req, res) => {
  const t0 = Date.now();
  try {
    const question = (req.body.question || req.body.message || "").trim();
    if (!question)
      return res.status(400).json({ message: "Question cannot be empty" });
    if (question.length > 3000)
      return res.status(400).json({ message: "Question too long (max 3000 characters)" });

    const { text: answer, provider } = await askHRAssistant(question);
    const latencyMs = Date.now() - t0;

    // Store in MongoDB (fire-and-forget — never block the response)
    AILog.create({
      type:      "chat",
      provider,
      input:     question,
      output:    { answer },
      userId:    req.user?._id,
      latencyMs,
      success:   true,
    }).catch(err => console.warn("[AILog] write failed:", err.message));

    return res.status(200).json({ answer, provider, latencyMs });
  } catch (err) {
    const latencyMs = Date.now() - t0;
    AILog.create({
      type:     "chat",
      provider: "error",
      input:    req.body.question || "",
      output:   null,
      userId:   req.user?._id,
      latencyMs,
      success:  false,
      error:    err.message,
    }).catch(() => {});
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { chat };
