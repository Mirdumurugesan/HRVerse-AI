const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/rbac");
const { getNotifications, markRead, createNotification } = require("../controllers/notificationController");

router.get  ("/",         protect, getNotifications);
router.put  ("/:id/read", protect, markRead);
router.post ("/",         protect, createNotification);

module.exports = router;
