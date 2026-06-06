/**
 * HRVerse AI — Master Seed Script  (seedAll.js)
 *
 * Idempotent: checks existing counts first and only inserts what is missing.
 * Covers ALL 10 collections:
 *   Users, Employees, Candidates, Attendance, Payroll,
 *   Performance, Leave, Onboarding, Interviews, Notifications
 *
 * Minimums enforced:
 *   Employees    5 000+   Attendance  100 000+   Candidates 1 000+
 *   Payroll      5 000+   Performance  5 000+    Leave        500+
 *   Interviews     500+   Onboarding    500+     Notifications 100+
 *   Users             4+  (Admin + Manager + HR + Employees)
 *
 * Usage:
 *   node seedAll.js            ← top-up mode (safe to re-run)
 *   node seedAll.js --clear    ← wipe all seeded collections first
 *   node seedAll.js --count    ← count-only, no inserts
 *
 * Run from: HRVerse-AI/server/
 *   cd server && node seedAll.js
 */

"use strict";
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ── Models ─────────────────────────────────────────────────────────────────────
const User         = require("./models/User");
const Employee     = require("./models/Employee");
const Candidate    = require("./models/Candidate");
const Attendance   = require("./models/Attendance");
const Payroll      = require("./models/Payroll");
const Performance  = require("./models/Performance");
const Leave        = require("./models/Leave");
const Onboarding   = require("./models/Onboarding");
const Interview    = require("./models/Interview");
const Notification = require("./models/Notification");

// ── Targets ────────────────────────────────────────────────────────────────────
const TARGET = {
  employees:     5000,
  candidates:    2000,
  attendance:  100000,
  payroll:       5000,
  performance:   5000,
  leave:         8000,
  onboarding:    1000,
  interviews:     600,   // new — was 0
  notifications:  150,   // new — was 0
};

// ── Reference data ─────────────────────────────────────────────────────────────
const DEPARTMENTS  = ["Engineering","AI/ML","HR","Finance","Operations","Management"];
const LOCATIONS    = ["Bangalore","Chennai","Hyderabad","Mumbai","Dubai","Singapore"];
const WORK_MODES   = ["Office","WFH","Hybrid"];
const EMP_STATUSES = ["Active","Active","Active","Active","Onboarding","On Leave","Resigned","Terminated"];

const DESIGNATIONS = {
  Engineering: ["Software Engineer","Senior Engineer","Tech Lead","Engineering Manager","Principal Engineer","Staff Engineer"],
  "AI/ML":     ["ML Engineer","Data Scientist","AI Researcher","MLOps Engineer","Senior Data Scientist","AI Lead"],
  HR:          ["HR Executive","HR Manager","Recruiter","HRBP","Talent Acquisition Lead","HR Director"],
  Finance:     ["Financial Analyst","Senior Analyst","Finance Manager","Controller","CFO","Accounts Executive"],
  Operations:  ["Operations Analyst","Process Manager","Ops Lead","Business Analyst","Operations Head"],
  Management:  ["Product Manager","Program Manager","VP","Director","CTO","CEO"],
};

const SKILLS_POOL = {
  Engineering: ["Java","Python","React","Node.js","TypeScript","Go","Kubernetes","Docker","AWS","PostgreSQL","Redis","gRPC"],
  "AI/ML":     ["PyTorch","TensorFlow","Scikit-learn","LangChain","Hugging Face","MLflow","Spark","Pandas","OpenCV","CUDA","RAG","LLM Fine-tuning"],
  HR:          ["Recruitment","HRIS","Employee Relations","Payroll Processing","Training & Development","Performance Management"],
  Finance:     ["Financial Modelling","Excel","Tally","SAP","Budget Planning","Tax Compliance","Audit"],
  Operations:  ["Process Optimization","Six Sigma","Project Management","JIRA","Agile","Supply Chain"],
  Management:  ["Strategic Planning","OKRs","Stakeholder Management","Product Roadmap","P&L Management"],
};

const SALARY_RANGES = {
  Engineering: [600000,2800000], "AI/ML":[800000,3500000], HR:[400000,1600000],
  Finance:[500000,2000000], Operations:[450000,1800000], Management:[1200000,5000000],
};

const FIRST_NAMES = [
  "Aarav","Aditya","Akash","Amit","Ananya","Anika","Anjali","Arjun","Aryan","Ashwin",
  "Bhavya","Chetan","Deepa","Deepak","Divya","Gaurav","Harini","Harsh","Ishaan","Jaya",
  "Karan","Kavya","Keerthana","Krish","Lavanya","Madhav","Manoj","Meera","Mihir","Mira",
  "Nandini","Nikhil","Nisha","Nitesh","Pooja","Pranav","Prashant","Priya","Rahul","Raj",
  "Rakesh","Ramesh","Ravi","Ritika","Rohit","Roshan","Sachin","Sahana","Samir","Sanjay",
  "Saniya","Sara","Shruti","Siddharth","Sneha","Sohan","Suresh","Swati","Tanvi","Tarun",
  "Uday","Uma","Varun","Vijay","Vikram","Vineeth","Vishal","Vivek","Yash","Zara",
  "Abhinav","Aishwarya","Ajay","Akshay","Amita","Anand","Asha","Bharat","Chandra","Deva",
  "Gita","Gopal","Hema","Indu","Jagdish","Kamal","Kiran","Lata","Mohan","Naina",
  "Nitin","Padma","Pankaj","Parveen","Prakash","Radha","Rajesh","Rekha","Renu","Rina",
];

const LAST_NAMES = [
  "Sharma","Verma","Singh","Kumar","Gupta","Patel","Rao","Nair","Menon","Iyer",
  "Pillai","Reddy","Naidu","Joshi","Mishra","Pandey","Tiwari","Dubey","Shukla","Srivastava",
  "Agarwal","Bansal","Goel","Jain","Mittal","Saxena","Trivedi","Bose","Das","Sen",
  "Chatterjee","Mukherjee","Ghosh","Roy","Dutta","Chakraborty","Bhat","Hegde","Shetty","Kamath",
  "Kulkarni","Desai","Patil","More","Jadhav","Shinde","Pawar","Kadam","Mane","Thorat",
  "Rajan","Krishnan","Subramaniam","Balakrishnan","Natarajan","Venkatesh","Annamalai","Murugan","Selvam","Arumugam",
  "Choudhary","Bajaj","Kapoor","Malhotra","Mehra","Chopra","Arora","Bedi","Grewal","Gill",
  "Ahmed","Khan","Sheikh","Ansari","Siddiqui","Qureshi","Malik","Mirza","Baig","Hussain",
];

const LEAVE_TYPES  = ["Sick Leave","Annual Leave","Casual Leave","WFH","Emergency","Paternity","Maternity"];
const LEAVE_STATUS = ["Pending","Approved","Approved","Approved","Rejected"];
const QUARTERS     = ["Q1 2025","Q2 2025","Q3 2025","Q4 2025","Q1 2026","Q2 2026"];
const APPLIED_ROLES = [
  "Software Engineer","Senior Software Engineer","AI/ML Engineer","Data Scientist",
  "Product Manager","HR Executive","Finance Analyst","Operations Manager","Tech Lead","DevOps Engineer",
];

// ── Utilities ──────────────────────────────────────────────────────────────────
const rand     = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick     = (arr)      => arr[rand(0, arr.length - 1)];
const pickN    = (arr, n)   => [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
const padId    = (n)        => "FWC" + String(n).padStart(5, "0");
const phone    = ()         => "+91-" + rand(70000, 99999) + rand(10000, 99999);
const fullName = ()         => pick(FIRST_NAMES) + " " + pick(LAST_NAMES);

const workEmail  = (name, idx) => name.toLowerCase().replace(/[^a-z0-9]/g, ".") + "." + idx + "@fwcit.com";
const candEmail  = (name, idx) => name.toLowerCase().replace(/[^a-z0-9]/g, "_") + idx + "@" + pick(["gmail.com","yahoo.com","outlook.com","hotmail.com"]);

const dateInRange = (start, end) => {
  const s = new Date(start).getTime(), e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s));
};

const checkInTime  = () => `${String(rand(8, 10)).padStart(2,"0")}:${String(rand(0, 59)).padStart(2,"0")}`;
const checkOutTime = () => `${String(rand(17, 21)).padStart(2,"0")}:${String(rand(0, 59)).padStart(2,"0")}`;

// ── Batch insert ──────────────────────────────────────────────────────────────
const BATCH = 1000;
const insertBatch = async (Model, docs, label) => {
  if (docs.length === 0) return;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    await Model.insertMany(slice, { ordered: false }).catch(e => {
      if (e.code !== 11000 && !e.message.includes("duplicate")) {
        console.warn(`  ⚠  ${label} insertMany warn:`, e.message.slice(0, 100));
      }
    });
    inserted += slice.length;
    process.stdout.write(`\r  → ${label}: ${inserted}/${docs.length}`);
  }
  console.log();
};

// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   HRVerse AI — Master Seed Script (seedAll.js)      ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  if (!process.env.MONGO_URI) {
    console.error("❌  MONGO_URI not set. Ensure server/.env exists.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  MongoDB connected\n");

  // ── Count-only mode ──────────────────────────────────────────────────────
  if (process.argv.includes("--count")) {
    await printCounts();
    await mongoose.disconnect();
    return;
  }

  // ── Clear mode ────────────────────────────────────────────────────────────
  if (process.argv.includes("--clear")) {
    console.log("🗑   --clear: dropping all seeded collections…");
    await Promise.all([
      Employee.deleteMany({}),
      Candidate.deleteMany({}),
      Attendance.deleteMany({}),
      Payroll.deleteMany({}),
      Performance.deleteMany({}),
      Leave.deleteMany({}),
      Onboarding.deleteMany({}),
      Interview.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log("    Done.\n");
  }

  // ── Pre-seed counts ───────────────────────────────────────────────────────
  console.log("📊  Current collection counts:");
  const pre = await getCounts();
  printCountTable(pre, "BEFORE");

  // ══════════════════════════════════════════════════════════════════════════
  // 1. EMPLOYEES
  // ══════════════════════════════════════════════════════════════════════════
  const empNeed = Math.max(0, TARGET.employees - pre.employees);
  if (empNeed > 0) {
    console.log(`\n👥  Seeding ${empNeed} Employees (have ${pre.employees}, need ${TARGET.employees})…`);
    const start = pre.employees;
    const docs  = [];
    for (let i = 1; i <= empNeed; i++) {
      const dept   = pick(DEPARTMENTS);
      const name   = fullName();
      docs.push({
        employeeId:       padId(start + i),
        name,
        email:            workEmail(name, start + i),
        phone:            phone(),
        department:       dept,
        designation:      pick(DESIGNATIONS[dept]),
        location:         pick(LOCATIONS),
        joiningDate:      dateInRange("2018-01-01", "2026-05-15"),
        salary:           rand(...SALARY_RANGES[dept]),
        skills:           pickN(SKILLS_POOL[dept], rand(3, 7)),
        status:           pick(EMP_STATUSES),
        workMode:         pick(WORK_MODES),
        performanceScore: rand(45, 100),
      });
    }
    await insertBatch(Employee, docs, "Employee");
    console.log("   ✅  Employees done");
  } else {
    console.log(`\n👥  Employees OK (${pre.employees} ≥ ${TARGET.employees})`);
  }

  // Load all employees for linking
  const employees = await Employee.find({}, "_id name department location salary joiningDate").lean();
  console.log(`   📎  Loaded ${employees.length} employee records for linking`);

  // ══════════════════════════════════════════════════════════════════════════
  // 2. CANDIDATES
  // ══════════════════════════════════════════════════════════════════════════
  const candNeed = Math.max(0, TARGET.candidates - pre.candidates);
  if (candNeed > 0) {
    console.log(`\n📄  Seeding ${candNeed} Candidates…`);
    const base = pre.candidates;
    const docs  = [];
    for (let i = 1; i <= candNeed; i++) {
      const name   = fullName();
      const dept   = pick(DEPARTMENTS);
      const score  = rand(38, 98);
      const status = score >= 80 ? "Shortlisted" : score >= 60 ? "Review" : pick(["Applied","Rejected","Interview"]);
      docs.push({
        name,
        email:          candEmail(name, base + i),
        phone:          phone(),
        skills:         pickN(SKILLS_POOL[dept], rand(2, 6)),
        experience:     rand(0, 15),
        education:      pick(["B.Tech CSE","B.E. IT","M.Tech","MCA","BCA","BSc CS","MBA"]),
        resume:         "",
        status,
        aiScore:        score,
        summary:        `${name} has ${rand(1,15)} years of experience with strong ${pick(SKILLS_POOL[dept])} skills.`,
        strengths:      pickN(["Problem Solving","Communication","Leadership","Teamwork","Adaptability","Technical Depth","Ownership"], 3),
        weaknesses:     pickN(["Needs More Cloud Exposure","Limited Team Leadership","English fluency","Presentation skills"], 2),
        recommendation: score >= 80 ? "Shortlisted" : score >= 60 ? "Consider" : "Rejected",
        appliedRole:    pick(APPLIED_ROLES),
        interviewDate:  score >= 60 ? dateInRange("2025-01-01", "2026-06-01") : undefined,
        offerExtended:  status === "Selected",
      });
    }
    await insertBatch(Candidate, docs, "Candidate");
    console.log("   ✅  Candidates done");
  } else {
    console.log(`\n📄  Candidates OK (${pre.candidates} ≥ ${TARGET.candidates})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. ATTENDANCE
  // ══════════════════════════════════════════════════════════════════════════
  const attNeed = Math.max(0, TARGET.attendance - pre.attendance);
  if (attNeed > 0) {
    console.log(`\n🕐  Seeding attendance records (have ${pre.attendance}, need ${TARGET.attendance})…`);

    // Build working-day list: all weekdays May 2026 + June 2026 up to today
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const workdays = [];
    for (let m = 4; m <= 5; m++) {   // 4=May, 5=June (0-indexed)
      const daysInMonth = m === 4 ? 31 : today.getMonth() === 5 ? today.getDate() : 30;
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(2026, m, d); dt.setHours(0, 0, 0, 0);
        if (dt.getDay() !== 0 && dt.getDay() !== 6 && dt <= today) workdays.push(new Date(dt));
      }
    }
    // Also add April 2026 weekdays for depth
    for (let d = 1; d <= 30; d++) {
      const dt = new Date(2026, 3, d); dt.setHours(0, 0, 0, 0);  // 3=April
      if (dt.getDay() !== 0 && dt.getDay() !== 6) workdays.push(new Date(dt));
    }

    // Sample enough employees to hit the target
    const empsNeeded = Math.ceil(attNeed / workdays.length);
    const empSample  = employees.slice(0, Math.min(empsNeeded + 200, employees.length));
    const docs = [];
    for (const emp of empSample) {
      for (const day of workdays) {
        if (docs.length >= attNeed) break;
        const roll = Math.random();
        let status, checkIn, checkOut, workHours, isLate = false, lateMinutes = 0;
        if (roll < 0.78) {
          isLate   = Math.random() < 0.1;
          checkIn  = checkInTime();
          checkOut = checkOutTime();
          workHours = parseFloat((rand(7, 10) + Math.random()).toFixed(1));
          status   = "Present";
          lateMinutes = isLate ? rand(5, 45) : 0;
        } else if (roll < 0.89) {
          status = "Present"; checkIn = "09:00"; checkOut = "18:00"; workHours = 9;
        } else if (roll < 0.93) {
          status = "Leave";    checkIn = ""; checkOut = ""; workHours = 0;
        } else if (roll < 0.96) {
          status = "Half Day"; checkIn = "09:00"; checkOut = "13:30"; workHours = 4.5;
        } else {
          status = "Absent";   checkIn = ""; checkOut = ""; workHours = 0;
        }
        docs.push({
          employeeId:   emp._id,
          employeeName: emp.name,
          date:         day,
          checkIn, checkOut, workHours,
          location:     emp.location,
          workMode:     roll >= 0.78 && roll < 0.89 ? "WFH" : "Office",
          status, isLate, lateMinutes,
        });
      }
      if (docs.length >= attNeed) break;
    }
    await insertBatch(Attendance, docs.slice(0, attNeed), "Attendance");
    console.log("   ✅  Attendance done");
  } else {
    console.log(`\n🕐  Attendance OK (${pre.attendance} ≥ ${TARGET.attendance})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. PAYROLL
  // ══════════════════════════════════════════════════════════════════════════
  const payNeed = Math.max(0, TARGET.payroll - pre.payroll);
  if (payNeed > 0) {
    console.log(`\n💰  Seeding ${payNeed} Payroll records…`);
    const PAY_STATUSES = ["Processed","Processed","Processed","Paid","Paid","Pending","Anomaly"];
    const MONTHS_LIST  = [
      ["January",1],["February",2],["March",3],["April",4],["May",5],["June",6],
      ["July",7],["August",8],["September",9],["October",10],["November",11],["December",12],
    ];
    const docs = [];
    const empSample = employees.slice(0, Math.min(payNeed, employees.length));
    for (const emp of empSample) {
      if (docs.length >= payNeed) break;
      const basic   = emp.salary || rand(500000, 2000000);
      const bonus   = Math.random() < 0.3 ? rand(10000, 100000) : 0;
      const deduct  = rand(5000, 30000);
      const tax     = Math.round(basic * 0.1);
      const anomaly = Math.random() < 0.04;
      const [month, monthNum] = pick(MONTHS_LIST);
      docs.push({
        employeeId:   emp._id,
        employeeName: emp.name,
        department:   emp.department,
        month,
        year:         2026,
        basicSalary:  basic,
        bonus,
        deductions:   deduct,
        tax,
        netSalary:    basic + bonus - deduct - tax,
        status:       anomaly ? "Anomaly" : pick(PAY_STATUSES),
        processedDate: new Date(`2026-${String(monthNum).padStart(2,"0")}-28`),
        anomaly,
        anomalyNote:  anomaly ? pick(["Duplicate entry detected","Salary mismatch vs offer letter","Unusual bonus spike","Missing deduction record"]) : "",
      });
    }
    await insertBatch(Payroll, docs, "Payroll");
    console.log("   ✅  Payroll done");
  } else {
    console.log(`\n💰  Payroll OK (${pre.payroll} ≥ ${TARGET.payroll})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. PERFORMANCE
  // ══════════════════════════════════════════════════════════════════════════
  const perfNeed = Math.max(0, TARGET.performance - pre.performance);
  if (perfNeed > 0) {
    console.log(`\n📊  Seeding ${perfNeed} Performance records…`);
    const empSample = employees.slice(0, Math.min(perfNeed, employees.length));
    const docs = empSample.map(emp => {
      const rating  = parseFloat(Math.min(5, Math.max(1, rand(1, 4) + Math.random())).toFixed(1));
      const aiScore = Math.min(100, Math.round(rating * 20));
      const pip     = rating < 2.0 && Math.random() < 0.5;
      const promo   = rating >= 4.0 && Math.random() < 0.4;
      return {
        employeeId:    emp._id,
        employeeName:  emp.name,
        department:    emp.department,
        quarter:       pick(QUARTERS),
        rating,
        review:        `${emp.name} demonstrated ${rating >= 3.5 ? "strong" : "moderate"} performance this quarter.`,
        aiScore,
        goals:         pickN(["Deliver feature roadmap","Improve code coverage","Complete AWS cert","Lead cross-team sprint","Reduce incidents","Mentor juniors"], 3),
        achievements:  pickN(["On-time delivery","Zero critical bugs","Improved API latency 30%","Completed certification","Mentored 2 juniors"], rand(1,3)),
        skillGaps:     pickN(["Cloud architecture","System design","Communication","Leadership","Documentation"], rand(1,2)),
        promotionReady: promo,
        pip: {
          active:   pip,
          reason:   pip ? pick(["Below KPI targets","Missed 3 deadlines","Attendance issues","Team conflict"]) : "",
          progress: pip ? rand(10, 60) : 0,
          since:    pip ? dateInRange("2025-10-01","2026-03-01") : undefined,
        },
        reviewedBy: pick(["Priya Sharma","Rohit Verma","Deepa Nair","Arjun Menon","Kavya Reddy","Suresh Iyer"]),
      };
    });
    await insertBatch(Performance, docs, "Performance");
    console.log("   ✅  Performance done");
  } else {
    console.log(`\n📊  Performance OK (${pre.performance} ≥ ${TARGET.performance})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. LEAVE
  // ══════════════════════════════════════════════════════════════════════════
  const leaveNeed = Math.max(0, TARGET.leave - pre.leave);
  if (leaveNeed > 0) {
    console.log(`\n🏖   Seeding ${leaveNeed} Leave records…`);
    const docs = [];
    // Include some leaves that span today so ON LEAVE TODAY shows non-zero
    const todayStr = new Date().toISOString().split("T")[0];
    for (let i = 0; i < leaveNeed; i++) {
      const emp       = pick(employees);
      let startDt, days;
      // 5% of leaves span today (so ON LEAVE TODAY has data)
      if (i < Math.ceil(leaveNeed * 0.05)) {
        const offset = rand(-2, 2);
        const start  = new Date(); start.setDate(start.getDate() + offset);
        startDt = start;
        days    = rand(1, 5);
      } else {
        startDt = dateInRange("2025-01-01", "2026-06-30");
        days    = rand(1, 7);
      }
      const endDt = new Date(startDt); endDt.setDate(endDt.getDate() + days - 1);
      const status = pick(LEAVE_STATUS);
      docs.push({
        employeeId:   emp._id,
        employeeName: emp.name,
        leaveType:    pick(LEAVE_TYPES),
        startDate:    startDt.toISOString().split("T")[0],
        endDate:      endDt.toISOString().split("T")[0],
        days,
        reason: pick(["Medical appointment","Family function","Personal emergency","Vacation","Child care","Home repairs","Travel","Wedding","Health recovery","Mental wellness day"]),
        status,
        approvedBy:  status !== "Pending" ? pick(["Priya Sharma","Rohit Verma","HR Admin","Deepa Nair"]) : "",
        approvedAt:  status !== "Pending" ? dateInRange(startDt, new Date()) : undefined,
        department:  emp.department,
      });
    }
    await insertBatch(Leave, docs, "Leave");
    console.log("   ✅  Leave done");
  } else {
    console.log(`\n🏖   Leave OK (${pre.leave} ≥ ${TARGET.leave})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 7. ONBOARDING
  // ══════════════════════════════════════════════════════════════════════════
  const obNeed = Math.max(0, TARGET.onboarding - pre.onboarding);
  if (obNeed > 0) {
    console.log(`\n🎓  Seeding ${obNeed} Onboarding records…`);
    const empSample = employees.slice(0, Math.min(obNeed, employees.length));
    const STEP_TITLES = [
      "Offer Letter Signed & e-KYC Verified",
      "IT Asset Allocation",
      "System Access Provisioning",
      "Training Program Enrollment",
      "Buddy & Mentor Assignment",
      "Commitment Bond Signing",
      "Team Introduction & Project Briefing",
    ];
    const docs = empSample.map(emp => {
      const done = rand(0, 7);
      const steps = STEP_TITLES.map((title, idx) => ({
        title,
        description: "",
        completed:   idx < done,
        completedAt: idx < done ? dateInRange(emp.joiningDate || "2025-01-01", new Date()) : undefined,
        status:      idx < done ? "Completed" : idx === done ? "In Progress" : "Pending",
      }));
      const pct = Math.round((done / 7) * 100);
      return {
        employeeId:        emp._id,
        name:              emp.name,
        role:              emp.designation || pick(DESIGNATIONS.Engineering),
        department:        emp.department,
        startDate:         emp.joiningDate || new Date(),
        steps,
        completionPercent: pct,
        status:            pct === 100 ? "Completed" : pct === 0 ? "Not Started" : "In Progress",
        trainingValue:     pick([300000, 400000, 500000, 600000, 800000]),
        bondYears:         3,
      };
    });
    await insertBatch(Onboarding, docs, "Onboarding");
    console.log("   ✅  Onboarding done");
  } else {
    console.log(`\n🎓  Onboarding OK (${pre.onboarding} ≥ ${TARGET.onboarding})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 8. INTERVIEWS  ← Previously missing; this is the key new section
  // ══════════════════════════════════════════════════════════════════════════
  const intNeed = Math.max(0, TARGET.interviews - pre.interviews);
  if (intNeed > 0) {
    console.log(`\n🎥  Seeding ${intNeed} Interview records…`);

    // Use existing Candidates where possible (links interviewDate logic)
    const candidates = await Candidate.find({}, "_id name email appliedRole").lean();
    const RECOMMENDATIONS = ["Shortlisted","Shortlisted","Consider","Consider","Rejected"];
    const AI_INSIGHTS_POOL = [
      "Strong technical fundamentals with excellent problem-solving ability.",
      "Communication is clear and structured; candidate explains well.",
      "Shows leadership potential — volunteered context beyond the question.",
      "Technical depth is adequate but system design needs improvement.",
      "Confidence level high; body language positive throughout.",
      "Some hesitation on advanced topics but recovers well.",
      "Cultural fit appears strong based on values alignment.",
      "Coding skills demonstrated with clean, readable approach.",
      "Experience aligns well with the JD requirements.",
      "Recommend next-round scheduling at the earliest.",
    ];

    const docs = [];
    for (let i = 0; i < intNeed; i++) {
      const cand    = candidates.length > 0 ? candidates[i % candidates.length] : null;
      const name    = cand ? cand.name : fullName();
      const email   = cand ? cand.email : candEmail(name, 90000 + i);
      const role    = cand ? (cand.appliedRole || pick(APPLIED_ROLES)) : pick(APPLIED_ROLES);
      const commScore = rand(45, 98);
      const confScore = rand(45, 98);
      const techScore = rand(40, 98);
      const sentScore = rand(50, 98);
      const bodyScore = rand(45, 95);
      const overall   = Math.round((commScore + confScore + techScore + sentScore + bodyScore) / 5);
      const rec       = overall >= 78 ? "Shortlisted" : overall >= 60 ? "Consider" : "Rejected";
      const sentiment = commScore >= 75 ? "Positive" : commScore >= 55 ? "Neutral" : "Negative";
      docs.push({
        candidateId:        cand?._id,
        candidateName:      name,
        candidateEmail:     email,
        appliedRole:        role,
        video:              `uploads/interview_${String(i + 1).padStart(4, "0")}.mp4`,
        communicationScore: commScore,
        confidenceScore:    confScore,
        technicalScore:     techScore,
        sentimentScore:     sentScore,
        bodyLanguageScore:  bodyScore,
        overallScore:       overall,
        recommendation:     rec,
        sentiment,
        aiInsights:         pickN(AI_INSIGHTS_POOL, rand(2, 4)),
        status:             "Completed",
        scheduledDate:      dateInRange("2025-06-01", "2026-06-05"),
        conductedBy:        pick(["Priya Sharma","Rahul Manager","Deepa Nair","Arjun Menon","Kavya Reddy"]),
        createdAt:          dateInRange("2025-06-01", "2026-06-05"),
      });
    }
    await insertBatch(Interview, docs, "Interview");
    console.log("   ✅  Interviews done");
  } else {
    console.log(`\n🎥  Interviews OK (${pre.interviews} ≥ ${TARGET.interviews})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 9. NOTIFICATIONS  ← Previously missing; key new section
  // ══════════════════════════════════════════════════════════════════════════
  const notifNeed = Math.max(0, TARGET.notifications - pre.notifications);
  if (notifNeed > 0) {
    console.log(`\n🔔  Seeding ${notifNeed} Notification records…`);

    const ROLES_TARGET = ["Admin","HR","Manager","All","All","All"];
    const NOTIF_TEMPLATES = [
      // AI Alerts
      { type:"AI Alert",     message:"AI resume screening completed — {n} new candidates shortlisted." },
      { type:"AI Alert",     message:"AI interview analysis ready — {n} candidates scored this week." },
      { type:"AI Alert",     message:"AI workforce forecast updated — review leadership pipeline." },
      { type:"AI Alert",     message:"Anomaly detected in AI scoring — {n} candidates flagged for manual review." },
      // Payroll
      { type:"Payroll",      message:"Payroll processed for {month} — {n} records completed." },
      { type:"Payroll",      message:"Payroll anomaly detected for {n} employees — immediate review required." },
      { type:"Payroll",      message:"Salary disbursement scheduled for {date}." },
      // Interviews
      { type:"Interview",    message:"{n} video interviews completed and scored by AI this week." },
      { type:"Interview",    message:"Interview pipeline updated — {n} candidates moved to next round." },
      { type:"Interview",    message:"Scheduled interviews for tomorrow: {n} candidates." },
      // Leave
      { type:"Leave",        message:"{n} leave requests pending approval — action required." },
      { type:"Leave",        message:"Leave summary: {n} employees on approved leave this week." },
      { type:"Leave",        message:"Unusual leave pattern detected in {dept} department." },
      // Performance
      { type:"Performance",  message:"Q2 2026 performance reviews due — {n} pending submissions." },
      { type:"Performance",  message:"{n} employees flagged for PIP review this quarter." },
      { type:"Performance",  message:"{n} employees are promotion-ready based on Q2 AI scores." },
      // Onboarding
      { type:"Onboarding",   message:"{n} new hires in onboarding — {m} steps overdue." },
      { type:"Onboarding",   message:"Onboarding completion rate: {pct}% across active cohorts." },
      { type:"Onboarding",   message:"IT asset allocation pending for {n} new joiners." },
      // Attendance
      { type:"Attendance",   message:"Today's attendance: {pct}% presence across {n} logged employees." },
      { type:"Attendance",   message:"{n} employees marked absent today without prior leave approval." },
      { type:"Attendance",   message:"Late arrivals spike detected — {n} employees late this week." },
      // System
      { type:"System",       message:"Database backup completed successfully at {time}." },
      { type:"System",       message:"System maintenance scheduled for this weekend — 2-hour downtime." },
      { type:"System",       message:"New HRVerse AI model deployed — improved screening accuracy." },
      // General
      { type:"General",      message:"All-hands meeting scheduled for {date} — add to calendar." },
      { type:"General",      message:"FWC quarterly report published — view in Analytics dashboard." },
      { type:"General",      message:"New HR policy update effective from {date} — review required." },
    ];

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const depts  = ["Engineering","AI/ML","HR","Finance","Operations","Management"];

    const docs = [];
    for (let i = 0; i < notifNeed; i++) {
      const tmpl = pick(NOTIF_TEMPLATES);
      const msg  = tmpl.message
        .replace("{n}",     String(rand(5, 200)))
        .replace("{month}", pick(months))
        .replace("{date}",  `${rand(1,28)} ${pick(months)} 2026`)
        .replace("{dept}",  pick(depts))
        .replace("{m}",     String(rand(1, 20)))
        .replace("{pct}",   String(rand(70, 98)))
        .replace("{time}",  `${rand(0,23)}:${String(rand(0,59)).padStart(2,"0")}`);
      const createdDt = dateInRange("2026-01-01", new Date());
      docs.push({
        role:      pick(ROLES_TARGET),
        type:      tmpl.type,
        message:   msg,
        read:      Math.random() < 0.4,
        link:      "",
        createdAt: createdDt,
        updatedAt: createdDt,
      });
    }
    await insertBatch(Notification, docs, "Notification");
    console.log("   ✅  Notifications done");
  } else {
    console.log(`\n🔔  Notifications OK (${pre.notifications} ≥ ${TARGET.notifications})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 10. USERS (seed.js handles this — just check)
  // ══════════════════════════════════════════════════════════════════════════
  const userCount = await User.countDocuments();
  if (userCount < 4) {
    console.log(`\n👤  Creating system users (have ${userCount})…`);
    const SYSTEM_USERS = [
      { name:"Admin User",   email:"admin@fwc.com",   password:"Admin@123",   role:"Admin"   },
      { name:"Rahul Manager",email:"manager@fwc.com", password:"Manager@123", role:"Manager" },
      { name:"Priya HR",     email:"hr@fwc.com",       password:"HR@123",     role:"HR"      },
    ];
    for (const u of SYSTEM_USERS) {
      if (await User.findOne({ email: u.email })) continue;
      const hash = await bcrypt.hash(u.password, 10);
      await User.create({ ...u, password: hash });
      console.log(`   ✅  Created ${u.role}: ${u.email} / ${u.password}`);
    }
    // Create employee login for first seeded employee
    const firstEmp = await Employee.findOne({}).lean();
    if (firstEmp) {
      const empEmail = firstEmp.name.toLowerCase().replace(/\s+/g, ".") + "@fwc.com";
      if (!await User.findOne({ email: empEmail })) {
        const hash = await bcrypt.hash("Employee@123", 10);
        await User.create({ name: firstEmp.name, email: empEmail, password: hash, role: "Employee", employeeProfileId: firstEmp._id });
        console.log(`   ✅  Created Employee: ${empEmail} / Employee@123`);
      }
    }
  } else {
    console.log(`\n👤  Users OK (${userCount} accounts exist)`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FINAL COUNTS
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n\n");
  const post = await getCounts();
  printCountTable(post, "AFTER");

  const allMet = Object.entries(TARGET).every(([k, v]) => (post[k] || 0) >= v);
  if (allMet) {
    console.log("✅  ALL TARGETS MET — HRVerse AI is demo-ready!\n");
  } else {
    console.log("⚠   Some targets not met (see table above). Re-run seedAll.js to top-up.\n");
  }

  await mongoose.disconnect();
  console.log("🔌  Disconnected from MongoDB\n");
  process.exit(0);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
async function getCounts() {
  const [users, employees, candidates, attendance, payroll, performance, leave, onboarding, interviews, notifications] = await Promise.all([
    User.countDocuments(),
    Employee.countDocuments(),
    Candidate.countDocuments(),
    Attendance.countDocuments(),
    Payroll.countDocuments(),
    Performance.countDocuments(),
    Leave.countDocuments(),
    Onboarding.countDocuments(),
    Interview.countDocuments(),
    Notification.countDocuments(),
  ]);
  return { users, employees, candidates, attendance, payroll, performance, leave, onboarding, interviews, notifications };
}

function printCountTable(counts, label) {
  const PAD = 14;
  console.log(`\n╔═══════════════════════════════════════════════════╗`);
  console.log(`║  Collection Counts  —  ${label.padEnd(25)}║`);
  console.log(`╠═══════════════════════════════════════════════════╣`);
  const rows = [
    ["Users",         counts.users,         "-"],
    ["Employees",     counts.employees,      TARGET.employees],
    ["Candidates",    counts.candidates,     TARGET.candidates],
    ["Attendance",    counts.attendance,     TARGET.attendance],
    ["Payroll",       counts.payroll,        TARGET.payroll],
    ["Performance",   counts.performance,    TARGET.performance],
    ["Leave",         counts.leave,          TARGET.leave],
    ["Onboarding",    counts.onboarding,     TARGET.onboarding],
    ["Interviews",    counts.interviews,     TARGET.interviews],
    ["Notifications", counts.notifications,  TARGET.notifications],
  ];
  for (const [name, count, target] of rows) {
    const countStr  = String(count).padStart(7);
    const targetStr = target === "-" ? "   N/A" : String(target).padStart(6);
    const status    = target === "-" ? " " : count >= target ? "✅" : "❌";
    console.log(`║  ${name.padEnd(PAD)} ${countStr}   target: ${targetStr}  ${status} ║`);
  }
  console.log(`╚═══════════════════════════════════════════════════╝\n`);
}

async function printCounts() {
  const c = await getCounts();
  printCountTable(c, "CURRENT");
}

// ── Run ────────────────────────────────────────────────────────────────────────
main().catch(err => {
  console.error("\n❌  seedAll.js failed:", err.message);
  console.error(err.stack);
  mongoose.disconnect();
  process.exit(1);
});
