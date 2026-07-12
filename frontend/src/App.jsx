import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import { EmployeeRole } from './utils/constants';

// Pages — Lazy loaded for performance and code splitting
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




// Protected route — redirects to login if not authenticated
function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRoles && !hasRole(requiredRoles)) return <Navigate to="/dashboard" replace />;
  return children;
}

// Main layout — responsive sidebar + content area
function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-base overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col md:ml-[220px] min-h-screen max-w-full overflow-hidden">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.05] glass-surface sticky top-0 z-30">
          <span className="font-semibold text-text-primary text-lg">AssetFlow</span>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow"
            aria-label="Open navigation menu"
          >
            <Menu size={24} />
          </button>
        </div>
        
        <div className="flex-1 p-4 md:p-6 overflow-y-auto animate-fade-in-up w-full">
          {children}
        </div>
      </main>
      
    </div>
  );
}

// Auth layout — no sidebar, centered
function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      {children}
    </div>
  );
}

// Redirect from root to dashboard or login
function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-bg-base text-accent-yellow">
              <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
              <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />

              {/* Protected app routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/org-setup" element={
                <ProtectedRoute requiredRoles={[EmployeeRole.Admin]}>
                  <AppLayout><OrgSetupPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/assets" element={
                <ProtectedRoute>
                  <AppLayout><AssetRegistryPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/allocation" element={
                <ProtectedRoute>
                  <AppLayout><AllocationPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/booking" element={
                <ProtectedRoute>
                  <AppLayout><BookingPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/maintenance" element={
                <ProtectedRoute>
                  <AppLayout><MaintenancePage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/audit" element={
                <ProtectedRoute requiredRoles={[EmployeeRole.Admin, EmployeeRole.AssetManager]}>
                  <AppLayout><AuditPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute requiredRoles={[EmployeeRole.Admin, EmployeeRole.AssetManager]}>
                  <AppLayout><ReportsPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <AppLayout><NotificationsPage /></AppLayout>
                </ProtectedRoute>
              } />

              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
