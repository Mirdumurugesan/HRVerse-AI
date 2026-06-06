import { createContext, useContext, useState, useEffect, useRef } from "react";

export const API = "http://localhost:5000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token:   localStorage.getItem("token")   || null,
    role:    localStorage.getItem("role")    || null,
    name:    localStorage.getItem("name")    || null,
    empName: localStorage.getItem("empName") || null, // resolved employee name
    userId:  localStorage.getItem("userId")  || null,
    email:   localStorage.getItem("email")   || null,
  });

  // Track whether the startup token check has completed so we don't
  // render protected components with a token that's already invalid.
  const [authChecked, setAuthChecked] = useState(false);
  const loggingOut = useRef(false);

  // ── Startup token validation ────────────────────────────────
  // On every page load, ping /api/auth/me with the stored token.
  // If the server returns 401 (expired, user deleted, DB changed) we
  // clear localStorage immediately so the app falls back to <Login>.
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setAuthChecked(true);
      return;
    }
    fetch(API + "/api/auth/me", {
      headers: { Authorization: "Bearer " + storedToken },
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          // Token is invalid / user gone from DB — wipe it now.
          localStorage.clear();
          setAuth({ token: null, role: null, name: null, empName: null, userId: null, email: null });
          return;
        }
        // Persist the resolved employeeName so all components can use it
        try {
          const profile = await res.json();
          if (profile?.employeeName) {
            localStorage.setItem("empName", profile.employeeName);
            setAuth(prev => ({ ...prev, empName: profile.employeeName }));
          }
        } catch (_) {}
      })
      .catch(() => {
        // Network error: backend is down. Keep the token so the app
        // doesn't loop between login and broken state; the user will
        // see a fetch error once they navigate.
      })
      .finally(() => setAuthChecked(true));
  }, []); // eslint-disable-line

  const login = (token, role, name, userId, email) => {
    localStorage.setItem("token",  token);
    localStorage.setItem("role",   role);
    localStorage.setItem("name",   name);
    localStorage.setItem("userId", userId || "");
    localStorage.setItem("email",  email  || "");
    // empName will be populated by the startup /api/auth/me call on next render
    setAuth({ token, role, name, empName: name, userId, email });
  };

  const logout = () => {
    localStorage.clear();
    setAuth({ token: null, role: null, name: null, empName: null, userId: null, email: null });
    window.location.href = "/";
  };

  const isAdmin    = auth.role === "Admin";
  const isManager  = auth.role === "Manager";
  const isHR       = auth.role === "HR";
  const isEmployee = auth.role === "Employee";

  const can = (allowedRoles) => allowedRoles.includes(auth.role);

  /**
   * apiFetch — attaches JWT automatically.
   * Pass { isFormData: true } for file uploads to skip Content-Type.
   *
   * REGRESSION FIX: now intercepts 401 responses.
   * Before, a 401 { message: "..." } was silently stored as "data" and
   * every KPI read `data.totalEmployees || 0` → 0.  Now we detect 401,
   * clear the invalid token and redirect to login so the user can
   * reauthenticate against the correct database.
   */
  const apiFetch = async (path, options = {}) => {
    const { isFormData, headers: extraHeaders, ...rest } = options;
    const headers = isFormData
      ? { Authorization: "Bearer " + auth.token, ...(extraHeaders || {}) }
      : { "Content-Type": "application/json", Authorization: "Bearer " + auth.token, ...(extraHeaders || {}) };
    const url = path.startsWith("http") ? path : API + path;
    const res = await fetch(url, { ...rest, headers });

    // 401 = token invalid / expired / user no longer in DB.
    // Guard with loggingOut ref so we don't call logout() in parallel
    // from multiple concurrent fetches.
    if (res.status === 401 && !loggingOut.current) {
      loggingOut.current = true;
      localStorage.clear();
      setAuth({ token: null, role: null, name: null, userId: null, email: null });
      window.location.href = "/";
      throw new Error("Session expired. Please log in again.");
    }

    return res;
  };

  // Don't render children until the startup token check finishes —
  // prevents a flash of protected content before the 401 wipe.
  if (!authChecked) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#070b14"
    }}>
      <div style={{ color: "#00e5a8", fontSize: 14, letterSpacing: 2 }}>INITIALIZING…</div>
    </div>
  );

  return (
    <AuthContext.Provider value={{
      ...auth,
      login, logout,
      isAdmin, isManager, isHR, isEmployee,
      can, apiFetch, API,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
