import { useLocation, useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CheckCircle } from 'lucide-react';
import { Booking, Payment } from '../data/mockData';
import { calculateDpAmount, calculateTimeDurationHours, DP_PER_HOUR, formatCurrency } from '../lib/utils';

export function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { booking, payment } = (location.state || {}) as {
    booking: Booking;
    payment: Payment;
  };

  if (!booking || !payment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Data reservasi tidak ditemukan</p>
            <Button onClick={() => navigate('/sports')}>Kembali ke Daftar Olahraga</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'lunas':
        return <Badge variant="success">Lunas</Badge>;
      case 'menunggu':
        return <Badge variant="warning">Menunggu</Badge>;
      case 'pembayaran_awal':
        return <Badge variant="info">Pembayaran Awal</Badge>;
      case 'verifikasi_pembayaran_sisa':
        return <Badge variant="warning">Verifikasi Pembayaran Sisa</Badge>;
      default:
        return null;
    }
  };

  const bookingDuration = calculateTimeDurationHours(booking.start_time, booking.end_time);
  const calculatedDpAmount = calculateDpAmount(bookingDuration);
  const cashDpAmount = payment.method === 'cash' ? payment.amount || calculatedDpAmount : 0;
  const remainingCashPayment = Math.max(booking.total_price - cashDpAmount, 0);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success/20 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Reservasi Berhasil!</h1>
            <p className="text-muted-foreground mb-8">
              {payment.method === 'transfer'
                ? 'Pembayaran transfer 100% Anda sedang diverifikasi. Cek status di halaman Riwayat Reservasi.'
                : `DP ${formatCurrency(cashDpAmount)} (${formatCurrency(DP_PER_HOUR)} x ${bookingDuration} jam) Anda sedang diverifikasi. Setelah itu, sisa pembayaran tunai dibayar di tempat saat Anda tiba.`}
            </p>

            <div className="bg-muted/30 rounded-lg p-6 text-left mb-6">
              <h2 className="font-semibold text-foreground mb-4">Detail Reservasi</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Reservasi</span>
                  <span className="font-medium text-foreground">#{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama</span>
                  <span className="font-medium text-foreground">{booking.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. HP</span>
                  <span className="font-medium text-foreground">{booking.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span className="font-medium text-foreground">
                    {new Date(booking.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waktu</span>
                  <span className="font-medium text-foreground">
                    {booking.start_time} - {booking.end_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durasi</span>
                  <span className="font-medium text-foreground">{bookingDuration} jam</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-muted-foreground">Total Harga</span>
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(booking.total_price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Pembayaran</span>
                  <span className="font-medium text-foreground">
                    {payment.method === 'cash' ? 'Tunai + DP Transfer' : 'Transfer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {payment.method === 'cash' ? 'Nominal DP' : 'Nominal Dibayar'}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(payment.method === 'cash' ? cashDpAmount : payment.amount)}
                  </span>
                </div>
                {payment.method === 'cash' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sisa Bayar di Tempat</span>
                    <span className="font-medium text-foreground">{formatCurrency(remainingCashPayment)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Pembayaran</span>
                  {getPaymentStatusBadge(payment.status)}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => navigate('/my-bookings')}
              >
                Lihat Riwayat Reservasi
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/sports')}
              >
                Reservasi Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
