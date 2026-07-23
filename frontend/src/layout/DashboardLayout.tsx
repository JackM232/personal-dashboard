import { NavLink, Outlet } from "react-router-dom";
import { modules } from "../modules";
import { useAuth } from "../auth/AuthContext";
import "./DashboardLayout.css";

export function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <nav className="sidebar">
        <div className="sidebar-brand">Dashboard</div>
        <ul>
          {modules.map((mod) => (
            <li key={mod.path}>
              <NavLink to={mod.path}>{mod.name}</NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          {user && <span className="sidebar-user">{user.username}</span>}
          <button type="button" className="sidebar-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
