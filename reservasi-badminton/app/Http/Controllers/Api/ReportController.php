<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingPaymentStatusService;
use App\Services\SimpleExcelService;
use App\Services\SimplePdfService;
use App\Services\SimpleWordService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly BookingPaymentStatusService $bookingPaymentStatusService,
        private readonly SimpleExcelService $simpleExcelService,
        private readonly SimplePdfService $simplePdfService,
        private readonly SimpleWordService $simpleWordService
    ) {}

    public function bookings(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'export' => 'nullable|in:json,pdf,excel,xls,word,doc',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $generatedAt = now();
        $reportStatuses = [
            BookingPaymentStatusService::BOOKING_SELESAI,
            BookingPaymentStatusService::BOOKING_DIBATALKAN,
        ];

        $bookings = Booking::with(['court.sport', 'user', 'payment'])
            ->whereBetween('booking_date', [$startDate, $endDate])
            ->get();

        $this->bookingPaymentStatusService->syncCollection($bookings);

        $bookings = Booking::with(['court.sport', 'user', 'payment'])
            ->whereBetween('booking_date', [$startDate, $endDate])
            ->whereIn('status', $reportStatuses)
            ->orderBy('booking_date')
            ->orderBy('start_time')
            ->get();

        $rows = $bookings->map(function ($booking, $index) {
            return [
                'no' => $index + 1,
                'id_payment' => $booking->payment?->id ?? '-',
                'booking_date' => Carbon::parse($booking->booking_date)->format('Y-m-d'),
                'time_slot' => Carbon::parse($booking->start_time)->format('H:i').' - '.Carbon::parse($booking->end_time)->format('H:i'),
                'customer_name' => $booking->customer_name,
                'court_name' => $booking->court?->name ?? '-',
                'sport_name' => $booking->court?->sport?->name ?? '-',
                'total_booking_amount' => (float) $booking->total_price,
                'paid_amount' => (float) ($booking->payment?->paid_amount ?? 0),
                'remaining_amount' => (float) ($booking->payment?->remaining_amount ?? 0),
                'payment_method' => $booking->payment?->payment_method ?? '-',
                'payment_status' => $booking->payment?->payment_status ?? '-',
                'status' => $booking->status,
            ];
        })->values();

        $totalBookingAmount = (float) $rows->sum('total_booking_amount');
        $totalPaidAmount = (float) $rows->sum('paid_amount');
        $totalRemainingAmount = (float) $rows->sum('remaining_amount');

        $totalRevenue = $bookings->sum(function ($booking) {
            return (float) ($booking->payment?->paid_amount ?? 0);
        });

        $statusSummary = [
            'selesai' => $bookings->where('status', 'selesai')->count(),
            'dibatalkan' => $bookings->where('status', 'dibatalkan')->count(),
        ];

        $sportSummary = $bookings
            ->groupBy(function ($booking) {
                return optional(optional($booking->court)->sport)->name ?? 'unknown';
            })
            ->map(function ($items, $sportName) {
                return [
                    'sport_name' => $sportName,
                    'total_bookings' => $items->count(),
                ];
            })
            ->values();

        $exportType = $request->get('export', 'json');

        if (in_array($exportType, ['excel', 'xls'], true)) {
            return $this->downloadExcel(
                $startDate,
                $endDate,
                $generatedAt,
                $rows->all(),
                $totalRevenue,
                $statusSummary,
                $totalBookingAmount,
                $totalPaidAmount,
                $totalRemainingAmount
            );
        }

        if (in_array($exportType, ['word', 'doc'], true)) {
            return $this->downloadWord(
                $startDate,
                $endDate,
                $generatedAt,
                $rows->all(),
                $totalRevenue,
                $statusSummary,
                $totalBookingAmount,
                $totalPaidAmount,
                $totalRemainingAmount
            );
        }

        if ($exportType === 'pdf') {
            return $this->downloadPdf(
                $startDate,
                $endDate,
                $generatedAt,
                $rows->all(),
                $totalRevenue,
                $statusSummary,
                $totalBookingAmount,
                $totalPaidAmount,
                $totalRemainingAmount
            );
        }

        return response()->json([
            'status' => true,
                'message' => 'Laporan pemesanan berhasil diambil',
            'data' => [
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'generated_at' => $generatedAt->format('Y-m-d H:i:s'),
                'total_bookings' => $bookings->count(),
                'total_booking_amount' => $totalBookingAmount,
                'total_paid_amount' => $totalPaidAmount,
                'total_remaining_amount' => $totalRemainingAmount,
                'total_revenue' => $totalRevenue,
                'status_summary' => $statusSummary,
                'sport_summary' => $sportSummary,
                'rows' => $rows,
            ],
        ]);
    }

    private function downloadPdf(
        string $startDate,
        string $endDate,
        Carbon $generatedAt,
        array $rows,
        float $totalRevenue,
        array $statusSummary,
        float $totalBookingAmount,
        float $totalPaidAmount,
        float $totalRemainingAmount
    ): Response {
        $pages = [];
        $currentPage = [
            'REKAP PEMESANAN',
            'Periode : '.$startDate.' s/d '.$endDate,
            'Dicetak : '.$generatedAt->format('Y-m-d H:i:s'),
            '',
            $this->tableSeparator(),
            $this->tableHeader(),
            $this->tableSeparator(),
        ];

        if ($rows === []) {
            $currentPage[] = $this->formatPdfEmptyRow('Tidak ada data pemesanan pada periode ini.');
        } else {
            foreach ($rows as $row) {
                $currentPage[] = $this->formatPdfRow($row);

                if (count($currentPage) >= 44) {
                    $currentPage[] = $this->tableSeparator();
                    $pages[] = $currentPage;
                    $currentPage = [
                        'REKAP PEMESANAN (lanjutan)',
                        'Periode : '.$startDate.' s/d '.$endDate,
                        'Dicetak : '.$generatedAt->format('Y-m-d H:i:s'),
                        '',
                        $this->tableSeparator(),
                        $this->tableHeader(),
                        $this->tableSeparator(),
                    ];
                }
            }
        }

        $currentPage[] = $this->tableSeparator();
        $currentPage[] = '';
        $currentPage[] = 'Ringkasan';
        $currentPage[] = 'Selesai : '.$statusSummary['selesai'];
        $currentPage[] = 'Dibatalkan : '.$statusSummary['dibatalkan'];
        $currentPage[] = 'Total harga pemesanan : Rp '.number_format($totalBookingAmount, 0, ',', '.');
        $currentPage[] = 'Total sudah dibayar : Rp '.number_format($totalPaidAmount, 0, ',', '.');
        $currentPage[] = 'Total belum dibayar : Rp '.number_format($totalRemainingAmount, 0, ',', '.');
        $currentPage[] = 'Total pendapatan terbayar : Rp '.number_format($totalRevenue, 0, ',', '.');
        $pages[] = $currentPage;

        $pdf = $this->simplePdfService->generateFromLines($pages, 'Rekap Pemesanan');
        $filename = 'rekap-pemesanan-'.$startDate.'-sampai-'.$endDate.'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    private function downloadExcel(
        string $startDate,
        string $endDate,
        Carbon $generatedAt,
        array $rows,
        float $totalRevenue,
        array $statusSummary,
        float $totalBookingAmount,
        float $totalPaidAmount,
        float $totalRemainingAmount
    ): Response {
        $excelRows = $this->exportRows($rows);

        $excel = $this->simpleExcelService->generateReport(
            'Rekap Pemesanan',
            [
                ['label' => 'Periode', 'value' => $startDate.' s/d '.$endDate],
                ['label' => 'Dicetak', 'value' => $generatedAt->format('Y-m-d H:i:s')],
            ],
            $this->excelColumns(),
            $excelRows,
            [
                ['label' => 'Selesai', 'value' => $statusSummary['selesai'], 'type' => 'Number'],
                ['label' => 'Dibatalkan', 'value' => $statusSummary['dibatalkan'], 'type' => 'Number'],
                ['label' => 'Total harga pemesanan', 'value' => $totalBookingAmount, 'type' => 'Number', 'style' => 'Currency'],
                ['label' => 'Total sudah dibayar', 'value' => $totalPaidAmount, 'type' => 'Number', 'style' => 'Currency'],
                ['label' => 'Total belum dibayar', 'value' => $totalRemainingAmount, 'type' => 'Number', 'style' => 'Currency'],
                ['label' => 'Total pendapatan terbayar', 'value' => $totalRevenue, 'type' => 'Number', 'style' => 'Currency'],
            ]
        );
        $filename = 'rekap-pemesanan-'.$startDate.'-sampai-'.$endDate.'.xls';

        return response($excel, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    private function downloadWord(
        string $startDate,
        string $endDate,
        Carbon $generatedAt,
        array $rows,
        float $totalRevenue,
        array $statusSummary,
        float $totalBookingAmount,
        float $totalPaidAmount,
        float $totalRemainingAmount
    ): Response {
        $word = $this->simpleWordService->generateReport(
            'Rekap Pemesanan',
            [
                ['label' => 'Periode', 'value' => $startDate.' s/d '.$endDate],
                ['label' => 'Dicetak', 'value' => $generatedAt->format('Y-m-d H:i:s')],
            ],
            $this->excelColumns(),
            $this->exportRows($rows),
            [
                ['label' => 'Selesai', 'value' => $statusSummary['selesai'], 'type' => 'Number'],
                ['label' => 'Dibatalkan', 'value' => $statusSummary['dibatalkan'], 'type' => 'Number'],
                ['label' => 'Total harga pemesanan', 'value' => $totalBookingAmount, 'type' => 'Number', 'style' => 'Currency'],
                ['label' => 'Total sudah dibayar', 'value' => $totalPaidAmount, 'type' => 'Number', 'style' => 'Currency'],
                ['label' => 'Total belum dibayar', 'value' => $totalRemainingAmount, 'type' => 'Number', 'style' => 'Currency'],
                ['label' => 'Total pendapatan terbayar', 'value' => $totalRevenue, 'type' => 'Number', 'style' => 'Currency'],
            ]
        );
        $filename = 'rekap-pemesanan-'.$startDate.'-sampai-'.$endDate.'.doc';

        return response($word, 200, [
            'Content-Type' => 'application/msword; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    private function exportRows(array $rows): array
    {
        return array_map(function (array $row) {
            return [
                'no' => $row['no'],
                'id_payment' => $row['id_payment'],
                'booking_date' => $row['booking_date'],
                'time_slot' => $row['time_slot'],
                'customer_name' => $row['customer_name'],
                'court_name' => $row['court_name'],
                'sport_name' => $row['sport_name'],
                'payment_method' => $this->paymentMethodLabel($row['payment_method']),
                'total_booking_amount' => $row['total_booking_amount'],
                'paid_amount' => $row['paid_amount'],
                'remaining_amount' => $row['remaining_amount'],
                'payment_status' => $this->paymentStatusLabel($row['payment_status']),
                'status' => $this->bookingStatusLabel($row['status']),
            ];
        }, $rows);
    }

    private function fitText(string $value, int $length): string
    {
        if (strlen($value) <= $length) {
            return $value;
        }

        return substr($value, 0, max($length - 1, 1)).'.';
    }

    private function tableHeader(): string
    {
        return $this->formatPdfCells(array_column($this->tableColumns(), 'heading'));
    }

    private function tableSeparator(): string
    {
        $parts = array_map(
            fn (array $column) => str_repeat('-', $column['width'] + 2),
            $this->tableColumns()
        );

        return '+'.implode('+', $parts).'+';
    }

    private function formatPdfRow(array $row): string
    {
        return $this->formatPdfCells(
            [
                $row['no'],
                $row['booking_date'],
                $row['time_slot'],
                $row['customer_name'],
                $row['court_name'],
                $row['sport_name'],
                $this->paymentMethodLabel($row['payment_method']),
                number_format($row['total_booking_amount'], 0, ',', '.'),
                number_format($row['paid_amount'], 0, ',', '.'),
                number_format($row['remaining_amount'], 0, ',', '.'),
                $this->paymentStatusLabel($row['payment_status']),
                $this->bookingStatusLabel($row['status']),
            ],
            ['total_booking_amount', 'paid_amount', 'remaining_amount']
        );
    }

    private function formatPdfCells(array $values, array $rightAlignedKeys = []): string
    {
        $segments = [];

        foreach ($this->tableColumns() as $index => $column) {
            $value = $this->fitText((string) ($values[$index] ?? ''), $column['width']);
            $shouldAlignRight = in_array($column['key'], $rightAlignedKeys, true) || ($column['align'] ?? 'left') === 'right';

            $segments[] = ' '.str_pad(
                $value,
                $column['width'],
                ' ',
                $shouldAlignRight ? STR_PAD_LEFT : STR_PAD_RIGHT
            ).' ';
        }

        return '|'.implode('|', $segments).'|';
    }

    private function tableColumns(): array
    {
        return [
            ['key' => 'no', 'heading' => 'No', 'width' => 3],
            ['key' => 'booking_date', 'heading' => 'Tanggal', 'width' => 10],
            ['key' => 'time_slot', 'heading' => 'Jam', 'width' => 13],
            ['key' => 'customer_name', 'heading' => 'Pelanggan', 'width' => 12],
            ['key' => 'court_name', 'heading' => 'Lapangan', 'width' => 10],
            ['key' => 'sport_name', 'heading' => 'Olahraga', 'width' => 9],
            ['key' => 'payment_method', 'heading' => 'Metode', 'width' => 8],
            ['key' => 'total_booking_amount', 'heading' => 'Total', 'width' => 10, 'align' => 'right'],
            ['key' => 'paid_amount', 'heading' => 'Dibayar', 'width' => 10, 'align' => 'right'],
            ['key' => 'remaining_amount', 'heading' => 'Sisa', 'width' => 10, 'align' => 'right'],
            ['key' => 'payment_status', 'heading' => 'Status Pembayaran', 'width' => 18],
            ['key' => 'status', 'heading' => 'Status Pemesanan', 'width' => 16],
        ];
    }

    private function excelColumns(): array
    {
        return [
            ['key' => 'no', 'heading' => 'No', 'type' => 'Number', 'width' => 45],
            ['key' => 'id_payment', 'heading' => 'ID Pembayaran', 'type' => 'String', 'width' => 90],
            ['key' => 'booking_date', 'heading' => 'Tanggal', 'type' => 'String', 'width' => 90],
            ['key' => 'time_slot', 'heading' => 'Jam', 'type' => 'String', 'width' => 100],
            ['key' => 'customer_name', 'heading' => 'Pelanggan', 'type' => 'String', 'width' => 150],
            ['key' => 'court_name', 'heading' => 'Lapangan', 'type' => 'String', 'width' => 150],
            ['key' => 'sport_name', 'heading' => 'Olahraga', 'type' => 'String', 'width' => 120],
            ['key' => 'payment_method', 'heading' => 'Metode Pembayaran', 'type' => 'String', 'width' => 130],
            ['key' => 'total_booking_amount', 'heading' => 'Total Pemesanan', 'type' => 'Number', 'style' => 'Currency', 'width' => 130],
            ['key' => 'paid_amount', 'heading' => 'Sudah Dibayar', 'type' => 'Number', 'style' => 'Currency', 'width' => 120],
            ['key' => 'remaining_amount', 'heading' => 'Sisa Pembayaran', 'type' => 'Number', 'style' => 'Currency', 'width' => 130],
            ['key' => 'payment_status', 'heading' => 'Status Pembayaran', 'type' => 'String', 'width' => 210],
            ['key' => 'status', 'heading' => 'Status Pemesanan', 'type' => 'String', 'width' => 160],
        ];
    }

    private function paymentMethodLabel(?string $method): string
    {
        return match ($method) {
            'cash' => 'Tunai',
            'transfer' => 'Transfer',
            default => $method ?: '-',
        };
    }

    private function paymentStatusLabel(?string $status): string
    {
        return match ($status) {
            'menunggu' => 'Menunggu',
            'pembayaran_awal' => 'Pembayaran Awal',
            'verifikasi_pembayaran_sisa' => 'Verif. Bayar Sisa',
            'lunas' => 'Lunas',
            default => $status ? ucwords(str_replace('_', ' ', $status)) : '-',
        };
    }

    private function bookingStatusLabel(?string $status): string
    {
        return match ($status) {
            'dibooking' => 'Dipesan',
            'sedang_digunakan' => 'Sedang Digunakan',
            'selesai' => 'Selesai',
            'dibatalkan' => 'Dibatalkan',
            default => $status ? ucwords(str_replace('_', ' ', $status)) : '-',
        };
    }

    private function formatPdfEmptyRow(string $message): string
    {
        return sprintf(
            '| %-'.(strlen($this->tableSeparator()) - 4).'s |',
            $this->fitText($message, strlen($this->tableSeparator()) - 4)
        );
    }
}
