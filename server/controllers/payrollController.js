const Payroll = require("../models/Payroll");
const { resolveEmpName, escapeRx } = require("../utils/resolveEmpName");

// POST /api/payroll/create
const createPayroll = async (req, res) => {
  try {
    const { employeeName, basicSalary, bonus, deductions, department, month, year } = req.body;

    if (!employeeName || !employeeName.trim())
      return res.status(400).json({ message: "Employee name is required" });
    if (!basicSalary || isNaN(Number(basicSalary)) || Number(basicSalary) <= 0)
      return res.status(400).json({ message: "Basic salary must be a positive number" });

    const payroll = await Payroll.create({
      employeeName: employeeName.trim(),
      basicSalary:  Number(basicSalary),
      bonus:        Number(bonus)      || 0,
      deductions:   Number(deductions) || 0,
      department:   department         || "Engineering",
      month:        month              || new Date().toLocaleString("default", { month: "long" }),
      year:         year               || new Date().getFullYear(),
    });
    res.status(201).json(payroll);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/payroll — paginated, searchable
const getPayrolls = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 25);
    const skip   = (page - 1) * limit;
    const search = req.query.search || "";
    const dept   = req.query.dept   || "";
    const status = req.query.status || "";
    const month  = req.query.month  || "";
    const year   = req.query.year   || "";

    const filter = {};
    if (search) filter.$or = [
      { employeeName: { $regex: search, $options: "i" } },
      { department:   { $regex: search, $options: "i" } },
    ];
    if (dept)   filter.department = dept;
    if (status) filter.status = status;
    if (month)  filter.month = month;
    if (year)   filter.year  = Number(year);

    const [data, total] = await Promise.all([
      Payroll.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payroll.countDocuments(filter),
    ]);

    res.json({
      payrolls: data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/payroll/my  (own records only, paginated)
const getMyPayroll = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const skip  = (page - 1) * limit;

    const name   = await resolveEmpName(req.user);
    const filter = { employeeName: { $regex: new RegExp("^" + escapeRx(name) + "$", "i") } };

    const [data, total] = await Promise.all([
      Payroll.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payroll.countDocuments(filter),
    ]);

    res.json({
      payrolls: data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PUT /api/payroll/recalculate — Admin: fix all records missing netSalary
const recalculateAll = async (req, res) => {
  try {
    const records = await Payroll.find({ $or: [{ netSalary: { $exists: false } }, { netSalary: null }, { netSalary: 0 }] });
    let fixed = 0;
    for (const r of records) {
      const tax = Math.round(Number(r.basicSalary) * 0.1);
      const net = Number(r.basicSalary) + Number(r.bonus) - Number(r.deductions) - tax;
      await Payroll.updateOne({ _id: r._id }, { $set: { tax, netSalary: net } });
      fixed++;
    }
    res.json({ fixed, message: `Recalculated netSalary for ${fixed} payroll records.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { createPayroll, getPayrolls, getMyPayroll, recalculateAll };
