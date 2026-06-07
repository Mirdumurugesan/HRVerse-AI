const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { createPayroll, getPayrolls, getMyPayroll, recalculateAll } = require("../controllers/payrollController");

const mgrAdmin = ["Admin", "Manager"];
const all4     = ["Admin", "Manager", "HR", "Employee"];

// Admin/Manager: full payroll list
router.get("/",       protect, authorize(...mgrAdmin), getPayrolls);
// Any role: own payroll records only
router.get("/my",     protect, authorize(...all4),     getMyPayroll);
// Admin/Manager: create payroll entry
router.post("/create", protect, authorize(...mgrAdmin), createPayroll);
// Admin: fix all records with missing netSalary (run once after seeding)
router.put("/recalculate", protect, authorize("Admin"), recalculateAll);

module.exports = router;
