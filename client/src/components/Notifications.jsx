import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Notifications() {
  const { token, role, apiFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await apiFetch("/api/notifications");
      const data = await r.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const markRead = async (id) => {
    try {
      await apiFetch("/api/notifications/" + id + "/read", { method: "PUT" });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) { console.log(e); }
  };

  const typeColor = {
    "AI Alert":"#00e5a8","Payroll":"#ff5c5c","Interview":"#1da1ff",
    "Leave":"#f59e0b","Performance":"#8b5cf6","Onboarding":"#00e5a8",
    "Attendance":"#1da1ff","General":"#64748b","System":"#ff5c5c"
  };

  const fallback = [
    { type:"AI Alert",    message:"AI screened new resumes — check candidate pipeline",        color:"#00e5a8", icon:"🤖" },
    { type:"Payroll",     message:"Payroll anomaly detected — review flagged records",          color:"#ff5c5c", icon:"⚠" },
    { type:"Interview",   message:"Video interview completed — results ready",                  color:"#1da1ff", icon:"🎥" },
    { type:"Leave",       message:"Leave requests pending approval",                            color:"#f59e0b", icon:"📋" },
    { type:"Performance", message:"Q2 performance reviews published",                           color:"#8b5cf6", icon:"⭐" },
    { type:"Onboarding",  message:"New employee onboarding checklist items due",               color:"#00e5a8", icon:"🎓" },
  ];

  const items = notifications.length > 0 ? notifications : fallback;
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="dashboardTop">
        <div>
          <h1 className="pageHeading">Notifications</h1>
          <p className="pageSub">Role-based alerts — {role} · Real-time Activity Feed</p>
        </div>
        <div className="topActions">
          <button className="aiBtn" onClick={() => notifications.forEach(n => markRead(n._id))}>
            ✓ Mark All Read
          </button>
        </div>
      </div>

      <div className="enterpriseGrid">
        <div className="enterpriseCard" style={{borderTop:"3px solid #ff5c5c"}}>
          <h5>UNREAD</h5><h1 style={{color:"#ff5c5c"}}>{unread || items.length}</h1><span>Need attention</span>
        </div>
        <div className="enterpriseCard" style={{borderTop:"3px solid #f59e0b"}}>
          <h5>TOTAL</h5><h1 style={{color:"#f59e0b"}}>{items.length}</h1><span>All notifications</span>
        </div>
        <div className="enterpriseCard" style={{borderTop:"3px solid #00e5a8"}}>
          <h5>AI GENERATED</h5><h1 style={{color:"#00e5a8"}}>{items.filter(n=>n.type==="AI Alert").length}</h1><span>Auto-insights</span>
        </div>
        <div className="enterpriseCard" style={{borderTop:"3px solid #1da1ff"}}>
          <h5>READ</h5><h1 style={{color:"#1da1ff"}}>{notifications.filter(n=>n.read).length}</h1><span>Processed</span>
        </div>
      </div>

      <div className="bigPanel">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3>All Notifications</h3>
          <span className="statusPill pillGreen">LIVE</span>
        </div>
        {loading
          ? <p style={{color:"#475569",textAlign:"center",padding:30}}>Loading...</p>
          : items.map((n, i) => {
              const c = n.color || typeColor[n.type] || "#64748b";
              return (
                <div key={n._id || i}
                  onClick={() => n._id && markRead(n._id)}
                  style={{display:"flex",gap:14,padding:16,borderRadius:12,marginBottom:10,background:c+"08",border:`1px solid ${c}20`,borderLeft:`3px solid ${c}`,cursor:n._id?"pointer":"default",opacity:n.read?0.6:1,transition:".2s"}}>
                  <div style={{width:40,height:40,borderRadius:10,background:c+"20",color:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                    {n.icon || "🔔"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{color:c,fontWeight:700,fontSize:11,letterSpacing:0.5}}>{(n.type||"GENERAL").toUpperCase()}</span>
                      <span style={{color:"#475569",fontSize:11}}>{n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : "Live"}</span>
                    </div>
                    <p style={{color:"#cbd5e1",fontSize:14,lineHeight:1.6,margin:0}}>{n.message}</p>
                  </div>
                  {!n.read && n._id && <div style={{width:8,height:8,borderRadius:"50%",background:"#00e5a8",flexShrink:0,marginTop:6}}></div>}
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
export default Notifications;
