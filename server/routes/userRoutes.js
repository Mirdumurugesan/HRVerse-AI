const express  = require("express");
const router   = express.Router();
const { protect } = require("../middleware/rbac");

// GET /api/user/profile — returns the full authenticated user profile (no password)
router.get("/profile", protect, (req, res) => {
  res.json({
    id:        req.user._id,
    name:      req.user.name,
    email:     req.user.email,
    role:      req.user.role,
    isActive:  req.user.isActive,
    lastLogin: req.user.lastLogin,
    avatar:    req.user.avatar,
  });
});

module.exports = router;
