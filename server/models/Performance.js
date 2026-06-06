const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  employeeName: { type: String, required: true },
  department:   { type: String, default: "" },
  quarter:      { type: String, default: "Q2 2026" },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  review:       { type: String, default: "" },
  aiScore:      { type: Number, default: 0 },
  goals:        { type: [String], default: [] },
  achievements: { type: [String], default: [] },
  skillGaps:    { type: [String], default: [] },
  promotionReady: { type: Boolean, default: false },
  pip: {
    active:   { type: Boolean, default: false },
    reason:   { type: String, default: "" },
    progress: { type: Number, default: 0 },
    since:    { type: Date }
  },
  reviewedBy: { type: String, default: "" },
}, { timestamps: true });

performanceSchema.index({ employeeId: 1, quarter: 1 });
performanceSchema.index({ department: 1 });
performanceSchema.index({ aiScore: -1 });
performanceSchema.index({ "pip.active": 1 });
performanceSchema.index({ promotionReady: 1 });

performanceSchema.pre("save", function(next) {
  this.aiScore = Math.round(this.rating * 20);
  next();
});

module.exports = mongoose.model("Performance", performanceSchema);
