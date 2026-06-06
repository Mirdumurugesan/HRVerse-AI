const Attendance = require("../models/Attendance");
const { resolveEmpName, escapeRx } = require("../utils/resolveEmpName");

const startOfDay = (d) => {
  const dt = d ? new Date(d) : new Date();
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
};

// POST /api/attendance/mark
const markAttendance = async (req, res) => {
  try {
    const { employeeName, status, workMode, checkIn, checkOut, date } = req.body;
    const name = (employeeName || req.user?.name || "").trim();
    if (!name) return res.status(400).json({ message: "Employee name is required" });

    const dayStart = startOfDay(date);
    const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const record = await Attendance.findOneAndUpdate(
      {
        employeeName: { $regex: new RegExp("^" + name + "$", "i") },
        date: { $gte: dayStart, $lt: dayEnd },
      },
      {
        employeeName: name,
        status:   status   || "Present",
        workMode: workMode || "Office",
        checkIn:  checkIn  || "",
        checkOut: checkOut || "",
        date:     dayStart,
      },
      { upsert: true, new: true }
    );
    res.status(200).json(record);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/attendance  (Admin/HR/Manager — paginated)
const getAttendance = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 25);
    const skip   = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const date   = req.query.date   || "";

    const filter = {};
    if (search) filter.employeeName = { $regex: search, $options: "i" };
    if (status) filter.status = status;
    if (date) {
      const d    = startOfDay(date);
      const dEnd = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      filter.date = { $gte: d, $lt: dEnd };
    }

    const [data, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      attendance: data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/attendance/my  (any role — own records only, paginated)
const getMyAttendance = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const skip  = (page - 1) * limit;

    const name   = await resolveEmpName(req.user);
    const filter = { employeeName: { $regex: new RegExp("^" + escapeRx(name) + "$", "i") } };

    const [data, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      attendance: data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/attendance/summary  (Admin/HR/Manager — today stats)
const getAttendanceSummary = async (req, res) => {
  try {
    const today    = startOfDay();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todayRecords = await Attendance.find({ date: { $gte: today, $lt: tomorrow } });
    const total   = todayRecords.length;
    const present = todayRecords.filter(r => r.status === "Present").length;
    const absent  = todayRecords.filter(r => r.status === "Absent").length;
    const wfh     = todayRecords.filter(r => r.workMode === "WFH").length;
    const rate    = total ? Math.round((present / total) * 100) : 0;

    res.json({ total, present, absent, wfh, rate, date: today });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { markAttendance, getAttendance, getMyAttendance, getAttendanceSummary };
