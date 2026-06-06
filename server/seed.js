/**
 * HRVerse AI — Demo User Seed Script
 * Run: node seed.js
 *
 * Creates:
 *   1 Admin, 1 Manager, 1 HR  (system roles, not linked to Employee records)
 *   10 Employee logins        (each linked to a real seeded Employee record)
 *
 * All employee logins share the password  Employee@123
 * Email format: firstname.lastname@fwc.com
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("./models/User");
const Employee = require("./models/Employee");

const SYSTEM_USERS = [
  { name: "Admin User",    email: "admin@fwc.com",   password: "Admin@123",   role: "Admin"   },
  { name: "Rahul Manager", email: "manager@fwc.com", password: "Manager@123", role: "Manager" },
  { name: "Priya HR",      email: "hr@fwc.com",      password: "HR@123",      role: "HR"      },
];

const EMP_PASSWORD = "Employee@123";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  MongoDB connected\n");

  // ── 1. System role accounts ───────────────────────────────────
  console.log("👤  Creating system role accounts…");
  let created = 0, skipped = 0;
  for (const u of SYSTEM_USERS) {
    if (await User.findOne({ email: u.email })) {
      console.log(`   ⏭  ${u.role.padEnd(9)} ${u.email} (exists)`);
      skipped++;
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password: hash });
    console.log(`   ✅  ${u.role.padEnd(9)} ${u.email}  /  ${u.password}`);
    created++;
  }

  // ── 2. Employee logins — linked to real Employee records ──────
  console.log("\n👥  Creating employee logins from seeded Employee records…");

  const employees = await Employee.find({}).limit(10).lean();

  if (employees.length === 0) {
    console.log("   ⚠  No Employee records found. Run seedLargeDataset.js first.");
  } else {
    let empCreated = 0, empSkipped = 0;
    const empHash = await bcrypt.hash(EMP_PASSWORD, 10);

    for (const emp of employees) {
      // email: "rahul.sharma@fwc.com"
      const email = emp.name.toLowerCase().replace(/\s+/g, ".") + "@fwc.com";

      const existing = await User.findOne({ email });
      if (existing) {
        // Backfill employeeProfileId if missing
        if (!existing.employeeProfileId) {
          await User.updateOne({ _id: existing._id }, { employeeProfileId: emp._id });
          console.log(`   🔗  ${emp.name.padEnd(25)} (linked employeeProfileId)`);
        } else {
          console.log(`   ⏭  ${emp.name.padEnd(25)} ${email} (exists)`);
        }
        empSkipped++;
        continue;
      }

      await User.create({
        name:              emp.name,
        email,
        password:          empHash,
        role:              "Employee",
        employeeProfileId: emp._id,
      });
      console.log(`   ✅  ${emp.name.padEnd(25)} ${email}  /  ${EMP_PASSWORD}`);
      empCreated++;
    }
    created  += empCreated;
    skipped  += empSkipped;
  }

  // ── 3. Summary ────────────────────────────────────────────────
  console.log(`\n🎉  ${created} created, ${skipped} skipped`);
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log(" ROLE        EMAIL                          PASSWORD");
  console.log("────────────────────────────────────────────────────────────────");
  SYSTEM_USERS.forEach(u =>
    console.log(` ${u.role.padEnd(12)} ${u.email.padEnd(35)} ${u.password}`)
  );
  const empList = await Employee.find({}).limit(10).lean();
  empList.forEach(emp => {
    const email = emp.name.toLowerCase().replace(/\s+/g, ".") + "@fwc.com";
    console.log(` Employee     ${email.padEnd(35)} ${EMP_PASSWORD}`);
  });
  console.log("════════════════════════════════════════════════════════════════");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
