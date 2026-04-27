import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
