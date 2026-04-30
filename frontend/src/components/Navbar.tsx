import { Link, useNavigate } from 'react-router';
import { LogOut, User, Calendar, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold">THE ARENA</div>
          </Link>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <Link to={currentUser.role === 'user' ? '/sports' : '/dashboard'}>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <Home className="w-4 h-4 mr-2" />
                    {currentUser.role === 'user' ? 'Pemesanan' : 'Dasbor'}
                  </Button>
                </Link>
                {currentUser.role === 'user' && (
                  <Link to="/my-bookings">
                    <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                      <Calendar className="w-4 h-4 mr-2" />
                      Riwayat
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>{currentUser.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-primary-foreground hover:bg-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                    Masuk
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
