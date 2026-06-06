const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize:     20,   // connection pool for 5000+ concurrent users
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected");

    // Create indexes after connection is established
    // These run once and are no-ops if indexes already exist
    await ensureIndexes();
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    process.exit(1);
  }
};

const ensureIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // Users — login speed
    await db.collection("users").createIndex({ email: 1 }, { unique: true, background: true });
    await db.collection("users").createIndex({ role: 1 },  { background: true });

    // Candidates — frequent filtering by status and score
    await db.collection("candidates").createIndex({ status: 1, aiScore: -1 }, { background: true });
    await db.collection("candidates").createIndex({ email: 1 },               { unique: true, background: true, sparse: true });
    await db.collection("candidates").createIndex({ createdAt: -1 },          { background: true });

    // Employees — search by name, department
    await db.collection("employees").createIndex({ name: "text", department: "text" }, { background: true });
    await db.collection("employees").createIndex({ status: 1, department: 1 }, { background: true });
    await db.collection("employees").createIndex({ email: 1 }, { background: true });

    // Attendance — range queries by date and name (most frequent query pattern)
    await db.collection("attendances").createIndex({ employeeName: 1, date: -1 }, { background: true });
    await db.collection("attendances").createIndex({ date: -1, status: 1 },       { background: true });

    // Payroll — per-employee queries
    await db.collection("payrolls").createIndex({ employeeName: 1, createdAt: -1 }, { background: true });
    await db.collection("payrolls").createIndex({ department: 1 },                   { background: true });

    // Performance — leaderboard queries
    await db.collection("performances").createIndex({ aiScore: -1 },                { background: true });
    await db.collection("performances").createIndex({ employeeName: 1, createdAt: -1 }, { background: true });

    // Leaves — approval workflow
    await db.collection("leaves").createIndex({ status: 1, createdAt: -1 }, { background: true });
    await db.collection("leaves").createIndex({ employeeName: 1, status: 1 }, { background: true });

    // Interviews — recent first
    await db.collection("interviews").createIndex({ createdAt: -1 }, { background: true });

    // Notifications — per-user unread feed
    await db.collection("notifications").createIndex({ userId: 1, read: 1, createdAt: -1 }, { background: true });

    // Onboarding — status queries
    await db.collection("onboardings").createIndex({ status: 1 }, { background: true });

    console.log("MongoDB indexes ensured");
  } catch (err) {
    // Index creation is non-critical at startup
    console.warn("Index creation warning:", err.message);
  }
};

module.exports = connectDB;
