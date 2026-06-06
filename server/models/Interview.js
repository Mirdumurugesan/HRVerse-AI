const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  candidateId:        { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
  candidateName:      { type: String, required: true },
  candidateEmail:     { type: String, default: "" },
  appliedRole:        { type: String, default: "AI/ML Engineer" },
  video:              { type: String, required: true },
  communicationScore: { type: Number, default: 0 },
  confidenceScore:    { type: Number, default: 0 },
  technicalScore:     { type: Number, default: 0 },
  sentimentScore:     { type: Number, default: 0 },
  bodyLanguageScore:  { type: Number, default: 0 },
  overallScore:       { type: Number, default: 0 },
  recommendation:     { type: String, default: "Pending" },
  aiInsights:         { type: [String], default: [] },
  status: {
    type: String,
    enum: ["Uploaded","Analyzing","Completed","Failed"],
    default: "Completed"
  },
  scheduledDate: { type: Date },
  conductedBy:   { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Interview", interviewSchema);
