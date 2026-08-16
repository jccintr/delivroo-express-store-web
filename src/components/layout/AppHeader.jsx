import { Avatar, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-react';
import { HiOutlineMenu, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AppHeader({ onOpenMenu }) {
  const { store, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initial = store?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-ink-soft hover:bg-cream lg:hidden"
        aria-label="Abrir menu"
      >
        <HiOutlineMenu className="h-6 w-6" />
      </button>

      <div className="hidden lg:block" />

      <Dropdown
        arrowIcon={false}
        inline
        label={
          <div className="flex cursor-pointer items-center gap-2">
            {store?.avatar ? (
              <img
                className="h-10 w-10 rounded-md"
                src={store?.avatar}
                alt={store?.name}
              />
            ) : (
              <Avatar rounded placeholderInitials={initial} size="sm" />
            )}
          
            <span className="hidden text-sm font-medium text-ink sm:block">
              {store?.name || 'Minha loja'}
            </span>
          </div>
        }
      >
        <div className="px-4 py-2 text-sm text-ink-soft">{store?.email}</div>
        <DropdownDivider />
        <DropdownItem icon={HiOutlineUser} onClick={() => navigate('/conta')}>
          Configurações da conta
        </DropdownItem>
        <DropdownItem icon={HiOutlineLogout} onClick={handleLogout}>
          Sair
        </DropdownItem>
      </Dropdown>
    </header>
  );
}
