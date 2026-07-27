import { NavLink, Outlet, useLocation } from "react-router-dom";
import { moduleForPath, visibleModules } from "../modules";
import { useAuth } from "../auth/AuthContext";
import "./DashboardLayout.css";

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navModules = visibleModules(user?.role);
  const mainNav = navModules.filter((mod) => mod.navPlacement !== "bottom");
  const bottomNav = navModules.filter((mod) => mod.navPlacement === "bottom");
  const theme = moduleForPath(pathname)?.theme;

  return (
    <div className={`dashboard-layout ${theme ? `theme-${theme}` : ""}`}>
      <nav className="sidebar">
        <div className="sidebar-brand">Dashboard</div>
        <ul>
          {mainNav.map((mod) => (
            <li key={mod.path}>
              <NavLink to={mod.path}>{mod.name}</NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          {bottomNav.length > 0 && (
            <ul className="sidebar-nav-bottom">
              {bottomNav.map((mod) => (
                <li key={mod.path}>
                  <NavLink to={mod.path}>{mod.name}</NavLink>
                </li>
              ))}
            </ul>
          )}
          <div className="sidebar-footer">
            {user && <span className="sidebar-user">{user.username}</span>}
            <button type="button" className="sidebar-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
