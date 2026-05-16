import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Trophy, MapPin, Calendar, CreditCard, Users, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dasbor', path: '/dashboard' },
    { icon: Trophy, label: 'Olahraga', path: '/admin/sports' },
    { icon: MapPin, label: 'Lapangan', path: '/admin/courts' },
    { icon: Calendar, label: 'Pemesanan', path: '/admin/bookings' },
    { icon: CreditCard, label: 'Pembayaran', path: '/admin/payments' },
  ];

  const superAdminMenuItems = [
    { icon: LayoutDashboard, label: 'Dasbor', path: '/dashboard' },
    { icon: Trophy, label: 'Olahraga', path: '/admin/sports' },
    { icon: MapPin, label: 'Lapangan', path: '/admin/courts' },
    { icon: Calendar, label: 'Pemesanan', path: '/admin/bookings' },
    { icon: CreditCard, label: 'Pembayaran', path: '/admin/payments' },
    { icon: Users, label: 'Kelola Admin', path: '/super-admin/admins' },
    { icon: FileText, label: 'Rekap Data', path: '/super-admin/reports' },
  ];

  const menuItems = currentUser?.role === 'super_admin' ? superAdminMenuItems : adminMenuItems;

  if (currentUser?.role === 'user') return null;

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar">
      <div className="p-6">
        <h2 className="truncate text-xl font-bold text-sidebar-foreground">
          {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Panel Admin'}
        </h2>
      </div>
      <nav className="px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'mb-1 flex min-w-0 items-center space-x-3 rounded-lg px-3 py-2.5 transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
