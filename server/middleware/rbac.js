const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and attach full user object to req.
// lastLogin is written only in authController.login, not on every request.
const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "No Token Provided" });
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive)
      return res.status(401).json({ message: "Invalid or Inactive Token" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token verification failed" });
  }
};

// Role-based gate factory. Usage: authorize("Admin","HR")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Role '" + req.user.role + "' is not authorized for this route",
    });
  }
  next();
};

module.exports = { protect, authorize };
