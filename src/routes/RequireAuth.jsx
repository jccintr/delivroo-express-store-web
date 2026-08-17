import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullScreenLoader from '../components/ui/FullScreenLoader';

export default function RequireAuth() {
  const { status, isEmailVerified } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;

  if (status === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Loja autenticada, mas com conta ainda não verificada — não pode
  // acessar o painel enquanto não confirmar o código enviado por e-mail.
  if (!isEmailVerified) {
    return <Navigate to="/verificar-conta" replace />;
  }

  return <Outlet />;
}
