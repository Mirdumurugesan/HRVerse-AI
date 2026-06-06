# HRVerse AI — Scalability Report
Generated: 2026-06-05

---

## 1. Collection Overview

| Collection   | Indexes Applied | Indexed Fields |
|-------------|----------------|----------------|
| Employee    | 5              | department, location, status, dept+location (compound), createdAt |
| Attendance  | 4              | employeeId+date, date, status, location+date |
| Candidate   | 3              | status, aiScore (desc), createdAt |
| Leave       | 5              | employeeId+startDate, status, department, leaveType, startDate |
| Payroll     | 5              | employeeId+year+month, department, status, anomaly, year+month |
| Performance | 5              | employeeId+quarter, department, aiScore, pip.active, promotionReady |
| Interview   | 0              | (no indexes — low-volume collection) |
| Onboarding  | 0              | (no indexes — low-volume collection) |
| AILog       | 0              | audit-only, append-only |

**Total strategic indexes: 27**

---

## 2. Backend Pagination (Employees Route)

```
GET /api/employees?page=1&limit=25&search=<term>&dept=<dept>
```

- Max limit capped at **100** (server-enforced)
- `skip = (page - 1) * limit` — offset-based pagination
- Parallel `Promise.all([find, countDocuments])` — single round-trip for data + total
- Response shape: `{ employees[], pagination: { page, limit, total, pages } }`
- Search uses `$regex` with `$options: "i"` on `name`, `designation`, `email`
- Department filter uses indexed `department` field

---

## 3. Frontend Pagination (Employees.jsx)

- **Page size selector:** 10 / 25 / 50 / 100 (default: 25)
- Search is **server-side** with 400ms debounce (resets to page 1)
- Changing page size resets to page 1
- KPI "Total Employees" card shows real `total` from paginated response (not page slice)
- Component: `Pagination.jsx` (reusable, used in Employees; can be added to Candidates, Performance)

---

## 4. Query Performance Estimates

| Query Pattern                          | Index Used                  | Est. Cost (10k docs) |
|----------------------------------------|-----------------------------|----------------------|
| `Employee.find({ department })`        | department_1                | O(log n)             |
| `Employee.find({ status }).sort(date)` | status_1 + createdAt_-1     | O(log n)             |
| `Attendance.find({ employeeId, date })` | employeeId_1_date_-1       | O(log n)             |
| `Payroll.find({ year, month })`        | year_-1_month_1             | O(log n)             |
| `Performance.find({ aiScore }).sort()` | aiScore_-1                  | O(log n)             |
| `Employee.find({$or: name/email/desig})` | collection scan (regex)   | O(n) — acceptable for search |

---

## 5. Aggregation Performance

Dashboard and Analytics routes use `$match` → `$group` pipelines:
- `$match` on indexed fields (`department`, `status`, `date`) prunes the scan early
- `$group` runs in-memory on the filtered subset
- All analytics aggregations return pre-aggregated counts (not raw documents)
- Estimated pipeline cost at 50k records: **< 200ms** with proper `$match` index use

---

## 6. Scalability Thresholds

| Volume          | Expected Behavior |
|-----------------|-------------------|
| < 10k employees | Sub-10ms queries  |
| 10k–100k        | Sub-50ms with indexes; pagination essential |
| 100k–500k       | Add read replicas; consider cursor-based pagination for exports |
| > 500k          | Shard by `department` or `location`; archive old attendance/payroll |

---

## 7. Files Modified (Scalability Sprint)

| File | Change |
|------|--------|
| `server/models/Employee.js` | Added 5 indexes |
| `server/models/Attendance.js` | Added 4 indexes |
| `server/models/Candidate.js` | Added 3 indexes |
| `server/models/Leave.js` | Added 5 indexes |
| `server/models/Payroll.js` | Added 5 indexes |
| `server/models/Performance.js` | Added 5 indexes |
| `server/controllers/employeeController.js` | Full paginated `getEmployees` |
| `server/routes/employeeRoutes.js` | Route comment updated |
| `client/src/components/Pagination.jsx` | New reusable component (10/25/50/100) |
| `client/src/components/Employees.jsx` | Wired server-side pagination + Pagination component |

---

## 8. Recommended Next Steps

1. Add `Pagination` to `Candidates.jsx` (route already supports it)
2. Add cursor-based pagination for CSV export (avoid skip at high offsets)
3. Add MongoDB Atlas Performance Advisor alerts for slow queries > 100ms
4. Index `Interview` and `Onboarding` collections once volume grows
