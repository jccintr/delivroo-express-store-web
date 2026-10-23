import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Drawer, DrawerItems } from 'flowbite-react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { useCredits } from '../../context/CreditsContext';

const LOW_BALANCE = 3;

// Aviso fixo quando o saldo acabou (vermelho) ou está acabando (âmbar).
export function CreditsBanner() {
  const { credits } = useCredits();
  const { pathname } = useLocation();
  if (!credits || pathname.startsWith('/creditos')) return null;

  const left = credits.availableToRequest;
  if (left > LOW_BALANCE) return null;

  const empty = left <= 0;
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6 lg:px-8 ${
        empty ? 'bg-red text-white' : 'bg-amber/20 text-ink'
      }`}
    >
      <span>
        {empty
          ? 'Seu saldo de entregas acabou. Compre um pacote para pedir novas entregas.'
          : `Restam apenas ${left} ${left === 1 ? 'entrega' : 'entregas'} no seu saldo.`}
      </span>
      <Link to="/creditos" className="font-semibold underline">
        Comprar entregas
      </Link>
    </div>
  );
}
//import VerifyEmailBanner from './VerifyEmailBanner';
//import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  //const { isEmailVerified } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar fixa (desktop) */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Drawer (mobile) */}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} className="p-0">
        <DrawerItems>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </DrawerItems>
      </Drawer>

      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader onOpenMenu={() => setMobileOpen(true)} />
        {/*!isEmailVerified && <VerifyEmailBanner />*/}
        <CreditsBanner />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
