import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import { EmployeeRole } from './utils/constants';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrgSetupPage = lazy(() => import('./pages/OrgSetupPage'));
const AssetRegistryPage = lazy(() => import('./pages/AssetRegistryPage'));
const AllocationPage = lazy(() => import('./pages/AllocationPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRoles && !hasRole(requiredRoles)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-in">
      {children}
    </div>
  );
}

// Sidebar + main share one flex row — no fixed overlap on desktop
function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-base overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/[0.05] glass-surface sticky top-0 z-30 shrink-0">
          <span className="font-semibold text-text-primary text-lg">AssetFlow</span>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow"
            aria-label="Open navigation menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden w-full">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 sm:px-6 py-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 40%, rgba(124,58,237,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 70%, rgba(192,38,211,0.08) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 w-full max-w-md flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-bg-base text-accent-yellow">
                <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
              <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout><DashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/org-setup"
                element={
                  <ProtectedRoute requiredRoles={[EmployeeRole.Admin]}>
                    <AppLayout><OrgSetupPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets"
                element={
                  <ProtectedRoute>
                    <AppLayout><AssetRegistryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/allocation"
                element={
                  <ProtectedRoute>
                    <AppLayout><AllocationPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute>
                    <AppLayout><BookingPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maintenance"
                element={
                  <ProtectedRoute>
                    <AppLayout><MaintenancePage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute requiredRoles={[EmployeeRole.Admin, EmployeeRole.AssetManager]}>
                    <AppLayout><AuditPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requiredRoles={[EmployeeRole.Admin, EmployeeRole.AssetManager]}>
                    <AppLayout><ReportsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <AppLayout><NotificationsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
