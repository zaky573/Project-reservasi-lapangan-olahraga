import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { ChevronRight } from 'lucide-react';

export function SportsPage() {
  const { sports, courts } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Pilih Jenis Olahraga</h1>
          <p className="text-muted-foreground mt-2">
            Temukan lapangan olahraga favorit Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => {
            const courtCount = courts.filter((c) => c.sport_id === sport.id && c.status === 'active').length;

            return (
              <Link key={sport.id} to={`/sports/${sport.id}/courts`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-5xl">{sport.icon}</div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{sport.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{sport.description}</p>
                          <p className="text-sm text-secondary mt-2 font-medium">
                            {courtCount} lapangan tersedia
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {sports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Belum ada olahraga tersedia</p>
          </div>
        )}
      </div>
    </div>
  );
}
