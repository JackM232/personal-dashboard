import { NavLink, Outlet, useLocation } from "react-router-dom";
import { moduleForPath, visibleModules } from "../modules";
import { useAuth } from "../auth/useAuth";
import "./DashboardLayout.css";

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navModules = visibleModules(user?.role);
  const mainNav = navModules.filter((mod) => mod.navPlacement !== "bottom");
  const bottomNav = navModules.filter((mod) => mod.navPlacement === "bottom");
  // Profile isn't a tracker module, so it isn't in the registry — give it its
  // own accent instead of falling through to the root purple, which collided
  // with LeetCode.
  const theme = moduleForPath(pathname)?.theme ?? (pathname.startsWith("/profile") ? "slate" : undefined);

  return (
    <div className={`dashboard-layout ${theme ? `theme-${theme}` : ""}`}>
      <nav className="sidebar">
        <NavLink to="/" end className="sidebar-brand">
          Dashboard
        </NavLink>
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
            {user && (
              <NavLink to="/profile" className="sidebar-user">
                <span className="sidebar-user-avatar" aria-hidden="true">
                  {(user.name || user.username).charAt(0).toUpperCase()}
                </span>
                <span className="sidebar-user-names">
                  <span className="sidebar-user-primary">{user.name || user.username}</span>
                  {user.name && <span className="sidebar-user-secondary">@{user.username}</span>}
                </span>
              </NavLink>
            )}
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
