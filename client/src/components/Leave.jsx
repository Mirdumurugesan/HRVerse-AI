import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";

function Leave() {
  const { name: loggedInName, empName, role, isEmployee, apiFetch } = useAuth();
  const displayName = empName || loggedInName || "";
  const [leaves,       setLeaves]       = useState([]);
  const [search,       setSearch]       = useState("");
  const [autoApproving,setAutoApproving]= useState(false);
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [total,        setTotal]        = useState(0);
  const limit = 25;
  const [form, setForm] = useState({
    employeeName: displayName, leaveType: "", startDate: "", endDate: "", reason: ""
  });

  const loadLeaves = useCallback(async (p = page) => {
    try {
      const params = new URLSearchParams({ page: p, limit });
      if (!isEmployee && search) params.set("search", search);
      const res  = await apiFetch("/api/leaves?" + params.toString());
      setPages(parseInt(res.headers.get("X-Pages") || "1"));
      setTotal(parseInt(res.headers.get("X-Total") || "0"));
      const data = await res.json();
      if (Array.isArray(data)) setLeaves(data);
    } catch (err) { console.error(err); }
  }, [page, search, isEmployee]);

  useEffect(() => { loadLeaves(page); }, [page]);

  // search debounce — reset to page 1
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadLeaves(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const applyLeave = async () => {
    if (!form.leaveType || !form.startDate || !form.endDate) {
      alert("Please fill in leave type, start date, and end date."); return;
    }
    try {
      await apiFetch("/api/leaves", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm({ employeeName: displayName, leaveType: "", startDate: "", endDate: "", reason: "" });
      loadLeaves();
    } catch (err) { console.error(err); }
  };

  const approveLeave = async (id) => {
    try {
      await apiFetch("/api/leaves/approve/" + id, { method: "PUT" });
      loadLeaves();
    } catch (err) { console.error(err); }
  };

  const rejectLeave = async (id) => {
    try {
      await apiFetch("/api/leaves/reject/" + id, { method: "PUT" });
      loadLeaves();
    } catch (err) { console.error(err); }
  };

  const autoApproveAll = async () => {
    const pending = leaves.filter(l => l.status === "Pending").length;
    if (pending === 0) { alert("No pending leave requests to approve."); return; }
    if (!window.confirm(`AI Auto-Approve: Approve all ${pending} pending leave requests?`)) return;
    setAutoApproving(true);
    try {
      const r    = await apiFetch("/api/leaves/auto-approve", { method: "PUT" });
      const data = await r.json();
      alert(data.message || "Auto-approved successfully.");
      loadLeaves();
    } catch (err) { console.error(err); }
    finally { setAutoApproving(false); }
  };

  const statusColor = (s) => ({ "Pending": "#f59e0b", "Approved": "#00e5a8", "Rejected": "#ff5c5c" }[s] || "#64748b");
  const leaveTypes  = ["Sick Leave", "Annual Leave", "Casual Leave", "WFH", "Maternity", "Paternity", "Emergency"];

  // Server already filters — just use leaves directly
  const filteredLeaves = leaves;
  const pendingCount  = leaves.filter(l => l.status === "Pending").length;
  const approvedCount = leaves.filter(l => l.status === "Approved").length;
  const rejectedCount = leaves.filter(l => l.status === "Rejected").length;
  // Count employees currently on approved leave today
  const todayStr      = new Date().toISOString().split("T")[0];
  const onLeaveToday  = leaves.filter(
    l => l.status === "Approved" && l.startDate <= todayStr && l.endDate >= todayStr
  ).length;

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Leave Management</h1>
          <p className="pageSub">
            {isEmployee ? displayName + " — Your Leave Requests" : "Enterprise Leave Tracking & Approval Workflow"}
          </p>
        </div>
        <div className="topActions">
          {!isEmployee && (
            <input
              placeholder="Search employee..."
              className="enterpriseSearch"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          {!isEmployee && (
            <button className="aiBtn" onClick={autoApproveAll} disabled={autoApproving}>
              {autoApproving ? "Approving..." : "⚡ AI Auto-Approve"}
            </button>
          )}
        </div>
      </div>

      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>{isEmployee ? "MY PENDING" : "PENDING REQUESTS"}</h5>
          <h1 style={{ color: "#f59e0b" }}>{pendingCount}</h1>
          <span>Awaiting Approval</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>{isEmployee ? "MY APPROVED" : "APPROVED"}</h5>
          <h1 style={{ color: "#00e5a8" }}>{approvedCount}</h1>
          <span>Approved</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>{isEmployee ? "TOTAL APPLIED" : "ON LEAVE TODAY"}</h5>
          <h1 style={{ color: "#1da1ff" }}>{isEmployee ? leaves.length : onLeaveToday}</h1>
          <span>{isEmployee ? "All time" : "Active Leaves"}</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #ff5c5c" }}>
          <h5>{isEmployee ? "MY REJECTED" : "REJECTED"}</h5>
          <h1 style={{ color: "#ff5c5c" }}>{rejectedCount}</h1>
          <span>This Month</span>
        </div>
      </div>

      <div className="bigPanel" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3>Apply for Leave</h3>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>Submit a new leave request</p>
          </div>
          <span className="statusPill pillGreen">ACTIVE</span>
        </div>
        <div className="mobileStack" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "8px" }}>EMPLOYEE NAME</label>
            <input placeholder="Employee name" className="formInput" value={form.employeeName}
              readOnly={isEmployee} style={isEmployee ? { opacity: 0.7, cursor: "not-allowed" } : {}}
              onChange={(e) => setForm({ ...form, employeeName: e.target.value })} />
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "8px" }}>LEAVE TYPE</label>
            <select className="formInput" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
              <option value="">Select leave type</option>
              {leaveTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "8px" }}>START DATE</label>
            <input type="date" className="formInput" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "8px" }}>END DATE</label>
            <input type="date" className="formInput" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "8px" }}>REASON</label>
          <textarea placeholder="Reason for leave..." className="formInput"
            style={{ minHeight: "80px", resize: "vertical" }} value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <button onClick={applyLeave} className="aiBtn" style={{ padding: "14px 28px" }}>
          Submit Leave Request
        </button>
      </div>

      <div className="bigPanel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3>{isEmployee ? "My Leave History" : "All Leave Records"}</h3>
          <span style={{ color: "#64748b", fontSize: "13px" }}>
            {total} record{total !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              {!isEmployee && <th>Employee</th>}
              <th>Leave Type</th>
              <th>Start</th>
              <th>End</th>
              <th>Reason</th>
              <th>Status</th>
              {!isEmployee && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan={isEmployee ? 5 : 7} style={{ textAlign: "center", color: "#475569", padding: "30px" }}>
                  {leaves.length === 0
                    ? (isEmployee ? "No leave requests found. Submit one above." : "No leave requests yet.")
                    : `No records match "${search}".`}
                </td>
              </tr>
            ) : (
              filteredLeaves.map((leave) => (
                <tr key={leave._id}>
                  {!isEmployee && <td style={{ color: "white", fontWeight: "600" }}>{leave.employeeName}</td>}
                  <td>{leave.leaveType}</td>
                  <td style={{ color: "#64748b" }}>{leave.startDate || "—"}</td>
                  <td style={{ color: "#64748b" }}>{leave.endDate || "—"}</td>
                  <td style={{ color: "#64748b", maxWidth: "180px" }}>{leave.reason || "—"}</td>
                  <td>
                    <span style={{ background: statusColor(leave.status) + "20", color: statusColor(leave.status), border: "1px solid " + statusColor(leave.status), padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>
                      {leave.status}
                    </span>
                  </td>
                  {!isEmployee && (
                    <td style={{ display: "flex", gap: 6 }}>
                      {leave.status === "Pending" && (
                        <>
                          <button onClick={() => approveLeave(leave._id)}
                            style={{ background: "#00e5a820", border: "1px solid #00e5a8", color: "#00e5a8", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => rejectLeave(leave._id)}
                            style={{ background: "#ff5c5c20", border: "1px solid #ff5c5c", color: "#ff5c5c", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                            ✕ Reject
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={page} pages={pages} total={total} limit={limit}
          onPageChange={p => setPage(p)}
          onLimitChange={() => {}}
        />
      </div>
    </div>
  );
}

export default Leave;
