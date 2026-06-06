const User     = require("../models/User");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const AuditLog = require("../models/AuditLog");
const Employee = require("../models/Employee");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    const safeRoles  = ["HR", "Employee", "Manager"];
    const requestedRole = role || "Employee";
    let userRole = "Employee";

    if (requestedRole === "Admin") {
      const existingAdmin = await User.findOne({ role: "Admin" });
      if (existingAdmin) {
        return res.status(403).json({ message: "Admin account already exists. Contact your system administrator." });
      }
      userRole = "Admin";
    } else if (safeRoles.includes(requestedRole)) {
      userRole = requestedRole;
    }

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed, role: userRole });

    await AuditLog.create({
      userId:   user._id,
      userRole: userRole,
      action:   "USER_REGISTER",
      entity:   "User",
      entityId: user._id.toString(),
      details:  `${name} registered as ${userRole}`,
      success:  true,
      ip:       req.ip,
    });

    res.status(201).json({
      message: "User Registered",
      user: { id: user._id, name, email, role: userRole },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user)        return res.status(400).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account deactivated. Contact Admin." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid Credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({
      userId:   user._id,
      userRole: user.role,
      action:   "USER_LOGIN",
      entity:   "User",
      entityId: user._id.toString(),
      details:  `${user.name} logged in`,
      success:  true,
      ip:       req.ip,
    });

    res.json({
      message: "Login Successful",
      token,
      role:   user.role,
      name:   user.name,
      userId: user._id,
      email:  user.email,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
const getProfile = async (req, res) => {
  try {
    // Resolve the linked Employee record name so the frontend can display
    // and query using the correct seeded employee name (not the login display name).
    let employeeName = req.user.name;
    if (req.user.employeeProfileId) {
      const emp = await Employee.findById(req.user.employeeProfileId).select("name").lean();
      if (emp?.name) employeeName = emp.name;
    }

    res.json({
      id:           req.user._id,
      name:         req.user.name,
      employeeName, // resolved real employee name for data queries
      email:        req.user.email,
      role:         req.user.role,
      isActive:     req.user.isActive,
      lastLogin:    req.user.lastLogin,
      avatar:       req.user.avatar,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getProfile };
