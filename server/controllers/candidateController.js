const Candidate = require("../models/Candidate");

// CREATE
const createCandidate = async (req, res) => {
  try {
    const existingCandidate = await Candidate.findOne({ email: req.body.email });
    if (existingCandidate) return res.status(400).json({ message: "Candidate already exists" });
    const candidate = await Candidate.create(req.body);
    res.status(201).json({ message: "Candidate Added", candidate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL — paginated, searchable
const getCandidates = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 25);
    const skip   = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const filter = {};
    if (search) filter.$or = [
      { name:        { $regex: search, $options: "i" } },
      { appliedRole: { $regex: search, $options: "i" } },
      { email:       { $regex: search, $options: "i" } },
    ];
    if (status) filter.status = status;

    const [candidates, total] = await Promise.all([
      Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);

    res.status(200).json({
      candidates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BY ID
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate Not Found" });
    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!candidate) return res.status(404).json({ message: "Candidate Not Found" });
    res.status(200).json({ message: "Candidate Updated", candidate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate Not Found" });
    res.status(200).json({ message: "Candidate Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createCandidate, getCandidates, getCandidateById, updateCandidate, deleteCandidate };
