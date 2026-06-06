import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RoleGuard — wrap any route element to restrict by role.
 * Unauthorized users are immediately redirected to /dashboard.
 * Usage: <RoleGuard allowed={["Admin","Manager"]}><MyPage /></RoleGuard>
 */
function RoleGuard({ allowed, children }) {
  const { role } = useAuth();

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleGuard;
