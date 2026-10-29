import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

export function homePathForRole(role: UserRole): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'ENSEIGNANT') return '/teacher/dashboard';
  return '/dashboard';
}

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#07070f', color: '#94a3b8', display: 'grid', placeItems: 'center' }}>Chargement de la session…</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
