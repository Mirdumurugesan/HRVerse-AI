const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { getTopCandidates } = require("../controllers/rankingController");

// Admin and HR only — candidate rankings must not be public
router.get("/", protect, authorize("Admin", "HR"), getTopCandidates);

module.exports = router;
