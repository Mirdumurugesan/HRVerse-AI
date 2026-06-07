const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { getNotifications, markRead, createNotification } = require("../controllers/notificationController");
const Leave = require("../models/Leave");

router.get  ("/",         protect, getNotifications);
router.put  ("/:id/read", protect, markRead);
router.post ("/",         protect, createNotification);

// PUT /api/notifications/leave/:leaveId/approve  OR  /reject
// Quick-action from Notifications page
const noEmp = ["Admin", "HR", "Manager"];
router.put("/leave/:leaveId/approve", protect, authorize(...noEmp), async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.leaveId,
      { status: "Approved", approvedBy: req.user.name, approvedAt: new Date() },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    res.json({ message: `Approved leave for ${leave.employeeName}`, leave });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/leave/:leaveId/reject", protect, authorize(...noEmp), async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.leaveId,
      { status: "Rejected", approvedBy: req.user.name, approvedAt: new Date() },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    res.json({ message: `Rejected leave for ${leave.employeeName}`, leave });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
