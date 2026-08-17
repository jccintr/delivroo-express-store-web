import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullScreenLoader from '../components/ui/FullScreenLoader';

// Protege a rota de verificação de conta:
// - sem sessão -> /login
// - já verificada -> /dashboard
// - autenticada e não verificada -> libera acesso
export default function RequireUnverified() {
  const { status, isEmailVerified } = useAuth();

  if (status === 'loading') return <FullScreenLoader />;

  if (status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  if (isEmailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}