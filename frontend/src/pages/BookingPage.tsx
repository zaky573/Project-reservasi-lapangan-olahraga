import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
import { Court, Sport, TimeSlot, Booking, Payment, PaymentMethod } from '../data/mockData';
import { Calendar, Clock, MapPin, CreditCard, Banknote, Upload, FileImage, X } from 'lucide-react';

export function BookingPage() {
  const BANK_ACCOUNT_INFO = 'BCA 1234567890 a/n THE ARENA';

  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, createBookingWithPayment } = useAuth();

  const { court, sport, slot, slots, date } = (location.state || {}) as {
    court: Court;
    sport: Sport;
    slot: TimeSlot;
    slots?: TimeSlot[];
    date: string;
  };

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!court || !sport || !slot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Data reservasi tidak lengkap</p>
            <Button onClick={() => navigate('/sports')}>Kembali ke Daftar Olahraga</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bookingSlots = slots && slots.length > 0 ? slots : [slot];
  const bookingStartTime = bookingSlots[0].start_time;
  const bookingEndTime = bookingSlots[bookingSlots.length - 1].end_time;
  const bookingDuration = bookingSlots.length;
  const totalPrice = court.price_per_hour * bookingDuration;
  const paymentAmount = paymentMethod === 'cash' ? Math.round(totalPrice * 0.25) : totalPrice;
  const remainingCashPayment = Math.max(totalPrice - paymentAmount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Nama harus diisi';
    }

    if (!customerPhone.trim() || customerPhone.length < 10) {
      newErrors.customerPhone = 'Nomor HP tidak valid';
    }

    if (!proofFile) {
      newErrors.proofFile = 'Bukti pembayaran harus diupload';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const result = await createBookingWithPayment({
        court_id: court.id,
        booking_date: date,
        start_time: bookingStartTime,
        end_time: bookingEndTime,
        customer_name: customerName,
        phone: customerPhone,
        payment_method: paymentMethod,
        amount: paymentAmount,
        proof_file: proofFile,
      });

      setLoading(false);
      navigate('/booking-success', { state: result });
    } catch (error: any) {
      setErrors({
        submit: error?.message || 'Reservasi gagal diproses. Pastikan jadwal masih tersedia.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Form Reservasi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Detail Reservasi</h2>
              </CardHeader>
              <CardContent>
                <div className="mb-6 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">Durasi reservasi bisa ditambah per jam.</p>
                  <p className="text-sm text-muted-foreground">
                    Slot tambahan mengikuti pilihan di halaman jadwal dan dihitung otomatis ke total pembayaran.
                  </p>
                </div>

                <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lapangan</p>
                      <p className="font-medium text-foreground">{court.name} - {sport.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal</p>
                      <p className="font-medium text-foreground">
                        {new Date(date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Waktu</p>
                      <p className="font-medium text-foreground">
                        {bookingStartTime} - {bookingEndTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Durasi</p>
                      <p className="font-medium text-foreground">{bookingDuration} jam</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Nama Lengkap"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    error={errors.customerName}
                    required
                  />
                  <Input
                    label="Nomor HP"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    error={errors.customerPhone}
                    required
                  />

                  <div>
                    <label className="block text-sm mb-2 text-foreground">Metode Pembayaran</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          paymentMethod === 'cash'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Banknote className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-foreground">Tunai</p>
                        <p className="text-xs text-muted-foreground">Bayar DP 25% sekarang, sisanya dibayar di tempat</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('transfer')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          paymentMethod === 'transfer'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-foreground">Transfer</p>
                        <p className="text-xs text-muted-foreground">Wajib transfer 100% sesuai total reservasi</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-foreground">
                      Upload Bukti Pembayaran {paymentMethod === 'cash' ? 'DP' : ''}
                    </label>
                    <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted/20">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {paymentMethod === 'cash'
                          ? 'Metode tunai tetap wajib membayar DP 25% terlebih dahulu.'
                          : 'Metode transfer wajib membayar 100% dari total reservasi.'}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Transfer ke: {BANK_ACCOUNT_INFO}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {paymentMethod === 'cash'
                          ? `Nominal DP yang harus ditransfer: ${formatCurrency(paymentAmount)}. Sisa pembayaran ${formatCurrency(remainingCashPayment)} dibayar saat datang ke lokasi.`
                          : `Nominal transfer penuh yang harus dibayar: ${formatCurrency(paymentAmount)}.`}
                      </p>
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-border bg-background px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                        <Upload className="w-8 h-8 text-primary mb-3" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          Klik untuk upload bukti pembayaran
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Format gambar: JPG, PNG, atau JPEG
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            setProofFile(e.target.files?.[0] || null);
                            setErrors({ ...errors, proofFile: '' });
                          }}
                          className="hidden"
                        />
                      </label>

                      {proofFile && (
                        <div className="mt-3 flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <FileImage className="w-4 h-4 text-success flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {proofFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProofFile(null)}
                            className="ml-3 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                            aria-label="Hapus file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {errors.proofFile && (
                        <p className="text-destructive text-sm mt-1">{errors.proofFile}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Konfirmasi Reservasi'}
                  </Button>
                  {errors.submit && (
                    <p className="text-destructive text-sm">{errors.submit}</p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Ringkasan Harga</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga per jam</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(court.price_per_hour)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durasi</span>
                    <span className="font-medium text-foreground">{bookingDuration} jam</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {paymentMethod === 'cash' ? 'DP Dibayar Sekarang' : 'Dibayar Sekarang'}
                    </span>
                    <span className="font-medium text-foreground">{formatCurrency(paymentAmount)}</span>
                  </div>
                  {paymentMethod === 'cash' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sisa Bayar di Tempat</span>
                      <span className="font-medium text-foreground">{formatCurrency(remainingCashPayment)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
