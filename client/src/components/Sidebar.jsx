import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaHome, FaUsers, FaUserTie, FaVideo, FaChartBar,
  FaCalendarCheck, FaMoneyBillWave, FaStar, FaRobot,
  FaBell, FaSignOutAlt, FaFileAlt, FaUserGraduate,
  FaUmbrellaBeach, FaUserCircle, FaShieldAlt
} from "react-icons/fa";

const ROLE_META = {
  Admin:    { label:"Management Admin", color:"#00e5a8" },
  Manager:  { label:"Senior Manager",   color:"#1da1ff" },
  HR:       { label:"HR Recruiter",     color:"#8b5cf6" },
  Employee: { label:"Employee",         color:"#f59e0b" },
};

// Each item: { to, icon, label, roles }
// roles: null = all, otherwise array
const NAV = [
  { section:"OVERVIEW" },
  { to:"/dashboard",           icon:FaHome,         label:"Dashboard",         roles:null },

  // Employee self-service
  { section:"MY WORKSPACE",    roles:["Employee"] },
  { to:"/my-portal",           icon:FaUserCircle,   label:"My Portal",         roles:["Employee"] },
  { to:"/leave",               icon:FaUmbrellaBeach,label:"My Leave",          roles:["Employee"] },
  { to:"/notifications",       icon:FaBell,         label:"Notifications",     roles:["Employee"] },
  { to:"/ai-assistant",        icon:FaRobot,        label:"AI Assistant",      roles:["Employee"] },

  // Recruitment
  { section:"RECRUITMENT",     roles:["Admin","HR"] },
  { to:"/resume",              icon:FaFileAlt,      label:"Resume Screening",  roles:["Admin","HR"] },
  { to:"/interview-analysis",  icon:FaVideo,        label:"Video Interviews",  roles:["Admin","HR"] },
  { to:"/candidates",          icon:FaUsers,        label:"Candidates",        roles:["Admin","HR"] },

  // People Ops
  { section:"PEOPLE OPS",      roles:["Admin","Manager","HR"] },
  { to:"/employees",           icon:FaUserTie,      label:"Employees",         roles:["Admin","Manager","HR"] },
  { to:"/onboarding",          icon:FaUserGraduate, label:"Onboarding",        roles:["Admin","Manager","HR"] },
  { to:"/attendance",          icon:FaCalendarCheck,label:"Attendance",        roles:["Admin","Manager","HR"] },
  { to:"/leave",               icon:FaUmbrellaBeach,label:"Leave",             roles:["Admin","Manager","HR"] },

  // Finance
  { section:"FINANCE",         roles:["Admin","Manager"] },
  { to:"/payroll",             icon:FaMoneyBillWave,label:"Payroll",           roles:["Admin","Manager"] },
  { to:"/performance",         icon:FaStar,         label:"Performance",       roles:["Admin","Manager"] },

  // Intelligence
  { section:"INTELLIGENCE",    roles:["Admin","Manager","HR"] },
  { to:"/analytics",           icon:FaChartBar,     label:"Analytics",         roles:["Admin","Manager"] },
  { to:"/ai-assistant",        icon:FaRobot,        label:"AI Assistant",      roles:["Admin","Manager","HR"] },
  { to:"/notifications",       icon:FaBell,         label:"Notifications",     roles:["Admin","Manager","HR"] },
];

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { role, name, logout } = useAuth();
  const location = useLocation();
  const meta = ROLE_META[role] || { label:role, color:"#00e5a8" };

  // Duplicate paths (/leave, /ai-assistant, /notifications) each have mutually exclusive
  // role arrays — ["Employee"] vs ["Admin","Manager","HR"] — so only one is ever visible
  // per session. No deduplication needed.
  const visible = (roles) => !roles || roles.includes(role);
  const active  = (path)  => location.pathname === path;

  return (
    <div className={"enterpriseSidebar" + (isOpen ? " sidebarMobileOpen" : "")}>
      {/* Mobile close button */}
      <button className="sidebarCloseBtn" onClick={onClose} aria-label="Close sidebar">✕</button>

      {/* Logo */}
      <div className="logoSection">
        <div className="logoBox">H</div>
        <div>
          <h2>HRVerse AI</h2>
          <span>Enterprise HRMS</span>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ background:meta.color+"15", border:`1px solid ${meta.color}40`, borderRadius:"8px", padding:"8px 12px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"8px" }}>
        <FaShieldAlt style={{ color:meta.color, fontSize:"11px" }} />
        <span style={{ color:meta.color, fontSize:"11px", fontWeight:"700", letterSpacing:"0.5px" }}>{meta.label}</span>
      </div>

      {/* Navigation */}
      {NAV.map((item, i) => {
        if (item.section) {
          if (!visible(item.roles)) return null;
          return <div key={`s${i}`} className="menuTitle">{item.section}</div>;
        }
        if (!visible(item.roles)) return null;
        const Icon = item.icon;
        return (
          <Link key={`l${i}`} to={item.to} onClick={onClose}
            className={`sidebarLink ${active(item.to) ? "sidebarLinkActive" : ""}`}>
            <Icon className="sidebarIcon" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Profile */}
      <div className="profileSection">
        <div className="profileAvatar">{name?.charAt(0)?.toUpperCase()}</div>
        <div>
          <h4>{name || "User"}</h4>
          <p style={{ color:meta.color }}>{meta.label}</p>
        </div>
      </div>
      <button className="logoutBtn" onClick={logout}>
        <FaSignOutAlt style={{ marginRight:"8px" }} /> Logout
      </button>
    </div>
  );
}
export default Sidebar;
