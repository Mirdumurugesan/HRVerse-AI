const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role:    { type: String, enum: ["Admin","HR","Employee","Candidate","All"], default: "All" },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["AI Alert","Payroll","Interview","Leave","Performance","Onboarding","Attendance","General","System"],
    default: "General"
  },
  read:      { type: Boolean, default: false },
  link:      { type: String, default: "" },
  metadata:  { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
