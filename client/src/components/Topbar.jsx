import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaSearch, FaRobot, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

function Topbar() {
  const { name, role, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const roleColor = {
    Admin:    "#00e5a8",
    Manager:  "#1da1ff",
    HR:       "#8b5cf6",
    Employee: "#f59e0b",
  };
  const rc = roleColor[role] || "#64748b";

  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim()) {
      const q = search.trim().toLowerCase();
      if (q.includes("employ"))      navigate("/employees");
      else if (q.includes("attend")) navigate("/attendance");
      else if (q.includes("pay"))    navigate("/payroll");
      else if (q.includes("leave"))  navigate("/leave");
      else if (q.includes("perform"))navigate("/performance");
      else if (q.includes("onboard"))navigate("/onboarding");
      else if (q.includes("resume")) navigate("/resume");
      else if (q.includes("analyt")) navigate("/analytics");
      else if (q.includes("ai") || q.includes("assist")) navigate("/ai-assistant");
      setSearch("");
    }
  };

  return (
    <div className="topbar">
      {/* Left: breadcrumb / greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
            Welcome back, {name || "User"}
          </span>
          <span style={{ color: "#475569", fontSize: 11, letterSpacing: 0.3 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <span style={{ background: rc + "20", color: rc, border: `1px solid ${rc}40`, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginLeft: 6 }}>
          {role}
        </span>
      </div>

      {/* Right: actions */}
      <div className="topbar-right">
        {/* Search */}
        <div className="searchBox" style={{ display: "flex", alignItems: "center", gap: 8, background: "#0b1220", border: "1px solid #1e293b", borderRadius: 8, padding: "0 12px" }}>
          <FaSearch style={{ color: "#475569", fontSize: 12 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search modules…"
            style={{ background: "transparent", border: "none", color: "white", padding: "8px 0", fontSize: 13, outline: "none", width: 160 }}
          />
        </div>

        {/* Notifications */}
        <button className="iconBtn" onClick={() => navigate("/notifications")} title="Notifications">
          <FaBell />
        </button>

        {/* AI Assistant */}
        <button className="aiBtn" onClick={() => navigate("/ai-assistant")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FaRobot style={{ fontSize: 12 }} /> AI Assistant
        </button>

        {/* Logout */}
        <button className="iconBtn" onClick={logout} title="Logout" style={{ color: "#ff5c5c", borderColor: "#ff5c5c30" }}>
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}

export default Topbar;
