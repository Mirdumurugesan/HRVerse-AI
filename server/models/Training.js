const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema({
  employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  instructor:  { type: String, default: "" },
  mode: {
    type: String,
    enum: ["Online","Offline","Hybrid"],
    default: "Online"
  },
  startDate:   { type: Date },
  endDate:     { type: Date },
  progress:    { type: Number, default: 0, min: 0, max: 100 },
  status: {
    type: String,
    enum: ["Enrolled","In Progress","Completed","Dropped"],
    default: "Enrolled"
  },
  certificate:  { type: String, default: "" },
  cost:         { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Training", trainingSchema);
