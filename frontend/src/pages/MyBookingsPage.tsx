import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PaymentProofPreview } from '../components/PaymentProofPreview';
import { Payment } from '../data/mockData';
import { calculateDpAmount, calculateTimeDurationHours, formatCurrency, formatDateTime } from '../lib/utils';
import { Calendar } from 'lucide-react';

export function MyBookingsPage() {
  const { currentUser, bookings, payments, courts } = useAuth();

  const userBookings = bookings.filter((b) => b.user_id === currentUser?.id);

  const getBookingStatusBadge = (status: string) => {
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'lunas':
        return <Badge variant="success">Lunas</Badge>;
      case 'menunggu':
        return <Badge variant="warning">Menunggu</Badge>;
      case 'pembayaran_awal':
        return <Badge variant="info">Pembayaran Awal</Badge>;
      default:
        return null;
    }
  };

  const getDisplayPaymentStatus = (payment: Payment, booking: any) => {
    return payment.status;
  };

  const getPaymentNote = (payment: Payment, remainingAmount: number) => {
    if (payment.admin_note) return payment.admin_note;

    if (payment.status === 'lunas') {
      return `Pembayaran sudah memenuhi syarat. Uang masuk tercatat ${formatCurrency(payment.amount)}.`;
    }

    const displayStatus = payment.status;

    if (displayStatus === 'pembayaran_awal') {
      if (payment.method === 'cash' && displayStatus === 'pembayaran_awal') {
        return `Pembayaran awal sudah diverifikasi. Jika masih ada sisa ${formatCurrency(remainingAmount)}, admin akan menghubungi Anda melalui WhatsApp.`;
      }

      return `Pembayaran belum lunas. Jika masih kurang ${formatCurrency(remainingAmount)}, admin akan menghubungi Anda melalui WhatsApp.`;
    }

    return 'Bukti pembayaran Anda masih menunggu pengecekan admin.';
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Riwayat Pemesanan</h1>
          <p className="text-muted-foreground mt-2">
            Lihat semua pemesanan Anda di sini
          </p>
        </div>

        {userBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Belum ada pemesanan</p>
              <p className="text-sm text-muted-foreground">
                Mulai pesan lapangan favorit Anda sekarang
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userBookings
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((booking) => {
                const court = courts.find((c) => c.id === booking.court_id);
                const payment = payments.find((p) => p.booking_id === booking.id);
                const paidAmount = payment
                  ? payment.status === 'menunggu'
                    ? payment.paid_amount || 0
                    : payment.amount
                  : 0;
                const remainingAmount = payment
                  ? Math.max(payment.remaining_amount ?? booking.total_price - paidAmount, 0)
                  : booking.total_price;
                const cashDpAmount = calculateDpAmount(calculateTimeDurationHours(booking.start_time, booking.end_time));
                const cashPaidAmount = payment?.paid_amount || payment?.amount || 0;
                const cashDpRemainingAmount = Math.max(cashDpAmount - cashPaidAmount, 0);
                const cashDpIsCovered = payment?.method === 'cash' && cashPaidAmount >= cashDpAmount;
                const displayPaymentStatus = payment ? getDisplayPaymentStatus(payment, booking) : '';

                return (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {court?.name || 'Lapangan tidak diketahui'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ID Pemesanan: #{booking.id}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {getBookingStatusBadge(booking.status)}
                          {payment && getPaymentStatusBadge(displayPaymentStatus)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tanggal</p>
                          <p className="font-medium text-foreground">
                            {new Date(booking.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Waktu</p>
                          <p className="font-medium text-foreground">
                            {booking.start_time} - {booking.end_time}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Harga</p>
                          <p className="font-medium text-primary">
                            {formatCurrency(booking.total_price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Metode Pembayaran</p>
                          <p className="font-medium text-foreground">
                            {payment?.method === 'cash'
                              ? 'Tunai + DP Transfer'
                              : payment?.method === 'transfer'
                                ? 'Transfer'
                                : '-'}
                          </p>
                        </div>
                      </div>
                      {booking.status === 'dibatalkan' && (
                        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                          <p className="text-sm text-muted-foreground">Keterangan Pemesanan</p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            Pemesanan ini sudah dibatalkan oleh admin. Data pembayaran tidak lagi diproses karena pemesanan telah dibatalkan.
                          </p>
                        </div>
                      )}
                      {payment && booking.status !== 'dibatalkan' && (
                        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                {payment.status === 'menunggu' && !payment.pending_amount ? 'Nominal Diajukan' : 'Uang Masuk'}
                              </p>
                              <p className="font-medium text-primary">{formatCurrency(payment.amount)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Sisa Pembayaran</p>
                              <p className="font-medium text-foreground">
                                {formatCurrency(payment.method === 'cash' && !cashDpIsCovered ? cashDpRemainingAmount : remainingAmount)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 border-t border-border pt-3">
                            <p className="text-muted-foreground text-sm">Keterangan Pembayaran</p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                              {getPaymentNote({ ...payment, status: displayPaymentStatus } as Payment, remainingAmount)}
                            </p>
                          </div>
                        </div>
                      )}
                      {(payment?.proof_url || payment?.pending_proof_url) && booking.status !== 'dibatalkan' && (
                        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <PaymentProofPreview
                            src={payment.proof_url || payment.pending_proof_url}
                            title="Bukti Pembayaran"
                            amountLabel={`Nominal tercatat ${formatCurrency(payment.amount)}`}
                          />
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                        Dibuat: {formatDateTime(booking.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
