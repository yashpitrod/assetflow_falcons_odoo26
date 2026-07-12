import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  CalendarClock, Wrench, ClipboardCheck, BarChart3, Bell, LogOut, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/constants';

const ICON_MAP = {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  CalendarClock, Wrench, ClipboardCheck, BarChart3, Bell,
};

const SIDEBAR_WIDTH = 220;

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose?.();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        style={{ width: SIDEBAR_WIDTH }}
        className={`shrink-0 h-screen glass-surface border-r border-white/[0.06] flex flex-col z-50 transition-transform duration-300 ease-out
          fixed left-0 top-0 lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        aria-label="Main navigation"
      >
        <div className="px-5 py-6 flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={18} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-text-primary font-semibold text-lg tracking-tight">AssetFlow</span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto" aria-label="Site navigation">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-2xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-white/[0.08] text-accent-yellow'
                      : 'text-text-secondary hover:bg-white/[0.05] hover:text-text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {Icon && (
                      <Icon
                        size={18}
                        className={`transition-transform duration-150 group-hover:scale-110 ${isActive ? 'text-accent-yellow' : ''}`}
                        aria-hidden="true"
                      />
                    )}
                    <span>{item.label}</span>
                    {isActive && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-yellow shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 pb-5 mt-auto shrink-0">
          <div className="glass-surface rounded-2xl p-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full gradient-indigo flex items-center justify-center text-xs font-bold text-white shrink-0"
              aria-hidden="true"
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-[0.65rem] text-text-dim truncate">
                {user?.role?.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-text-dim hover:text-status-danger transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
