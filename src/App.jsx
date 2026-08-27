import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RealtimeProvider } from './context/RealtimeContext';
import RequireAuth from './routes/RequireAuth';
import RequireGuest from './routes/RequireGuest';
import RequireUnverified from './routes/RequireUnverified';
 
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyAccountPage from './pages/auth/VerifyAccountPage';
import PerfilLojaPage from './pages/perfil/PerfilLojaPage';
import ContaPage from './pages/conta/ContaPage';

import DashboardPage from './pages/dashboard/DashboardPage';
import EntregasPage from './pages/entregas/EntregasPage';
import NovaEntregaPage from './pages/entregas/NovaEntregaPage';
import NotFoundPage from './pages/NotFoundPage';
 export default function App() {
   return (
     <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Rotas públicas — redirecionam para /dashboard se já autenticado */}
            <Route element={<RequireGuest />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
              </Route>
            </Route>

            {/* Verificação de conta — só para lojas autenticadas e ainda não verificadas */}
            <Route element={<RequireUnverified />}>
              <Route element={<AuthLayout />}>
                <Route path="/verificar-conta" element={<VerifyAccountPage />} />
              </Route>
             </Route>

            {/* Rotas autenticadas — redirecionam para /login se sem sessão */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/entregas" element={<EntregasPage />} />
                <Route path="/entregas/nova" element={<NovaEntregaPage />} />
                <Route path="/perfil-loja" element={<PerfilLojaPage />} />
                <Route path="/conta" element={<ContaPage />} />
              </Route>
             </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </RealtimeProvider>
        </AuthProvider>
      </ToastProvider>
     </BrowserRouter>
   );
 }