const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/rbac");
const { chat } = require("../controllers/aiController");

// /api/ai-assistant/chat — kept for backward compatibility; delegates to same controller as /api/ai/chat
router.post("/chat", protect, chat);

module.exports = router;
