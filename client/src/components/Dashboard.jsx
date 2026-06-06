import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function useStats() {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch("/api/dashboard")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line
  return { stats, loading };
}

function KPI({ label, value, sub, color, border }) {
  return (
    <div className="enterpriseCard" style={{ borderTop: `3px solid ${color || "#00e5a8"}`, ...(border ? { borderLeft: `3px solid ${color}`, borderTop: "none" } : {}) }}>
      <h5>{label}</h5>
      <h1 style={{ color: color || "white" }}>{value ?? "—"}</h1>
      {sub && <span style={{ color: "#64748b" }}>{sub}</span>}
    </div>
  );
}

function Feed({ items }) {
  const colors = { green: "#00e5a8", blue: "#1da1ff", red: "#ff5c5c", purple: "#8b5cf6", orange: "#f59e0b" };
  return (
    <ul className="activityFeed">
      {items.map((a, i) => (
        <li key={i} style={{ display:"flex", gap:"12px", padding:"12px 0", borderBottom:"1px solid #1e293b", alignItems:"flex-start" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background: colors[a.color]||"#00e5a8", flexShrink:0, marginTop:5 }} />
          <span style={{ color:"#cbd5e1", fontSize:"13px", flex:1 }}>{a.text}</span>
          <span style={{ color:"#334155", fontSize:"11px", flexShrink:0 }}>{a.time}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── ADMIN ──────────────────────────────────────────────── */
function AdminDashboard({ stats, name }) {
  const s = stats || {};
  const hp = s.hiringPipeline || {};
  const pipeline = [
    { label:"Applications", value: s.totalCandidates || 0,                                                    color:"#1da1ff" },
    { label:"AI Screened",  value: Math.round((s.aiScreeningAccuracy || 0) / 100 * (s.totalCandidates || 0)), color:"#8b5cf6" },
    { label:"Shortlisted",  value: s.shortlisted || hp["Shortlisted"] || 0,                                   color:"#00e5a8" },
    { label:"Interviewed",  value: s.totalInterviews || 0,                                                     color:"#f59e0b" },
    { label:"Selected",     value: s.selectedCandidates || hp["Selected"] || 0,                               color:"#00e5a8" },
  ];
  const feed = [
    { text:`${s.totalCandidates || 0} total resumes in system — AI screened`, color:"green", time:"Live" },
    { text:`${s.totalInterviews || 0} video interviews analyzed by AI`, color:"blue", time:"Live" },
    { text:`${s.payrollAnomalies || 0} payroll anomalies flagged for review`, color:"red", time:"Live" },
    { text:`Attendance rate today: ${s.attendanceRate || 0}%`, color:"green", time:"Today" },
    { text:`${s.activeOnboarding || 0} employees in active onboarding`, color:"purple", time:"Live" },
    { text:`${s.pendingLeaves || 0} leave requests pending approval`, color:"orange", time:"Live" },
  ];
  return (
    <>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Executive Dashboard</h1>
          <p className="pageSub">Welcome, <span style={{color:"#00e5a8"}}>{name}</span> · Management Admin · Company-Wide Intelligence</p>
        </div>
        <div className="topActions">
          <input placeholder="Search..." className="enterpriseSearch" />
          <button className="aiBtn">⚡ AI Insights</button>
        </div>
      </div>
      <div className="enterpriseGrid">
        <KPI label="TOTAL EMPLOYEES"  value={s.totalEmployees || 0}        sub="Active workforce"  color="#00e5a8" />
        <KPI label="OPEN POSITIONS"   value={s.openPositions || 0}         sub="Active roles"      color="#1da1ff" />
        <KPI label="RESUMES SCREENED" value={s.totalCandidates || 0}       sub="AI Processed"      color="#8b5cf6" />
        <KPI label="ATTENDANCE RATE"  value={`${s.attendanceRate || 0}%`}  sub="Today"             color="#f59e0b" />
      </div>
      <div className="bigPanel" style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div><h3>Hiring Pipeline</h3><p style={{color:"#64748b",fontSize:13,marginTop:4}}>FWC AI/ML Drive — Real-time</p></div>
          <span className="statusPill pillGreen">LIVE</span>
        </div>
        <div className="pipelineBar" style={{marginBottom:16}}>
          <div className="pipelineProgress" style={{width: s.totalCandidates > 0
            ? `${Math.min(Math.round(((s.selectedCandidates || 0) / s.totalCandidates) * 100), 100)}%`
            : "2%"}}></div>
        </div>
        <div className="pipelineStats">
          {pipeline.map((p,i) => (
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:700,color:p.color}}>{p.value}</div>
              <div style={{color:"#64748b",fontSize:12,marginTop:4}}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="enterpriseRow" style={{marginBottom:20}}>
        <div className="bigPanel">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <h3>AI Activity Feed</h3><span className="statusPill pillGreen">LIVE</span>
          </div>
          <Feed items={feed} />
        </div>
        <div className="bigPanel">
          <h3 style={{marginBottom:20}}>Key Metrics</h3>
          {[
            ["Payroll Total",      `₹${((s.totalPayroll||0)/100000).toFixed(1)}L`,     "#00e5a8"],
            ["Payroll Processed",  s.processedPayroll||0,                              "#1da1ff"],
            ["Payroll Anomalies",  s.payrollAnomalies||0,                              "#ff5c5c"],
            ["Pending Leaves",     s.pendingLeaves||0,                                 "#f59e0b"],
            ["Active Onboarding",  s.activeOnboarding||0,                              "#8b5cf6"],
            ["Avg Interview Score",`${s.avgInterviewScore||0}%`,                       "#00e5a8"],
          ].map(([k,v,c],i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e293b"}}>
              <span style={{color:"#64748b",fontSize:13}}>{k}</span>
              <span style={{color:c,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="enterpriseGrid">
        <KPI label="PRESENT TODAY"  value={s.presentToday||0}   color="#00e5a8" border />
        <KPI label="WORK FROM HOME" value={s.wfhToday||0}       color="#1da1ff" border />
        <KPI label="ABSENT TODAY"   value={s.absentToday||0}    color="#ff5c5c" border />
        <KPI label="AI ACCURACY"    value={`${s.aiScreeningAccuracy || 0}%`} color="#f59e0b" border />
      </div>
    </>
  );
}

/* ── MANAGER ───────────────────────────────────────────── */
function ManagerDashboard({ stats, name }) {
  const s = stats || {};
  return (
    <>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Manager Dashboard</h1>
          <p className="pageSub">Welcome, <span style={{color:"#1da1ff"}}>{name}</span> · Senior Manager · Team & Department Intelligence</p>
        </div>
        <div className="topActions">
          <input placeholder="Search team..." className="enterpriseSearch" />
          <button className="aiBtn" style={{background:"#1da1ff"}}>📊 Team Report</button>
        </div>
      </div>
      <div className="enterpriseGrid">
        <KPI label="TEAM HEADCOUNT"    value={s.totalEmployees||0}                          color="#1da1ff" />
        <KPI label="AVG PERFORMANCE"   value={`${s.avgPerformanceScore||0}%`}               color="#00e5a8" />
        <KPI label="ATTRITION RISK"    value={`${s.pipActive||0} PIPs`}                     color="#ff5c5c" />
        <KPI label="PROMOTIONS DUE"    value={s.topPerformers||0}                           color="#8b5cf6" />
      </div>
      <div className="enterpriseRow" style={{marginBottom:20}}>
        <div className="bigPanel">
          <h3 style={{marginBottom:18}}>Department Breakdown</h3>
          {(s.deptBreakdown||[]).length === 0
            ? <p style={{color:"#475569",textAlign:"center",padding:20}}>No employee data yet. Add employees to see department breakdown.</p>
            : (s.deptBreakdown||[]).map((d,i) => (
              <div key={i} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{color:"#cbd5e1",fontSize:13}}>{d._id||"Unknown"}</span>
                  <span style={{color:"#00e5a8",fontWeight:600}}>{d.count}</span>
                </div>
                <div className="progressBar">
                  <div style={{width:`${Math.min((d.count/(s.totalEmployees||1))*100,100)}%`}}></div>
                </div>
              </div>
            ))
          }
        </div>
        <div className="bigPanel">
          <h3 style={{marginBottom:18}}>Finance Summary</h3>
          {[
            ["Monthly Payroll",  `₹${((s.monthlyPayroll||0)/100000).toFixed(1)}L`,  "#00e5a8"],
            ["Present Today",    s.todayPresent||0,                                  "#1da1ff"],
            ["Absent Today",     s.todayAbsent||0,                                   "#ff5c5c"],
            ["Pending Leaves",   s.pendingLeaves||0,                                 "#f59e0b"],
            ["PIP Active",       s.pipActive||0,                                     "#ff5c5c"],
            ["Attendance Rate",  `${s.attendanceRate||0}%`,                          "#00e5a8"],
          ].map(([k,v,c],i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e293b"}}>
              <span style={{color:"#64748b",fontSize:13}}>{k}</span>
              <span style={{color:c,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── HR ────────────────────────────────────────────────── */
function HRDashboard({ stats, name }) {
  const s = stats || {};
  const total = s.totalApplications || 0;
  // Use real statusFunnel to get AI-screened count (those with status beyond "Applied")
  const sf = s.statusFunnel || [];
  const sfMap = {};
  sf.forEach(f => { sfMap[f._id] = f.count; });
  const aiScreened = (sfMap["Shortlisted"] || 0) + (sfMap["Interview"] || 0)
    + (sfMap["Selected"] || 0) + (sfMap["Review"] || 0);
  const funnel = [
    { stage:"Applications",  val: total,                color:"#1da1ff", pct: 100 },
    { stage:"AI Screened",   val: aiScreened,           color:"#8b5cf6", pct: total ? Math.round((aiScreened/total)*100) : 0 },
    { stage:"Shortlisted",   val: s.shortlisted || 0,  color:"#00e5a8", pct: total ? Math.round(((s.shortlisted||0)/total)*100) : 0 },
    { stage:"Interviewed",   val: s.totalInterviews||0,color:"#f59e0b", pct: total ? Math.round(((s.totalInterviews||0)/total)*100) : 0 },
  ];
  return (
    <>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">HR Dashboard</h1>
          <p className="pageSub">Welcome, <span style={{color:"#8b5cf6"}}>{name}</span> · HR Recruiter · Recruitment & People Ops</p>
        </div>
        <div className="topActions">
          <input placeholder="Search candidates..." className="enterpriseSearch" />
          <button className="aiBtn" style={{background:"#8b5cf6",color:"white"}}>⚡ AI Screen</button>
        </div>
      </div>
      <div className="enterpriseGrid">
        <KPI label="OPEN POSITIONS"     value={s.openPositions || 0}   color="#8b5cf6" />
        <KPI label="TOTAL APPLICATIONS" value={s.totalApplications||0} color="#1da1ff" />
        <KPI label="INTERVIEWS TODAY"   value={s.todayInterviews||0}   color="#00e5a8" />
        <KPI label="PENDING LEAVES"     value={s.pendingLeaves||0}     color="#f59e0b" />
      </div>
      <div className="enterpriseRow" style={{marginBottom:20}}>
        <div className="bigPanel">
          <h3 style={{marginBottom:18}}>Recruitment Funnel (Live)</h3>
          {funnel.map((f,i) => (
            <div key={i} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:"#cbd5e1",fontSize:13}}>{f.stage}</span>
                <span style={{color:f.color,fontWeight:700}}>{f.val}</span>
              </div>
              <div className="progressBar">
                <div style={{width:`${f.pct||2}%`,background:f.color}}></div>
              </div>
            </div>
          ))}
          <div style={{marginTop:16,background:"#06111e",borderRadius:10,padding:12,border:"1px solid #1e293b"}}>
            <p style={{color:"#8b5cf6",fontSize:11,fontWeight:700,margin:"0 0 6px"}}>🤖 AI INSIGHT</p>
            <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.6,margin:0}}>
              Avg interview score: {s.avgInterviewScore||0}%. Offer-ready candidates: {s.offerReadyCount||0}. Active onboarding: {s.activeOnboarding||0}.
            </p>
          </div>
        </div>
        <div className="bigPanel">
          <h3 style={{marginBottom:18}}>Quick Stats</h3>
          {[
            ["Total Applications",  s.totalApplications||0,  "#1da1ff"],
            ["Shortlisted",         s.shortlisted||0,         "#00e5a8"],
            ["Total Interviews",    s.totalInterviews||0,     "#8b5cf6"],
            ["Avg Interview Score", `${s.avgInterviewScore||0}%`, "#f59e0b"],
            ["Active Onboarding",   s.activeOnboarding||0,    "#00e5a8"],
            ["Offer Ready",         s.offerReadyCount||0,     "#1da1ff"],
          ].map(([k,v,c],i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e293b"}}>
              <span style={{color:"#64748b",fontSize:13}}>{k}</span>
              <span style={{color:c,fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── EMPLOYEE ──────────────────────────────────────────── */
function EmployeeDashboard({ stats, name }) {
  const s = stats || {};
  const announcements = [
    { title:"Q2 Performance Reviews Complete",      color:"#00e5a8" },
    { title:"FWC Annual Hackathon — Register Now!", color:"#1da1ff" },
    { title:`Payslips for latest month available`,  color:"#f59e0b" },
    { title:"New wellness initiative launched",     color:"#8b5cf6" },
  ];
  return (
    <>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Welcome, {name?.split(" ")[0]} 👋</h1>
          <p className="pageSub"><span style={{color:"#f59e0b"}}>Employee Portal</span> · Your personal workspace at FWC</p>
        </div>
        <div className="topActions">
          <a href="/ai-assistant"><button className="aiBtn" style={{background:"#f59e0b",color:"#000"}}>🤖 Ask AI</button></a>
        </div>
      </div>
      <div className="enterpriseGrid">
        <KPI label="ATTENDANCE RATE" value={`${s.attendanceRate||0}%`}                   color="#00e5a8" />
        <KPI label="PENDING LEAVES"  value={s.pendingLeaves||0}                          color="#f59e0b" />
        <KPI label="LAST NET SALARY" value={s.latestNetSalary ? `₹${Number(s.latestNetSalary).toLocaleString()}` : "—"} color="#1da1ff" />
        <KPI label="PERFORMANCE"     value={s.performanceRating ? `${s.performanceRating}/5` : "—"} color="#8b5cf6" />
      </div>
      <div className="enterpriseRow" style={{marginBottom:20}}>
        <div className="bigPanel">
          <h3 style={{marginBottom:18}}>Company Announcements</h3>
          {announcements.map((a,i) => (
            <div key={i} style={{display:"flex",gap:12,padding:"14px 0",borderBottom:"1px solid #1e293b",alignItems:"center"}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:a.color,flexShrink:0}}></span>
              <p style={{color:"#cbd5e1",margin:0,fontSize:14}}>{a.title}</p>
            </div>
          ))}
        </div>
        <div className="bigPanel">
          <h3 style={{marginBottom:18}}>Quick Actions</h3>
          {[
            { label:"Apply for Leave",     path:"/leave",        color:"#f59e0b", icon:"🏖" },
            { label:"My Attendance",       path:"/my-portal",    color:"#1da1ff", icon:"📅" },
            { label:"My Payslip",          path:"/my-portal",    color:"#00e5a8", icon:"💰" },
            { label:"Ask AI Assistant",    path:"/ai-assistant", color:"#8b5cf6", icon:"🤖" },
          ].map((a,i) => (
            <a key={i} href={a.path} style={{textDecoration:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:10,marginBottom:8,background:a.color+"10",border:`1px solid ${a.color}20`,cursor:"pointer"}}>
                <span style={{fontSize:18}}>{a.icon}</span>
                <span style={{color:a.color,fontWeight:600,fontSize:13}}>{a.label}</span>
                <span style={{marginLeft:"auto",color:"#334155"}}>→</span>
              </div>
            </a>
          ))}
          <div style={{marginTop:12,background:"#06111e",borderRadius:10,padding:14,border:"1px solid #1e293b"}}>
            <p style={{color:"#f59e0b",fontWeight:600,fontSize:12,margin:"0 0 6px"}}>📊 MY STATS</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                ["Days Present",s.presentDays||0,"#00e5a8"],
                ["Total Logged",s.attendanceDays||0,"#1da1ff"],
                ["Leaves Taken",s.totalLeaves||0,"#f59e0b"],
                ["Approved",    s.approvedLeaves||0,"#00e5a8"],
              ].map(([k,v,c],i) => (
                <div key={i} style={{background:"#0b1220",borderRadius:8,padding:"10px 12px",border:"1px solid #1e293b"}}>
                  <p style={{color:"#475569",fontSize:10,margin:"0 0 4px"}}>{k}</p>
                  <p style={{color:c,fontWeight:700,margin:0,fontSize:16}}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── ROUTER ─────────────────────────────────────────────── */
function Dashboard() {
  const { role, name } = useAuth();
  const { stats, loading } = useStats();

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:16}}>
      <div style={{width:48,height:48,border:"3px solid #1e293b",borderTop:"3px solid #00e5a8",borderRadius:"50%",animation:"spin 1s linear infinite"}}></div>
      <p style={{color:"#475569"}}>Loading dashboard data...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (role === "Admin")   return <AdminDashboard   stats={stats} name={name} />;
  if (role === "Manager") return <ManagerDashboard stats={stats} name={name} />;
  if (role === "HR")      return <HRDashboard      stats={stats} name={name} />;
  return                         <EmployeeDashboard stats={stats} name={name} />;
}
export default Dashboard;
