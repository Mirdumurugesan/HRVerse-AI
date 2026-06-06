const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  employeeId:  { type: String, unique: true, sparse: true },
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  phone:       { type: String, default: "" },
  department:  { type: String, default: "Engineering" },
  designation: { type: String, default: "Engineer" },
  location:    { type: String, default: "Bangalore" },
  joiningDate: { type: Date, default: Date.now },
  salary:      { type: Number, default: 0 },
  managerId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  skills:      { type: [String], default: [] },
  status: {
    type: String,
    enum: ["Active", "Onboarding", "On Leave", "Resigned", "Terminated"],
    default: "Active"
  },
  workMode: {
    type: String,
    enum: ["Office", "WFH", "Hybrid"],
    default: "Office"
  },
  performanceScore: { type: Number, default: 0 },
}, { timestamps: true });

employeeSchema.index({ department: 1 });
employeeSchema.index({ location: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ department: 1, location: 1 });
employeeSchema.index({ createdAt: -1 });

employeeSchema.pre("save", async function(next) {
  if (!this.employeeId) {
    const count = await mongoose.model("Employee").countDocuments();
    this.employeeId = "FWC" + String(count + 1).padStart(4, "0");
  }
  next();
});

module.exports = mongoose.model("Employee", employeeSchema);
