import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";

const COLORS = ["#00e5a8","#1da1ff","#8b5cf6","#f59e0b","#ff5c5c"];

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0b1220", border:"1px solid #1e293b", borderRadius:8, padding:"10px 14px" }}>
      <p style={{ color:"#94a3b8", margin:"0 0 4px", fontSize:12 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#00e5a8", margin:"2px 0", fontWeight:700, fontSize:13 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function Analytics() {
  const { apiFetch } = useAuth();
  const [funnel,     setFunnel]     = useState([]);
  const [skills,     setSkills]     = useState([]);
  const [scores,     setScores]     = useState([]);
  const [depts,      setDepts]      = useState([]);
  const [attTrend,   setAttTrend]   = useState([]);
  const [attSummary, setAttSummary] = useState(null);
  const [payroll,    setPayroll]    = useState(null);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [perf,       setPerf]       = useState(null);
  const [interviews, setInterviews] = useState(null);
  const [leaveData,  setLeaveData]  = useState(null);
  const [headcount,  setHeadcount]  = useState(null);
  const [loading,    setLoading]    = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch("/api/analytics/hiring-funnel").then(r=>r.json()).catch(()=>[]),
      apiFetch("/api/analytics/skill-distribution").then(r=>r.json()).catch(()=>[]),
      apiFetch("/api/analytics/score-distribution").then(r=>r.json()).catch(()=>[]),
      apiFetch("/api/analytics/department-metrics").then(r=>r.json()).catch(()=>[]),
      apiFetch("/api/analytics/attendance-trends").then(r=>r.json()).catch(()=>[]),
      apiFetch("/api/analytics/attendance-summary").then(r=>r.json()).catch(()=>null),
      apiFetch("/api/analytics/payroll").then(r=>r.json()).catch(()=>null),
      apiFetch("/api/analytics/payroll-trend").then(r=>r.json()).catch(()=>[]),
      apiFetch("/api/analytics/performance").then(r=>r.json()).catch(()=>null),
      apiFetch("/api/analytics/interviews").then(r=>r.json()).catch(()=>null),
      apiFetch("/api/analytics/leave").then(r=>r.json()).catch(()=>null),
      apiFetch("/api/analytics/headcount").then(r=>r.json()).catch(()=>null),
    ]).then(([f,sk,sc,d,at,attSum,pay,payTrend,prf,iv,lv,hc]) => {
      setFunnel(Array.isArray(f)  ? f  : []);
      setSkills(Array.isArray(sk) ? sk : []);
      setScores(Array.isArray(sc) ? sc : []);
      setDepts(Array.isArray(d)   ? d  : []);
      setAttTrend(Array.isArray(at) ? at : []);
      setAttSummary(attSum && !attSum.error ? attSum : null);
      setPayroll(pay && !pay.error ? pay : null);
      setPayrollTrend(Array.isArray(payTrend) ? payTrend : []);
      setPerf(prf   && !prf.error  ? prf : null);
      setInterviews(iv && !iv.error ? iv  : null);
      setLeaveData(lv && !lv.error ? lv : null);
      setHeadcount(hc && !hc.error ? hc : null);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const exportCSV = () => {
    if (depts.length === 0) { alert("No department data to export."); return; }
    const rows = [["Department","Headcount","Avg Salary","Avg Performance","Attrition"],
      ...depts.map(d => [d.dept, d.headcount, d.avgSalary, d.performance, d.attrition])];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "hrverse_analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", flexDirection:"column", gap:16 }}>
      <div style={{ width:48, height:48, border:"3px solid #1e293b", borderTop:"3px solid #00e5a8", borderRadius:"50%", animation:"spin 1s linear infinite" }}></div>
      <p style={{ color:"#475569" }}>Loading analytics from database...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const axisStyle = { fill:"#64748b", fontSize:11 };
  const gridColor = "#1e293b";

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Analytics & Reporting</h1>
          <p className="pageSub">Live data — Hiring · Screening · Attendance · Payroll · Performance</p>
        </div>
        <div className="topActions">
          <button className="aiBtn" onClick={load} style={{ marginRight:8 }}>⚡ Refresh</button>
          <button className="secondaryBtn" onClick={exportCSV}>📥 Export CSV</button>
        </div>
      </div>

      {/* KPIs — all from MongoDB aggregation */}
      <div className="enterpriseGrid">
        {[
          ["TOTAL EMPLOYEES",     headcount?.active ?? headcount?.total ?? "—",                              "#00e5a8"],
          ["TOTAL CANDIDATES",    funnel.find(f=>f.stage==="Applications")?.value || 0,                      "#1da1ff"],
          ["ATTENDANCE RATE",     attSummary ? attSummary.attendancePct + "%" : "—",                         "#f59e0b"],
          ["TOTAL INTERVIEWS",    interviews?.total || 0,                                                      "#8b5cf6"],
          ["AVG INTERVIEW SCORE", interviews?.avgScores?.avgOverall
            ? Math.round(interviews.avgScores.avgOverall) + "%" : "—",                                        "#ff5c5c"],
          ["PENDING LEAVES",      leaveData?.byStatus?.pending ?? "—",                                        "#f59e0b"],
          ["TOTAL PAYROLL",       payroll ? "₹" + ((payroll.totalPayroll||0)/100000).toFixed(1) + "L" : "—", "#00e5a8"],
          ["PROMOTION READY",     perf?.promoCount ?? "—",                                                     "#1da1ff"],
        ].map(([l,v,c],i) => (
          <div key={i} className="enterpriseCard" style={{ borderTop:"3px solid "+c }}>
            <h5>{l}</h5><h1 style={{ color:c }}>{v}</h1>
          </div>
        ))}
      </div>

      {/* Hiring Funnel + Skills */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div className="bigPanel">
          <h3 style={{ marginBottom:20 }}>Hiring Funnel (Live)</h3>
          {funnel.length === 0
            ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>No candidate data yet.</p>
            : funnel.map((f,i) => (
              <div key={i} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ color:"#cbd5e1", fontSize:13 }}>{f.stage}</span>
                  <span style={{ color:f.color, fontWeight:700 }}>{f.value}</span>
                </div>
                <div className="progressBar">
                  <div style={{ width: funnel[0]?.value ? ((f.value/funnel[0].value)*100)+"%" : "2%", background:f.color }}></div>
                </div>
              </div>
            ))
          }
        </div>
        <div className="bigPanel">
          <h3 style={{ marginBottom:20 }}>Top Skills in Candidate Pool</h3>
          {skills.length === 0
            ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>Upload resumes to see skill distribution.</p>
            : <ResponsiveContainer width="100%" height={240}>
                <BarChart data={skills} margin={{ top:5, right:5, left:-20, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" fill="#00e5a8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Score Distribution + Attendance Trend */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div className="bigPanel">
          <h3 style={{ marginBottom:20 }}>AI Score Distribution</h3>
          {scores.every(s=>s.value===0)
            ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>Screen resumes to populate scores.</p>
            : <ResponsiveContainer width="100%" height={240}>
                <BarChart data={scores} margin={{ top:5, right:5, left:-20, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" fill="#1da1ff" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
        <div className="bigPanel">
          <h3 style={{ marginBottom:20 }}>Attendance Trend (Last 7 Days)</h3>
          {attTrend.every(d=>d.total===0)
            ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>Mark attendance to see trends.</p>
            : <ResponsiveContainer width="100%" height={240}>
                <LineChart data={attTrend} margin={{ top:5, right:5, left:-20, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend wrapperStyle={{ fontSize:12, color:"#64748b" }} />
                  <Line type="monotone" dataKey="present" stroke="#00e5a8" strokeWidth={2} dot={{ fill:"#00e5a8", r:3 }} name="Present" />
                  <Line type="monotone" dataKey="absent"  stroke="#ff5c5c" strokeWidth={2} dot={{ fill:"#ff5c5c", r:3 }} name="Absent"  />
                </LineChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Department Metrics */}
      <div className="bigPanel" style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3>Department Metrics (Live)</h3>
          <span className="statusPill pillGreen">FROM DATABASE</span>
        </div>
        {depts.length === 0
          ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>Add employees to see department metrics.</p>
          : <table>
              <thead>
                <tr><th>Department</th><th>Headcount</th><th>Avg Salary</th><th>Avg Performance</th><th>Attrition %</th></tr>
              </thead>
              <tbody>
                {depts.map((d,i) => (
                  <tr key={i}>
                    <td style={{ color:"white", fontWeight:600 }}>{d.dept}</td>
                    <td>{d.headcount}</td>
                    <td style={{ color:"#00e5a8" }}>
                      {d.avgSalary > 0 ? "₹" + (d.avgSalary/100000).toFixed(1) + "L" : "—"}
                    </td>
                    <td>
                      <span style={{ color: d.performance>=80?"#00e5a8":d.performance>=60?"#f59e0b":"#ff5c5c", fontWeight:700 }}>
                        {d.performance > 0 ? d.performance + "%" : "—"}
                      </span>
                    </td>
                    <td style={{ color:"#f59e0b" }}>{d.attrition}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {/* Payroll + Interview Analytics */}
      <div className="enterpriseRow" style={{ marginBottom:20 }}>
        <div className="bigPanel">
          <h3 style={{ marginBottom:18 }}>Payroll Analytics (Live)</h3>
          {!payroll
            ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>Process payroll to see analytics.</p>
            : <>
                {[
                  ["Total Net Payout", "₹" + ((payroll.totalPayroll||0)/100000).toFixed(1)+"L", "#00e5a8"],
                  ["Avg Net Salary",   "₹" + ((payroll.avgSalary||0)/1000).toFixed(0)+"K",     "#1da1ff"],
                  ["Anomalies",        payroll.anomalyCount || 0,                                       "#ff5c5c"],
                ].map(([k,v,c],i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e293b" }}>
                    <span style={{ color:"#64748b", fontSize:13 }}>{k}</span>
                    <span style={{ color:c, fontWeight:700 }}>{v}</span>
                  </div>
                ))}
                {(payroll.deptPayroll||[]).map((d,i) => (
                  <div key={i} style={{ marginTop:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ color:"#cbd5e1", fontSize:13 }}>{d.dept}</span>
                      <span style={{ color:"#00e5a8", fontWeight:600 }}>
                        {"₹" + ((d.total||0)/100000).toFixed(1)+"L"} ({d.count})
                      </span>
                    </div>
                    <div className="progressBar">
                      <div style={{ width: payroll.totalPayroll ? ((d.total/payroll.totalPayroll)*100)+"%" : "2%" }}></div>
                    </div>
                  </div>
                ))}
              </>
          }
        </div>
        <div className="bigPanel">
          <h3 style={{ marginBottom:18 }}>Interview Score Analytics (Live)</h3>
          {!interviews?.total
            ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>Upload interviews to see score analytics.</p>
            : <>
                <p style={{ color:"#64748b", fontSize:12, marginBottom:12 }}>Based on {interviews.total} interviews</p>
                {[
                  ["Communication", (interviews.avgScores?.avgComm||0).toFixed(0),    "#1da1ff"],
                  ["Confidence",    (interviews.avgScores?.avgConf||0).toFixed(0),    "#f59e0b"],
                  ["Technical",     (interviews.avgScores?.avgTech||0).toFixed(0),    "#00e5a8"],
                  ["Sentiment",     (interviews.avgScores?.avgSent||0).toFixed(0),    "#8b5cf6"],
                  ["Overall",       (interviews.avgScores?.avgOverall||0).toFixed(0), "#ff5c5c"],
                ].map(([k,v,c],i) => (
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ color:"#cbd5e1", fontSize:13 }}>{k}</span>
                      <span style={{ color:c, fontWeight:700 }}>{v}%</span>
                    </div>
                    <div className="progressBar"><div style={{ width:v+"%", background:c }}></div></div>
                  </div>
                ))}
                {(interviews.recommendations||[]).length > 0 && (
                  <div style={{ marginTop:16 }}>
                    <p style={{ color:"#64748b", fontSize:11, marginBottom:8 }}>RECOMMENDATIONS BREAKDOWN</p>
                    {interviews.recommendations.map((r,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #1e293b" }}>
                        <span style={{ color:"#94a3b8", fontSize:13 }}>{r._id || "Pending"}</span>
                        <span style={{ color:COLORS[i%COLORS.length], fontWeight:700 }}>{r.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
          }
        </div>
      </div>

      {/* Attendance Summary + Leave Analytics */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div className="bigPanel">
          <h3 style={{ marginBottom:18 }}>Attendance Summary (All-Time)</h3>
          {!attSummary
            ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>No attendance records yet.</p>
            : <>
                {[
                  ["Present",   attSummary.present,  "#00e5a8"],
                  ["Absent",    attSummary.absent,   "#ff5c5c"],
                  ["On Leave",  attSummary.leave,    "#f59e0b"],
                  ["Half Day",  attSummary.halfDay,  "#8b5cf6"],
                  ["Late",      attSummary.late,     "#1da1ff"],
                ].map(([k,v,c],i) => (
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ color:"#cbd5e1", fontSize:13 }}>{k}</span>
                      <span style={{ color:c, fontWeight:700 }}>{v?.toLocaleString() || 0}</span>
                    </div>
                    <div className="progressBar">
                      <div style={{ width: attSummary.total ? ((v/attSummary.total)*100)+"%" : "2%", background:c }}></div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:14, padding:"10px 14px", background:"#06111e", borderRadius:8, border:"1px solid #1e293b" }}>
                  <span style={{ color:"#64748b", fontSize:12 }}>Overall Attendance Rate: </span>
                  <span style={{ color:"#00e5a8", fontWeight:700, fontSize:16 }}>{attSummary.attendancePct}%</span>
                  <span style={{ color:"#334155", fontSize:11, marginLeft:8 }}>({attSummary.total?.toLocaleString()} records)</span>
                </div>
              </>
          }
        </div>
        <div className="bigPanel">
          <h3 style={{ marginBottom:18 }}>Leave Analytics (Live)</h3>
          {!leaveData
            ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>No leave data yet.</p>
            : <>
                <div style={{ display:"flex", gap:12, marginBottom:16 }}>
                  {[
                    ["Pending",  leaveData.byStatus?.pending,  "#f59e0b"],
                    ["Approved", leaveData.byStatus?.approved, "#00e5a8"],
                    ["Rejected", leaveData.byStatus?.rejected, "#ff5c5c"],
                  ].map(([k,v,c],i) => (
                    <div key={i} style={{ flex:1, background:"#06111e", borderRadius:8, padding:"10px 12px", border:`1px solid ${c}30`, textAlign:"center" }}>
                      <p style={{ color:"#475569", fontSize:10, margin:"0 0 4px" }}>{k}</p>
                      <p style={{ color:c, fontWeight:700, fontSize:18, margin:0 }}>{v || 0}</p>
                    </div>
                  ))}
                </div>
                {(leaveData.byType || []).map((t,i) => (
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ color:"#cbd5e1", fontSize:12 }}>{t.type}</span>
                      <span style={{ color:COLORS[i%COLORS.length], fontWeight:700 }}>{t.count} ({t.totalDays}d)</span>
                    </div>
                    <div className="progressBar">
                      <div style={{ width: leaveData.byType[0]?.count ? ((t.count/leaveData.byType[0].count)*100)+"%" : "2%", background:COLORS[i%COLORS.length] }}></div>
                    </div>
                  </div>
                ))}
              </>
          }
        </div>
      </div>

      {/* Payroll Trend */}
      {payrollTrend.length > 0 && (
        <div className="bigPanel" style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <h3>Monthly Payroll Trend</h3>
            <span className="statusPill pillGreen">FROM DATABASE</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={payrollTrend} margin={{ top:5, right:5, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}
                tickFormatter={v => "₹"+(v/100000).toFixed(0)+"L"} />
              <Tooltip content={<DarkTooltip />} formatter={v => "₹"+(v/100000).toFixed(1)+"L"} />
              <Legend wrapperStyle={{ fontSize:12, color:"#64748b" }} />
              <Bar dataKey="totalNet"   name="Net Payout"  fill="#00e5a8" radius={[4,4,0,0]} />
              <Bar dataKey="totalBasic" name="Basic Total" fill="#1da1ff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Analytics — previously missing */}
      {perf && (
        <div className="enterpriseRow">
          <div className="bigPanel">
            <h3 style={{ marginBottom:18 }}>Performance Score Distribution</h3>
            {(!perf.dist || perf.dist.length === 0)
              ? <p style={{ color:"#475569", textAlign:"center", padding:20 }}>Add performance reviews to see distribution.</p>
              : <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={perf.dist} margin={{ top:5, right:5, left:-20, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
          <div className="bigPanel">
            <h3 style={{ marginBottom:18 }}>Performance Summary</h3>
            {[
              ["Top Performers",    (perf.top5||[]).length + " of top 5",   "#00e5a8"],
              ["Promotion Ready",  perf.promoCount || 0,                    "#1da1ff"],
              ["PIP Active",       perf.pipCount   || 0,                    "#ff5c5c"],
            ].map(([k,v,c],i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e293b" }}>
                <span style={{ color:"#64748b", fontSize:13 }}>{k}</span>
                <span style={{ color:c, fontWeight:700 }}>{v}</span>
              </div>
            ))}
            {(perf.top5||[]).length > 0 && (
              <div style={{ marginTop:16 }}>
                <p style={{ color:"#64748b", fontSize:11, marginBottom:10 }}>TOP 5 PERFORMERS</p>
                {perf.top5.map((emp, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #0f1e30" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":String(i+1)}</span>
                      <div>
                        <p style={{ color:"white", fontWeight:600, margin:"0 0 2px", fontSize:13 }}>{emp.employeeName}</p>
                        <p style={{ color:"#475569", fontSize:11, margin:0 }}>{emp.department||"Engineering"}</p>
                      </div>
                    </div>
                    <span style={{ color:"#00e5a8", fontWeight:700 }}>{emp.aiScore}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default Analytics;
