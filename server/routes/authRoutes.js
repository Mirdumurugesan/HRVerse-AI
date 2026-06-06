const express    = require("express");
const router     = express.Router();
const rateLimit  = require("express-rate-limit");
const { register, login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/rbac");

// 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs:    15 * 60 * 1000,
  max:         10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

// 5 registrations per hour per IP (prevents spam account creation)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      5,
  message:  { message: "Too many registration attempts. Please try again later." },
});

router.post("/register", registerLimiter, register);
router.post("/login",    loginLimiter,    login);
router.get  ("/me",      protect,         getProfile);

module.exports = router;
