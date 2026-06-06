const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  employeeName: { type: String, required: true },
  date:         { type: Date, default: Date.now },
  checkIn:      { type: String, default: "" },
  checkOut:     { type: String, default: "" },
  workHours:    { type: Number, default: 0 },
  location:     { type: String, default: "Bangalore" },
  workMode: {
    type: String,
    enum: ["Office","WFH","Hybrid"],
    default: "Office"
  },
  status: {
    type: String,
    enum: ["Present","Absent","Leave","Half Day","Late"],
    default: "Present"
  },
  isLate:     { type: Boolean, default: false },
  lateMinutes:{ type: Number, default: 0 },
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ location: 1, date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
