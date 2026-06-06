const Employee = require("../models/Employee");

// POST /api/employees/onboard
const onboardEmployee = async (req, res) => {
  try {
    const { name, email, department, designation, location, phone, salary } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Employee name is required" });
    if (!email || !email.trim()) return res.status(400).json({ message: "Employee email is required" });

    const existing = await Employee.findOne({ email: email.trim().toLowerCase() });
    if (existing) return res.status(400).json({ message: "An employee with this email already exists" });

    const employee = await Employee.create({
      name:        name.trim(),
      email:       email.trim().toLowerCase(),
      department:  department  || "Engineering",
      designation: designation || "Engineer",
      location:    location    || "Bangalore",
      phone:       phone       || "",
      salary:      salary      || 0,
    });
    res.status(201).json({ message: "Employee onboarded successfully", employee });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/employees — paginated, searchable
const getEmployees = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const skip   = (page - 1) * limit;
    const search = req.query.search || "";
    const dept   = req.query.dept   || "";

    const filter = {};
    if (search) filter.$or = [
      { name:        { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
      { email:       { $regex: search, $options: "i" } },
    ];
    if (dept) filter.department = dept;

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      employees,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/employees/stats — aggregated KPIs (Admin/HR/Manager)
const getEmployeeStats = async (req, res) => {
  try {
    const [statusBreakdown, locationBreakdown, perfBuckets, totalCount] = await Promise.all([
      Employee.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Employee.aggregate([
        { $group: { _id: { $ifNull: ["$location", "Unknown"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 4 },
      ]),
      Employee.aggregate([
        {
          $group: {
            _id:             null,
            highPerformers:  { $sum: { $cond: [{ $gte: ["$performanceScore", 85] }, 1, 0] } },
            leadershipReady: { $sum: { $cond: [{ $gte: ["$performanceScore", 90] }, 1, 0] } },
            upskilling:      { $sum: { $cond: [{ $lt:  ["$performanceScore", 60] }, 1, 0] } },
          },
        },
      ]),
      Employee.countDocuments(),
    ]);

    const total      = totalCount;
    const active     = statusBreakdown.find(r => r._id === "Active")?.count      || 0;
    const resigned   = statusBreakdown.find(r => r._id === "Resigned")?.count    || 0;
    const terminated = statusBreakdown.find(r => r._id === "Terminated")?.count  || 0;
    const attrition  = total ? +((resigned + terminated) / total * 100).toFixed(1) : 0;
    const promotions = perfBuckets[0]?.leadershipReady || 0;

    res.json({
      total,
      active,
      attrition,
      promotions,
      locationBreakdown: locationBreakdown.map(r => ({
        location: r._id || "Unknown",
        count:    r.count,
        pct:      total ? Math.round((r.count / total) * 100) : 0,
      })),
      forecast: {
        highPerformers:  perfBuckets[0]?.highPerformers  || 0,
        leadershipReady: perfBuckets[0]?.leadershipReady || 0,
        upskilling:      perfBuckets[0]?.upskilling      || 0,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { onboardEmployee, getEmployees, getEmployeeStats };
