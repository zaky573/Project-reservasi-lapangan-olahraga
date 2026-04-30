import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Search } from 'lucide-react';

export function BookingsManagementPage() {
  const { bookings, courts, payments } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_phone.includes(searchTerm) ||
      booking.id.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dibooking':
        return <Badge variant="warning">Dipesan</Badge>;
      case 'sedang_digunakan':
        return <Badge variant="info">Sedang Digunakan</Badge>;
      case 'selesai':
        return <Badge variant="success">Selesai</Badge>;
      case 'dibatalkan':
        return <Badge variant="danger">Dibatalkan</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Manajemen Pemesanan</h1>
        <p className="text-muted-foreground mt-2">Kelola semua pemesanan lapangan</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative w-full">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari pemesanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Semua Status</option>
              <option value="dibooking">Dipesan</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pelanggan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lapangan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Waktu</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Harga</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const court = courts.find((c) => c.id === booking.court_id);
                  return (
                    <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">#{booking.id}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{booking.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{court?.name || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(booking.date)}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {booking.start_time} - {booking.end_time}
                      </td>
                      <td className="py-3 px-4 font-medium text-primary">
                        {formatCurrency(booking.total_price)}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada pemesanan ditemukan
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
