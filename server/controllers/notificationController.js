const Notification = require("../models/Notification");
const Leave        = require("../models/Leave");
const Payroll      = require("../models/Payroll");

const getNotifications = async (req, res) => {
  try {
    const role   = req.user?.role;
    const userId = req.user?._id;

    // Stored notifications
    const stored = await Notification.find({
      $or: [{ userId }, { role }, { role: "All" }]
    }).sort({ createdAt: -1 }).limit(30);

    const dynamic = [];

    if (["Admin", "HR", "Manager"].includes(role)) {
      // Pending leave requests → each becomes an actionable notification
      const pendingLeaves = await Leave.find({ status: "Pending" })
        .sort({ createdAt: -1 }).limit(15);

      pendingLeaves.forEach(l => {
        dynamic.push({
          _id:          "leave_" + l._id,
          type:         "Leave",
          message:      `${l.employeeName} requested ${l.leaveType} from ${l.startDate || "?"} to ${l.endDate || "?"}`,
          icon:         "📋",
          color:        "#f59e0b",
          read:         false,
          actionType:   "leave_approval",
          actionId:     String(l._id),
          employeeName: l.employeeName,
          createdAt:    l.createdAt,
        });
      });

      // Payroll anomalies
      const anomalies = await Payroll.find({ anomaly: true }).limit(5);
      anomalies.forEach(p => {
        dynamic.push({
          _id:       "pay_" + p._id,
          type:      "Payroll",
          message:   `Payroll anomaly flagged — ${p.employeeName}: ${p.anomalyNote || "Manual review needed"}`,
          icon:      "⚠",
          color:     "#ff5c5c",
          read:      false,
          createdAt: p.createdAt,
        });
      });

      // System: pending leave count summary if any
      if (pendingLeaves.length > 0) {
        dynamic.unshift({
          _id:       "sys_leave_summary",
          type:      "AI Alert",
          message:   `${pendingLeaves.length} leave request${pendingLeaves.length > 1 ? "s" : ""} pending your approval. Review and action below.`,
          icon:      "🤖",
          color:     "#00e5a8",
          read:      false,
          createdAt: new Date(),
        });
      }
    }

    res.json([...dynamic, ...stored]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "Marked as read" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createNotification = async (req, res) => {
  try {
    const notif = await Notification.create(req.body);
    res.status(201).json(notif);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getNotifications, markRead, createNotification };
