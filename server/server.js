require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const compression = require("compression");
const connectDB   = require("./config/db");
const { validateConnections } = require("./services/aiService");

connectDB();

const app = express();

// ── Security headers ────────────────────────────────────────
// ── Gzip compression — reduces JSON payload size by 60-80% ──
app.use(compression());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow file serving
  contentSecurityPolicy: false,                           // disabled — frontend is separate origin
}));

// ── CORS — allow only the Vite dev server + production origin
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow REST tools (Postman / curl) and same-origin requests where origin is undefined
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("CORS: origin not allowed — " + origin));
  },
  credentials: true,
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Core Auth ───────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/user",          require("./routes/userRoutes"));

// ── Dashboard & Analytics ───────────────────────────────────
app.use("/api/dashboard",     require("./routes/dashboardRoutes"));
app.use("/api/analytics",     require("./routes/analyticsRoutes"));

// ── Recruitment ─────────────────────────────────────────────
app.use("/api/candidates",    require("./routes/candidateRoutes"));
app.use("/api/resume",        require("./routes/resumeRoutes"));
app.use("/api/interview",     require("./routes/interviewRoutes"));
app.use("/api/ranking",       require("./routes/rankingRoutes"));

// ── People Ops ──────────────────────────────────────────────
app.use("/api/employees",     require("./routes/employeeRoutes"));
app.use("/api/onboarding",    require("./routes/onboardingRoutes"));
app.use("/api/attendance",    require("./routes/attendanceRoutes"));
app.use("/api/payroll",       require("./routes/payrollRoutes"));
app.use("/api/performance",   require("./routes/performanceRoutes"));
app.use("/api/leaves",        require("./routes/leaveRoutes"));

// ── AI & Notifications ──────────────────────────────────────
app.use("/api/ai",            require("./routes/aiRoutes"));
app.use("/api/ai-assistant",  require("./routes/aiAssistantRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/", (req, res) => res.send("HRVerse AI Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log("Server Running on Port " + PORT);
  console.log("\n── AI Provider Startup Validation ─────────────────────────");
  try {
    await validateConnections();
  } catch (e) {
    console.warn("  AI validation error:", e.message);
  }
  console.log("────────────────────────────────────────────────────────\n");
});
