const Onboarding = require("../models/Onboarding");

// GET /api/onboarding
const getAll = async (req, res) => {
  try {
    const list = await Onboarding.find().sort({ createdAt: -1 });
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

    const doc = await Onboarding.findById(id);
    if (!doc) return res.status(404).json({ message: "Onboarding record not found" });
    if (isNaN(idx) || idx < 0 || idx >= doc.steps.length)
      return res.status(400).json({ message: "Invalid step index" });

    doc.steps[idx].completed  = true;
    doc.steps[idx].status     = "Completed";
    doc.steps[idx].completedAt = new Date();

    const done = doc.steps.filter(s => s.completed).length;
    doc.completionPercent = Math.round((done / doc.steps.length) * 100);
    if (doc.completionPercent === 100) doc.status = "Completed";
    else if (done > 0)                 doc.status = "In Progress";

    await doc.save();
    res.json(doc);
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
