import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[16rem_minmax(0,1fr)]">
        <Sidebar />
        <main className="min-w-0 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
