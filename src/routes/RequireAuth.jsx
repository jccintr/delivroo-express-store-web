import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullScreenLoader from '../components/ui/FullScreenLoader';

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;

  if (status === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
