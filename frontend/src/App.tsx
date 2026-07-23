import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layout/DashboardLayout";
import { modules } from "./modules";
import { LoginPage } from "./auth/LoginPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to={modules[0].path} replace />} />
          {modules.map((mod) => (
            <Route key={mod.path} path={mod.path} element={<mod.component />} />
          ))}
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
