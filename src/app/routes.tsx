import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ServicesListPage } from './pages/ServicesListPage';
import { ServiceCreatePage } from './pages/ServiceCreatePage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { getCurrentUser } from './lib/storage';
import { TechniciansPage } from './pages/TechniciansPage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/services',
    element: (
      <ProtectedRoute>
        <ServicesListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/services/new',
    element: (
      <ProtectedRoute>
        <ServiceCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/services/:id',
    element: (
      <ProtectedRoute>
        <ServiceDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/equipment',
    element: (
      <ProtectedRoute>
        <EquipmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <ReportsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/technicians',
    element: (
      <ProtectedRoute>
        <TechniciansPage />
      </ProtectedRoute>
    ),
  }
]);