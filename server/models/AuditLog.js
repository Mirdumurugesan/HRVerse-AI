const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userRole: { type: String },
  action:   { type: String, required: true },
  entity:   { type: String },
  entityId: { type: String },
  details:  { type: String },
  ip:       { type: String },
  success:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);
