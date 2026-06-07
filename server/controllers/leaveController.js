const Leave = require("../models/Leave");
const { resolveEmpName, escapeRx } = require("../utils/resolveEmpName");

const getLeaves = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const skip   = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";

    let query = {};
    if (req.user.role === "Employee") {
      const name = await resolveEmpName(req.user);
      query = { employeeName: { $regex: new RegExp(escapeRx(name), "i") } };
    } else {
      if (search) query.employeeName = { $regex: search, $options: "i" };
      if (status) query.status = status;
    }

    const [leaves, total] = await Promise.all([
      Leave.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Leave.countDocuments(query),
    ]);

    res.set("X-Total", total);
    res.set("X-Pages", Math.ceil(total / limit));
    res.json(leaves);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const applyLeave = async (req, res) => {
  try {
    // If employee is applying, always use their resolved real name
    let empName = req.body.employeeName;
    if (req.user.role === "Employee") {
      empName = await resolveEmpName(req.user);
    }
    const leave = await Leave.create({ ...req.body, employeeName: empName || req.user.name });
    res.status(201).json(leave);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: "Approved", approvedBy: req.user.name, approvedAt: new Date() },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: "Not found" });
    res.json(leave);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", approvedBy: req.user.name, approvedAt: new Date() },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: "Not found" });
    res.json(leave);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Bulk approve all pending leaves (AI Auto-Approve)
const autoApproveAll = async (req, res) => {
  try {
    const result = await Leave.updateMany(
      { status: "Pending" },
      { status: "Approved", approvedBy: req.user.name + " (AI)", approvedAt: new Date() }
    );
    res.json({ approved: result.modifiedCount, message: result.modifiedCount + " leave requests auto-approved by AI." });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getLeaves, applyLeave, approveLeave, rejectLeave, autoApproveAll };
