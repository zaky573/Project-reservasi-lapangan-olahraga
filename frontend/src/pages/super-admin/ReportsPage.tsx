import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../lib/api';
import { formatCurrency, formatDateInputValue } from '../../lib/utils';
import { Calendar, Download, FileText, TrendingUp, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type ReportRow = {
  no: number;
  id_payment: string | number;
  booking_date: string;
  time_slot: string;
  customer_name: string;
  court_name: string;
  sport_name: string;
  total_booking_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
};

type ReportData = {
  generated_at: string;
  total_bookings: number;
  total_booking_amount: number;
  total_paid_amount: number;
  total_remaining_amount: number;
  total_revenue: number;
  status_summary: Record<string, number>;
  sport_summary: Array<{ sport_name: string; total_bookings: number }>;
  rows: ReportRow[];
};

type ApiResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

const today = new Date();
const defaultStartDate = formatDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
const defaultEndDate = formatDateInputValue(new Date(today.getFullYear(), today.getMonth() + 1, 0));

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    dibooking: 'Dipesan',
    sedang_digunakan: 'Sedang Digunakan',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
    menunggu: 'Menunggu',
    pembayaran_awal: 'Pembayaran Awal',
    verifikasi_pembayaran_sisa: 'Verifikasi Pembayaran Sisa',
    lunas: 'Lunas',
  };

  return labels[status] || status || '-';
}

function paymentMethodLabel(method: string) {
  if (method === 'cash') return 'Tunai';
  if (method === 'transfer') return 'Transfer';
  return method || '-';
}

export function ReportsPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<'excel' | 'word' | null>(null);
  const [error, setError] = useState('');
  const dateRangeInvalid = Boolean(startDate && endDate && endDate < startDate);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);

    if (endDate && value && endDate < value) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    if (startDate && value < startDate) {
      setError('Tanggal sampai tidak boleh lebih awal dari tanggal dari.');
      return;
    }

    setEndDate(value);
  };

  const loadReport = async () => {
    if (dateRangeInvalid) {
      setReport(null);
      setError('Tanggal sampai tidak boleh lebih awal dari tanggal dari.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get<ApiResponse<ReportData>>('/reports/bookings', {
        start_date: startDate,
        end_date: endDate,
      });

      setReport(response.data);
    } catch (err: any) {
      setReport(null);
      setError(err?.message || 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dateRangeInvalid) {
      loadReport();
    }
  }, [startDate, endDate]);

  const downloadReport = async (format: 'excel' | 'word') => {
    if (dateRangeInvalid) {
      setError('Tanggal sampai tidak boleh lebih awal dari tanggal dari.');
      return;
    }

    setDownloading(format);
    setError('');

    try {
      const blob = await apiClient.downloadBlob('/reports/bookings', {
        start_date: startDate,
        end_date: endDate,
        export: format,
      });
      const extension = format === 'word' ? 'doc' : 'xls';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rekap-pemesanan-${startDate}-sampai-${endDate}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || `Gagal membuat ${format === 'word' ? 'Word' : 'Excel'}.`);
    } finally {
      setDownloading(null);
    }
  };

  const revenueChartData = useMemo(() => {
    const revenueByDate = (report?.rows || []).reduce((acc, row) => {
      if (!acc[row.booking_date]) {
        acc[row.booking_date] = 0;
      }

      acc[row.booking_date] += Number(row.paid_amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(revenueByDate).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      revenue: amount,
    }));
  }, [report]);

  const bookingsBySport = useMemo(() => {
    return (report?.sport_summary || []).map((item) => ({
      name: item.sport_name,
      bookings: item.total_bookings,
    }));
  }, [report]);

  const averagePerBooking = report && report.total_bookings > 0
    ? report.total_paid_amount / report.total_bookings
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Rekap Data</h1>
        <p className="text-muted-foreground mt-2">Pratinjau rekap pemesanan selesai dan dibatalkan sebelum diunduh sebagai Excel atau Word</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Periode Laporan</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Dari</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Sampai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={startDate || undefined}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadReport} disabled={loading}>
                {loading ? 'Memuat...' : 'Tampilkan Data'}
              </Button>
              <Button variant="primary" onClick={() => downloadReport('excel')} disabled={!report || Boolean(downloading) || dateRangeInvalid}>
                <Download className="w-4 h-4 mr-2" />
                {downloading === 'excel' ? 'Membuat Excel...' : 'Unduh Excel'}
              </Button>
              <Button variant="outline" onClick={() => downloadReport('word')} disabled={!report || Boolean(downloading) || dateRangeInvalid}>
                <FileText className="w-4 h-4 mr-2" />
                {downloading === 'word' ? 'Membuat Word...' : 'Unduh Word'}
              </Button>
            </div>
          </div>
          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Terbayar</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(report?.total_paid_amount || 0)}</p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Pemesanan</p>
                <p className="text-2xl font-bold text-foreground">{report?.total_bookings || 0}</p>
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
                <p className="text-sm text-muted-foreground mb-1">Rata-rata Terbayar</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(averagePerBooking)}</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <MapPin className="w-8 h-8 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-xl font-semibold text-foreground">Pratinjau Data Rekap</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">No</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pelanggan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lapangan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Jam</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total Pemesanan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Terbayar</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sisa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Metode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status Pembayaran</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status Pemesanan</th>
                </tr>
              </thead>
              <tbody>
                {(report?.rows || []).map((row) => (
                  <tr key={`${row.no}-${row.id_payment}`} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 text-muted-foreground">{row.no}</td>
                    <td className="py-3 px-4">{new Date(row.booking_date).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{row.customer_name}</td>
                    <td className="py-3 px-4">{row.court_name}</td>
                    <td className="py-3 px-4">{row.time_slot}</td>
                    <td className="py-3 px-4 text-primary font-medium">{formatCurrency(row.total_booking_amount)}</td>
                    <td className="py-3 px-4 text-primary font-medium">{formatCurrency(row.paid_amount)}</td>
                    <td className="py-3 px-4">{formatCurrency(row.remaining_amount)}</td>
                    <td className="py-3 px-4">{paymentMethodLabel(row.payment_method)}</td>
                    <td className="py-3 px-4">{statusLabel(row.payment_status)}</td>
                    <td className="py-3 px-4">{statusLabel(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && (report?.rows || []).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada data pada periode ini
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Terbayar per Hari</h2>
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
            <h2 className="text-xl font-semibold text-foreground">Pemesanan per Olahraga</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingsBySport}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#85C79A" name="Pemesanan" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
