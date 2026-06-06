const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const {
  getHiringFunnel, getSkillDistribution, getScoreDistribution,
  getDepartmentMetrics, getAttendanceTrends, getPayrollAnalytics,
  getPerformanceAnalytics, getInterviewAnalytics,
  getAttendanceSummary, getLeaveAnalytics, getPayrollTrend, getHeadcountSummary,
} = require("../controllers/analyticsController");

const hrAdmin  = ["Admin", "HR"];
const mgrAdmin = ["Admin", "Manager"];
const noEmp    = ["Admin", "HR", "Manager"];   // all staff roles
const all4     = ["Admin", "HR", "Employee", "Manager"];

router.get("/hiring-funnel",        protect, authorize(...noEmp),   getHiringFunnel);
router.get("/skill-distribution",   protect, authorize(...noEmp),   getSkillDistribution);
router.get("/score-distribution",   protect, authorize(...noEmp),   getScoreDistribution);
router.get("/department-metrics",   protect, authorize(...mgrAdmin), getDepartmentMetrics);
router.get("/attendance-trends",    protect, authorize(...all4),     getAttendanceTrends);
router.get("/attendance-summary",   protect, authorize(...all4),     getAttendanceSummary);
router.get("/payroll",              protect, authorize(...mgrAdmin), getPayrollAnalytics);
router.get("/payroll-trend",        protect, authorize(...mgrAdmin), getPayrollTrend);
router.get("/performance",          protect, authorize(...mgrAdmin), getPerformanceAnalytics);
router.get("/interviews",           protect, authorize(...noEmp),   getInterviewAnalytics);
router.get("/leave",                protect, authorize(...mgrAdmin), getLeaveAnalytics);
router.get("/headcount",            protect, authorize(...mgrAdmin), getHeadcountSummary);

module.exports = router;
