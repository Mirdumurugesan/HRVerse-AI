const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { addPerformance, getPerformance, getMyPerformance } = require("../controllers/performanceController");

const mgrAdmin = ["Admin", "Manager"];
const all4     = ["Admin", "Manager", "HR", "Employee"];

// Admin/Manager: full performance list
router.get("/",    protect, authorize(...mgrAdmin), getPerformance);
// Any role: own performance records only
router.get("/my",  protect, authorize(...all4),     getMyPerformance);
// Admin/Manager: add performance review
router.post("/add", protect, authorize(...mgrAdmin), addPerformance);

module.exports = router;
