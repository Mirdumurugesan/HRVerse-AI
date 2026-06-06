const Candidate   = require("../models/Candidate");
const Employee    = require("../models/Employee");
const Attendance  = require("../models/Attendance");
const Payroll     = require("../models/Payroll");
const Performance = require("../models/Performance");
const Interview   = require("../models/Interview");
const Leave       = require("../models/Leave");

// Hiring funnel from real Candidate statuses
const getHiringFunnel = async (req, res) => {
  try {
    const total       = await Candidate.countDocuments();
    const screened    = await Candidate.countDocuments({ aiScore: { $gt: 0 } });
    const shortlisted = await Candidate.countDocuments({ status: "Shortlisted" });
    const interviewed = await Interview.countDocuments();
    const selected    = await Candidate.countDocuments({ status: "Selected" });
    res.json([
      { stage: "Applications", value: total,       color: "#1da1ff" },
      { stage: "AI Screened",  value: screened,    color: "#8b5cf6" },
      { stage: "Shortlisted",  value: shortlisted, color: "#00e5a8" },
      { stage: "Interviewed",  value: interviewed, color: "#f59e0b" },
      { stage: "Selected",     value: selected,    color: "#00e5a8" },
    ]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Top skills from candidates
const getSkillDistribution = async (req, res) => {
  try {
    const result = await Candidate.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json(result.map(r => ({ name: r._id, count: r.count })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// AI score buckets
const getScoreDistribution = async (req, res) => {
  try {
    const ranges = [
      { range: "0-20",   min: 0,  max: 20  },
      { range: "21-40",  min: 21, max: 40  },
      { range: "41-60",  min: 41, max: 60  },
      { range: "61-80",  min: 61, max: 80  },
      { range: "81-100", min: 81, max: 100 },
    ];
    const data = await Promise.all(
      ranges.map(async r => ({
        range: r.range,
        value: await Candidate.countDocuments({ aiScore: { $gte: r.min, $lte: r.max } }),
      }))
    );
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Department breakdown — real attrition from employee status
const getDepartmentMetrics = async (req, res) => {
  try {
    const depts = await Employee.aggregate([
      { $group: {
          _id: "$department",
          headcount:    { $sum: 1 },
          avgSalary:    { $avg: "$salary" },
          resigned:     { $sum: { $cond: [{ $in: ["$status", ["Resigned","Terminated"]] }, 1, 0] } },
      }},
      { $sort: { headcount: -1 } },
    ]);

    const perfByDept = await Performance.aggregate([
      { $group: { _id: "$department", avgScore: { $avg: "$aiScore" } } },
    ]);
    const perfMap = {};
    perfByDept.forEach(p => { if (p._id) perfMap[p._id] = p.avgScore; });

    const result = depts.map(d => ({
      dept:        d._id || "Unknown",
      headcount:   d.headcount,
      avgSalary:   Math.round(d.avgSalary || 0),
      performance: parseFloat((perfMap[d._id] || 0).toFixed(1)),
      attrition:   d.headcount > 0
        ? parseFloat(((d.resigned / d.headcount) * 100).toFixed(1))
        : 0,
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Attendance trends — last 7 days using UTC midnight (consistent with markAttendance)
const getAttendanceTrends = async (req, res) => {
  try {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const now   = new Date();
      const start = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i
      ));
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

      const [present, absent] = await Promise.all([
        Attendance.countDocuments({ date: { $gte: start, $lt: end }, status: "Present" }),
        Attendance.countDocuments({ date: { $gte: start, $lt: end }, status: "Absent"  }),
      ]);
      result.push({
        day:     start.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
        present,
        absent,
        total:   present + absent,
      });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Payroll analytics
const getPayrollAnalytics = async (req, res) => {
  try {
    const [totalNet, avgNet, deptPayroll, anomalyCount] = await Promise.all([
      Payroll.aggregate([{ $group: { _id: null, total: { $sum: "$netSalary" } } }]),
      Payroll.aggregate([{ $group: { _id: null, avg:   { $avg: "$netSalary" } } }]),
      Payroll.aggregate([
        { $group: { _id: "$department", total: { $sum: "$netSalary" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Payroll.countDocuments({ anomaly: true }),
    ]);
    res.json({
      totalPayroll: totalNet[0]?.total || 0,
      avgSalary:    Math.round(avgNet[0]?.avg || 0),
      anomalyCount,
      deptPayroll:  deptPayroll.map(d => ({ dept: d._id || "Unknown", total: d.total, count: d.count })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Performance analytics — readable bucket labels
const getPerformanceAnalytics = async (req, res) => {
  try {
    const [rawDist, top5, pipCount, promoCount] = await Promise.all([
      Performance.aggregate([{
        $bucket: {
          groupBy: "$aiScore",
          boundaries: [0, 40, 60, 80, 90, 101],
          default:    "Other",
          output:     { count: { $sum: 1 } },
        },
      }]),
      Performance.find().sort({ aiScore: -1 }).limit(5)
        .select("employeeName aiScore department rating"),
      Performance.countDocuments({ "pip.active": true }),
      Performance.countDocuments({ promotionReady: true }),
    ]);

    const labels = { 0: "0-39", 40: "40-59", 60: "60-79", 80: "80-89", 90: "90-100", Other: "Other" };
    const dist = rawDist.map(b => ({ range: labels[b._id] || String(b._id), count: b.count }));

    res.json({ dist, top5, pipCount, promoCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Interview analytics
const getInterviewAnalytics = async (req, res) => {
  try {
    const total = await Interview.countDocuments();
    const avgScores = await Interview.aggregate([{
      $group: {
        _id:        null,
        avgComm:    { $avg: "$communicationScore" },
        avgConf:    { $avg: "$confidenceScore"    },
        avgTech:    { $avg: "$technicalScore"     },
        avgSent:    { $avg: "$sentimentScore"     },
        avgOverall: { $avg: "$overallScore"       },
      },
    }]);
    const recommendations = await Interview.aggregate([
      { $group: { _id: "$recommendation", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({
      total,
      avgScores:       avgScores[0] || {},
      recommendations,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Overall attendance % (all-time, aggregated via pipeline)
const getAttendanceSummary = async (req, res) => {
  try {
    const result = await Attendance.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {};
    result.forEach(r => { statusMap[r._id] = r.count; });

    const present  = statusMap["Present"]  || 0;
    const absent   = statusMap["Absent"]   || 0;
    const leave    = statusMap["Leave"]    || 0;
    const halfDay  = statusMap["Half Day"] || 0;
    const late     = statusMap["Late"]     || 0;
    const total    = present + absent + leave + halfDay + late;

    const attendancePct = total > 0
      ? parseFloat(((present / total) * 100).toFixed(1))
      : 0;

    res.json({ present, absent, leave, halfDay, late, total, attendancePct, statusMap });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Leave breakdown by type and status
const getLeaveAnalytics = async (req, res) => {
  try {
    const [byType, byStatus, monthlyTrend] = await Promise.all([
      Leave.aggregate([
        { $group: { _id: "$leaveType", count: { $sum: 1 }, totalDays: { $sum: "$days" } } },
        { $sort: { count: -1 } },
      ]),
      Leave.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Leave.aggregate([
        {
          $group: {
            _id: {
              year:  { $year:  { $toDate: "$startDate" } },
              month: { $month: { $toDate: "$startDate" } },
            },
            count:    { $sum: 1 },
            totalDays:{ $sum: "$days" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ]),
    ]);

    const pending  = byStatus.find(s => s._id === "Pending")?.count  || 0;
    const approved = byStatus.find(s => s._id === "Approved")?.count || 0;
    const rejected = byStatus.find(s => s._id === "Rejected")?.count || 0;

    res.json({
      byType:  byType.map(t => ({ type: t._id, count: t.count, totalDays: t.totalDays })),
      byStatus:{ pending, approved, rejected },
      monthlyTrend: monthlyTrend.map(m => ({
        label:     `${m._id.year}-${String(m._id.month).padStart(2,"0")}`,
        count:     m.count,
        totalDays: m.totalDays,
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Monthly payroll trend (last 12 months)
const getPayrollTrend = async (req, res) => {
  try {
    const trend = await Payroll.aggregate([
      {
        $group: {
          _id:        { year: "$year", month: "$month" },
          totalNet:   { $sum: "$netSalary" },
          totalBasic: { $sum: "$basicSalary" },
          count:      { $sum: 1 },
          anomalies:  { $sum: { $cond: ["$anomaly", 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    res.json(trend.map(t => ({
      label:      `${t._id.month || ""} ${t._id.year || ""}`.trim(),
      totalNet:   t.totalNet,
      totalBasic: t.totalBasic,
      count:      t.count,
      anomalies:  t.anomalies,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Headcount summary: total, active, by work mode
const getHeadcountSummary = async (req, res) => {
  try {
    const [statusBreakdown, workModeBreakdown, deptCount] = await Promise.all([
      Employee.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Employee.aggregate([
        { $group: { _id: "$workMode", count: { $sum: 1 } } },
      ]),
      Employee.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const total  = statusBreakdown.reduce((s, r) => s + r.count, 0);
    const active = statusBreakdown.find(r => r._id === "Active")?.count || 0;

    res.json({
      total,
      active,
      statusBreakdown:   statusBreakdown.map(r => ({ status: r._id, count: r.count })),
      workModeBreakdown: workModeBreakdown.map(r => ({ mode: r._id, count: r.count })),
      deptCount:         deptCount.map(r => ({ dept: r._id || "Unknown", count: r.count })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = {
  getHiringFunnel, getSkillDistribution, getScoreDistribution,
  getDepartmentMetrics, getAttendanceTrends, getPayrollAnalytics,
  getPerformanceAnalytics, getInterviewAnalytics,
  getAttendanceSummary, getLeaveAnalytics, getPayrollTrend, getHeadcountSummary,
};
