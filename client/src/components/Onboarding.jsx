import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";

const DEFAULT_STEPS = [
  "Offer Letter Signed & e-KYC Verified",
  "IT Asset Allocation",
  "System Access Provisioning",
  "Training Program Enrollment",
  "Buddy & Mentor Assignment",
  "Commitment Bond Signing",
  "Team Introduction & Project Briefing",
];

function Onboarding() {
  const { apiFetch } = useAuth();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);
  const [form, setForm] = useState({
    name: "", role: "Engineer", department: "Engineering", startDate: ""
  });

  const departments = ["Engineering","AI/ML","Data","DevOps","HR / Admin","Finance","Sales"];

  useEffect(() => { loadAll(page); }, [page]);

  const loadAll = async (p = 1) => {
    setLoading(true);
    try {
      const r    = await apiFetch(`/api/onboarding?page=${p}&limit=20`);
      setPages(parseInt(r.headers.get("X-Pages") || "1"));
      setTotal(parseInt(r.headers.get("X-Total")  || "0"));
      const data = await r.json();
      if (Array.isArray(data)) setRecords(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createRecord = async () => {
    if (!form.name.trim()) { alert("Employee name is required."); return; }
    setCreating(true);
    try {
      const r    = await apiFetch("/api/onboarding", {
        method: "POST",
        body:   JSON.stringify(form),
      });
      const data = await r.json();
      if (r.ok) {
        setForm({ name: "", role: "Engineer", department: "Engineering", startDate: "" });
        setShowForm(false);
        setSelected(data._id);
        setPage(1);
        loadAll(1);
      } else {
        alert(data.message || "Failed to create onboarding record.");
      }
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const markStep = async (recordId, stepIndex) => {
    try {
      const r    = await apiFetch("/api/onboarding/" + recordId + "/step/" + stepIndex, { method: "PUT" });
      const data = await r.json();
      if (r.ok) setRecords(prev => prev.map(rec => rec._id === recordId ? data : rec));
      else alert(data.message || "Failed to update step.");
    } catch (e) { console.error(e); }
  };

  const deleteRecord = async (recordId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this onboarding record?")) return;
    try {
      await apiFetch("/api/onboarding/" + recordId, { method: "DELETE" });
      setRecords(prev => prev.filter(r => r._id !== recordId));
      if (selected === recordId) setSelected(null);
    } catch (e) { console.error(e); }
  };

  // KPIs
  const active    = records.filter(r => r.status !== "Completed").length;
  const completed = records.filter(r => r.status === "Completed").length;
  const avgPct    = records.length
    ? Math.round(records.reduce((s, r) => s + (r.completionPercent || 0), 0) / records.length)
    : 0;

  const statusColor = (s) => ({
    "Completed":   "#00e5a8",
    "In Progress": "#f59e0b",
    "Not Started": "#64748b",
  }[s] || "#64748b");

  const stepStatusColor = (s) => s.completed ? "#00e5a8" : "#1e293b";

  return (
    <div>
      {/* Header */}
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Employee Onboarding</h1>
          <p className="pageSub">Multi-step Workflow · Real-time Progress · Live from Database</p>
        </div>
        <div className="topActions">
          <button className="aiBtn" onClick={() => setShowForm(f => !f)}>
            {showForm ? "✕ Cancel" : "+ New Onboarding"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>ACTIVE ONBOARDING</h5>
          <h1 style={{ color: "#00e5a8" }}>{active}</h1>
          <span>In Progress</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>COMPLETED (ALL TIME)</h5>
          <h1 style={{ color: "#1da1ff" }}>{completed}</h1>
          <span>Fully Onboarded</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #8b5cf6" }}>
          <h5>TOTAL RECORDS</h5>
          <h1 style={{ color: "#8b5cf6" }}>{records.length}</h1>
          <span>In Database</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>AVG COMPLETION</h5>
          <h1 style={{ color: "#f59e0b" }}>{avgPct}%</h1>
          <span>Across All Active</span>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bigPanel" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3>Start New Onboarding</h3>
              <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                Creates a 7-step onboarding workflow for the new hire
              </p>
            </div>
            <span className="statusPill pillGreen">NEW</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>EMPLOYEE NAME *</label>
              <input className="formInput" placeholder="Full name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>ROLE / DESIGNATION</label>
              <input className="formInput" placeholder="e.g. Senior Engineer" value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>DEPARTMENT</label>
              <select className="formInput" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>START DATE</label>
              <input type="date" className="formInput" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
          </div>
          <button onClick={createRecord} disabled={creating} className="aiBtn" style={{ padding: "14px 28px" }}>
            {creating ? "Creating..." : "🚀 Start Onboarding"}
          </button>
        </div>
      )}

      {/* Records List */}
      <div className="bigPanel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3>Onboarding Records — Live from Database</h3>
          <span style={{ color: "#64748b", fontSize: 13 }}>{total} total</span>
        </div>

        {loading && (
          <p style={{ color: "#475569", textAlign: "center", padding: 30 }}>Loading onboarding records...</p>
        )}

        {!loading && records.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
            <p>No onboarding records yet.</p>
            <p style={{ fontSize: 13 }}>Click <strong style={{ color: "#00e5a8" }}>+ New Onboarding</strong> above to create the first one.</p>
          </div>
        )}

        {records.map(rec => {
          const isOpen  = selected === rec._id;
          const sc      = statusColor(rec.status);
          const steps   = rec.steps || [];
          const done    = steps.filter(s => s.completed).length;

          return (
            <div key={rec._id}
              style={{ background: "#06111e", border: "1px solid " + (isOpen ? "#00e5a840" : "#1e293b"),
                borderRadius: 12, marginBottom: 12, overflow: "hidden",
                boxShadow: isOpen ? "0 0 0 1px #00e5a830" : "none", transition: ".2s" }}>

              {/* Card Header — click to expand */}
              <div onClick={() => setSelected(isOpen ? null : rec._id)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px 20px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: sc + "20", border: "2px solid " + sc,
                    color: sc, display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0
                  }}>
                    {rec.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: "white", fontWeight: 700, margin: "0 0 3px", fontSize: 15 }}>{rec.name}</p>
                    <p style={{ color: "#64748b", margin: 0, fontSize: 12 }}>
                      {rec.role} · {rec.department} · Started {new Date(rec.startDate).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: sc, fontWeight: 700, margin: "0 0 3px", fontSize: 15 }}>
                      {rec.completionPercent || 0}%
                    </p>
                    <p style={{ color: "#475569", fontSize: 11, margin: 0 }}>{done}/{steps.length} steps</p>
                  </div>
                  <span style={{
                    background: sc + "20", color: sc, border: "1px solid " + sc + "40",
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap"
                  }}>
                    {rec.status}
                  </span>
                  <button onClick={e => deleteRecord(rec._id, e)}
                    style={{ background: "#ff5c5c10", border: "1px solid #ff5c5c30", color: "#ff5c5c",
                      padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>
                    ✕
                  </button>
                  <span style={{ color: "#475569", fontSize: 18 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: 3, background: "#0b1220" }}>
                <div style={{ height: "100%", width: (rec.completionPercent || 0) + "%", background: sc, transition: ".4s" }} />
              </div>

              {/* Expanded Steps */}
              {isOpen && (
                <div style={{ padding: "20px 20px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                    {steps.map((step, idx) => (
                      <div key={idx} style={{
                        background: step.completed ? "#00e5a808" : "#0b1220",
                        border: "1px solid " + (step.completed ? "#00e5a830" : "#1e293b"),
                        borderRadius: 8, padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                          background: step.completed ? "#00e5a8" : "#1e293b",
                          border: "2px solid " + (step.completed ? "#00e5a8" : "#334155"),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, color: step.completed ? "#000" : "#475569", fontWeight: 700
                        }}>
                          {step.completed ? "✓" : idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: step.completed ? "#00e5a8" : "#cbd5e1", margin: "0 0 2px", fontSize: 13, fontWeight: 600 }}>
                            {step.title}
                          </p>
                          {step.completed && step.completedAt && (
                            <p style={{ color: "#475569", margin: 0, fontSize: 11 }}>
                              Done {new Date(step.completedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                            </p>
                          )}
                        </div>
                        {!step.completed && (
                          <button onClick={() => markStep(rec._id, idx)}
                            style={{ background: "#00e5a815", border: "1px solid #00e5a840", color: "#00e5a8",
                              padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11,
                              whiteSpace: "nowrap", flexShrink: 0 }}>
                            Mark Done
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {pages > 1 && (
          <Pagination
            page={page} pages={pages} total={total} limit={20}
            onPageChange={p => setPage(p)}
            onLimitChange={() => {}}
          />
        )}
      </div>
    </div>
  );
}

export default Onboarding;
