import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PaymentProofPreview } from '../components/PaymentProofPreview';
import { Payment } from '../data/mockData';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { Banknote, Calendar, FileImage, Upload } from 'lucide-react';

export function MyBookingsPage() {
  const { currentUser, bookings, payments, courts, submitPaymentDetail } = useAuth();
  const [remainingProofFiles, setRemainingProofFiles] = useState<Record<string, File | null>>({});
  const [paymentActionErrors, setPaymentActionErrors] = useState<Record<string, string>>({});
  const [paymentActionMessages, setPaymentActionMessages] = useState<Record<string, string>>({});

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
      case 'verifikasi_pembayaran_sisa':
        return <Badge variant="warning">Verifikasi Pembayaran Sisa</Badge>;
      default:
        return null;
    }
  };

  const getPaymentNote = (payment: Payment, remainingAmount: number) => {
    if (payment.admin_note) return payment.admin_note;

    if (payment.status === 'lunas') {
      return `Pembayaran sudah memenuhi syarat. Uang masuk tercatat ${formatCurrency(payment.amount)}.`;
    }

    if (payment.status === 'menunggu' && payment.pending_amount) {
      return `Bukti pembayaran ${formatCurrency(payment.pending_amount)} sudah dikirim dan sedang menunggu verifikasi admin.`;
    }

    if (payment.status === 'pembayaran_awal' || payment.status === 'verifikasi_pembayaran_sisa') {
      if (payment.settlement_method === 'cash_at_venue') {
        return `Anda memilih membayar sisa ${formatCurrency(remainingAmount)} secara tunai saat datang ke lapangan.`;
      }

      return `Admin mencatat uang masuk ${formatCurrency(payment.amount)}. Sisa pembayaran ${formatCurrency(remainingAmount)} dapat ditransfer ulang atau dibayar langsung saat datang.`;
    }

    return 'Bukti pembayaran Anda masih menunggu pengecekan admin.';
  };

  const setPaymentMessage = (paymentId: string, message: string) => {
    setPaymentActionMessages((currentMessages) => ({
      ...currentMessages,
      [paymentId]: message,
    }));
  };

  const setPaymentError = (paymentId: string, message: string) => {
    setPaymentActionErrors((currentErrors) => ({
      ...currentErrors,
      [paymentId]: message,
    }));
  };

  const handleRemainingProofChange = (paymentId: string, file?: File | null) => {
    setRemainingProofFiles((currentFiles) => ({
      ...currentFiles,
      [paymentId]: file || null,
    }));
    setPaymentError(paymentId, '');
    setPaymentMessage(paymentId, '');
  };

  const handleTransferRemaining = async (payment: Payment, remainingAmount: number) => {
    const proofFile = remainingProofFiles[payment.id];

    if (!proofFile) {
      setPaymentError(payment.id, 'Upload bukti transfer sisa terlebih dahulu.');
      return;
    }

    try {
      await submitPaymentDetail(payment.booking_id, 'transfer', remainingAmount, proofFile);
      handleRemainingProofChange(payment.id, null);
      setPaymentMessage(payment.id, 'Bukti transfer sisa berhasil dikirim dan sedang menunggu verifikasi admin.');
    } catch (error: any) {
      setPaymentError(payment.id, error?.message || 'Gagal mengirim bukti transfer sisa.');
    }
  };

  const handlePayAtVenue = async (payment: Payment, remainingAmount: number) => {
    try {
      await submitPaymentDetail(payment.booking_id, 'cash', remainingAmount, null, 'Pembayaran tunai saat datang ke lapangan.');
      setPaymentError(payment.id, '');
      setPaymentMessage(payment.id, 'Pilihan bayar tunai saat datang sudah dicatat.');
    } catch (error: any) {
      setPaymentError(payment.id, error?.message || 'Gagal mencatat pembayaran cash.');
    }
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
                  ? Math.max(booking.total_price - paidAmount, 0)
                  : booking.total_price;
                const remainingProofFile = payment ? remainingProofFiles[payment.id] : null;
                const paymentActionError = payment ? paymentActionErrors[payment.id] : '';
                const paymentActionMessage = payment ? paymentActionMessages[payment.id] : '';

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
                          {payment && getPaymentStatusBadge(payment.status)}
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
                      {payment && (
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
                              <p className="font-medium text-foreground">{formatCurrency(remainingAmount)}</p>
                            </div>
                            {payment.pending_amount && (
                              <div>
                                <p className="text-muted-foreground">Transfer Sisa Diajukan</p>
                                <p className="font-medium text-primary">{formatCurrency(payment.pending_amount)}</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 border-t border-border pt-3">
                            <p className="text-muted-foreground text-sm">Keterangan Pembayaran</p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                              {getPaymentNote(payment, remainingAmount)}
                            </p>
                          </div>
                        </div>
                      )}
                      {payment && (payment.proof_url || payment.pending_proof_url) && (
                        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <PaymentProofPreview
                            src={payment.proof_url}
                            title="Bukti Pembayaran"
                            amountLabel={`Nominal tercatat ${formatCurrency(payment.amount)}`}
                          />
                          <PaymentProofPreview
                            src={payment.pending_proof_url}
                            title="Bukti Transfer Sisa"
                            amountLabel={payment.pending_amount ? `Diajukan ${formatCurrency(payment.pending_amount)}` : undefined}
                          />
                        </div>
                      )}
                      {payment && payment.status !== 'menunggu' && payment.status !== 'lunas' && remainingAmount > 0 && (
                        <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 p-4">
                          <div className="mb-4">
                            <p className="font-semibold text-foreground">Bayar Sisa Pembayaran</p>
                            <p className="text-sm text-muted-foreground">
                              Pilih transfer sisa dengan upload bukti baru, atau catat bahwa sisa akan dibayar tunai saat datang.
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label
                                htmlFor={`remaining-proof-${payment.id}`}
                                className="inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-primary px-4 py-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Pilih Bukti Transfer Sisa
                              </label>
                              <input
                                id={`remaining-proof-${payment.id}`}
                                type="file"
                                accept="image/*"
                                onChange={(event) => handleRemainingProofChange(payment.id, event.target.files?.[0])}
                                className="hidden"
                              />
                            </div>

                            {remainingProofFile && (
                              <div className="flex items-center space-x-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
                                <FileImage className="w-4 h-4 text-success" />
                                <span className="font-medium text-foreground">{remainingProofFile.name}</span>
                              </div>
                            )}

                            {paymentActionError && (
                              <p className="text-sm text-destructive">{paymentActionError}</p>
                            )}

                            {paymentActionMessage && (
                              <p className="text-sm font-medium text-success">{paymentActionMessage}</p>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                variant="primary"
                                onClick={() => handleTransferRemaining(payment, remainingAmount)}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Kirim Transfer Sisa
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handlePayAtVenue(payment, remainingAmount)}
                              >
                                <Banknote className="w-4 h-4 mr-2" />
                                Bayar Tunai Saat Datang
                              </Button>
                            </div>
                          </div>
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
