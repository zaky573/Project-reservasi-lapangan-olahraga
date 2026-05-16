import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { UserLayout } from '../components/UserLayout';
import { AdminLayout } from '../components/AdminLayout';

const LandingPage = lazy(() => import('../pages/LandingPage').then(({ LandingPage }) => ({ default: LandingPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then(({ RegisterPage }) => ({ default: RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import('../pages/ForgotPasswordPage').then(({ ForgotPasswordPage }) => ({ default: ForgotPasswordPage })),
);
const SportsPage = lazy(() => import('../pages/SportsPage').then(({ SportsPage }) => ({ default: SportsPage })));
const CourtsPage = lazy(() => import('../pages/CourtsPage').then(({ CourtsPage }) => ({ default: CourtsPage })));
const CourtDetailPage = lazy(() =>
  import('../pages/CourtDetailPage').then(({ CourtDetailPage }) => ({ default: CourtDetailPage })),
);
const BookingPage = lazy(() => import('../pages/BookingPage').then(({ BookingPage }) => ({ default: BookingPage })));
const BookingSuccessPage = lazy(() =>
  import('../pages/BookingSuccessPage').then(({ BookingSuccessPage }) => ({ default: BookingSuccessPage })),
);
const MyBookingsPage = lazy(() =>
  import('../pages/MyBookingsPage').then(({ MyBookingsPage }) => ({ default: MyBookingsPage })),
);

const DashboardPage = lazy(() =>
  import('../pages/admin/DashboardPage').then(({ DashboardPage }) => ({ default: DashboardPage })),
);
const SportsManagementPage = lazy(() =>
  import('../pages/admin/SportsManagementPage').then(({ SportsManagementPage }) => ({ default: SportsManagementPage })),
);
const CourtsManagementPage = lazy(() =>
  import('../pages/admin/CourtsManagementPage').then(({ CourtsManagementPage }) => ({ default: CourtsManagementPage })),
);
const BookingsManagementPage = lazy(() =>
  import('../pages/admin/BookingsManagementPage').then(({ BookingsManagementPage }) => ({
    default: BookingsManagementPage,
  })),
);
const PaymentsManagementPage = lazy(() =>
  import('../pages/admin/PaymentsManagementPage').then(({ PaymentsManagementPage }) => ({
    default: PaymentsManagementPage,
  })),
);

const AdminManagementPage = lazy(() =>
  import('../pages/super-admin/AdminManagementPage').then(({ AdminManagementPage }) => ({
    default: AdminManagementPage,
  })),
);
const ReportsPage = lazy(() =>
  import('../pages/super-admin/ReportsPage').then(({ ReportsPage }) => ({ default: ReportsPage })),
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-[#f5f7fb]" />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route element={<UserLayout />}>
              <Route
                path="/sports"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <SportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sports/:sportId/courts"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <CourtsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courts/:courtId"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <CourtDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-success"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <BookingSuccessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route element={<AdminLayout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sports"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <SportsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courts"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <CourtsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <BookingsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <PaymentsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/admins"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
