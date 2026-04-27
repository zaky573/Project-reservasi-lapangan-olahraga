import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Search, Eye, CheckCircle, Clock, Wallet } from 'lucide-react';

type PaymentWithRelations = {
  id: string;
  booking_id: string;
  amount: number;
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

export function PaymentsManagementPage() {
  const { payments, bookings, courts, users, updatePayment, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [receivedAmountError, setReceivedAmountError] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementError, setSettlementError] = useState('');

  const paymentRows = useMemo(() => {
    return payments.map((payment) => {
      const booking = bookings.find((item) => item.id === payment.booking_id);
      const court = booking ? courts.find((item) => item.id === booking.court_id) : null;
      const user = booking ? users.find((item) => item.id === booking.user_id) : null;
      const remainingAmount = Math.max((booking?.total_price || 0) - payment.amount, 0);

      return {
        ...payment,
        booking,
        court,
        user,
        remainingAmount,
      };
    });
  }, [payments, bookings, courts, users]);

  const filteredPayments = paymentRows.filter((payment) => {
    const keyword = searchTerm.toLowerCase();
    const matchesSearch =
      payment.booking?.customer_name?.toLowerCase().includes(keyword) ||
      payment.user?.email?.toLowerCase().includes(keyword) ||
      payment.booking_id.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Approve</Badge>;
      case 'pending_verification':
        return <Badge variant="warning">Menunggu Verifikasi</Badge>;
      case 'pending':
        return <Badge variant="info">Pending</Badge>;
      case 'rejected':
        return <Badge variant="danger">Ditolak</Badge>;
      default:
        return null;
    }
  };

  const getPaymentNote = (payment: PaymentWithRelations) => {
    if (payment.admin_note) return payment.admin_note;

    if (payment.status === 'paid') {
      return `Pembayaran sudah memenuhi syarat. Uang masuk tercatat ${formatCurrency(payment.amount)}.`;
    }

    if (payment.status === 'pending') {
      if (payment.settlement_method === 'cash_at_venue') {
        return `Customer memilih membayar sisa ${formatCurrency(payment.remainingAmount)} secara cash saat datang ke lapangan.`;
      }

      return `Admin mencatat uang masuk ${formatCurrency(payment.amount)}. Sisa pembayaran ${formatCurrency(payment.remainingAmount)} dapat ditransfer ulang atau dibayar langsung saat datang.`;
    }

    if (payment.status === 'pending_verification' && payment.pending_amount) {
      return `Customer mengirim bukti transfer sisa ${formatCurrency(payment.pending_amount)}. Silakan cek bukti tambahan lalu approve jika uang sudah masuk.`;
    }

    return 'Bukti pembayaran masih menunggu pengecekan admin.';
  };

  const openPaymentModal = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setReceivedAmount('');
    setReceivedAmountError('');
    setSettlementAmount(payment.remainingAmount > 0 ? String(payment.remainingAmount) : '');
    setSettlementError('');
    setIsModalOpen(true);
  };

  const handleApprove = (payment: PaymentWithRelations) => {
    const totalPrice = payment.booking?.total_price || payment.amount;
    const approvedAmount = payment.pending_amount
      ? Math.min(payment.amount + payment.pending_amount, totalPrice)
      : payment.method === 'transfer'
        ? totalPrice
        : payment.amount;
    const remainingAmount = Math.max(totalPrice - approvedAmount, 0);
    const nextStatus = remainingAmount === 0 ? 'paid' : 'pending';
    const adminNote =
      nextStatus === 'paid'
        ? `Pembayaran sudah memenuhi syarat. Uang masuk tercatat ${formatCurrency(approvedAmount)}.`
        : `Pembayaran awal sudah memenuhi syarat. Sisa pembayaran ${formatCurrency(remainingAmount)} dapat dibayar langsung saat datang.`;

    updatePayment(payment.id, {
      amount: approvedAmount,
      status: nextStatus,
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
        amount: approvedAmount,
        remainingAmount,
        status: nextStatus,
        admin_note: adminNote,
        settlement_method: undefined,
        pending_amount: undefined,
        pending_proof_url: undefined,
        customer_note: undefined,
      });
    }

    setReceivedAmount('');
    setReceivedAmountError('');
    setSettlementAmount(remainingAmount > 0 ? String(remainingAmount) : '');
  };

  const handleMarkPending = () => {
    if (!selectedPayment) return;

    const totalPrice = selectedPayment.booking?.total_price || 0;
    const parsedAmount = Number(receivedAmount);

    if (receivedAmount.trim() === '' || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setReceivedAmountError('Uang yang masuk harus lebih dari 0');
      return;
    }

    if (parsedAmount >= totalPrice) {
      setReceivedAmountError('Nominal sudah memenuhi tagihan. Gunakan tombol Approve.');
      return;
    }

    const remainingAmount = Math.max(totalPrice - parsedAmount, 0);
    const adminNote = `Admin mencatat uang masuk ${formatCurrency(parsedAmount)}. Sisa pembayaran ${formatCurrency(remainingAmount)} dapat ditransfer ulang atau dibayar langsung saat datang.`;

    updatePayment(selectedPayment.id, {
      amount: parsedAmount,
      status: 'pending',
      admin_note: adminNote,
      settlement_method: undefined,
      pending_amount: undefined,
      pending_proof_url: undefined,
      customer_note: undefined,
      verified_by: currentUser?.id,
      verified_at: new Date().toISOString(),
    });

    setSelectedPayment({
      ...selectedPayment,
      amount: parsedAmount,
      remainingAmount,
      status: 'pending',
      admin_note: adminNote,
      settlement_method: undefined,
      pending_amount: undefined,
      pending_proof_url: undefined,
      customer_note: undefined,
    });
    setSettlementAmount(remainingAmount > 0 ? String(remainingAmount) : '');
    setReceivedAmount('');
    setReceivedAmountError('');
  };

  const handleSettlementSubmit = () => {
    if (!selectedPayment) return;

    const parsedAmount = Number(settlementAmount);

    if (!parsedAmount || parsedAmount <= 0) {
      setSettlementError('Nominal pelunasan harus lebih dari 0');
      return;
    }

    if (parsedAmount > selectedPayment.remainingAmount) {
      setSettlementError('Nominal pelunasan tidak boleh melebihi sisa pembayaran');
      return;
    }

    const newPaidAmount = selectedPayment.amount + parsedAmount;
    const newRemainingAmount = Math.max((selectedPayment.booking?.total_price || 0) - newPaidAmount, 0);
    const nextStatus = newRemainingAmount === 0 ? 'paid' : 'pending';
    const adminNote =
      nextStatus === 'paid'
        ? `Pembayaran sudah memenuhi syarat. Uang masuk tercatat ${formatCurrency(newPaidAmount)}.`
        : `Admin mencatat uang masuk ${formatCurrency(newPaidAmount)}. Sisa pembayaran ${formatCurrency(newRemainingAmount)} dapat ditransfer ulang atau dibayar langsung saat datang.`;

    updatePayment(selectedPayment.id, {
      amount: newPaidAmount,
      status: nextStatus,
      admin_note: adminNote,
      settlement_method: undefined,
      pending_amount: undefined,
      pending_proof_url: undefined,
      customer_note: undefined,
      verified_by: currentUser?.id,
      verified_at: new Date().toISOString(),
    });

    setSelectedPayment({
      ...selectedPayment,
      amount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: nextStatus,
      admin_note: adminNote,
      settlement_method: undefined,
      pending_amount: undefined,
      pending_proof_url: undefined,
      customer_note: undefined,
    });
    setSettlementAmount(newRemainingAmount > 0 ? String(newRemainingAmount) : '');
    setSettlementError('');
  };

  const selectedTotalPrice = selectedPayment?.booking?.total_price || 0;
  const pendingReceivedAmount = Number(receivedAmount);
  const pendingRemainingPreview =
    receivedAmount.trim() === '' || Number.isNaN(pendingReceivedAmount)
      ? selectedTotalPrice
      : Math.max(selectedTotalPrice - pendingReceivedAmount, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Payments Management</h1>
        <p className="text-muted-foreground mt-2">Kelola pembayaran dan pelunasan booking</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative w-full">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, email, atau booking..."
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
              <option value="pending_verification">Menunggu Verifikasi</option>
              <option value="pending">Pending</option>
              <option value="paid">Approve</option>
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
                    <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDateTime(payment.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPaymentModal(payment)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Aksi
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada payment ditemukan
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
                <p className="font-medium text-foreground capitalize">{selectedPayment.method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tagihan</p>
                <p className="font-medium text-foreground">
                  {formatCurrency(selectedPayment.booking?.total_price || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment.status === 'pending_verification' ? 'Nominal Diajukan' : 'Uang Masuk'}
                </p>
                <p className="font-medium text-primary">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sisa Pembayaran</p>
                <p className="font-medium text-foreground">{formatCurrency(selectedPayment.remainingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(selectedPayment.status)}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Keterangan Pembayaran</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getPaymentNote(selectedPayment)}
              </p>
            </div>

            {selectedPayment.proof_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bukti Pembayaran Awal</p>
                <img
                  src={selectedPayment.proof_url}
                  alt="Bukti Pembayaran Awal"
                  className="w-full rounded-lg border border-border"
                />
              </div>
            )}

            {selectedPayment.pending_proof_url && (
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">Transfer Sisa Diajukan</p>
                  <p className="font-semibold text-primary">
                    {formatCurrency(selectedPayment.pending_amount || selectedPayment.remainingAmount)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Bukti Transfer Sisa</p>
                <img
                  src={selectedPayment.pending_proof_url}
                  alt="Bukti Transfer Sisa"
                  className="w-full rounded-lg border border-border"
                />
              </div>
            )}

            {selectedPayment.status === 'pending_verification' && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-warning" />
                  <h3 className="font-semibold text-foreground">Konfirmasi Pending</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Jika uang yang masuk kurang dari total tagihan, isi total uang yang benar-benar sudah diterima sampai sekarang. Sistem akan menghitung kekurangannya secara otomatis.
                  </p>
                  <Input
                    type="number"
                    label="Total Uang yang Masuk"
                    value={receivedAmount}
                    onChange={(e) => {
                      setReceivedAmount(e.target.value);
                      setReceivedAmountError('');
                    }}
                    min="1"
                    max={String(Math.max(selectedTotalPrice - 1, 1))}
                    placeholder="Contoh: 80000"
                    error={receivedAmountError}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Total Tagihan</p>
                      <p className="font-semibold text-foreground">{formatCurrency(selectedTotalPrice)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Kekurangan Otomatis</p>
                      <p className="font-semibold text-primary">{formatCurrency(pendingRemainingPreview)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPayment.status === 'pending' && selectedPayment.remainingAmount > 0 && (
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Tambah Pembayaran Sisa</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Gunakan form ini saat customer sudah transfer tambahan atau membayar sisa tagihan langsung di lapangan.
                  </p>
                  <Input
                    type="number"
                    label="Nominal Tambahan"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    min="1"
                    max={String(selectedPayment.remainingAmount)}
                    placeholder="Masukkan nominal tambahan"
                    error={settlementError}
                  />
                  <div className="flex justify-end">
                    <Button variant="primary" onClick={handleSettlementSubmit}>
                      Simpan Pembayaran
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedPayment.status === 'pending_verification' && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleMarkPending}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Pending
                </Button>
                <Button
                  variant="accent"
                  onClick={() => handleApprove(selectedPayment)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
