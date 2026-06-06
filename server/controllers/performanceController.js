const Performance = require("../models/Performance");
const { resolveEmpName, escapeRx } = require("../utils/resolveEmpName");

// POST /api/performance/add
const addPerformance = async (req, res) => {
  try {
    const { employeeName, rating, review, department, quarter, reviewedBy, goals, achievements } = req.body;

    if (!employeeName || !employeeName.trim())
      return res.status(400).json({ message: "Employee name is required" });

    const ratingNum = Number(rating);
    if (!rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5)
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });

    // aiScore is computed by the pre-save hook (rating * 20)
    const performance = await Performance.create({
      employeeName:   employeeName.trim(),
      rating:         ratingNum,
      review:         review         || "",
      department:     department     || "Engineering",
      quarter:        quarter        || getCurrentQuarter(),
      reviewedBy:     reviewedBy     || "",
      goals:          Array.isArray(goals)       ? goals       : [],
      achievements:   Array.isArray(achievements) ? achievements : [],
      promotionReady: ratingNum >= 4,
      pip:            ratingNum <= 2 ? { active: true, since: new Date(), reason: "Performance below threshold" } : { active: false },
    });
    res.status(201).json(performance);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/performance?page=1&limit=50&department=Engineering&search=name
const getPerformance = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const skip   = (page - 1) * limit;

    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.search) {
      filter.employeeName = { $regex: req.query.search, $options: "i" };
    }

    const [data, total] = await Promise.all([
      Performance.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Performance.countDocuments(filter),
    ]);

    res.set("X-Page",  page);
    res.set("X-Pages", Math.ceil(total / limit));
    res.set("X-Total", total);
    res.set("X-Limit", limit);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/performance/my  (own records only)
const getMyPerformance = async (req, res) => {
  try {
    const name = await resolveEmpName(req.user);
    const data = await Performance.find({
      employeeName: { $regex: new RegExp("^" + escapeRx(name) + "$", "i") }
    }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Returns current quarter string e.g. "Q2 2026"
const getCurrentQuarter = () => {
  const m = new Date().getMonth();
  const q = m < 3 ? 1 : m < 6 ? 2 : m < 9 ? 3 : 4;
  return "Q" + q + " " + new Date().getFullYear();
};

module.exports = { addPerformance, getPerformance, getMyPerformance };
