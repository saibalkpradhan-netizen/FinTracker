import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps routes that require a logged-in user. Redirects to /login otherwise,
// and holds rendering until we know whether the stored token is still valid.
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
