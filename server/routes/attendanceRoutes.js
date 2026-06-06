const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { markAttendance, getAttendance, getMyAttendance, getAttendanceSummary } = require("../controllers/attendanceController");

const noEmp = ["Admin", "HR", "Manager"];
const all4  = ["Admin", "HR", "Manager", "Employee"];

router.get  ("/",        protect, authorize(...noEmp), getAttendance);
router.get  ("/my",      protect, authorize(...all4),  getMyAttendance);
router.get  ("/summary", protect, authorize(...noEmp), getAttendanceSummary);
router.post ("/mark",    protect, authorize(...noEmp), markAttendance);

module.exports = router;
