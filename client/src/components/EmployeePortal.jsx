import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function EmployeePortal() {
  const { name, empName, role, apiFetch } = useAuth();
  const resolvedName = empName || name;
  const [attendance,   setAttendance]   = useState([]);
  const [leaves,       setLeaves]       = useState([]);
  const [payrolls,     setPayrolls]     = useState([]);
  const [performances, setPerformances] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ leaveType: "", startDate: "", endDate: "", reason: "" });
  const [activeTab, setActiveTab] = useState("attendance");
  const [loading, setLoading]     = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      // Use /my endpoints — returns only the current user own records regardless of role
      const [attRes, leaveRes, payRes, perfRes] = await Promise.all([
        apiFetch("/api/attendance/my"),
        apiFetch("/api/leaves"),
        apiFetch("/api/payroll/my"),
        apiFetch("/api/performance/my"),
      ]);
      const [attData, leaveData, payData, perfData] = await Promise.all([
        attRes.json(), leaveRes.json(), payRes.json(), perfRes.json()
      ]);
      // getMyAttendance returns { attendance: [], pagination: {} }
      setAttendance(Array.isArray(attData) ? attData : (attData?.attendance || []));
      // getLeaves returns a plain array for employees
      setLeaves(Array.isArray(leaveData) ? leaveData : (leaveData?.leaves || []));
      // getMyPayroll returns { payrolls: [], pagination: {} }
      setPayrolls(Array.isArray(payData) ? payData : (payData?.payrolls || []));
      // getMyPerformance returns a plain array
      setPerformances(Array.isArray(perfData) ? perfData : []);
    } catch (err) { console.error(err); }
  };

  const applyLeave = async () => {
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate) {
      alert("Please fill all leave details."); return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/leaves", {
        method: "POST",
        body: JSON.stringify({ ...leaveForm, employeeName: resolvedName })
      });
      setLeaveForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
      loadAll();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const presentDays    = attendance.filter(a => a.status === "Present").length;
  const absentDays     = attendance.filter(a => a.status === "Absent").length;
  const totalDays      = attendance.length;
  const attendanceRate = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;
  const latestPayroll  = payrolls[0];
  const latestPerf     = performances[0];
  const pendingLeaves  = leaves.filter(l => l.status === "Pending").length;
  const approvedLeaves = leaves.filter(l => l.status === "Approved").length;

  const statusColor = (s) => ({ "Pending": "#f59e0b", "Approved": "#00e5a8", "Rejected": "#ff5c5c", "Present": "#00e5a8", "Absent": "#ff5c5c" }[s] || "#64748b");
  const leaveTypes  = ["Sick Leave", "Annual Leave", "Casual Leave", "WFH", "Emergency"];

  const tabs = [
    { id: "attendance",  label: "📅 Attendance" },
    { id: "leave",       label: "🏖 Leave"      },
    { id: "payroll",     label: "💰 Payslip"    },
    { id: "performance", label: "⭐ Performance" },
  ];

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">My Employee Portal</h1>
          <p className="pageSub">
            <span style={{ color: "#f59e0b" }}>{resolvedName}</span>&nbsp;·&nbsp;{role}&nbsp;·&nbsp;Personal Workspace
          </p>
        </div>
        <div className="topActions">
          <button className="aiBtn" style={{ background: "#f59e0b", color: "#000" }}>🤖 Ask AI</button>
        </div>
      </div>

      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>ATTENDANCE RATE</h5>
          <h1 style={{ color: "#00e5a8" }}>{totalDays ? attendanceRate + "%" : "--"}</h1>
          <span>{presentDays} Present / {totalDays} Days</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>PENDING LEAVES</h5>
          <h1 style={{ color: "#f59e0b" }}>{pendingLeaves}</h1>
          <span>{approvedLeaves} Approved</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>LAST PAYSLIP</h5>
          <h1 style={{ color: "#1da1ff", fontSize: "20px" }}>
            {latestPayroll ? "₹" + Number(latestPayroll.netSalary).toLocaleString() : "—"}
          </h1>
          <span>Net Salary</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #8b5cf6" }}>
          <h5>PERFORMANCE</h5>
          <h1 style={{ color: "#8b5cf6" }}>
            {latestPerf ? latestPerf.rating + "/5" : "—"}
          </h1>
          <span>Last Review</span>
        </div>
      </div>

      <div className="bigPanel">
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid #1e293b", paddingBottom: "12px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? "#00e5a820" : "transparent",
                border: "1px solid " + (activeTab === t.id ? "#00e5a8" : "#1e293b"),
                color: activeTab === t.id ? "#00e5a8" : "#64748b",
                padding: "8px 18px", borderRadius: "8px", cursor: "pointer",
                fontSize: "13px", fontWeight: "600", transition: ".2s"
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "attendance" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
              {[["Present", presentDays, "#00e5a8"],["Absent", absentDays, "#ff5c5c"],["Total Logged", totalDays, "#1da1ff"]].map(([k,v,c],i) => (
                <div key={i} className="enterpriseCard" style={{ borderLeft: "3px solid " + c }}>
                  <h5>{k}</h5><h1 style={{ color: c }}>{v}</h1>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#cbd5e1" }}>My Attendance Rate</span>
              <span style={{ color: "#00e5a8", fontWeight: "700" }}>{attendanceRate}%</span>
            </div>
            <div className="progressBar" style={{ marginBottom: "20px" }}>
              <div style={{ width: attendanceRate + "%" }}></div>
            </div>
            {attendance.length === 0 ? (
              <p style={{ color: "#475569", textAlign: "center", padding: "20px" }}>
                No attendance records found for <strong style={{ color: "#f59e0b" }}>{name}</strong>. Ask your HR to mark your attendance.
              </p>
            ) : (
              <table>
                <thead><tr><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {[...attendance].map((a) => (
                    <tr key={a._id}>
                      <td>{new Date(a.date).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</td>
                      <td>
                        <span style={{ background: statusColor(a.status) + "20", color: statusColor(a.status), border: "1px solid " + statusColor(a.status), padding: "3px 12px", borderRadius: "20px", fontSize: "12px" }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === "leave" && (
          <>
            <h4 style={{ color: "white", marginBottom: "16px" }}>Apply for Leave</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "7px" }}>LEAVE TYPE</label>
                <select className="formInput" value={leaveForm.leaveType} onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}>
                  <option value="">Select type...</option>
                  {leaveTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "7px" }}>START DATE</label>
                <input type="date" className="formInput" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
              </div>
              <div>
                <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "7px" }}>END DATE</label>
                <input type="date" className="formInput" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
              </div>
              <div>
                <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "7px" }}>REASON</label>
                <input className="formInput" placeholder="Reason for leave" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
              </div>
            </div>
            <button onClick={applyLeave} disabled={loading} className="aiBtn" style={{ background: "#f59e0b", color: "#000", marginBottom: "24px" }}>
              {loading ? "Submitting..." : "📤 Submit Leave Request"}
            </button>
            <h4 style={{ color: "white", marginBottom: "14px" }}>My Leave History</h4>
            {leaves.length === 0 ? (
              <p style={{ color: "#475569", textAlign: "center", padding: "20px" }}>No leave records found.</p>
            ) : (
              <table>
                <thead><tr><th>Type</th><th>From</th><th>To</th><th>Status</th></tr></thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l._id}>
                      <td style={{ color: "white", fontWeight: "600" }}>{l.leaveType}</td>
                      <td style={{ color: "#64748b" }}>{l.startDate}</td>
                      <td style={{ color: "#64748b" }}>{l.endDate}</td>
                      <td>
                        <span style={{ background: statusColor(l.status) + "20", color: statusColor(l.status), border: "1px solid " + statusColor(l.status), padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === "payroll" && (
          payrolls.length === 0 ? (
            <p style={{ color: "#475569", textAlign: "center", padding: "30px" }}>
              No payroll records for <strong style={{ color: "#f59e0b" }}>{name}</strong>. Contact your HR Manager.
            </p>
          ) : (
            payrolls.map((p, i) => (
              <div key={p._id || i} style={{ background: "#06111e", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <p style={{ color: "white", fontWeight: "700", margin: "0 0 4px", fontSize: "16px" }}>Payslip #{i + 1}</p>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "12px" }}>{new Date(p.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</p>
                  </div>
                  <span className="statusPill pillGreen">Processed</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
                  {[
                    ["Basic Salary", "₹" + Number(p.basicSalary).toLocaleString(), "#cbd5e1"],
                    ["Bonus",        "₹" + Number(p.bonus).toLocaleString(),        "#00e5a8"],
                    ["Deductions",   "₹" + Number(p.deductions).toLocaleString(),   "#ff5c5c"],
                    ["Net Salary",   "₹" + Number(p.netSalary).toLocaleString(),    "#1da1ff"],
                  ].map(([k, v, c], j) => (
                    <div key={j} style={{ background: "#0b1220", borderRadius: "8px", padding: "12px" }}>
                      <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 4px" }}>{k}</p>
                      <p style={{ color: c, fontWeight: "700", margin: 0, fontSize: "16px" }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === "performance" && (
          performances.length === 0 ? (
            <p style={{ color: "#475569", textAlign: "center", padding: "30px" }}>
              No performance records for <strong style={{ color: "#f59e0b" }}>{name}</strong>. Contact your Manager.
            </p>
          ) : (
            performances.map((p, i) => (
              <div key={p._id || i} style={{ background: "#06111e", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <p style={{ color: "white", fontWeight: "700", margin: 0, fontSize: "16px" }}>Review #{i + 1}</p>
                  <span style={{ color: "#00e5a8", fontWeight: "700", fontSize: "20px" }}>{p.rating}/5 ⭐</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>AI Score</span>
                  <span style={{ color: "#8b5cf6", fontWeight: "700" }}>{p.aiScore}</span>
                </div>
                <div className="progressBar" style={{ marginBottom: "12px" }}>
                  <div style={{ width: ((p.rating / 5) * 100) + "%", background: "#8b5cf6" }}></div>
                </div>
                {p.review && (
                  <div style={{ background: "#0b1220", borderRadius: "8px", padding: "12px", border: "1px solid #1e293b" }}>
                    <p style={{ color: "#64748b", fontSize: "11px", margin: "0 0 6px" }}>MANAGER REVIEW</p>
                    <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{p.review}</p>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

export default EmployeePortal;
