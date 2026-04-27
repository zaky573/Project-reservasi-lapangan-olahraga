import { useParams, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { MapPin, Clock } from 'lucide-react';

export function CourtsPage() {
  const { sportId } = useParams();
  const { sports, courts } = useAuth();

  const sport = sports.find((s) => s.id === sportId);
  const sportCourts = courts.filter((c) => c.sport_id === sportId);

  if (!sport) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Sport tidak ditemukan</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Tersedia</Badge>;
      case 'inactive':
        return <Badge variant="danger">Tidak Aktif</Badge>;
      case 'maintenance':
        return <Badge variant="warning">Maintenance</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-4xl">{sport.icon}</span>
            <h1 className="text-3xl font-bold text-foreground">{sport.name}</h1>
          </div>
          <p className="text-muted-foreground">{sport.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sportCourts.map((court) => (
            <Link
              key={court.id}
              to={`/courts/${court.id}`}
              className={court.status !== 'active' ? 'pointer-events-none' : ''}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <img
                  src={court.image}
                  alt={court.name}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{court.name}</h3>
                      <p className="text-sm text-muted-foreground">{court.code}</p>
                    </div>
                    {getStatusBadge(court.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {court.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      Per jam
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(court.price_per_hour)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {sportCourts.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada lapangan untuk {sport.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
