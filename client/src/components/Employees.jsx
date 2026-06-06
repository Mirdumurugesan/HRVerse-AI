import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";

function Employees() {
  const { apiFetch } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [page,    setPage]        = useState(1);
  const [limit,   setLimit]       = useState(25);
  const [total,   setTotal]       = useState(0);
  const [pages,   setPages]       = useState(1);

  // Live stats from /api/employees/stats and /api/attendance/summary
  const [stats,      setStats]      = useState(null);
  const [attSummary, setAttSummary] = useState(null);

  // debounced search resets to page 1
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load KPI stats once on mount
  useEffect(() => {
    apiFetch("/api/employees/stats")
      .then(r => r.json()).then(setStats).catch(() => {});
    apiFetch("/api/attendance/summary")
      .then(r => r.json()).then(setAttSummary).catch(() => {});
  }, []);

  const fetchEmployees = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (debouncedSearch) params.set("search", debouncedSearch);
    apiFetch(`/api/employees?${params}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmployees(data); setTotal(data.length); setPages(1);
        } else if (data?.employees) {
          setEmployees(data.employees);
          setTotal(data.pagination?.total  || data.employees.length);
          setPages(data.pagination?.pages  || 1);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // search is now server-side; no client filter needed
  const filtered = employees;

  const perfColor  = (p) => p >= 90 ? "#00e5a8" : p >= 80 ? "#1da1ff" : "#f59e0b";
  const deptColors = {
    "AI/ML": "#00e5a8", "Engineering": "#1da1ff", "Data": "#8b5cf6",
    "DevOps": "#f59e0b", "HR / Admin": "#ff5c5c"
  };

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Workforce Management</h1>
          <p className="pageSub">Enterprise Employee Intelligence Platform</p>
        </div>
        <div className="topActions">
          <input placeholder="Search employee, role..." className="enterpriseSearch"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="aiBtn">⚡ Workforce Insights</button>
        </div>
      </div>

      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>TOTAL EMPLOYEES</h5>
          <h1 style={{ color: "#00e5a8" }}>{total.toLocaleString() || 0}</h1>
          <span>In Database</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>PRESENT TODAY</h5>
          <h1 style={{ color: "#1da1ff" }}>
            {attSummary ? attSummary.present.toLocaleString() : "—"}
          </h1>
          <span>{attSummary ? `${attSummary.rate}% Attendance Rate` : "Loading..."}</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #8b5cf6" }}>
          <h5>LEADERSHIP READY</h5>
          <h1 style={{ color: "#8b5cf6" }}>
            {stats ? stats.promotions.toLocaleString() : "—"}
          </h1>
          <span>Performance ≥ 90%</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #f59e0b" }}>
          <h5>ATTRITION RATE</h5>
          <h1 style={{ color: "#f59e0b" }}>
            {stats ? `${stats.attrition}%` : "—"}
          </h1>
          <span>Resigned + Terminated</span>
        </div>
      </div>

      <div className="enterpriseRow">
        <div className="bigPanel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3>Employee Directory</h3>
            <span style={{ color: "#64748b", fontSize: "13px" }}>{total.toLocaleString()} employees</span>
          </div>

          {loading && <p style={{ color: "#475569", textAlign: "center", padding: "30px" }}>Loading employees...</p>}

          {!loading && filtered.length === 0 && (
            <p style={{ color: "#475569", textAlign: "center", padding: "30px" }}>
              No employees found. Use the Onboard Employee form to add employees.
            </p>
          )}

          {loading && employees.length > 0 && (
            <p style={{ color: "#475569", fontSize: "12px", marginBottom: "8px" }}>Refreshing…</p>
          )}

          {filtered.map((emp, i) => {
            const p    = emp.performanceScore || emp.performance || 90;
            const dept = emp.department || emp.dept || "Engineering";
            const dc   = deptColors[dept] || "#00e5a8";
            return (
              <div key={emp._id || i} className="candidateCard">
                <div className="candidateHeader">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      background: dc + "20", border: "2px solid " + dc,
                      color: dc, display: "flex", alignItems: "center",
                      justifyContent: "center", fontWeight: "700", fontSize: "16px", flexShrink: 0
                    }}>
                      {emp.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ color: "white", margin: "0 0 3px" }}>{emp.name}</h3>
                      <p style={{ color: "#64748b", margin: 0, fontSize: "12px" }}>
                        {emp.role || emp.designation}{emp.location ? " · " + emp.location : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: perfColor(p), fontWeight: "700", fontSize: "20px" }}>{p}%</div>
                    <div style={{ color: "#475569", fontSize: "11px" }}>Performance</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                  <span style={{ background: dc + "20", color: dc, border: "1px solid " + dc + "40", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>{dept}</span>
                  {emp.experience && <span style={{ background: "#1e293b", color: "#64748b", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>💼 {emp.experience}</span>}
                  {emp.location   && <span style={{ background: "#1e293b", color: "#64748b", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>📍 {emp.location}</span>}
                </div>

                <div className="progressBar" style={{ marginTop: "12px" }}>
                  <div style={{ width: p + "%", background: perfColor(p) }}></div>
                </div>
              </div>
            );
          })}

          <Pagination
            page={page} pages={pages} total={total} limit={limit}
            onPageChange={setPage}
            onLimitChange={(n) => { setLimit(n); setPage(1); }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="bigPanel">
            <h3 style={{ marginBottom: "18px" }}>Workforce by Location</h3>
            {stats?.locationBreakdown?.length > 0
              ? stats.locationBreakdown.map((loc, i) => (
                  <div key={i} style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <p style={{ color: "#cbd5e1", margin: 0, fontSize: "13px" }}>{loc.location}</p>
                      <span style={{ color: "#00e5a8", fontWeight: "600", fontSize: "13px" }}>{loc.count.toLocaleString()}</span>
                    </div>
                    <div className="progressBar"><div style={{ width: loc.pct + "%" }}></div></div>
                  </div>
                ))
              : <p style={{ color: "#475569", fontSize: "13px" }}>Loading distribution...</p>
            }
          </div>

          <div className="bigPanel">
            <h3 style={{ marginBottom: "16px" }}>🤖 AI Workforce Forecast</h3>
            <div className="aiInsight">
              {[
                ["High Performers",     stats ? `${stats.forecast.highPerformers.toLocaleString()} Employees`  : "—", "#00e5a8"],
                ["Leadership Ready",    stats ? `${stats.forecast.leadershipReady.toLocaleString()} Employees` : "—", "#1da1ff"],
                ["Upskilling Required", stats ? `${stats.forecast.upskilling.toLocaleString()} Employees`      : "—", "#f59e0b"],
                ["Active Workforce",    stats ? `${stats.active.toLocaleString()} Employees`                   : "—", "#8b5cf6"]
              ].map(([k, v, c], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>{k}</span>
                  <span style={{ color: c, fontWeight: "600", fontSize: "13px" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Employees;
