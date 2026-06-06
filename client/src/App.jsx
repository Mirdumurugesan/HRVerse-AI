import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";

import Sidebar           from "./components/Sidebar";
import Topbar            from "./components/Topbar";
import Login             from "./components/Login";
import RoleGuard         from "./components/RoleGuard";
import Dashboard         from "./components/Dashboard";
import ResumeScreening   from "./components/ResumeScreening";
import InterviewAnalysis from "./components/InterviewAnalysis";
import Candidates        from "./components/Candidates";
import Employees         from "./components/Employees";
import Onboarding        from "./components/Onboarding";
import AttendanceReplica from "./components/AttendanceReplica";
import Payroll           from "./components/Payroll";
import Performance       from "./components/Performance";
import Analytics         from "./components/Analytics";
import AIAssistant       from "./components/AIAssistant";
import Leave             from "./components/Leave";
import Notifications     from "./components/Notifications";
import Interviews        from "./components/Interviews";
import EmployeePortal    from "./components/EmployeePortal";

import "./App.css";

// Role constants — single source of truth for frontend guards
const ALL       = ["Admin","Manager","HR","Employee"];
const MGR_ADMIN = ["Admin","Manager"];
const HR_ADMIN  = ["Admin","HR"];
const NO_EMP    = ["Admin","Manager","HR"];
const EMP_ONLY  = ["Employee"];

function Guard({ roles, el }) {
  return <RoleGuard allowed={roles}>{el}</RoleGuard>;
}

function App() {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token) return (
    <BrowserRouter>
      <Routes><Route path="*" element={<Login />} /></Routes>
    </BrowserRouter>
  );
  return (
    <BrowserRouter>
      <div className="layout">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="sidebarOverlay" onClick={() => setSidebarOpen(false)} />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="content">
          <Topbar />
          {/* Mobile top bar with hamburger */}
          <div className="mobileTopBar">
            <button className="hamburgerBtn" onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle navigation">
              <span /><span /><span />
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div className="logoBox" style={{ width:28, height:28, fontSize:14 }}>H</div>
              <span style={{ color:"white", fontWeight:700, fontSize:14 }}>HRVerse AI</span>
            </div>
          </div>

          <Routes>
            <Route path="/"                   element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard"          element={<Dashboard />} />
            <Route path="/ai-assistant"       element={<AIAssistant />} />
            <Route path="/notifications"      element={<Notifications />} />
            <Route path="/leave"              element={<Leave />} />
            <Route path="/my-portal"          element={<Guard roles={EMP_ONLY}  el={<EmployeePortal />} />} />
            <Route path="/resume"             element={<Guard roles={HR_ADMIN}  el={<ResumeScreening />} />} />
            <Route path="/interview-analysis" element={<Guard roles={HR_ADMIN}  el={<InterviewAnalysis />} />} />
            <Route path="/candidates"         element={<Guard roles={HR_ADMIN}  el={<Candidates />} />} />
            <Route path="/interviews"         element={<Guard roles={HR_ADMIN}  el={<Interviews />} />} />
            <Route path="/employees"          element={<Guard roles={NO_EMP}    el={<Employees />} />} />
            <Route path="/onboarding"         element={<Guard roles={NO_EMP}    el={<Onboarding />} />} />
            <Route path="/attendance"         element={<Guard roles={NO_EMP}    el={<AttendanceReplica />} />} />
            <Route path="/payroll"            element={<Guard roles={MGR_ADMIN} el={<Payroll />} />} />
            <Route path="/performance"        element={<Guard roles={MGR_ADMIN} el={<Performance />} />} />
            <Route path="/analytics"          element={<Guard roles={NO_EMP}    el={<Analytics />} />} />
            <Route path="*"                   element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
export default App;
