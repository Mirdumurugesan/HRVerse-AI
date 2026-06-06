const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema({
  employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  employeeName: { type: String, required: true },
  department:   { type: String, default: "" },
  month:        { type: String, default: "" },
  year:         { type: Number, default: new Date().getFullYear() },
  basicSalary:  { type: Number, required: true },
  bonus:        { type: Number, default: 0 },
  deductions:   { type: Number, default: 0 },
  tax:          { type: Number, default: 0 },
  netSalary:    { type: Number },
  esopUnits:    { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Pending","Processed","Paid","On Hold","Anomaly"],
    default: "Processed"
  },
  processedDate:{ type: Date, default: Date.now },
  anomaly:      { type: Boolean, default: false },
  anomalyNote:  { type: String, default: "" },
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, year: -1, month: 1 });
payrollSchema.index({ department: 1 });
payrollSchema.index({ status: 1 });
payrollSchema.index({ anomaly: 1 });
payrollSchema.index({ year: -1, month: 1 });

payrollSchema.pre("save", function(next) {
  if (!this.tax) {
    this.tax = Math.round(Number(this.basicSalary) * 0.1);
  }
  this.netSalary = Number(this.basicSalary) + Number(this.bonus) - Number(this.deductions) - Number(this.tax);
  next();
});

module.exports = mongoose.model("Payroll", payrollSchema);
