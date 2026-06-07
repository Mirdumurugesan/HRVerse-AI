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

// In-process cache: userId → resolved name (cleared on restart, good enough for demo)
const _cache = new Map();

async function resolveEmpName(user) {
  if (!user) return "";

  const cacheKey = String(user._id || user.id || user.name);
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  let resolved = user.name; // default fallback

  // 1. Hard link via employeeProfileId
  if (user.employeeProfileId) {
    const emp = await Employee.findById(user.employeeProfileId).select("name").lean();
    if (emp?.name) resolved = emp.name;
  } else {
    // 2. Exact name match
    const byName = await Employee.findOne({
      name: { $regex: new RegExp("^" + escapeRx(user.name) + "$", "i") },
    }).select("name").lean();
    if (byName?.name) resolved = byName.name;
  }

  _cache.set(cacheKey, resolved);
  return resolved;
}

function escapeRx(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { resolveEmpName, escapeRx };
