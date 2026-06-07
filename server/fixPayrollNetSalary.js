/**
 * fixPayrollNetSalary.js
 * Run ONCE after seeding to ensure all payroll records have tax + netSalary computed.
 * Usage: node fixPayrollNetSalary.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Payroll  = require("./models/Payroll");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find records where netSalary is missing, null, or 0
    const broken = await Payroll.find({
      $or: [
        { netSalary: { $exists: false } },
        { netSalary: null },
        { netSalary: 0 },
      ]
    }).select("basicSalary bonus deductions");

    console.log(`Found ${broken.length} records to fix...`);

    let fixed = 0;
    const BATCH = 500;
    for (let i = 0; i < broken.length; i += BATCH) {
      const slice = broken.slice(i, i + BATCH);
      const ops = slice.map(r => {
        const tax      = Math.round(Number(r.basicSalary) * 0.1);
        const netSalary = Number(r.basicSalary) + Number(r.bonus) - Number(r.deductions) - tax;
        return {
          updateOne: {
            filter: { _id: r._id },
            update: { $set: { tax, netSalary, status: "Processed" } },
          }
        };
      });
      await Payroll.bulkWrite(ops);
      fixed += slice.length;
      process.stdout.write(`\r  Fixed: ${fixed}/${broken.length}`);
    }

    console.log(`\n✅ Done — fixed ${fixed} payroll records.`);

    // Verify
    const stillBroken = await Payroll.countDocuments({
      $or: [{ netSalary: { $exists: false } }, { netSalary: null }, { netSalary: 0 }]
    });
    console.log(`Remaining broken: ${stillBroken}`);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
})();
