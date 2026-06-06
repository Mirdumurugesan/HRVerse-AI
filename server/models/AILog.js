const mongoose = require("mongoose");

const aiLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["chat", "resume", "interview"],
    required: true,
  },
  provider: {
    type: String,
    enum: ["groq", "openrouter", "fallback", "error"],
    default: "groq",
  },
  input:    { type: String, default: "" },
  output:   { type: mongoose.Schema.Types.Mixed },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  latencyMs:{ type: Number, default: 0 },
  success:  { type: Boolean, default: true },
  error:    { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("AILog", aiLogSchema);
