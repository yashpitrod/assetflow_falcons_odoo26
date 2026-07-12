import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  CalendarClock, Wrench, ClipboardCheck, BarChart3, Bell, LogOut, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/constants';

// Icon lookup — maps string name to lucide component
const ICON_MAP = {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  CalendarClock, Wrench, ClipboardCheck, BarChart3, Bell,
};

// Persistent left nav — glass surface, RBAC-filtered items, active-route yellow indicator
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Filter nav items by user role — null roles means visible to everyone
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close the mobile drawer when a nav item is tapped
    if (window.innerWidth < 768) onClose?.();
  };

  return (
    <>
      {/* Mobile Backdrop — click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[220px] glass-surface border-r border-white/[0.06] flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={18} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-text-primary font-semibold text-lg tracking-tight">AssetFlow</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto" aria-label="Site navigation">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 group ${
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

        {/* User info + logout */}
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
              className="text-text-dim hover:text-status-danger transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow"
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
