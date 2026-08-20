import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlinePlusCircle,
  HiOutlineOfficeBuilding,
  HiOutlineCog,
} from 'react-icons/hi';
import Logo from '../Logo';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { to: '/entregas/nova', label: 'Nova entrega', icon: HiOutlinePlusCircle },
  { to: '/perfil-loja', label: 'Perfil da loja', icon: HiOutlineOfficeBuilding },
  { to: '/conta', label: 'Conta', icon: HiOutlineCog },
];

export default function AppSidebar({ onNavigate }) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-line bg-white">
      <div className="flex items-center gap-2 px-2 py-5 mb-4">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange/10 text-orange-dark'
                  : 'text-ink-soft hover:bg-cream hover:text-ink'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line px-6 py-4 font-mono text-xs text-ink-soft">
        Delivroo Lojista · v1.0
      </div>
    </div>
  );
}