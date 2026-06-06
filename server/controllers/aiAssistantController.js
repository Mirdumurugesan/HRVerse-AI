/**
 * aiAssistantController — delegates to the same Gemini-backed chat handler.
 * The old keyword-matching implementation has been replaced with real AI.
 */
const { chat } = require("./aiController");

// Alias so any code that imported getAIResponse still works
const getAIResponse = chat;

module.exports = { getAIResponse, chat };
