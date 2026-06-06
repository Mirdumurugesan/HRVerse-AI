/**
 * seedLargeDataset.js  —  HRVerse AI  Scalability Phase 1
 *
 * Generates:
 *   5 000  Employees
 *   2 000  Candidates
 * 100 000  Attendance records  (~20 records × 5 000 employees)
 *   5 000  Payroll records     (1 per employee, current month)
 *   5 000  Performance records (1 per employee, current quarter)
 *   8 000  Leave requests      (~1.6 per employee on average)
 *   1 000  Onboarding records
 *
 * Run:  node seedLargeDataset.js [--clear]
 *   --clear : drop existing seeded data before inserting (safe to re-run)
 */

"use strict";
require("dotenv").config();
const mongoose = require("mongoose");

// ── Models ────────────────────────────────────────────────────────────────────
const Employee    = require("./models/Employee");
const Candidate   = require("./models/Candidate");
const Attendance  = require("./models/Attendance");
const Payroll     = require("./models/Payroll");
const Performance = require("./models/Performance");
const Leave       = require("./models/Leave");
const Onboarding  = require("./models/Onboarding");

// ── Reference data ────────────────────────────────────────────────────────────
const DEPARTMENTS = ["Engineering", "AI/ML", "HR", "Finance", "Operations", "Management"];
const LOCATIONS   = ["Bangalore", "Chennai", "Hyderabad", "Mumbai", "Dubai", "Singapore"];
const WORK_MODES  = ["Office", "WFH", "Hybrid"];
const STATUSES    = ["Active", "Active", "Active", "Active", "Onboarding", "On Leave", "Resigned"];

const DESIGNATIONS = {
  Engineering:  ["Software Engineer", "Senior Engineer", "Tech Lead", "Engineering Manager", "Principal Engineer", "Staff Engineer"],
  "AI/ML":      ["ML Engineer", "Data Scientist", "AI Researcher", "MLOps Engineer", "Senior Data Scientist", "AI Lead"],
  HR:           ["HR Executive", "HR Manager", "Recruiter", "HRBP", "Talent Acquisition Lead", "HR Director"],
  Finance:      ["Financial Analyst", "Senior Analyst", "Finance Manager", "Controller", "CFO", "Accounts Executive"],
  Operations:   ["Operations Analyst", "Process Manager", "Ops Lead", "Business Analyst", "Operations Head"],
  Management:   ["Product Manager", "Program Manager", "VP", "Director", "CTO", "CEO"],
};

const SKILLS_POOL = {
  Engineering:  ["Java", "Python", "React", "Node.js", "TypeScript", "Go", "Kubernetes", "Docker", "AWS", "PostgreSQL", "Redis", "gRPC"],
  "AI/ML":      ["PyTorch", "TensorFlow", "Scikit-learn", "LangChain", "Hugging Face", "MLflow", "Spark", "Pandas", "OpenCV", "CUDA", "RAG", "LLM Fine-tuning"],
  HR:           ["Recruitment", "HRIS", "Employee Relations", "Payroll Processing", "Training & Development", "Performance Management"],
  Finance:      ["Financial Modelling", "Excel", "Tally", "SAP", "Budget Planning", "Tax Compliance", "Audit"],
  Operations:   ["Process Optimization", "Six Sigma", "Project Management", "JIRA", "Agile", "Supply Chain"],
  Management:   ["Strategic Planning", "OKRs", "Stakeholder Management", "Product Roadmap", "P&L Management"],
};

const SALARY_RANGES = {
  Engineering:  [600000,  2800000],
  "AI/ML":      [800000,  3500000],
  HR:           [400000,  1600000],
  Finance:      [500000,  2000000],
  Operations:   [450000,  1800000],
  Management:   [1200000, 5000000],
};

// Indian first names (male + female)
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
  "Sandeep","Santhosh","Saranya","Shanti","Shiva","Shobha","Suraj","Sushma","Usha","Vani",
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

const LEAVE_TYPES   = ["Sick Leave","Annual Leave","Casual Leave","WFH","Emergency","Paternity","Maternity"];
const LEAVE_STATUS  = ["Pending","Approved","Approved","Approved","Rejected"];
const QUARTERS      = ["Q1 2025","Q2 2025","Q3 2025","Q4 2025","Q1 2026","Q2 2026"];
const MONTHS        = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const APPLIED_ROLES = [
  "Software Engineer","Senior Software Engineer","AI/ML Engineer","Data Scientist",
  "Product Manager","HR Executive","Finance Analyst","Operations Manager","Tech Lead","DevOps Engineer",
];

// ── Tiny utilities ────────────────────────────────────────────────────────────
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick    = (arr)      => arr[rand(0, arr.length - 1)];
const pickN   = (arr, n)   => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const padId   = (n)        => "FWC" + String(n).padStart(5, "0");
const phone   = ()         => "+91-" + rand(70000, 99999) + rand(10000, 99999);

const firstName  = () => pick(FIRST_NAMES);
const lastName   = () => pick(LAST_NAMES);
const fullName   = () => firstName() + " " + lastName();
const workEmail  = (name, idx) =>
  name.toLowerCase().replace(/\s+/g, ".") + "." + idx + "@fwcit.com";
const candEmail  = (name, idx) =>
  name.toLowerCase().replace(/\s+/g, "_") + idx + "@" + pick(["gmail.com","yahoo.com","outlook.com","hotmail.com"]);

const dateInRange = (start, end) => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s));
};

const checkInTime  = () => {
  const h = rand(8, 10), m = rand(0, 59);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
};
const checkOutTime = (inH) => {
  const h = inH + rand(8, 10), m = rand(0, 59);
  return `${String(Math.min(h,21)).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
};

// ── Batch insert helper (handles large arrays safely) ─────────────────────────
const BATCH = 500;
const insertBatch = async (Model, docs) => {
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    await Model.insertMany(docs.slice(i, i + BATCH), { ordered: false }).catch(e => {
      // ignore duplicate key errors (re-runs)
      if (e.code !== 11000) console.warn("  insertMany warn:", e.message.slice(0, 120));
    });
    inserted += Math.min(BATCH, docs.length - i);
    process.stdout.write(`\r  → ${inserted}/${docs.length}`);
  }
  console.log();
};

// ══════════════════════════════════════════════════════════════════════════════
async function seed() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   HRVerse AI  —  Large Dataset Seed v1.0    ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ── Connect ────────────────────────────────────────────────────────────────
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB Connected\n");

  const CLEAR = process.argv.includes("--clear");
  if (CLEAR) {
    console.log("🗑  --clear flag detected. Dropping seeded collections…");
    await Promise.all([
      Employee.deleteMany({}),
      Candidate.deleteMany({}),
      Attendance.deleteMany({}),
      Payroll.deleteMany({}),
      Performance.deleteMany({}),
      Leave.deleteMany({}),
      Onboarding.deleteMany({}),
    ]);
    console.log("   Done.\n");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. EMPLOYEES  (5 000)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("👥 Seeding 5 000 Employees…");
  const existingCount = await Employee.countDocuments();
  const EMP_COUNT = 5000;

  const empDocs = [];
  for (let i = 1; i <= EMP_COUNT; i++) {
    const dept   = pick(DEPARTMENTS);
    const name   = fullName();
    const salary = rand(...SALARY_RANGES[dept]);
    const joining = dateInRange("2018-01-01", "2026-05-01");
    empDocs.push({
      employeeId:       padId(existingCount + i),
      name,
      email:            workEmail(name, existingCount + i),
      phone:            phone(),
      department:       dept,
      designation:      pick(DESIGNATIONS[dept]),
      location:         pick(LOCATIONS),
      joiningDate:      joining,
      salary,
      skills:           pickN(SKILLS_POOL[dept], rand(3, 7)),
      status:           pick(STATUSES),
      workMode:         pick(WORK_MODES),
      performanceScore: rand(50, 100),
    });
  }
  await insertBatch(Employee, empDocs);
  console.log(`   ✅ Employees done\n`);

  // Fetch inserted IDs for linking
  const employees = await Employee.find({}, "_id name department location salary joiningDate").lean();
  console.log(`   Loaded ${employees.length} employee records for linking\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CANDIDATES  (2 000)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📄 Seeding 2 000 Candidates…");
  const CAND_COUNT = 2000;
  const CAND_STATUSES = ["Applied","Shortlisted","Interview","Selected","Rejected","Review"];

  const candDocs = [];
  for (let i = 1; i <= CAND_COUNT; i++) {
    const name   = fullName();
    const dept   = pick(DEPARTMENTS);
    const score  = rand(40, 98);
    const status = score >= 80 ? "Shortlisted" : score >= 60 ? "Review" : pick(["Applied","Rejected","Interview"]);
    candDocs.push({
      name,
      email:          candEmail(name, i),
      phone:          phone(),
      skills:         pickN(SKILLS_POOL[dept], rand(2, 6)),
      experience:     rand(0, 15),
      education:      pick(["B.Tech CSE","B.E. IT","M.Tech","MCA","BCA","BSc CS","MBA"]),
      resume:         "",
      status,
      aiScore:        score,
      summary:        `${name} is a ${rand(1,15)}-year experienced professional with strong ${pick(SKILLS_POOL[dept])} skills.`,
      strengths:      pickN(["Problem Solving","Communication","Leadership","Teamwork","Adaptability","Technical Depth","Ownership"], 3),
      weaknesses:     pickN(["Needs More Cloud Exposure","Limited Team Leadership","English fluency","Presentation skills"], 2),
      recommendation: score >= 80 ? "Shortlisted" : score >= 60 ? "Review" : "Rejected",
      appliedRole:    pick(APPLIED_ROLES),
      interviewDate:  score >= 60 ? dateInRange("2025-01-01", "2026-06-01") : undefined,
      offerExtended:  status === "Selected",
    });
  }
  await insertBatch(Candidate, candDocs);
  console.log(`   ✅ Candidates done\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ATTENDANCE  (100 000)
  //    ~20 working-day records per employee (1 month of daily records)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🕐 Seeding 100 000 Attendance records…");

  // Generate weekday dates: May 2026 (20 days) + June 2026 up to today
  const workdays = [];
  // May 2026
  for (let d = 1; d <= 31 && workdays.length < 20; d++) {
    const dt = new Date(2026, 4, d); // May 2026
    if (dt.getDay() !== 0 && dt.getDay() !== 6) workdays.push(new Date(dt));
  }
  // June 2026: include all weekdays up to and including today so "Present Today" shows data
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let d = 1; d <= today.getDate(); d++) {
    const dt = new Date(2026, 5, d); // June 2026
    dt.setHours(0, 0, 0, 0);
    if (dt.getDay() !== 0 && dt.getDay() !== 6 && dt <= today) workdays.push(new Date(dt));
  }

  const attDocs = [];
  for (const emp of employees) {
    for (const day of workdays) {
      const roll = Math.random();
      let status, checkIn, checkOut, workHours, isLate, lateMinutes;

      if (roll < 0.78) {
        // Present
        const inHour = rand(8, 10);
        isLate    = inHour >= 10 || (inHour === 9 && rand(0,59) > 30);
        lateMinutes = isLate ? rand(5, 45) : 0;
        checkIn   = checkInTime();
        checkOut  = checkOutTime(inHour);
        workHours = parseFloat((rand(7, 10) + Math.random()).toFixed(1));
        status    = isLate ? "Late" : "Present";
      } else if (roll < 0.88) {
        // WFH
        status = "Present"; isLate = false; lateMinutes = 0;
        checkIn = "09:00"; checkOut = "18:00"; workHours = 9;
      } else if (roll < 0.93) {
        // Leave
        status = "Leave"; checkIn = ""; checkOut = ""; workHours = 0; isLate = false; lateMinutes = 0;
      } else if (roll < 0.96) {
        // Half Day
        status = "Half Day"; checkIn = "09:00"; checkOut = "13:30"; workHours = 4.5; isLate = false; lateMinutes = 0;
      } else {
        // Absent
        status = "Absent"; checkIn = ""; checkOut = ""; workHours = 0; isLate = false; lateMinutes = 0;
      }

      attDocs.push({
        employeeId:   emp._id,
        employeeName: emp.name,
        date:         day,
        checkIn,
        checkOut,
        workHours,
        location:     emp.location,
        workMode:     roll < 0.88 && roll >= 0.78 ? "WFH" : "Office",
        status,
        isLate,
        lateMinutes,
      });
    }
  }

  // Allow up to 130 000 to cover extra June days
  const attSlice = attDocs.slice(0, 130000);
  await insertBatch(Attendance, attSlice);
  console.log(`   ✅ Attendance done (${attSlice.length} records)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PAYROLL  (5 000 — one record per employee, May 2026)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("💰 Seeding 5 000 Payroll records…");
  const PAY_STATUSES = ["Processed","Processed","Processed","Paid","Paid","Pending","Anomaly"];

  const payDocs = employees.map(emp => {
    const basic   = emp.salary || rand(500000, 2000000);
    const bonus   = Math.random() < 0.3 ? rand(10000, 100000) : 0;
    const deduct  = rand(5000, 30000);
    const tax     = Math.round(basic * 0.1);
    const anomaly = Math.random() < 0.04;
    const joiningYrs = (Date.now() - new Date(emp.joiningDate).getTime()) / (365.25 * 24 * 3600 * 1000);
    return {
      employeeId:   emp._id,
      employeeName: emp.name,
      department:   emp.department,
      month:        "May",
      year:         2026,
      basicSalary:  basic,
      bonus,
      deductions:   deduct,
      tax,
      netSalary:    basic + bonus - deduct - tax,
      esopUnits:    joiningYrs >= 1 ? rand(50, 500) : 0,
      status:       anomaly ? "Anomaly" : pick(PAY_STATUSES),
      processedDate: new Date("2026-05-31"),
      anomaly,
      anomalyNote:  anomaly ? pick(["Duplicate entry detected","Salary mismatch vs offer letter","Unusual bonus spike","Missing deduction record"]) : "",
    };
  });
  await insertBatch(Payroll, payDocs);
  console.log(`   ✅ Payroll done\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PERFORMANCE  (5 000 — one per employee)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📊 Seeding 5 000 Performance records…");

  const perfDocs = employees.map(emp => {
    const rating = parseFloat((rand(1, 5) + Math.random() * 0.9).toFixed(1));
    const aiScore = Math.min(100, Math.round(rating * 20));
    const pip    = rating < 2.0 && Math.random() < 0.6;
    const promo  = rating >= 4.0 && Math.random() < 0.4;
    const dept   = emp.department;
    return {
      employeeId:    emp._id,
      employeeName:  emp.name,
      department:    dept,
      quarter:       pick(QUARTERS),
      rating:        Math.min(5, Math.max(1, parseFloat(rating.toFixed(1)))),
      review:        `${emp.name} demonstrated ${rating >= 3.5 ? "strong" : "moderate"} performance in ${dept} this quarter.`,
      aiScore,
      goals:         pickN(["Deliver feature roadmap","Improve code coverage to 80%","Complete AWS certification","Lead cross-team sprint","Reduce incident rate","Mentor junior team members"], 3),
      achievements:  pickN(["On-time delivery","Zero critical bugs","Improved API latency by 30%","Completed certification","Mentored 2 juniors","Led successful sprint"], rand(1,3)),
      skillGaps:     pickN(["Cloud architecture","System design","Communication","Leadership","Documentation","Testing rigor"], rand(1,2)),
      promotionReady: promo,
      pip: {
        active:   pip,
        reason:   pip ? pick(["Below KPI targets","Missed 3 deadlines","Attendance issues","Team conflict"]) : "",
        progress: pip ? rand(10, 60) : 0,
        since:    pip ? dateInRange("2025-10-01","2026-04-01") : undefined,
      },
      reviewedBy: pick(["Priya Sharma","Rohit Verma","Deepa Nair","Arjun Menon","Kavya Reddy","Suresh Iyer"]),
    };
  });
  await insertBatch(Performance, perfDocs);
  console.log(`   ✅ Performance done\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. LEAVE REQUESTS  (8 000)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🏖  Seeding 8 000 Leave Requests…");
  const LEAVE_COUNT = 8000;

  const leaveDocs = [];
  for (let i = 0; i < LEAVE_COUNT; i++) {
    const emp       = pick(employees);
    const startDt   = dateInRange("2025-01-01", "2026-05-30");
    const days      = rand(1, 7);
    const endDt     = new Date(startDt); endDt.setDate(endDt.getDate() + days - 1);
    const leaveType = pick(LEAVE_TYPES);
    const status    = pick(LEAVE_STATUS);
    leaveDocs.push({
      employeeId:   emp._id,
      employeeName: emp.name,
      leaveType,
      startDate:    startDt.toISOString().split("T")[0],
      endDate:      endDt.toISOString().split("T")[0],
      days,
      reason: pick([
        "Medical appointment","Family function","Personal emergency","Vacation","Child care",
        "Home repairs","Travel","Wedding","Health recovery","Mental wellness day",
      ]),
      status,
      approvedBy:  status !== "Pending" ? pick(["Priya Sharma","Rohit Verma","HR Admin","Deepa Nair"]) : "",
      approvedAt:  status !== "Pending" ? dateInRange(startDt, new Date()) : undefined,
      department:  emp.department,
    });
  }
  await insertBatch(Leave, leaveDocs);
  console.log(`   ✅ Leave done\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ONBOARDING  (1 000)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🎓 Seeding 1 000 Onboarding records…");
  const OB_COUNT = 1000;
  const onboardEmp = employees.slice(0, OB_COUNT);

  const obDocs = onboardEmp.map(emp => {
    const completedSteps = rand(0, 7);
    const steps = [
      "Offer Letter Signed & e-KYC Verified",
      "IT Asset Allocation",
      "System Access Provisioning",
      "Training Program Enrollment",
      "Buddy & Mentor Assignment",
      "Commitment Bond Signing",
      "Team Introduction & Project Briefing",
    ].map((title, idx) => ({
      title,
      description: "",
      completed:   idx < completedSteps,
      completedAt: idx < completedSteps ? dateInRange(emp.joiningDate || "2025-01-01", new Date()) : undefined,
      status:      idx < completedSteps ? "Completed" : idx === completedSteps ? "In Progress" : "Pending",
    }));

    const pct = Math.round((completedSteps / 7) * 100);
    return {
      employeeId:        emp._id,
      name:              emp.name,
      role:              emp.designation || "Engineer",
      department:        emp.department,
      startDate:         emp.joiningDate || new Date(),
      steps,
      completionPercent: pct,
      status:            pct === 100 ? "Completed" : pct === 0 ? "Not Started" : "In Progress",
      trainingValue:     pick([300000, 400000, 500000, 600000, 800000]),
      bondYears:         3,
    };
  });
  await insertBatch(Onboarding, obDocs);
  console.log(`   ✅ Onboarding done\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 8. BUILD INDEXES
  // Schema-owned indexes (unique: true fields on the model) are already
  // created by Mongoose with auto-generated names (e.g. "employeeId_1").
  // Re-declaring them here under a different name causes MongoDB to throw
  // "Index already exists with a different name".  We only add the
  // compound / query-optimisation indexes that the schema doesn't own,
  // and we wrap each collection individually so one conflict never aborts
  // the rest.
  // ──────────────────────────────────────────────────────────────────────────
  console.log("⚡ Building MongoDB indexes…");

  const safeCreateIndexes = async (collection, specs, label) => {
    for (const spec of specs) {
      try {
        await collection.createIndex(spec.key, {
          name:    spec.name,
          unique:  spec.unique   || false,
          sparse:  spec.sparse   || false,
          background: true,
        });
      } catch (e) {
        // "already exists" errors are fine — the index is already there.
        if (!e.message.includes("already exists")) console.warn(`  ⚠ ${label} index warning:`, e.message);
      }
    }
    console.log(`   ✅ ${label} indexes`);
  };

  await safeCreateIndexes(Employee.collection, [
    // NOTE: email_1 and employeeId_1 are already created by the Mongoose
    // schema (unique:true).  Only add compound / extra query indexes here.
    { key: { department: 1 },             name: "department_1" },
    { key: { location: 1 },               name: "location_1" },
    { key: { status: 1 },                 name: "status_1" },
    { key: { department: 1, location: 1 }, name: "dept_loc_compound" },
  ], "Employee");

  await safeCreateIndexes(Candidate.collection, [
    // email_1 already owned by schema (unique:true).
    { key: { status: 1 },     name: "status_1" },
    { key: { aiScore: -1 },   name: "aiScore_desc" },
    { key: { createdAt: -1 }, name: "createdAt_desc" },
  ], "Candidate");

  await safeCreateIndexes(Attendance.collection, [
    { key: { employeeId: 1, date: -1 }, name: "emp_date_compound" },
    { key: { date: -1 },                name: "date_desc" },
    { key: { status: 1 },               name: "status_1" },
    { key: { location: 1, date: -1 },   name: "location_date_compound" },
  ], "Attendance");

  await safeCreateIndexes(Payroll.collection, [
    { key: { employeeId: 1, year: -1, month: 1 }, name: "emp_year_month" },
    { key: { department: 1 },                      name: "department_1" },
    { key: { status: 1 },                          name: "status_1" },
    { key: { anomaly: 1 },                         name: "anomaly_1" },
    { key: { year: -1, month: 1 },                 name: "year_month_compound" },
  ], "Payroll");

  await safeCreateIndexes(Performance.collection, [
    { key: { employeeId: 1, quarter: 1 }, name: "emp_quarter_compound" },
    { key: { department: 1 },              name: "department_1" },
    { key: { aiScore: -1 },               name: "aiScore_desc" },
    { key: { "pip.active": 1 },            name: "pip_active_1" },
    { key: { promotionReady: 1 },          name: "promotionReady_1" },
  ], "Performance");

  await safeCreateIndexes(Leave.collection, [
    { key: { employeeId: 1, startDate: -1 }, name: "emp_start_compound" },
    { key: { status: 1 },                     name: "status_1" },
    { key: { department: 1 },                 name: "department_1" },
    { key: { leaveType: 1 },                  name: "leaveType_1" },
    { key: { startDate: -1 },                 name: "startDate_desc" },
  ], "Leave");

  console.log();

  // ──────────────────────────────────────────────────────────────────────────
  // 9. FINAL COUNTS
  // ──────────────────────────────────────────────────────────────────────────
  const [ec, cc, ac, pc, perc, lc, oc] = await Promise.all([
    Employee.countDocuments(),
    Candidate.countDocuments(),
    Attendance.countDocuments(),
    Payroll.countDocuments(),
    Performance.countDocuments(),
    Leave.countDocuments(),
    Onboarding.countDocuments(),
  ]);

  console.log("╔════════════════════════════════════════════════╗");
  console.log("║          SEED COMPLETE — Final Counts          ║");
  console.log("╠════════════════════════════════════════════════╣");
  console.log(`║  Employees      : ${String(ec).padStart(7)}                     ║`);
  console.log(`║  Candidates     : ${String(cc).padStart(7)}                     ║`);
  console.log(`║  Attendance     : ${String(ac).padStart(7)}                     ║`);
  console.log(`║  Payroll        : ${String(pc).padStart(7)}                     ║`);
  console.log(`║  Performance    : ${String(perc).padStart(7)}                     ║`);
  console.log(`║  Leave          : ${String(lc).padStart(7)}                     ║`);
  console.log(`║  Onboarding     : ${String(oc).padStart(7)}                     ║`);
  console.log("╚════════════════════════════════════════════════╝\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB\n");
  process.exit(0);
}

seed().catch(err => {
  console.error("\n❌ Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
