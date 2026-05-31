import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import LandingPage from "../pages/landing/LandingPage";
import { ChangePasswordRoute, ProtectedRoute, PublicRoute } from "./guards";
import { PATHS } from "./paths";

export default function AppRoutes() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path={PATHS.home} element={<LandingPage />} />
        <Route
          path={PATHS.login}
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path={PATHS.register}
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path={PATHS.changePassword}
          element={
            <ChangePasswordRoute>
              <ChangePasswordPage />
            </ChangePasswordRoute>
          }
        />
        <Route
          path={`${PATHS.app}/*`}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
