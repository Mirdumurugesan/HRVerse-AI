import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function AttendanceReplica() {
  const { apiFetch } = useAuth();
  const [attendance,   setAttendance]   = useState([]);
  const [leaves,       setLeaves]       = useState([]);
  const [summary,      setSummary]      = useState({ present:0, absent:0, wfh:0, rate:0 });
  const [employeeName, setEmployeeName] = useState("");
  const [status,       setStatus]       = useState("Present");
  const [workMode,     setWorkMode]     = useState("Office");
  const [markDate,     setMarkDate]     = useState("");
  const [search,       setSearch]       = useState("");
  const [saving,       setSaving]       = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [attRes, leaveRes, sumRes] = await Promise.all([
        apiFetch("/api/attendance"),
        apiFetch("/api/leaves"),
        apiFetch("/api/attendance/summary"),
      ]);
      const [attData, leaveData, sumData] = await Promise.all([
        attRes.json(), leaveRes.json(), sumRes.json()
      ]);
      const attArray   = Array.isArray(attData)   ? attData   : (attData?.attendance   || []);
      const leaveArray = Array.isArray(leaveData) ? leaveData : (leaveData?.leaves     || []);
      setAttendance(attArray);
      setLeaves(leaveArray.filter(l => l.status === "Pending").slice(0, 8));
      if (sumData && !sumData.error) setSummary(sumData);
    } catch (e) { console.error(e); }
  };

  const mark = async () => {
    if (!employeeName.trim()) { alert("Enter employee name."); return; }
    setSaving(true);
    try {
      const r    = await apiFetch("/api/attendance/mark", {
        method: "POST",
        body:   JSON.stringify({ employeeName: employeeName.trim(), status, workMode, date: markDate || undefined }),
      });
      const data = await r.json();
      if (r.ok) {
        setEmployeeName("");
        setMarkDate("");
        loadAll();
      } else {
        alert(data.message || data.error || "Failed to mark attendance.");
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Compute weekly trend from loaded data (last 7 days)
  const weeklyTrend = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const nextD = new Date(d); nextD.setDate(d.getDate() + 1);
      const dayRecs = attendance.filter(a => {
        const ad = new Date(a.date);
        return ad >= d && ad < nextD;
      });
      const present = dayRecs.filter(r => r.status === "Present").length;
      const total   = dayRecs.length;
      const pct     = total ? Math.round((present / total) * 100) : 0;
      days.push({
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        pct,
        count: total,
        color: pct >= 90 ? "#00e5a8" : pct >= 75 ? "#1da1ff" : pct > 0 ? "#f59e0b" : "#1e293b",
      });
    }
    return days;
  };

  const filtered = attendance.filter(a =>
    a.employeeName?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => ({
    "Present":  "#00e5a8",
    "Absent":   "#ff5c5c",
    "Leave":    "#f59e0b",
    "Half Day": "#8b5cf6",
    "Late":     "#f59e0b",
  }[s] || "#64748b");

  const leaveStatusColor = (s) => ({
    "Pending":  "#f59e0b",
    "Approved": "#00e5a8",
    "Rejected": "#ff5c5c",
  }[s] || "#64748b");

  const trend = weeklyTrend();
  const maxTrend = Math.max(...trend.map(t => t.pct), 1);

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Attendance & Leave</h1>
          <p className="pageSub">Enterprise Workforce Presence Monitoring — Real-time Tracking</p>
        </div>
        <div className="topActions">
          <input placeholder="Search employee..." className="enterpriseSearch"
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="aiBtn" onClick={loadAll}>⚡ Refresh</button>
        </div>
      </div>

      {/* KPIs — today summary */}
      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>PRESENT TODAY</h5>
          <h1 style={{ color: "#00e5a8" }}>{summary.present}</h1>
          <span>Active Records</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>WORK FROM HOME</h5>
          <h1 style={{ color: "#1da1ff" }}>{summary.wfh}</h1>
          <span>Hybrid Employees</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #ff5c5c" }}>
          <h5>ABSENT TODAY</h5>
          <h1 style={{ color: "#ff5c5c" }}>{summary.absent}</h1>
          <span>Not Marked Present</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>ATTENDANCE RATE</h5>
          <h1 style={{ color: "#f59e0b" }}>{summary.rate || 0}%</h1>
          <span>Today</span>
        </div>
      </div>

      <div className="enterpriseRow" style={{ marginBottom: 20 }}>
        {/* Weekly trend — computed from real data */}
        <div className="bigPanel">
          <h3 style={{ marginBottom: 20 }}>Last 7 Days Trend</h3>
          {trend.every(t => t.count === 0) ? (
            <p style={{ color: "#475569", textAlign: "center", padding: 30, fontSize: 13 }}>
              No attendance records in the last 7 days.
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180 }}>
              {trend.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ marginBottom: 5, color: d.color, fontSize: 11, fontWeight: 600 }}>
                    {d.count > 0 ? d.pct + "%" : "—"}
                  </div>
                  <div style={{
                    height: Math.max((d.pct / maxTrend) * 140, d.count > 0 ? 8 : 2) + "px",
                    background: d.count > 0 ? d.color : "#1e293b",
                    borderRadius: "6px 6px 0 0", transition: ".3s"
                  }} />
                  <p style={{ color: "#64748b", fontSize: 11, marginTop: 6, marginBottom: 0 }}>{d.day}</p>
                  {d.count > 0 && <p style={{ color: "#334155", fontSize: 10, margin: 0 }}>{d.count}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending leave requests — from real /api/leaves */}
        <div className="bigPanel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3>Pending Leave Requests</h3>
            <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>{leaves.length} pending</span>
          </div>
          {leaves.length === 0 ? (
            <p style={{ color: "#475569", textAlign: "center", padding: 20, fontSize: 13 }}>No pending leave requests.</p>
          ) : (
            <table>
              <thead><tr><th>Employee</th><th>Leave Type</th><th>From</th><th>Status</th></tr></thead>
              <tbody>
                {leaves.map((l, i) => {
                  const lc = leaveStatusColor(l.status);
                  return (
                    <tr key={l._id || i}>
                      <td style={{ color: "white", fontWeight: 600 }}>{l.employeeName}</td>
                      <td style={{ color: "#94a3b8" }}>{l.leaveType}</td>
                      <td style={{ color: "#64748b", fontSize: 12 }}>{l.startDate || "—"}</td>
                      <td>
                        <span style={{ background: lc + "20", color: lc, border: "1px solid " + lc, padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mark Attendance */}
      <div className="bigPanel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3>Mark Attendance</h3>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              One record per employee per day — duplicate entries are automatically merged
            </p>
          </div>
          <span className="statusPill pillGreen">ACTIVE</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>EMPLOYEE NAME</label>
            <input className="formInput" placeholder="Full name" value={employeeName}
              onChange={e => setEmployeeName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && mark()} />
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>STATUS</label>
            <select className="formInput" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)}>
              <option>Present</option>
              <option>Absent</option>
              <option>Half Day</option>
              <option>Late</option>
              <option>Leave</option>
            </select>
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>WORK MODE</label>
            <select className="formInput" style={{ width: 150 }} value={workMode} onChange={e => setWorkMode(e.target.value)}>
              <option>Office</option>
              <option>WFH</option>
              <option>Hybrid</option>
            </select>
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>DATE (optional)</label>
            <input type="date" className="formInput" style={{ width: 170 }} value={markDate}
              onChange={e => setMarkDate(e.target.value)} />
          </div>
          <button onClick={mark} disabled={saving} className="aiBtn" style={{ padding: "14px 24px" }}>
            {saving ? "Saving..." : "✓ Mark"}
          </button>
        </div>
      </div>

      {/* Attendance Register */}
      <div className="bigPanel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3>Attendance Register</h3>
          <span style={{ color: "#64748b", fontSize: 13 }}>
            {filtered.length} of {attendance.length} records
            {search && ` matching "${search}"`}
          </span>
        </div>
        <table>
          <thead>
            <tr><th>Employee</th><th>Status</th><th>Work Mode</th><th>Date</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#475569", padding: 30 }}>
                  {attendance.length === 0
                    ? "No attendance records yet. Use the form above to mark attendance."
                    : `No records match "${search}".`}
                </td>
              </tr>
            ) : (
              filtered.map(a => {
                const sc = statusColor(a.status);
                return (
                  <tr key={a._id}>
                    <td style={{ color: "white", fontWeight: 600 }}>{a.employeeName}</td>
                    <td>
                      <span style={{ background: sc + "20", color: sc, border: "1px solid " + sc, padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ color: "#94a3b8" }}>{a.workMode || "Office"}</td>
                    <td style={{ color: "#64748b" }}>
                      {new Date(a.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default AttendanceReplica;
