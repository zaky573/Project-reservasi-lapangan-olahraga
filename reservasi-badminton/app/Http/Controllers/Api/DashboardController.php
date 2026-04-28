<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\Sport;
use App\Models\User;
use App\Services\BookingPaymentStatusService;

class DashboardController extends Controller
{
    public function __construct(
        private readonly BookingPaymentStatusService $bookingPaymentStatusService
    ) {}

    public function index()
    {
        $today = now()->toDateString();
        $bookings = Booking::with('payment')->get();

        $this->bookingPaymentStatusService->syncCollection($bookings);

        $data = [
            'summary' => [
                'total_users' => User::where('role', 'user')->count(),
                'total_admins' => User::where('role', 'admin')->count(),
                'total_super_admins' => User::where('role', 'super_admin')->count(),
                'total_sports' => Sport::count(),
                'total_courts' => Court::count(),
            ],

            'bookings' => [
                'today' => Booking::where('booking_date', $today)->count(),
                'dibooking' => Booking::where('status', 'dibooking')->count(),
                'sedang_digunakan' => Booking::where('status', 'sedang_digunakan')->count(),
                'selesai' => Booking::where('status', 'selesai')->count(),
                'dibatalkan' => Booking::where('status', 'dibatalkan')->count(),
            ],

            'payments' => [
                'menunggu' => Payment::where('payment_status', 'menunggu')->count(),
                'pembayaran_awal' => Payment::where('payment_status', 'pembayaran_awal')->count(),
                'verifikasi_pembayaran_sisa' => Payment::where('payment_status', 'verifikasi_pembayaran_sisa')->count(),
                'lunas' => Payment::where('payment_status', 'lunas')->count(),
            ],

            'sports_breakdown' => Sport::withCount('courts')->get()->map(function ($sport) {
                return [
                    'id_sport' => $sport->id,
                    'name' => $sport->name,
                    'total_courts' => $sport->courts_count,
                ];
            }),
        ];

        return response()->json([
            'status' => true,
            'message' => 'Ringkasan dashboard berhasil diambil',
            'data' => $data,
        ]);
    }
}
