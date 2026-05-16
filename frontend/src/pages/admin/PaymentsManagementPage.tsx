import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PaymentProofPreview } from '../../components/PaymentProofPreview';
import { calculateDpAmount, calculateTimeDurationHours, formatCurrency, formatDateTime } from '../../lib/utils';
import { Search, Eye, CheckCircle, XCircle, MessageCircle } from 'lucide-react';

type PaymentWithRelations = {
  id: string;
  booking_id: string;
  amount: number;
  paid_amount?: number;
  total_amount?: number;
  remaining_amount?: number;
  method: 'cash' | 'transfer';
  status: string;
  proof_url?: string;
  admin_note?: string;
  settlement_method?: 'transfer' | 'cash_at_venue';
  pending_amount?: number;
  pending_proof_url?: string;
  customer_note?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  booking: any;
  court: any;
  user: any;
  remainingAmount: number;
};

const PAYMENT_STATUS_FILTERS = [
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'menunggu_verifikasi_pembayaran_dp', label: 'Menunggu Verifikasi Pembayaran DP' },
  { value: 'menunggu_verifikasi_pembayaran', label: 'Menunggu Verifikasi Pembayaran' },
  { value: 'pembayaran_awal', label: 'Pembayaran Awal' },
  { value: 'lunas', label: 'Lunas' },
];

const HIDDEN_PAYMENT_BOOKING_STATUSES = ['dibatalkan', 'cancelled', 'sedang_digunakan', 'selesai', 'completed'];

export function PaymentsManagementPage() {
  const { payments, bookings, courts, users, updatePayment, updateBooking, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const paymentRows = useMemo(() => {
    return payments.map((payment) => {
      const booking = bookings.find((item) => item.id === payment.booking_id);
      const court = booking ? courts.find((item) => item.id === booking.court_id) : null;
      const user = booking ? users.find((item) => item.id === booking.user_id) : null;
      const acceptedAmount = payment.status === 'menunggu'
        ? payment.paid_amount || 0
        : payment.amount;
      const displayAppliedAmount =
        payment.status === 'menunggu' && payment.pending_amount
          ? payment.pending_amount
          : acceptedAmount;
      const cashDpAmount = booking
        ? calculateDpAmount(calculateTimeDurationHours(booking.start_time, booking.end_time))
        : 0;
      const dpShortage = Math.max(cashDpAmount - acceptedAmount, 0);
      const displayStatus = payment.status;
      const remainingAmount = payment.method === 'cash' && displayStatus === 'menunggu'
        ? dpShortage
        : Math.max(
            payment.remaining_amount ?? (booking?.total_price || payment.total_amount || 0) - displayAppliedAmount,
            0
          );

      return {
        ...payment,
        status: displayStatus,
        booking,
        court,
        user,
        remainingAmount,
      };
    }).filter((payment) => !payment.booking || !HIDDEN_PAYMENT_BOOKING_STATUSES.includes(payment.booking.status));
  }, [payments, bookings, courts, users]);

  const getPaymentFilterStatus = (payment: PaymentWithRelations) => {
    if (payment.status === 'menunggu' && payment.method === 'cash') {
      return 'menunggu_verifikasi_pembayaran_dp';
    }

    if (payment.status === 'menunggu' && payment.method === 'transfer') {
      return 'menunggu_verifikasi_pembayaran';
    }

    return payment.status;
  };

  const filteredPayments = paymentRows.filter((payment) => {
    const keyword = searchTerm.toLowerCase();
    const matchesSearch =
      payment.booking?.customer_name?.toLowerCase().includes(keyword) ||
      payment.user?.email?.toLowerCase().includes(keyword) ||
      payment.booking_id.includes(searchTerm);
    const paymentFilterStatus = getPaymentFilterStatus(payment);
    const matchesStatus =
      filterStatus === 'all'
      || payment.status === filterStatus
      || paymentFilterStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, payment?: PaymentWithRelations) => {
    if (payment?.status === 'menunggu' && payment.pending_amount) {
      return (
        <Badge variant="warning">
          {payment.method === 'cash' ? 'Menunggu Verifikasi Pembayaran DP' : 'Menunggu Verifikasi Pembayaran'}
        </Badge>
      );
    }

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

  const getPaymentNote = (payment: PaymentWithRelations) => {
    if (payment.admin_note) return payment.admin_note;

    if (payment.status === 'lunas') {
      return `Pembayaran sudah diverifikasi lunas oleh admin.`;
    }

    if (payment.status === 'pembayaran_awal') {
      return `Pembayaran belum lunas. Jika nominal belum sesuai, hubungi pelanggan melalui WhatsApp. Setelah uang masuk, klik Lunas.`;
    }

    if (payment.status === 'menunggu' && payment.pending_amount) {
      return `Ada bukti pembayaran menunggu verifikasi sebesar ${formatCurrency(payment.pending_amount)}. Cek bukti pembayaran, lalu klik Lunas jika sesuai atau Dibatalkan jika booking harus dibatalkan.`;
    }

    return 'Bukti pembayaran masih menunggu pengecekan admin. Jika sesuai klik Lunas, jika tidak sesuai hubungi pelanggan lewat WhatsApp atau batalkan booking.';
  };

  const buildWhatsAppUrl = (payment: PaymentWithRelations) => {
    const rawPhone = payment.booking?.customer_phone || payment.user?.phone || '';
    let phone = rawPhone.replace(/\D/g, '');

    if (!phone) return '';

    if (phone.startsWith('0')) {
      phone = `62${phone.slice(1)}`;
    } else if (!phone.startsWith('62')) {
      phone = `62${phone}`;
    }

    const customerName = payment.booking?.customer_name || 'Pelanggan';
    const courtName = payment.court?.name || 'lapangan';
    const bookingDate = payment.booking?.date ? formatDateTime(payment.booking.date).split(' pukul ')[0] : '';
    const playTime = payment.booking?.start_time && payment.booking?.end_time
      ? `${payment.booking.start_time} - ${payment.booking.end_time}`
      : '';
    const remainingText = payment.remainingAmount > 0
      ? `Pembayaran masih kurang ${formatCurrency(payment.remainingAmount)}.`
      : `Pembayaran sudah tercatat ${formatCurrency(payment.amount)}.`;

    const message = [
      `Halo ${customerName},`,
      `kami dari THE ARENA ingin menginformasikan pemesanan #${payment.booking_id}`,
      `untuk ${courtName}${bookingDate ? ` tanggal ${bookingDate}` : ''}${playTime ? ` jam ${playTime}` : ''}.`,
      remainingText,
      `Silakan hubungi admin jika ada yang perlu dikonfirmasi. Terima kasih.`,
    ].join(' ');

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const canSendWhatsApp = (payment: PaymentWithRelations) => {
    return !!buildWhatsAppUrl(payment);
  };

  const openWhatsApp = (payment: PaymentWithRelations) => {
    const url = buildWhatsAppUrl(payment);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const openPaymentModal = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const getMethodLabel = (method: string) => {
    return method === 'cash' ? 'Tunai' : 'Transfer';
  };

  const handleApprove = (payment: PaymentWithRelations) => {
    const totalPrice = payment.booking?.total_price || payment.total_amount || payment.amount;
    const adminNote = `Pembayaran sudah diverifikasi lunas oleh admin. Total tagihan ${formatCurrency(totalPrice)}.`;

    updatePayment(payment.id, {
      amount: totalPrice,
      paid_amount: totalPrice,
      status: 'lunas',
      admin_note: adminNote,
      settlement_method: undefined,
      pending_amount: undefined,
      pending_proof_url: undefined,
      customer_note: undefined,
      verified_by: currentUser?.id,
      verified_at: new Date().toISOString(),
    });

    if (selectedPayment?.id === payment.id) {
      setSelectedPayment({
        ...payment,
        amount: totalPrice,
        paid_amount: totalPrice,
        remainingAmount: 0,
        status: 'lunas',
        admin_note: adminNote,
        settlement_method: undefined,
        pending_amount: undefined,
        pending_proof_url: undefined,
        customer_note: undefined,
      });
    }
  };

  const handleVerifyInitialPayment = (payment: PaymentWithRelations) => {
    const submittedAmount = payment.pending_amount || payment.amount;
    const totalPrice = payment.booking?.total_price || payment.total_amount || payment.amount;
    const remainingAmount = Math.max(totalPrice - submittedAmount, 0);
    const adminNote = `Pembayaran awal sudah diverifikasi. Sisa pembayaran ${formatCurrency(remainingAmount)} akan dikonfirmasi admin setelah uang masuk.`;

    updatePayment(payment.id, {
      amount: submittedAmount,
      paid_amount: submittedAmount,
      status: 'pembayaran_awal',
      admin_note: adminNote,
      settlement_method: undefined,
      pending_amount: undefined,
      pending_proof_url: undefined,
      customer_note: undefined,
      verified_by: currentUser?.id,
      verified_at: new Date().toISOString(),
    });

    if (selectedPayment?.id === payment.id) {
      setSelectedPayment({
        ...payment,
        amount: submittedAmount,
        paid_amount: submittedAmount,
        remainingAmount,
        status: 'pembayaran_awal',
        admin_note: adminNote,
        settlement_method: undefined,
        pending_amount: undefined,
        pending_proof_url: undefined,
        customer_note: undefined,
      });
    }
  };

  const openCancelConfirm = () => {
    setCancelMessage('');
    setIsCancelConfirmOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedPayment) return;

    setIsCancelling(true);
    setCancelMessage('');

    const result = await updateBooking(selectedPayment.booking_id, {
      status: 'dibatalkan',
    });

    setIsCancelling(false);

    if (!result.success) {
      setCancelMessage(result.message);
      return;
    }

    setCancelMessage(result.message);
    setIsCancelConfirmOpen(false);
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Manajemen Pembayaran</h1>
        <p className="text-muted-foreground mt-2">Kelola pembayaran dan pelunasan pemesanan</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative w-full">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, email, atau pemesanan..."
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
              {PAYMENT_STATUS_FILTERS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nama</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sisa Pembayaran</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nominal Pembayaran</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status Pembayaran</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium text-foreground">
                      {payment.booking?.customer_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {payment.user?.email || '-'}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {formatCurrency(payment.remainingAmount)}
                    </td>
                    <td className="py-3 px-4 font-medium text-primary">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(payment.status, payment)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDateTime(payment.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canSendWhatsApp(payment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openWhatsApp(payment)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WA
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPaymentModal(payment)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Aksi
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada pembayaran ditemukan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Aksi Pembayaran"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-medium text-foreground">{selectedPayment.booking?.customer_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{selectedPayment.user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lapangan</p>
                <p className="font-medium text-foreground">{selectedPayment.court?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metode</p>
                <p className="font-medium text-foreground">{getMethodLabel(selectedPayment.method)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tagihan</p>
                <p className="font-medium text-foreground">
                  {formatCurrency(selectedPayment.booking?.total_price || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment.status === 'menunggu' ? 'Nominal Diajukan' : 'Uang Masuk'}
                </p>
                <p className="font-medium text-primary">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sisa Pembayaran</p>
                <p className="font-medium text-foreground">{formatCurrency(selectedPayment.remainingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(selectedPayment.status, selectedPayment)}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Keterangan Pembayaran</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getPaymentNote(selectedPayment)}
              </p>
            </div>

            {selectedPayment.pending_proof_url ? (
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">Bukti Pembayaran Menunggu Verifikasi</p>
                  <p className="font-semibold text-primary">
                    {formatCurrency(selectedPayment.pending_amount || selectedPayment.remainingAmount)}
                  </p>
                </div>
                <PaymentProofPreview
                  src={selectedPayment.pending_proof_url}
                  title="Bukti Pembayaran"
                />
              </div>
            ) : (
              <PaymentProofPreview
                src={selectedPayment.proof_url}
                title="Bukti Pembayaran"
              />
            )}

            {canSendWhatsApp(selectedPayment) && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => openWhatsApp(selectedPayment)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat WhatsApp Pelanggan
                </Button>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              {selectedPayment.booking?.status !== 'dibatalkan' && selectedPayment.booking?.status !== 'selesai' && (
                <Button
                  variant="destructive"
                  onClick={openCancelConfirm}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Dibatalkan
                </Button>
              )}
              {selectedPayment.status === 'menunggu' && selectedPayment.method === 'cash' ? (
                <Button
                  variant="accent"
                  onClick={() => handleVerifyInitialPayment(selectedPayment)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verifikasi Pembayaran Awal
                </Button>
              ) : selectedPayment.status !== 'lunas' && (
                <Button
                  variant="accent"
                  onClick={() => handleApprove(selectedPayment)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Lunas
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCancelConfirmOpen}
        onClose={() => {
          if (!isCancelling) setIsCancelConfirmOpen(false);
        }}
        title="Batalkan Pemesanan?"
        size="sm"
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="font-semibold text-foreground">
              Yakin mau membatalkan pemesanan ini?
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Jika dibatalkan sebelum jam main, slot jadwal akan tersedia lagi untuk dipesan. Jika sudah masuk jam main atau sudah lewat, pemesanan tidak bisa dibatalkan karena slot sudah kadaluarsa.
            </p>
          </div>

          {cancelMessage && (
            <p className="text-sm font-medium text-destructive">{cancelMessage}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCancelConfirmOpen(false)}
              disabled={isCancelling}
            >
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={isCancelling}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {isCancelling ? 'Membatalkan...' : 'Dibatalkan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
