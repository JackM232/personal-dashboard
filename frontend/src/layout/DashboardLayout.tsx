import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { queries } from "../api/queries";
import { queryKeys } from "../api/queryKeys";
import { moduleForPath, visibleModules, type DashboardModule } from "../modules";
import { dashboardApi } from "../modules/home/api";
import { reconcileSidebarOrder, readCachedSidebarOrder, reorderModules, writeCachedSidebarOrder } from "./sidebarOrder";
import { useAuth } from "../auth/useAuth";
import "./DashboardLayout.css";

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const orderQuery = useQuery(queries.sidebarOrder);

  const navModules = visibleModules(user?.role);
  const mainNav = navModules.filter((mod) => mod.navPlacement !== "bottom");
  const bottomNav = navModules.filter((mod) => mod.navPlacement === "bottom");
  // Profile isn't a tracker module, so it isn't in the registry — give it its
  // own accent instead of falling through to the root purple, which collided
  // with LeetCode.
  const theme = moduleForPath(pathname)?.theme ?? (pathname.startsWith("/profile") ? "slate" : undefined);

  // The query cache doesn't survive a page reload, so without a fallback the
  // first paint would use the alphabetical default and jump to the saved
  // order a moment later. This localStorage copy — written whenever the real
  // order is known — makes the first paint already correct; it's read once at
  // mount, not on every render, since it only matters before the query settles.
  const [cachedOrder] = useState(() => (user ? readCachedSidebarOrder(user.id) : []));

  const orderedMainNav = reconcileSidebarOrder(orderQuery.data?.order ?? cachedOrder, mainNav);

  useEffect(() => {
    if (user && orderQuery.data) writeCachedSidebarOrder(user.id, orderQuery.data.order);
  }, [user, orderQuery.data]);

  // The insertion point tracked while dragging: an index into orderedMainNav,
  // where the drop bar renders. Separate from `dragging` because dragstart's
  // state update is not guaranteed to have committed by the time dragover runs
  // on a different element in the same gesture.
  const [dragging, setDragging] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function persistOrder(next: DashboardModule[]) {
    const body = { order: next.map((mod) => mod.path) };
    // Written to the cache before the request so the sidebar holds the new
    // order instead of snapping back until the refetch lands.
    queryClient.setQueryData(queryKeys.dashboard.sidebarOrder, body);
    if (user) writeCachedSidebarOrder(user.id, body.order);
    void dashboardApi
      .saveSidebarOrder(body)
      .finally(() => void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.sidebarOrder }));
  }

  function handleDragStart(event: DragEvent, path: string) {
    setDragging(path);
    event.dataTransfer.effectAllowed = "move";
    // Firefox ignores a drag that carries no data, even when the id is tracked
    // in state rather than read back out of the transfer.
    event.dataTransfer.setData("text/plain", path);
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    setOverIndex(before ? index : index + 1);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const draggedPath = (event.dataTransfer.getData("text/plain") || dragging) ?? null;
    const insertionIndex = overIndex;
    setDragging(null);
    setOverIndex(null);
    if (!draggedPath || insertionIndex === null) return;

    const beforePath = orderedMainNav[insertionIndex]?.path ?? null;
    const next = reorderModules(orderedMainNav, draggedPath, beforePath);
    if (next !== orderedMainNav) persistOrder(next);
  }

  return (
    <div className={`dashboard-layout ${theme ? `theme-${theme}` : ""}`}>
      <nav className="sidebar">
        <NavLink to="/" end className="sidebar-brand">
          Dashboard
        </NavLink>
        <ul className="sidebar-nav-main" onDragLeave={() => setOverIndex(null)}>
          {orderedMainNav.map((mod, index) => (
            <li
              key={mod.path}
              // Dragging is on the <li>, not the <a>: a native drag started on
              // a link makes Chrome offer to tear it into a split view near
              // the window edge, which this sidesteps entirely.
              draggable
              className={dragging === mod.path ? "is-dragging" : ""}
              onDragStart={(event) => handleDragStart(event, mod.path)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDrop={handleDrop}
              onDragEnd={() => {
                setDragging(null);
                setOverIndex(null);
              }}
            >
              {overIndex === index && <div className="sidebar-drop-indicator" />}
              <NavLink to={mod.path}>{mod.name}</NavLink>
            </li>
          ))}
          {overIndex === orderedMainNav.length && (
            <li className="sidebar-drop-indicator-item">
              <div className="sidebar-drop-indicator" />
            </li>
          )}
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
