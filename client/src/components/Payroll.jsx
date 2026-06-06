import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const MONTHS = ["January","February","March","April","May","June",
               "July","August","September","October","November","December"];
const DEPARTMENTS = ["Engineering","AI/ML","Data Science","DevOps","HR / Admin","Management"];
const THIS_MONTH  = MONTHS[new Date().getMonth()];
const THIS_YEAR   = new Date().getFullYear();

function Payroll() {
  const { apiFetch } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [search,   setSearch]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    employeeName: "",
    basicSalary:  "",
    bonus:        "",
    deductions:   "",
    department:   "Engineering",
    month:        THIS_MONTH,
    year:         String(THIS_YEAR),
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const r    = await apiFetch("/api/payroll");
      const data = await r.json();
      const arr = Array.isArray(data) ? data : (data?.payrolls || []);
      setPayrolls(arr);
    } catch (e) { console.error(e); }
  };

  const create = async () => {
    if (!form.employeeName.trim()) { alert("Employee name is required."); return; }
    if (!form.basicSalary || Number(form.basicSalary) <= 0) { alert("Basic salary must be a positive number."); return; }
    setSaving(true);
    try {
      const r    = await apiFetch("/api/payroll/create", {
        method: "POST",
        body:   JSON.stringify({
          ...form,
          basicSalary: Number(form.basicSalary),
          bonus:       Number(form.bonus)      || 0,
          deductions:  Number(form.deductions) || 0,
          year:        Number(form.year),
        }),
      });
      const data = await r.json();
      if (r.ok) {
        setForm({ employeeName: "", basicSalary: "", bonus: "", deductions: "",
                  department: "Engineering", month: THIS_MONTH, year: String(THIS_YEAR) });
        load();
      } else {
        alert(data.message || data.error || "Failed to create payroll record.");
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const filtered = payrolls.filter(p =>
    p.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayout   = payrolls.reduce((s, p) => s + (Number(p.netSalary) || 0), 0);
  const totalBasic    = payrolls.reduce((s, p) => s + (Number(p.basicSalary) || 0), 0);
  const totalBonus    = payrolls.reduce((s, p) => s + (Number(p.bonus) || 0), 0);
  const anomalyCount  = payrolls.filter(p => p.anomaly).length;

  const bands = [
    { band: "L1 – Fresher",  range: "Up to ₹10L",   color: "#1da1ff", pct: 100 },
    { band: "L2 – Junior",   range: "₹10L – ₹16L",  color: "#8b5cf6", pct: 79  },
    { band: "L3 – Mid",      range: "₹16L – ₹25L",  color: "#00e5a8", pct: 58  },
    { band: "L4 – Senior",   range: "₹25L – ₹40L",  color: "#f59e0b", pct: 34  },
    { band: "L5 – Lead",     range: "₹40L+",         color: "#ff5c5c", pct: 15  },
  ];

  const fmtINR = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Payroll Management</h1>
          <p className="pageSub">Enterprise Salary Intelligence & Compensation Analytics</p>
        </div>
        <div className="topActions">
          <input placeholder="Search employee, department..." className="enterpriseSearch"
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="aiBtn" onClick={load}>⚡ Refresh</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{ borderTop: "3px solid #00e5a8" }}>
          <h5>TOTAL NET PAYOUT</h5>
          <h1 style={{ color: "#00e5a8", fontSize: 22 }}>
            {totalPayout > 0 ? "₹" + (totalPayout / 100000).toFixed(1) + "L" : "—"}
          </h1>
          <span>All records</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #1da1ff" }}>
          <h5>TOTAL BASIC</h5>
          <h1 style={{ color: "#1da1ff", fontSize: 22 }}>
            {totalBasic > 0 ? "₹" + (totalBasic / 100000).toFixed(1) + "L" : "—"}
          </h1>
          <span>Base salary sum</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #8b5cf6" }}>
          <h5>TOTAL BONUS</h5>
          <h1 style={{ color: "#8b5cf6", fontSize: 22 }}>
            {totalBonus > 0 ? "₹" + (totalBonus / 100000).toFixed(1) + "L" : "—"}
          </h1>
          <span>Across all employees</span>
        </div>
        <div className="enterpriseCard" style={{ borderTop: "3px solid #ff5c5c" }}>
          <h5>RECORDS</h5>
          <h1 style={{ color: "#ff5c5c" }}>{payrolls.length}</h1>
          <span>{anomalyCount > 0 ? anomalyCount + " anomaly flagged" : "All clear"}</span>
        </div>
      </div>

      <div className="enterpriseRow" style={{ marginBottom: 20 }}>
        {/* AI Alerts */}
        <div className="bigPanel">
          <h3 style={{ marginBottom: 20 }}>🤖 AI Payroll Alerts</h3>
          {[
            anomalyCount > 0
              ? { type:"Anomaly",  msg: anomalyCount + " anomaly detected in payroll records. Manual review recommended.", color:"#ff5c5c", icon:"⚠" }
              : { type:"All Clear", msg:"No anomalies detected in current payroll records.", color:"#00e5a8", icon:"✅" },
            { type:"Tax Notice", msg:"TDS filing due — ensure all deductions are recorded before period close.", color:"#f59e0b", icon:"📋" },
            { type:"Insight",    msg:"Bonus-to-salary ratio: " + (totalBasic > 0 ? ((totalBonus/totalBasic)*100).toFixed(1) : "0") + "% across all processed records.", color:"#1da1ff", icon:"💡" },
            { type:"Summary",    msg: payrolls.length + " payroll records processed. Net payout: " + (totalPayout > 0 ? "₹" + (totalPayout/100000).toFixed(1) + "L" : "₹0") + ".", color:"#8b5cf6", icon:"📊" },
          ].map((a, i) => (
            <div key={i} style={{ background: a.color + "10", border: "1px solid " + a.color + "30", borderLeft: "3px solid " + a.color, borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <p style={{ color: a.color, fontWeight: 600, fontSize: 12, margin: "0 0 4px" }}>{a.icon} {a.type}</p>
              <p style={{ color: "#cbd5e1", fontSize: 13, margin: 0 }}>{a.msg}</p>
            </div>
          ))}
        </div>

        {/* Salary Bands */}
        <div className="bigPanel">
          <h3 style={{ marginBottom: 20 }}>Salary Band Distribution</h3>
          {bands.map((b, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: b.color, fontWeight: 600, fontSize: 13 }}>{b.band}</span>
                <span style={{ color: "#475569", fontSize: 12 }}>{b.range}</span>
              </div>
              <div className="progressBar"><div style={{ width: b.pct + "%", background: b.color }}></div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Payroll Form */}
      <div className="bigPanel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3>Generate Payroll</h3>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              Tax (10% of basic) is auto-calculated. Net = Basic + Bonus - Deductions - Tax.
            </p>
          </div>
          <span className="statusPill pillGreen">ACTIVE</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 16 }}>
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
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>BASIC SALARY (₹) *</label>
            <input className="formInput" type="number" min="0" placeholder="e.g. 100000"
              value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} />
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>BONUS (₹)</label>
            <input className="formInput" type="number" min="0" placeholder="e.g. 5000"
              value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })} />
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>DEDUCTIONS (₹)</label>
            <input className="formInput" type="number" min="0" placeholder="e.g. 2000"
              value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>MONTH</label>
              <select className="formInput" value={form.month}
                onChange={e => setForm({ ...form, month: e.target.value })}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 8 }}>YEAR</label>
              <select className="formInput" value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value })}>
                {[THIS_YEAR-1, THIS_YEAR, THIS_YEAR+1].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Live net preview */}
        {form.basicSalary > 0 && (
          <div style={{ background: "#00e5a810", border: "1px solid #00e5a830", borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
            <span style={{ color: "#64748b", fontSize: 12 }}>Estimated Net Salary: </span>
            <span style={{ color: "#00e5a8", fontWeight: 700 }}>
              {fmtINR(
                Number(form.basicSalary) + Number(form.bonus||0) -
                Number(form.deductions||0) - Math.round(Number(form.basicSalary) * 0.1)
              )}
            </span>
            <span style={{ color: "#475569", fontSize: 11, marginLeft: 8 }}>
              (includes 10% TDS: {fmtINR(Math.round(Number(form.basicSalary) * 0.1))})
            </span>
          </div>
        )}

        <button onClick={create} disabled={saving} className="aiBtn" style={{ padding: "14px 28px" }}>
          {saving ? "Processing..." : "₹ Generate Payroll"}
        </button>
      </div>

      {/* Records Table */}
      <div className="bigPanel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3>Payroll Records</h3>
          <span style={{ color: "#64748b", fontSize: 13 }}>
            {filtered.length} of {payrolls.length} records
            {search && ` matching "${search}"`}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee</th><th>Department</th><th>Month</th>
              <th>Basic</th><th>Bonus</th><th>Deductions</th>
              <th>Tax</th><th>Net Salary</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "#475569", padding: 30 }}>
                  {payrolls.length === 0 ? "No payroll records yet. Use the form above." : "No records match your search."}
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p._id}>
                  <td style={{ color: "white", fontWeight: 600 }}>{p.employeeName}</td>
                  <td style={{ color: "#64748b" }}>{p.department || "—"}</td>
                  <td style={{ color: "#64748b", fontSize: 12 }}>{p.month ? p.month + " " + p.year : "—"}</td>
                  <td>{fmtINR(p.basicSalary)}</td>
                  <td style={{ color: "#00e5a8" }}>{fmtINR(p.bonus)}</td>
                  <td style={{ color: "#ff5c5c" }}>{fmtINR(p.deductions)}</td>
                  <td style={{ color: "#f59e0b" }}>{fmtINR(p.tax)}</td>
                  <td style={{ color: "#00e5a8", fontWeight: 700 }}>{fmtINR(p.netSalary)}</td>
                  <td>
                    <span className={"statusPill " + (p.anomaly ? "pillRed" : "pillGreen")}>
                      {p.status || "Processed"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Payroll;
