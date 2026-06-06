const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?._id;
    const notifs = await Notification.find({
      $or: [{ userId }, { role }, { role: "All" }]
    }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
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
