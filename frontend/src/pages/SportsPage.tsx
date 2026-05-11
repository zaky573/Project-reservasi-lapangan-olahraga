import { useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { ChevronRight, ImageIcon } from 'lucide-react';

export function SportsPage() {
  const { sports, courts, refreshPublicData } = useAuth();

  useEffect(() => {
    refreshPublicData();
  }, []);

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
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <div className="relative h-44 bg-muted">
                    {sport.image ? (
                      <img
                        src={sport.image}
                        alt={sport.name}
                        onError={(event) => {
                          if (!event.currentTarget.src.includes('/images/hero-background.jpg')) {
                            event.currentTarget.src = '/images/hero-background.jpg';
                          }
                        }}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg bg-background/90 text-2xl shadow-sm">
                      {sport.icon}
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-xl font-semibold text-foreground">{sport.name}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{sport.description}</p>
                        <p className="text-sm text-secondary mt-3 font-medium">
                          {courtCount} lapangan tersedia
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
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
