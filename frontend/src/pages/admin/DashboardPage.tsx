import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Trophy, MapPin, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../lib/utils';

export function DashboardPage() {
  const { sports, courts, bookings, payments, currentUser } = useAuth();

  const stats = [
    {
      label: 'Total Sports',
      value: sports.length,
      icon: Trophy,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Total Lapangan',
      value: courts.length,
      icon: MapPin,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: 'Total Booking',
      value: bookings.length,
      icon: Calendar,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Total Payment',
      value: payments.length,
      icon: CreditCard,
      color: 'text-info',
      bg: 'bg-info/10',
    },
  ];

  const totalRevenue = payments
    .filter((p) => p.status === 'lunas')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingVerification = payments.filter((p) => p.status === 'menunggu').length;

  const chartData = sports.map((sport) => {
    const sportBookings = bookings.filter((b) => {
      const court = courts.find((c) => c.id === b.court_id);
      return court?.sport_id === sport.id;
    });

    return {
      name: sport.name,
      bookings: sportBookings.length,
    };
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Selamat datang, {currentUser?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Total Pendapatan</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-10 h-10 text-success" />
              <div>
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Dari {payments.filter((p) => p.status === 'lunas').length} transaksi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Pembayaran Menunggu</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-10 h-10 text-warning" />
              <div>
                <p className="text-3xl font-bold text-foreground">{pendingVerification}</p>
                <p className="text-sm text-muted-foreground">Perlu diverifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-foreground">Booking per Sport</h2>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#281C59" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
