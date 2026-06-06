const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  employeeName: { type: String, required: true },
  leaveType: {
    type: String,
    enum: ["Sick Leave","Annual Leave","Casual Leave","WFH","Maternity","Paternity","Emergency"],
    required: true
  },
  startDate: { type: String, required: true },
  endDate:   { type: String, required: true },
  days:      { type: Number, default: 1 },
  reason:    { type: String, default: "" },
  status: {
    type: String,
    enum: ["Pending","Approved","Rejected"],
    default: "Pending"
  },
  approvedBy:  { type: String, default: "" },
  approvedAt:  { type: Date },
  department:  { type: String, default: "" },
}, { timestamps: true });

leaveSchema.index({ employeeId: 1, startDate: -1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ department: 1 });
leaveSchema.index({ leaveType: 1 });
leaveSchema.index({ startDate: -1 });

module.exports = mongoose.model("Leave", leaveSchema);
