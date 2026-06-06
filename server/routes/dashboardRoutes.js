const express  = require("express");
const router   = express.Router();
const { protect } = require("../middleware/rbac");
const { getDashboardStats, getLegacyStats } = require("../controllers/dashboardController");

// Role-specific stats for the main dashboard
router.get("/",       protect, getDashboardStats);

// Legacy endpoint — now also protected (was publicly accessible)
router.get("/legacy", protect, getLegacyStats);

module.exports = router;
