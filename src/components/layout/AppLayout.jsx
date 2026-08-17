import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Drawer, DrawerItems } from 'flowbite-react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
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

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
