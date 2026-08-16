import { Outlet } from 'react-router-dom';
import Logo from '../Logo';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
             <Logo/>
        </div>
       
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
