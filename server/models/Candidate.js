const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  phone:     { type: String, default: "" },
  skills:    { type: [String], default: [] },
  experience:{ type: Number, default: 0 },
  education: { type: String, default: "" },
  resume:    { type: String, default: "" },
  status: {
    type: String,
    enum: ["Applied", "Shortlisted", "Interview", "Selected", "Rejected", "Review"],
    default: "Applied"
  },
  aiScore:        { type: Number, default: 0 },
  summary:        { type: String, default: "" },
  strengths:      { type: [String], default: [] },
  weaknesses:     { type: [String], default: [] },
  recommendation: { type: String, default: "Pending" },
  projects:       { type: [String], default: [] },
  certifications: { type: [String], default: [] },
  appliedRole:    { type: String, default: "AI/ML Engineer" },
  interviewDate:  { type: Date },
  offerExtended:  { type: Boolean, default: false },
}, { timestamps: true });

candidateSchema.index({ status: 1 });
candidateSchema.index({ aiScore: -1 });
candidateSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Candidate", candidateSchema);
