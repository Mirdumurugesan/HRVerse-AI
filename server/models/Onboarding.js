const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Skipped"],
    default: "Pending"
  }
}, { _id: false });

const onboardingSchema = new mongoose.Schema({
  // employeeId is optional — onboarding record can exist before Employee profile is linked
  employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
  name:        { type: String, required: true },
  role:        { type: String, default: "Engineer" },
  department:  { type: String, default: "Engineering" },
  startDate:   { type: Date, default: Date.now },
  steps: {
    type: [stepSchema],
    default: [
      { title: "Offer Letter Signed & e-KYC Verified" },
      { title: "IT Asset Allocation" },
      { title: "System Access Provisioning" },
      { title: "Training Program Enrollment" },
      { title: "Buddy & Mentor Assignment" },
      { title: "Commitment Bond Signing" },
      { title: "Team Introduction & Project Briefing" },
    ]
  },
  completionPercent: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "In Progress"
  },
  trainingValue: { type: Number, default: 400000 },
  bondYears:     { type: Number, default: 3 },
}, { timestamps: true });

onboardingSchema.index({ createdAt: -1 });
onboardingSchema.index({ status: 1 });
onboardingSchema.index({ name: 1 });

module.exports = mongoose.model("Onboarding", onboardingSchema);
