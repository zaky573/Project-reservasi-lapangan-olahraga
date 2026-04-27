import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Trophy, MapPin, Calendar, CreditCard, Users, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Trophy, label: 'Sports', path: '/admin/sports' },
    { icon: MapPin, label: 'Lapangan', path: '/admin/courts' },
    { icon: Calendar, label: 'Booking', path: '/admin/bookings' },
    { icon: CreditCard, label: 'Payment', path: '/admin/payments' },
  ];

  const superAdminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Trophy, label: 'Sports', path: '/admin/sports' },
    { icon: MapPin, label: 'Lapangan', path: '/admin/courts' },
    { icon: Calendar, label: 'Booking', path: '/admin/bookings' },
    { icon: CreditCard, label: 'Payment', path: '/admin/payments' },
    { icon: Users, label: 'Admin Management', path: '/super-admin/admins' },
    { icon: FileText, label: 'Reports', path: '/super-admin/reports' },
  ];

  const menuItems = currentUser?.role === 'super_admin' ? superAdminMenuItems : adminMenuItems;

  if (currentUser?.role === 'user') return null;

  return (
    <aside className="bg-sidebar w-64 min-h-screen border-r border-sidebar-border">
      <div className="p-6">
        <h2 className="text-sidebar-foreground text-xl font-bold">
          {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin Panel'}
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
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
