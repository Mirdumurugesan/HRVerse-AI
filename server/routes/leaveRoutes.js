const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { applyLeave, getLeaves, approveLeave } = require("../controllers/leaveController");

const all4  = ["Admin","HR","Employee","Manager"];
const noEmp = ["Admin","HR","Manager"];

router.get ("/",               protect, authorize(...all4),  getLeaves);
router.post("/",               protect, authorize(...all4),  applyLeave);
router.put ("/approve/:id",    protect, authorize(...noEmp), approveLeave);

module.exports = router;
