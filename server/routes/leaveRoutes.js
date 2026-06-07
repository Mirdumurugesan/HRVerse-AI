const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { applyLeave, getLeaves, approveLeave, rejectLeave, autoApproveAll } = require("../controllers/leaveController");

const all4  = ["Admin","HR","Employee","Manager"];
const noEmp = ["Admin","HR","Manager"];

router.get ("/",               protect, authorize(...all4),  getLeaves);
router.post("/",               protect, authorize(...all4),  applyLeave);
router.put ("/approve/:id",    protect, authorize(...noEmp), approveLeave);
router.put ("/reject/:id",     protect, authorize(...noEmp), rejectLeave);
router.put ("/auto-approve",   protect, authorize(...noEmp), autoApproveAll);

module.exports = router;
