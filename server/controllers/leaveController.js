const Leave = require("../models/Leave");
const { resolveEmpName, escapeRx } = require("../utils/resolveEmpName");

const getLeaves = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Employee") {
      const name = await resolveEmpName(req.user);
      query = { employeeName: { $regex: new RegExp(escapeRx(name), "i") } };
    }
    const leaves = await Leave.find(query).sort({ createdAt: -1 });
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

module.exports = { getLeaves, applyLeave, approveLeave };
