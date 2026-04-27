<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingPaymentStatusService;
use App\Services\SimplePdfService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly BookingPaymentStatusService $bookingPaymentStatusService,
        private readonly SimplePdfService $simplePdfService
    ) {}

    public function bookings(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'export' => 'nullable|in:json,pdf',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $generatedAt = now();

        $bookings = Booking::with(['court.sport', 'user', 'payment'])
            ->whereBetween('booking_date', [$startDate, $endDate])
            ->get();

        $this->bookingPaymentStatusService->syncCollection($bookings);

        $bookings = Booking::with(['court.sport', 'user', 'payment'])
            ->whereBetween('booking_date', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'cancelled'])
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

        $totalRevenue = $bookings
            ->where('status', 'completed')
            ->sum(function ($booking) {
                return (float) ($booking->payment?->paid_amount ?? 0);
            });

        $statusSummary = [
            'completed' => $bookings->where('status', 'completed')->count(),
            'cancelled' => $bookings->where('status', 'cancelled')->count(),
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

        if ($request->get('export', 'json') === 'pdf') {
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
            'message' => 'Laporan booking berhasil diambil',
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
            'REKAP BOOKING',
            'Periode : '.$startDate.' s/d '.$endDate,
            'Dicetak : '.$generatedAt->format('Y-m-d H:i:s'),
            '',
            $this->tableSeparator(),
            $this->tableHeader(),
            $this->tableSeparator(),
        ];

        if ($rows === []) {
            $currentPage[] = $this->formatPdfEmptyRow('Tidak ada data booking final pada periode ini.');
        } else {
            foreach ($rows as $row) {
                $currentPage[] = $this->formatPdfRow($row);

                if (count($currentPage) >= 45) {
                    $currentPage[] = $this->tableSeparator();
                    $pages[] = $currentPage;
                    $currentPage = [
                        'REKAP BOOKING (lanjutan)',
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
        $currentPage[] = 'Completed : '.$statusSummary['completed'];
        $currentPage[] = 'Cancelled : '.$statusSummary['cancelled'];
        $currentPage[] = 'Total harga booking : Rp '.number_format($totalBookingAmount, 0, ',', '.');
        $currentPage[] = 'Total sudah dibayar : Rp '.number_format($totalPaidAmount, 0, ',', '.');
        $currentPage[] = 'Total belum dibayar : Rp '.number_format($totalRemainingAmount, 0, ',', '.');
        $currentPage[] = 'Total pendapatan booking selesai : Rp '.number_format($totalRevenue, 0, ',', '.');
        $pages[] = $currentPage;

        $pdf = $this->simplePdfService->generateFromLines($pages, 'Rekap Booking');
        $filename = 'rekap-booking-'.$startDate.'-sampai-'.$endDate.'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
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
        return sprintf(
            '| %-3s | %-6s | %-10s | %-13s | %-13s | %-10s | %-8s | %-8s | %-10s | %-10s | %-10s | %-11s | %-10s |',
            'No',
            'ID Pay',
            'Tanggal',
            'Jam',
            'Customer',
            'Lapangan',
            'Sport',
            'Metode',
            'Booking',
            'Dibayar',
            'Sisa',
            'Status Bayar',
            'Status'
        );
    }

    private function tableSeparator(): string
    {
        return '+-----+--------+------------+---------------+---------------+------------+----------+----------+------------+------------+------------+-------------+------------+';
    }

    private function formatPdfRow(array $row): string
    {
        return sprintf(
            '| %-3s | %-6s | %-10s | %-13s | %-13s | %-10s | %-8s | %-8s | %10s | %10s | %10s | %-11s | %-10s |',
            $row['no'],
            $this->fitText((string) $row['id_payment'], 6),
            $this->fitText($row['booking_date'], 10),
            $this->fitText($row['time_slot'], 13),
            $this->fitText($row['customer_name'], 13),
            $this->fitText($row['court_name'], 10),
            $this->fitText($row['sport_name'], 8),
            $this->fitText($row['payment_method'], 8),
            number_format($row['total_booking_amount'], 0, ',', '.'),
            number_format($row['paid_amount'], 0, ',', '.'),
            number_format($row['remaining_amount'], 0, ',', '.'),
            $this->fitText($row['payment_status'], 11),
            $this->fitText($row['status'], 10)
        );
    }

    private function formatPdfEmptyRow(string $message): string
    {
        return sprintf(
            '| %-139s |',
            $this->fitText($message, 139)
        );
    }
}
