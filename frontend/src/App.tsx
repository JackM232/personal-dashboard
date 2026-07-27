import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layout/DashboardLayout";
import { visibleModules } from "./modules";
import { useModulePrefetch } from "./modules/useModulePrefetch";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

function App() {
  const { user } = useAuth();
  const allowed = visibleModules(user?.role);

  // Here rather than in DashboardLayout: the layout doesn't mount until auth
  // resolves, and the point is to be fetching before that.
  useModulePrefetch();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to={allowed[0].path} replace />} />
          {allowed.map((mod) => (
            <Route
              key={mod.path}
              // Nested modules match everything below their path and route the
              // rest themselves; the default is a single exact route.
              path={mod.nested ? `${mod.path}/*` : mod.path}
              element={<mod.component />}
            />
          ))}
          <Route path="*" element={<Navigate to={allowed[0].path} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
