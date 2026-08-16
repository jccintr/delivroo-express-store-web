import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullScreenLoader from '../components/ui/FullScreenLoader';

export default function RequireGuest() {
  const { status } = useAuth();

  if (status === 'loading') return <FullScreenLoader />;

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
