const Candidate   = require("../models/Candidate");
const Employee    = require("../models/Employee");
const Attendance  = require("../models/Attendance");
const Payroll     = require("../models/Payroll");
const Performance = require("../models/Performance");
const Leave       = require("../models/Leave");
const Interview   = require("../models/Interview");
const Onboarding  = require("../models/Onboarding");
const Notification= require("../models/Notification");
const User        = require("../models/User");

// ─── ADMIN / HR stats (company-wide) ──────────────────────
const getAdminStats = async (req, res) => {
  try {
    const todayStart = new Date(new Date().setHours(0,0,0,0));

    const [
      totalEmployees, totalCandidates, totalInterviews,
      shortlisted, rejected, needsReview, selectedCandidates,
      attendanceToday, wfhToday, absentToday,
      totalPayroll, processedPayroll, anomalies,
      pendingLeaves, activeOnboarding,
      avgScore, topPerformer,
      screenedCandidates
    ] = await Promise.all([
      Employee.countDocuments({ status: "Active" }),
      Candidate.countDocuments(),
      Interview.countDocuments(),
      Candidate.countDocuments({ status: "Shortlisted" }),
      Candidate.countDocuments({ status: "Rejected" }),
      Candidate.countDocuments({ status: "Review" }),
      Candidate.countDocuments({ status: "Selected" }),
      Attendance.countDocuments({ date: { $gte: todayStart }, status: "Present" }),
      Attendance.countDocuments({ date: { $gte: todayStart }, workMode: "WFH" }),
      Attendance.countDocuments({ date: { $gte: todayStart }, status: "Absent" }),
      Payroll.aggregate([{ $group: { _id: null, total: { $sum: "$netSalary" } } }]),
      Payroll.countDocuments({ status: "Processed" }),
      Payroll.countDocuments({ anomaly: true }),
      Leave.countDocuments({ status: "Pending" }),
      Onboarding.countDocuments({ status: "In Progress" }),
      Interview.aggregate([{ $group: { _id: null, avg: { $avg: "$overallScore" } } }]),
      Performance.findOne().sort({ aiScore: -1 }).select("employeeName aiScore department"),
      Candidate.countDocuments({ aiScore: { $gt: 0 } }),
    ]);

    const totalAttendanceToday = attendanceToday + absentToday;
    const attendanceRate = totalAttendanceToday > 0
      ? ((attendanceToday / totalAttendanceToday) * 100).toFixed(1)
      : 0;

    // AI screening accuracy: % of candidates that have been AI-scored
    const aiScreeningAccuracy = totalCandidates > 0
      ? parseFloat(((screenedCandidates / totalCandidates) * 100).toFixed(1))
      : 0;

    // Open positions: unique roles actively being hired (candidates in pipeline, not yet selected/rejected)
    const openRolesAgg = await Candidate.aggregate([
      { $match: { status: { $in: ["Applied", "Shortlisted", "Interview", "Review"] } } },
      { $group: { _id: "$appliedRole" } },
      { $count: "total" }
    ]);
    const openPositions = openRolesAgg[0]?.total || 0;

    // Hiring pipeline breakdown
    const pipeline = await Candidate.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const pipelineMap = {};
    pipeline.forEach(p => { pipelineMap[p._id] = p.count; });

    res.json({
      totalEmployees,
      totalCandidates,
      totalInterviews,
      openPositions,
      shortlisted,
      rejected,
      needsReview,
      selectedCandidates,
      presentToday: attendanceToday,
      wfhToday,
      absentToday,
      attendanceRate: parseFloat(attendanceRate),
      totalPayroll: totalPayroll[0]?.total || 0,
      processedPayroll,
      payrollAnomalies: anomalies,
      pendingLeaves,
      activeOnboarding,
      avgInterviewScore: parseFloat((avgScore[0]?.avg || 0).toFixed(1)),
      aiScreeningAccuracy,
      topPerformer,
      hiringPipeline: pipelineMap,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── MANAGER stats (team-focused) ─────────────────────────
const getManagerStats = async (req, res) => {
  try {
    const [
      totalEmployees, avgPerf, topPerformers,
      todayPresent, todayAbsent, pendingLeaves,
      payrollTotal, pipActive
    ] = await Promise.all([
      Employee.countDocuments({ status: "Active" }),
      Performance.aggregate([{ $group: { _id: null, avg: { $avg: "$aiScore" } } }]),
      Performance.countDocuments({ aiScore: { $gte: 85 } }),
      Attendance.countDocuments({
        date: { $gte: new Date(new Date().setHours(0,0,0,0)) },
        status: "Present"
      }),
      Attendance.countDocuments({
        date: { $gte: new Date(new Date().setHours(0,0,0,0)) },
        status: "Absent"
      }),
      Leave.countDocuments({ status: "Pending" }),
      Payroll.aggregate([{ $group: { _id: null, total: { $sum: "$netSalary" } } }]),
      Performance.countDocuments({ "pip.active": true }),
    ]);

    const deptBreakdown = await Employee.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const perfDist = await Performance.aggregate([
      { $group: { _id: "$quarter", avgScore: { $avg: "$aiScore" }, count: { $sum: 1 } } }
    ]);

    res.json({
      totalEmployees,
      avgPerformanceScore: parseFloat((avgPerf[0]?.avg || 0).toFixed(1)),
      topPerformers,
      todayPresent,
      todayAbsent,
      attendanceRate: todayPresent + todayAbsent > 0
        ? parseFloat(((todayPresent / (todayPresent + todayAbsent)) * 100).toFixed(1)) : 0,
      pendingLeaves,
      monthlyPayroll: payrollTotal[0]?.total || 0,
      pipActive,
      deptBreakdown,
      perfDistribution: perfDist,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── HR stats (recruitment-focused) ───────────────────────
const getHRStats = async (req, res) => {
  try {
    const todayStart = new Date(new Date().setHours(0,0,0,0));

    const [
      totalApplications, shortlisted, interviews,
      onboarding, pendingLeaves, todayInterviews,
      offerReadyCount, openPositionsAgg
    ] = await Promise.all([
      Candidate.countDocuments(),
      Candidate.countDocuments({ status: "Shortlisted" }),
      Interview.countDocuments(),
      Onboarding.countDocuments({ status: "In Progress" }),
      Leave.countDocuments({ status: "Pending" }),
      Interview.countDocuments({ createdAt: { $gte: todayStart } }),
      // Offer-ready = candidates marked Selected OR offerExtended
      Candidate.countDocuments({
        $or: [{ status: "Selected" }, { offerExtended: true }]
      }),
      // Open positions = distinct roles with active candidates
      Candidate.aggregate([
        { $match: { status: { $in: ["Applied", "Shortlisted", "Interview", "Review"] } } },
        { $group: { _id: "$appliedRole" } },
        { $count: "total" }
      ]),
    ]);

    const avgInterviewScore = await Interview.aggregate([
      { $group: { _id: null, avg: { $avg: "$overallScore" } } }
    ]);

    const statusFunnel = await Candidate.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.json({
      totalApplications,
      shortlisted,
      totalInterviews: interviews,
      activeOnboarding: onboarding,
      pendingLeaves,
      todayInterviews,
      avgInterviewScore: parseFloat((avgInterviewScore[0]?.avg || 0).toFixed(1)),
      offerReadyCount,
      openPositions: openPositionsAgg[0]?.total || 0,
      statusFunnel,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── EMPLOYEE stats (personal) ─────────────────────────────
const getEmployeeStats = async (req, res) => {
  try {
    // Resolve the actual employee name to query against seeded data.
    // Priority:
    //   1. User.employeeProfileId → Employee.name  (linked record — most accurate)
    //   2. req.user.name as fallback
    let empName = req.user?.name;

    if (req.user?.employeeProfileId) {
      const linked = await Employee.findById(req.user.employeeProfileId).select("name").lean();
      if (linked?.name) empName = linked.name;
    } else {
      // Try to find an Employee record whose name exactly matches the User name
      const byName = await Employee.findOne({
        name: { $regex: new RegExp("^" + empName + "$", "i") }
      }).select("name").lean();
      if (byName?.name) empName = byName.name;
    }

    const nameRx = new RegExp(empName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [attAll, attPresent, myLeaves, myPayrolls, myPerf] = await Promise.all([
      Attendance.countDocuments({ employeeName: nameRx }),
      Attendance.countDocuments({ employeeName: nameRx, status: "Present" }),
      Leave.find({ employeeName: nameRx }).sort({ createdAt: -1 }).limit(5),
      Payroll.find({ employeeName: nameRx }).sort({ createdAt: -1 }).limit(3),
      Performance.find({ employeeName: nameRx }).sort({ createdAt: -1 }).limit(1),
    ]);

    const attendanceRate = attAll > 0 ? parseFloat(((attPresent / attAll) * 100).toFixed(1)) : 0;
    const latestPayroll = myPayrolls[0] || null;
    const latestPerf = myPerf[0] || null;
    const pendingLeaves = myLeaves.filter(l => l.status === "Pending").length;
    const approvedLeaves = myLeaves.filter(l => l.status === "Approved").length;

    res.json({
      attendanceDays: attAll,
      presentDays: attPresent,
      attendanceRate,
      pendingLeaves,
      approvedLeaves,
      totalLeaves: myLeaves.length,
      latestNetSalary: latestPayroll?.netSalary || 0,
      latestPayroll,
      performanceRating: latestPerf?.rating || 0,
      performanceAiScore: latestPerf?.aiScore || 0,
      recentLeaves: myLeaves,
      recentPayrolls: myPayrolls,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Main router — dispatches by role ─────────────────────
const getDashboardStats = async (req, res) => {
  const role = req.user?.role;
  if (role === "Admin")   return getAdminStats(req, res);
  if (role === "Manager") return getManagerStats(req, res);
  if (role === "HR")      return getHRStats(req, res);
  return getEmployeeStats(req, res);
};

// ─── Legacy endpoint (kept for backward compat) ───────────
const getLegacyStats = async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const shortlisted = await Candidate.countDocuments({ aiScore: { $gte: 80 } });
    const candidates = await Candidate.find().select("aiScore");
    const averageScore = candidates.length > 0
      ? (candidates.reduce((s, c) => s + (c.aiScore || 0), 0) / candidates.length).toFixed(2)
      : 0;
    const topCandidate = await Candidate.findOne().sort({ aiScore: -1 });
    res.json({ totalCandidates, shortlisted, averageScore, topCandidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDashboardStats, getLegacyStats };
