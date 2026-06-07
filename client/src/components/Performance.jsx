import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";

const DEPARTMENTS = ["Engineering","AI/ML","Data Science","DevOps","HR / Admin","Management"];

const getCurrentQuarter = () => {
  const m = new Date().getMonth();
  const q = m < 3 ? 1 : m < 6 ? 2 : m < 9 ? 3 : 4;
  return "Q" + q + " " + new Date().getFullYear();
};

const QUARTERS = ["Q1","Q2","Q3","Q4"].map(q => q + " " + new Date().getFullYear());

function Performance() {
  const { apiFetch, name: managerName } = useAuth();
  const [records, setRecords] = useState([]);
  const [search,  setSearch]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [page,  setPage]  = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [form, setForm] = useState({
    employeeName: "",
    department:   "Engineering",
    rating:       "",
    review:       "",
    quarter:      getCurrentQuarter(),
  });

  useEffect(() => { load(); }, [page, limit, search]);

  const load = async () => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.set("search", search);
      const r    = await apiFetch("/api/performance?" + params.toString());
      setPages(parseInt(r.headers.get("X-Pages") || "1"));
      setTotal(parseInt(r.headers.get("X-Total") || "0"));
      const data = await r.json();
      if (Array.isArray(data)) setRecords(data);
    } catch (e) { console.error(e); }
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };

  const save = async () => {
    if (!form.employeeName.trim()) { alert("Employee name is required."); return; }
    const r = Number(form.rating);
    if (!form.rating || isNaN(r) || r < 1 || r > 5) { alert("Rating must be between 1 and 5."); return; }
    setSaving(true);
    try {
      const res  = await apiFetch("/api/performance/add", {
        method: "POST",
        body:   JSON.stringify({ ...form, rating: r, reviewedBy: managerName || "" }),
      });
      const data = await res.json();
      if (res.ok) {
        setForm({ employeeName: "", department: "Engineering", rating: "", review: "", quarter: getCurrentQuarter() });
        setRecords(prev => [data, ...prev]);
      } else {
        alert(data.message || data.error || "Failed to save review.");
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // records are already filtered server-side when search is set
  const filtered   = records;

  const sorted     = [...records].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  const top5       = sorted.slice(0, 5);
  const pipList    = records.filter(r => r.pip?.active);
  const promoReady = records.filter(r => r.promotionReady).length;
  const avg        = records.length
    ? (records.reduce((s, r) => s + (r.rating || 0), 0) / records.length).toFixed(1)
    : 0;
  const above85    = records.filter(r => (r.aiScore || 0) >= 85).length;

  const scoreColor = n => n >= 85 ? "#00e5a8" : n >= 60 ? "#f59e0b" : "#ff5c5c";

  const StarRating = ({ value }) => (
    <span style={{ letterSpacing: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= value ? "#f59e0b" : "#1e293b", fontSize: 14 }}>★</span>
      ))}
    </span>
  );

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Performance Intelligence</h1>
          <p className="pageSub">Leaderboard · PIP Tracking · AI Recommendations — Live from DB</p>
        </div>
        <div className="topActions">
          <input placeholder="Search employee, department..." className="enterpriseSearch"
            value={search} onChange={e => handleSearch(e.target.value)} />
          <button className="aiBtn" onClick={load}>⚡ Refresh</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>TOP PERFORMERS</h5>
          <h1 style={{ color: "#00e5a8" }}>{above85}</h1>
          <span>Score ≥ 85%</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>AVG RATING</h5>
          <h1 style={{ color: "#f59e0b" }}>{avg}/5</h1>
          <span>All reviews</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>PROMOTION READY</h5>
          <h1 style={{ color: "#1da1ff" }}>{promoReady}</h1>
          <span>Rating ≥ 4</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #ff5c5c" }}>
          <h5>PIP ACTIVE</h5>
          <h1 style={{ color: "#ff5c5c" }}>{pipList.length}</h1>
          <span>Improvement Plan</span>
        </div>
      </div>

      <div className="enterpriseRow" style={{ marginBottom: 20 }}>
        {/* Leaderboard */}
        <div className="bigPanel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3>Performance Leaderboard</h3>
            <span className="statusPill pillGreen">LIVE</span>
          </div>
          {top5.length === 0 ? (
            <p style={{ color: "#475569", textAlign: "center", padding: 20 }}>No records yet. Add reviews below.</p>
          ) : (
            top5.map((emp, i) => (
              <div key={emp._id || i} style={{
                display: "flex", alignItems: "center", gap: 14, padding: 14,
                borderRadius: 12, marginBottom: 10,
                background: i === 0 ? "#00e5a810" : "#06111e",
                border: "1px solid " + (i === 0 ? "#00e5a830" : "#1e293b")
              }}>
                <div style={{ fontSize: 20, width: 32, textAlign: "center" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "white", fontWeight: 600, margin: "0 0 2px" }}>{emp.employeeName}</p>
                  <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
                    {emp.department || "Engineering"} · {emp.quarter || getCurrentQuarter()}
                    {emp.promotionReady && <span style={{ color: "#00e5a8", marginLeft: 8, fontSize: 11 }}>🚀 Promo Ready</span>}
                    {emp.pip?.active   && <span style={{ color: "#ff5c5c",  marginLeft: 8, fontSize: 11 }}>⚠ PIP</span>}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: scoreColor(emp.aiScore), fontWeight: 700, margin: "0 0 2px", fontSize: 18 }}>{emp.aiScore}%</p>
                  <StarRating value={emp.rating} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bigPanel">
          <h3 style={{ marginBottom: 20 }}>🤖 AI Recommendations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Promotion Ready",    value: promoReady + " employees",       color: "#00e5a8", icon: "🚀" },
              { label: "PIP Active",         value: pipList.length + " employees",   color: "#ff5c5c", icon: "⚠" },
              { label: "Above Target (85%)", value: above85 + " employees",          color: "#1da1ff", icon: "🎯" },
              { label: "Total Reviews",      value: records.length + " records",     color: "#8b5cf6", icon: "📊" },
              { label: "Average Rating",     value: avg + " / 5",                    color: "#f59e0b", icon: "⭐" },
            ].map(({ label, value, color, icon }, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#06111e", border: "1px solid #1e293b", borderLeft: "3px solid " + color,
                borderRadius: 8, padding: "12px 16px" }}>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>{icon} {label}</span>
                <span style={{ color, fontWeight: 700, fontSize: 14 }}>{value}</span>
              </div>
            ))}
          </div>

          {pipList.length > 0 && (
            <div style={{ marginTop: 16, background: "#ff5c5c10", border: "1px solid #ff5c5c30",
              borderRadius: 8, padding: "12px 14px" }}>
              <p style={{ color: "#ff5c5c", fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>⚠ ACTIVE PIP EMPLOYEES</p>
              {pipList.map((p, i) => (
                <p key={i} style={{ color: "#94a3b8", fontSize: 13, margin: "3px 0" }}>
                  • {p.employeeName} — Rating {p.rating}/5
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Review Form */}
      <div className="bigPanel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3>Add Performance Review</h3>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              Rating ≥ 4 auto-marks Promotion Ready. Rating ≤ 2 auto-activates PIP.
            </p>
          </div>
          <span className="statusPill pillGreen">ACTIVE</span>
        </div>
        <div className="mobileStack" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>EMPLOYEE NAME *</label>
            <input className="formInput" placeholder="Full name" value={form.employeeName}
              onChange={e => setForm({ ...form, employeeName: e.target.value })} />
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>DEPARTMENT</label>
            <select className="formInput" value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>RATING (1–5) *</label>
            <select className="formInput" value={form.rating}
              onChange={e => setForm({ ...form, rating: e.target.value })}>
              <option value="">Select rating...</option>
              {[5,4,3,2,1].map(n => (
                <option key={n} value={n}>{n} ⭐ — {n===5?"Outstanding":n===4?"Exceeds Expectations":n===3?"Meets Expectations":n===2?"Needs Improvement":"Unsatisfactory"}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>QUARTER</label>
            <select className="formInput" value={form.quarter}
              onChange={e => setForm({ ...form, quarter: e.target.value })}>
              {QUARTERS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>REVIEW NOTES</label>
          <textarea className="formInput" placeholder="Write detailed review..." rows={4}
            style={{ resize: "vertical", minHeight: 100 }} value={form.review}
            onChange={e => setForm({ ...form, review: e.target.value })} />
        </div>

        {/* Rating preview */}
        {form.rating && (
          <div style={{ background: "#06111e", border: "1px solid #1e293b", borderRadius: 8,
            padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <StarRating value={Number(form.rating)} />
            <span style={{ color: Number(form.rating) >= 4 ? "#00e5a8" : Number(form.rating) <= 2 ? "#ff5c5c" : "#f59e0b", fontSize: 13, fontWeight: 600 }}>
              AI Score: {Number(form.rating) * 20}%
              {Number(form.rating) >= 4 && " · 🚀 Will mark Promotion Ready"}
              {Number(form.rating) <= 2 && " · ⚠ Will activate PIP"}
            </span>
          </div>
        )}

        <button onClick={save} disabled={saving} className="aiBtn" style={{ padding: "14px 28px" }}>
          {saving ? "Saving..." : "⭐ Save Review"}
        </button>
      </div>

      {/* Records Table */}
      <div className="bigPanel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3>Performance Records</h3>
          <span style={{ color: "#64748b", fontSize: 13 }}>
            {total} records{search && ` matching "${search}"`}
          </span>
        </div>
        <table>
          <thead>
            <tr><th>Employee</th><th>Department</th><th>Quarter</th><th>Rating</th><th>AI Score</th><th>Status</th><th>Review</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#475569", padding: 30 }}>
                  {records.length === 0 ? "No reviews yet. Use the form above." : "No records match your search."}
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p._id}>
                  <td style={{ color: "white", fontWeight: 600 }}>{p.employeeName}</td>
                  <td style={{ color: "#64748b" }}>{p.department || "—"}</td>
                  <td style={{ color: "#64748b", fontSize: 12 }}>{p.quarter || "—"}</td>
                  <td><StarRating value={p.rating} /></td>
                  <td>
                    <span style={{ color: scoreColor(p.aiScore), fontWeight: 700 }}>{p.aiScore}%</span>
                  </td>
                  <td>
                    {p.promotionReady && <span style={{ background: "#00e5a820", color: "#00e5a8", border: "1px solid #00e5a840", padding: "2px 8px", borderRadius: 12, fontSize: 11, marginRight: 4 }}>🚀 Promo</span>}
                    {p.pip?.active    && <span style={{ background: "#ff5c5c20", color: "#ff5c5c",  border: "1px solid #ff5c5c40", padding: "2px 8px", borderRadius: 12, fontSize: 11 }}>⚠ PIP</span>}
                    {!p.promotionReady && !p.pip?.active && <span style={{ color: "#475569", fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ color: "#94a3b8", maxWidth: 280, fontSize: 12 }}>{p.review || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          page={page} pages={pages} total={total} limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </div>
    </div>
  );
}
export default Performance;
