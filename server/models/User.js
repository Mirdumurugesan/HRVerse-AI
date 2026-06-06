const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Admin", "HR", "Employee", "Manager"],
    default: "Employee"
  },
  employeeProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  isActive:  { type: Boolean, default: true },
  lastLogin: { type: Date },
  avatar:    { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
