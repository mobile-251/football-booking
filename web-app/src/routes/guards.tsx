import { Navigate } from 'react-router-dom';
import { getStoredUser, isPortalUser } from '../types/auth';
import { PATHS } from './paths';

const isAuthenticated = () => !!localStorage.getItem('access_token');

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const user = getStoredUser();
  if (!isAuthenticated()) {
    return <>{children}</>;
  }
  if (user?.mustChangePassword) {
    return <Navigate to={PATHS.changePassword} replace />;
  }
  return <Navigate to={PATHS.app} replace />;
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to={PATHS.login} replace />;
  }
  const user = getStoredUser();
  if (!user || !isPortalUser(user)) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return <Navigate to={PATHS.login} replace />;
  }
  if (user.mustChangePassword) {
    return <Navigate to={PATHS.changePassword} replace />;
  }
  return <>{children}</>;
};

export const ChangePasswordRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to={PATHS.login} replace />;
  }
  const user = getStoredUser();
  if (!user || !isPortalUser(user)) {
    return <Navigate to={PATHS.login} replace />;
  }
  if (!user.mustChangePassword) {
    return <Navigate to={PATHS.app} replace />;
  }
  return <>{children}</>;
};
