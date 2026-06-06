const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { onboardEmployee, getEmployees, getEmployeeStats } = require("../controllers/employeeController");

const noEmp = ["Admin","HR","Manager"];

// GET /api/employees/stats — aggregated KPIs (must be before "/:id" if added)
router.get ("/stats",   protect, authorize(...noEmp), getEmployeeStats);
// GET /api/employees?page=1&limit=50&search=term&dept=Engineering
router.get ("/",        protect, authorize(...noEmp), getEmployees);
router.post("/onboard", protect, authorize(...noEmp), onboardEmployee);

module.exports = router;
