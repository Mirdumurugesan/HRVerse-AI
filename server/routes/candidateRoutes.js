const express   = require("express");
const router    = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const Candidate = require("../models/Candidate");

const hrAdmin = ["Admin","HR"];

// GET /api/candidates?page=1&limit=50&status=Shortlisted&search=name
router.get("/", protect, authorize(...hrAdmin), async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const skip   = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const filter = {};
    if (search) filter.$or = [
      { name:     { $regex: search, $options: "i" } },
      { email:    { $regex: search, $options: "i" } },
      { skills:   { $regex: search, $options: "i" } },
    ];
    if (status) filter.status = status;

    const [candidates, total] = await Promise.all([
      Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);

    // Return flat array for backward compat with existing frontend
    // Include pagination metadata in headers
    res.set("X-Total-Count", total);
    res.set("X-Page",        page);
    res.set("X-Pages",       Math.ceil(total / limit));
    res.json(candidates);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", protect, authorize(...hrAdmin), async (req, res) => {
  try {
    const c = await Candidate.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Not found" });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id/status", protect, authorize(...hrAdmin), async (req, res) => {
  try {
    const c = await Candidate.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
