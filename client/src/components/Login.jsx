import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login() {
  const { login: saveAuth } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const roles = [
    { label: "Management Admin", value: "Admin",    color: "#00e5a8" },
    { label: "Senior Manager",   value: "Manager",  color: "#1da1ff" },
    { label: "HR Recruiter",     value: "HR",       color: "#8b5cf6" },
    { label: "Employee",         value: "Employee", color: "#f59e0b" },
  ];

  const login = async () => {
    setError("");
    if (!email.trim())    return setError("Please enter your email address.");
    if (!password.trim()) return setError("Please enter your password.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return setError("Please enter a valid email address.");

    try {
      setLoading(true);
      const res  = await fetch(API + "/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        saveAuth(data.token, data.role, data.name, data.userId, data.email);
        window.location.replace("/dashboard");
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running on port 5000.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginLeft">
        <div className="loginBrand">
          <div className="loginLogoBox">H</div>
          <div>
            <h1 className="loginBrandName">HRVerse AI</h1>
            <p className="loginBrandSub">FWC Enterprise HRMS Platform</p>
          </div>
        </div>
        <h2 className="loginHero">The Future of HR<br /><span style={{ color:"#00e5a8" }}>Powered by AI</span></h2>
        <p className="loginDesc">AI-driven resume screening, video interview intelligence, real-time workforce analytics built for FWC IT Services.</p>
        <div className="loginFeatures">
          {["Bulk AI Resume Screening","Video Interview Analysis","Multi-Role Access Control","Real-Time Workforce Analytics","AI Payroll & Performance Intelligence"].map((f,i) => (
            <div className="loginFeatureItem" key={i}>
              <span className="loginFeatureDot" />{f}
            </div>
          ))}
        </div>
        <div className="loginStats">
          <div className="loginStat"><h3>15,000+</h3><p>Employees</p></div>
          <div className="loginStat"><h3>93.4%</h3><p>AI Accuracy</p></div>
          <div className="loginStat"><h3>40</h3><p>Open Roles</p></div>
        </div>
      </div>

      <div className="loginRight">
        <div className="loginCard">
          <div style={{ textAlign:"center", marginBottom:"28px" }}>
            <div className="loginLogoBox" style={{ margin:"0 auto 14px" }}>H</div>
            <h2 style={{ color:"white", fontSize:"22px", marginBottom:"6px" }}>Welcome Back</h2>
            <p style={{ color:"#64748b", fontSize:"13px" }}>Sign in to HRVerse AI</p>
          </div>

          <p style={{ color:"#64748b", fontSize:"11px", marginBottom:"10px", letterSpacing:"1px" }}>SELECT YOUR ROLE</p>
          <div className="loginRoleGrid">
            {roles.map(r => (
              <div key={r.value} className={"loginRoleChip " + (selectedRole===r.value ? "active" : "")}
                style={selectedRole===r.value ? { borderColor:r.color, color:r.color, background:r.color+"18" } : {}}
                onClick={() => setSelectedRole(r.value)}>
                {r.label}
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              background: "#ff5c5c18", border: "1px solid #ff5c5c55",
              borderRadius: "8px", padding: "10px 14px", marginBottom: "12px",
              color: "#ff5c5c", fontSize: "13px"
            }}>
              {error}
            </div>
          )}

          <div className="loginField">
            <label>Email Address</label>
            <input type="email" placeholder="admin@fwc.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              className="loginInput" />
          </div>
          <div className="loginField">
            <label>Password</label>
            <input type="password" placeholder="........" value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              className="loginInput"
              onKeyDown={e => e.key === "Enter" && login()} />
          </div>

          <button onClick={login} disabled={loading} className="loginBtn">
            {loading ? "Authenticating..." : "Sign In to HRVerse AI"}
          </button>

          <div style={{ marginTop:"20px", padding:"14px", background:"#06111e", borderRadius:"8px", border:"1px solid #1e293b" }}>
            <p style={{ color:"#475569", fontSize:"11px", marginBottom:"8px", letterSpacing:"1px" }}>DEMO CREDENTIALS</p>
            {roles.map(r => (
              <div key={r.value}
                style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #0f1e30", cursor:"pointer" }}
                onClick={() => {
                  setEmail(r.value.toLowerCase() + "@fwc.com");
                  setPassword(r.value === "HR" ? "HR@123" : r.value + "@123");
                  setSelectedRole(r.value);
                  setError("");
                }}>
                <span style={{ color:r.color, fontSize:"12px", fontWeight:"600" }}>{r.value}</span>
                <span style={{ color:"#334155", fontSize:"11px" }}>{r.value.toLowerCase()}@fwc.com</span>
              </div>
            ))}
          </div>

          <p style={{ textAlign:"center", color:"#334155", fontSize:"11px", marginTop:"14px" }}>
            FWC IT Services Pvt. Ltd. - Enterprise HRMS v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
export default Login;
