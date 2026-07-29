import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layout/DashboardLayout";
import { visibleModules } from "./modules";
import { HomePage } from "./modules/home/HomePage";
import { useModulePrefetch } from "./modules/useModulePrefetch";
import { useAuth } from "./auth/useAuth";
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
          {/* Home is not in the module registry — an entry with path "/" would
              make moduleForPath match every route and mis-theme the whole app. */}
          <Route index element={<HomePage />} />
          {allowed.map((mod) => (
            <Route
              key={mod.path}
              // Nested modules match everything below their path and route the
              // rest themselves; the default is a single exact route.
              path={mod.nested ? `${mod.path}/*` : mod.path}
              element={<mod.component />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
