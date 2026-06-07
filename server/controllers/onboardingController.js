const Onboarding = require("../models/Onboarding");

// GET /api/onboarding  (paginated, lean)
const getAll = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50,  parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [list, total] = await Promise.all([
      Onboarding.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Onboarding.countDocuments(),
    ]);

    res.set("X-Total", total);
    res.set("X-Pages", Math.ceil(total / limit));
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/onboarding/:id
const getById = async (req, res) => {
  try {
    const doc = await Onboarding.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Onboarding record not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/onboarding
const create = async (req, res) => {
  try {
    const { name, role, department, startDate } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: "Employee name is required" });

    const doc = await Onboarding.create({
      name:       name.trim(),
      role:       role       || "Engineer",
      department: department || "Engineering",
      startDate:  startDate  || new Date(),
    });
    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PUT /api/onboarding/:id/step/:stepIndex
const updateStep = async (req, res) => {
  try {
    const { id, stepIndex } = req.params;
    const idx = parseInt(stepIndex, 10);

    // Read lean for speed, then do a targeted atomic update
    const doc = await Onboarding.findById(id).lean();
    if (!doc) return res.status(404).json({ message: "Onboarding record not found" });
    if (isNaN(idx) || idx < 0 || idx >= doc.steps.length)
      return res.status(400).json({ message: "Invalid step index" });

    // Build atomic $set paths
    const now  = new Date();
    const set  = {
      [`steps.${idx}.completed`]:   true,
      [`steps.${idx}.status`]:      "Completed",
      [`steps.${idx}.completedAt`]: now,
    };

    const updatedSteps = doc.steps.map((s, i) =>
      i === idx ? { ...s, completed: true } : s
    );
    const done    = updatedSteps.filter(s => s.completed).length;
    const pct     = Math.round((done / updatedSteps.length) * 100);
    set.completionPercent = pct;
    set.status = pct === 100 ? "Completed" : done > 0 ? "In Progress" : "Not Started";

    const updated = await Onboarding.findByIdAndUpdate(
      id, { $set: set }, { new: true, lean: true }
    );
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// DELETE /api/onboarding/:id
const remove = async (req, res) => {
  try {
    const doc = await Onboarding.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Onboarding record not found" });
    res.json({ message: "Onboarding record deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getAll, getById, create, updateStep, remove };
