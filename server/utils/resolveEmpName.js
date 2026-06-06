/**
 * resolveEmpName(user)
 *
 * Employee-facing controllers store data keyed by employeeName (a string).
 * A User account's .name ("Karthik Emp") often doesn't match the seeded
 * Employee record's .name ("Rahul Sharma") unless the user was created by
 * seed.js with an explicit employeeProfileId link.
 *
 * Resolution order:
 *   1. user.employeeProfileId → Employee.name   (hard link, most reliable)
 *   2. Exact name match in employees collection  (works when names happen to match)
 *   3. user.name as-is                           (last resort / new employees)
 */
const Employee = require("../models/Employee");

async function resolveEmpName(user) {
  if (!user) return "";

  // 1. Hard link via employeeProfileId
  if (user.employeeProfileId) {
    const emp = await Employee.findById(user.employeeProfileId).select("name").lean();
    if (emp?.name) return emp.name;
  }

  // 2. Try exact name match in employees collection
  const byName = await Employee.findOne({
    name: { $regex: new RegExp("^" + escapeRx(user.name) + "$", "i") },
  }).select("name").lean();
  if (byName?.name) return byName.name;

  // 3. Fallback
  return user.name;
}

function escapeRx(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { resolveEmpName, escapeRx };
