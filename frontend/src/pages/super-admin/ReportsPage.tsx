import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import { Calendar, Download, TrendingUp, Users, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function ReportsPage() {
  const { bookings, payments, courts, sports } = useAuth();
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2026-04-30');

  const filteredBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return bookingDate >= start && bookingDate <= end;
  });

  const filteredPayments = payments.filter((p) => {
    const paymentDate = new Date(p.created_at);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return paymentDate >= start && paymentDate <= end && p.status === 'paid';
  });

  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalBookings = filteredBookings.length;
  const averagePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  const revenueByDate = filteredPayments.reduce((acc, payment) => {
    const date = payment.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const revenueChartData = Object.entries(revenueByDate)
    .map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      revenue: amount,
    }))
    .slice(0, 10);

  const bookingsBySport = sports.map((sport) => {
    const sportBookings = filteredBookings.filter((b) => {
      const court = courts.find((c) => c.id === b.court_id);
      return court?.sport_id === sport.id;
    });

    const sportRevenue = sportBookings.reduce((sum, b) => sum + b.total_price, 0);

    return {
      name: sport.name,
      bookings: sportBookings.length,
      revenue: sportRevenue,
    };
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">Analisis booking dan pendapatan</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Periode Laporan</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Booking</p>
                <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <Calendar className="w-8 h-8 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rata-rata/Booking</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(averagePerBooking)}</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <MapPin className="w-8 h-8 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Pendapatan per Hari</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#4E8D9C" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Booking & Pendapatan per Sport</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingsBySport}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#85C79A" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
