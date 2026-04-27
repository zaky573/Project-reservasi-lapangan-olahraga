import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { UserLayout } from '../components/UserLayout';
import { AdminLayout } from '../components/AdminLayout';

import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { SportsPage } from '../pages/SportsPage';
import { CourtsPage } from '../pages/CourtsPage';
import { CourtDetailPage } from '../pages/CourtDetailPage';
import { BookingPage } from '../pages/BookingPage';
import { BookingSuccessPage } from '../pages/BookingSuccessPage';
import { MyBookingsPage } from '../pages/MyBookingsPage';

import { DashboardPage } from '../pages/admin/DashboardPage';
import { SportsManagementPage } from '../pages/admin/SportsManagementPage';
import { CourtsManagementPage } from '../pages/admin/CourtsManagementPage';
import { BookingsManagementPage } from '../pages/admin/BookingsManagementPage';
import { PaymentsManagementPage } from '../pages/admin/PaymentsManagementPage';

import { AdminManagementPage } from '../pages/super-admin/AdminManagementPage';
import { ReportsPage } from '../pages/super-admin/ReportsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}
