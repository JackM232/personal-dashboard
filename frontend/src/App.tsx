import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layout/DashboardLayout";
import { visibleModules } from "./modules";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

function App() {
  const { user } = useAuth();
  const allowed = visibleModules(user?.role);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to={allowed[0].path} replace />} />
          {allowed.map((mod) => (
            <Route key={mod.path} path={mod.path} element={<mod.component />} />
          ))}
          <Route path="*" element={<Navigate to={allowed[0].path} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
