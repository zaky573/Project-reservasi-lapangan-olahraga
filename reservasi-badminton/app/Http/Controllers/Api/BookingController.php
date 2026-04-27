<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Services\BookingPaymentStatusService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingPaymentStatusService $bookingPaymentStatusService
    ) {}

    // POST /api/bookings
    public function store(Request $request)
    {
        $validated = $request->validate([
            'court_id' => 'required|exists:courts,id',
            'booking_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'customer_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'notes' => 'nullable|string',
        ]);

        $court = Court::with('sport')->find($validated['court_id']);

        if (! $court) {
            return response()->json([
                'status' => false,
                'message' => 'Lapangan tidak ditemukan',
            ], 404);
        }

        if ($court->status === 'maintenance') {
            return response()->json([
                'status' => false,
                'message' => 'Lapangan sedang maintenance',
            ], 422);
        }

        if ($court->status === 'inactive') {
            return response()->json([
                'status' => false,
                'message' => 'Lapangan sedang tidak aktif',
            ], 422);
        }

        $start = Carbon::createFromFormat('H:i', $validated['start_time']);
        $end = Carbon::createFromFormat('H:i', $validated['end_time']);

        // Jam harus tepat di awal slot
        if ($start->format('i') !== '00' || $end->format('i') !== '00') {
            return response()->json([
                'status' => false,
                'message' => 'Jam booking harus kelipatan 1 jam, misalnya 10:00-12:00',
            ], 422);
        }

        // Durasi harus minimal 1 jam dan kelipatan 1 jam
        $durationInMinutes = $start->diffInMinutes($end);

        if ($durationInMinutes < 60 || $durationInMinutes % 60 !== 0) {
            return response()->json([
                'status' => false,
                'message' => 'Durasi booking harus minimal 1 jam dan kelipatan 1 jam',
            ], 422);
        }

        // Jam operasional 08:00 - 22:00
        $openTime = Carbon::createFromFormat('H:i', '08:00');
        $closeTime = Carbon::createFromFormat('H:i', '22:00');

        if ($start->lt($openTime) || $end->gt($closeTime)) {

            return response()->json([
                'status' => false,
                'message' => 'Booking hanya bisa antara jam 08:00 sampai 22:00',
            ], 422);
        }

        // 🚫 Tidak boleh booking di waktu yang sudah lewat (khusus hari ini)
        $bookingDate = Carbon::parse($validated['booking_date'])->toDateString();
        $today = Carbon::now()->toDateString();

        if ($bookingDate === $today) {
            $now = Carbon::now();

            // samakan format ke jam:menit
            $currentTime = Carbon::createFromFormat('H:i', $now->format('H:i'));

            // jika start_time <= sekarang → tolak
            if ($start->lte($currentTime)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tidak bisa booking di jam yang sudah lewat atau sedang berlangsung',
                ], 422);
            }
        }

        $totalHours = $durationInMinutes / 60;
        $totalPrice = $court->price_per_hour * $totalHours;

        // Cek bentrok slot
        $conflict = Booking::where('court_id', $validated['court_id'])
            ->where('booking_date', $validated['booking_date'])
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($validated) {
                $query->where('start_time', '<', $validated['end_time'])
                    ->where('end_time', '>', $validated['start_time']);
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'status' => false,
                'message' => 'Slot sudah dibooking',
            ], 409);
        }

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'court_id' => $validated['court_id'],
            'booking_date' => $validated['booking_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'total_hours' => $totalHours,
            'customer_name' => $validated['customer_name'],
            'phone' => $validated['phone'],
            'total_price' => $totalPrice,
            'status' => 'dibooking',
            'notes' => $validated['notes'] ?? null,
        ]);

        $booking->load(['court.sport', 'user']);

        return response()->json([
            'status' => true,
            'message' => 'Booking berhasil dibuat',
            'data' => $this->formatBooking($booking),
        ], 201);
    }

    private function formatBooking($booking)
    {
        return [
            'id_booking' => $booking->id,
            'booking_date' => $booking->booking_date,
            'start_time' => Carbon::parse($booking->start_time)->format('H:i'),
            'end_time' => Carbon::parse($booking->end_time)->format('H:i'),
            'customer_name' => $booking->customer_name,
            'phone' => $booking->phone,
            'notes' => $booking->notes,
            'total_price' => $booking->total_price,
            'status' => $booking->status,
            'booking_summary' => [
                'slot_label' => Carbon::parse($booking->start_time)->format('H:i').' - '.Carbon::parse($booking->end_time)->format('H:i'),
                'date' => $booking->booking_date,
                'price' => $booking->total_price,
            ],
            'selected_slot' => [
                'slot_id' => Carbon::parse($booking->start_time)->format('H:i').'_'.Carbon::parse($booking->end_time)->format('H:i'),
                'slot_label' => Carbon::parse($booking->start_time)->format('H:i').' - '.Carbon::parse($booking->end_time)->format('H:i'),
                'start_time' => Carbon::parse($booking->start_time)->format('H:i'),
                'end_time' => Carbon::parse($booking->end_time)->format('H:i'),
            ],
            'court' => $booking->court ? [
                'id_court' => $booking->court->id,
                'name' => $booking->court->name,
                'code' => $booking->court->code,
                'status' => $booking->court->status,
                'sport' => $booking->court->sport ? [
                    'id_sport' => $booking->court->sport->id,
                    'name' => $booking->court->sport->name,
                ] : null,
            ] : null,
            'user' => $booking->user ? [
                'id_user' => $booking->user->id,
                'name' => $booking->user->name,
                'email' => $booking->user->email,
                'phone' => $booking->user->phone,
            ] : null,
            'payment' => $booking->payment ? [
                'id_payment' => $booking->payment->id,
                'payment_method' => $booking->payment->payment_method,
                'payment_status' => $booking->payment->payment_status,
                'total_amount' => $booking->payment->amount,
                'paid_amount' => $booking->payment->paid_amount,
                'remaining_amount' => $booking->payment->remaining_amount,
                'remaining_notice' => $this->buildRemainingNotice($booking->payment),
                'paid_at' => $booking->payment->paid_at,
                'payment_details' => $booking->payment->details
                    ->sortByDesc('created_at')
                    ->values()
                    ->map(fn ($detail) => $this->formatPaymentDetail($detail)),
            ] : null,
            'created_at' => $booking->created_at,
            'updated_at' => $booking->updated_at,
        ];
    }

    private function formatPaymentDetail($detail)
    {
        return [
            'id_payment_detail' => $detail->id,
            'amount' => $detail->amount,
            'verified_amount' => $detail->verified_amount,
            'payment_method' => $detail->payment_method,
            'proof_file' => $detail->proof_file,
            'status' => $detail->status,
            'notes' => $detail->notes,
            'verified_by' => $detail->verifiedBy ? [
                'id_user' => $detail->verifiedBy->id,
                'name' => $detail->verifiedBy->name,
                'email' => $detail->verifiedBy->email,
            ] : null,
            'verified_at' => $detail->verified_at,
            'created_at' => $detail->created_at,
            'updated_at' => $detail->updated_at,
        ];
    }

    private function buildRemainingNotice($payment): ?string
    {
        if ((float) $payment->remaining_amount <= 0 || (float) $payment->paid_amount <= 0) {
            return null;
        }

        return 'Pembayaran kurang Rp '.number_format((float) $payment->remaining_amount, 0, ',', '.');
    }

    // GET /api/my-bookings
    public function myBookings(Request $request)
    {
        $bookings = Booking::with(['court.sport', 'user', 'payment.details.verifiedBy'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        $this->bookingPaymentStatusService->syncCollection($bookings);

        $bookings = Booking::with(['court.sport', 'user', 'payment.details.verifiedBy'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function ($booking) {
                return $this->formatBooking($booking);
            });

        return response()->json([
            'status' => true,
            'message' => 'Riwayat booking berhasil diambil',
            'data' => $bookings,
        ]);
    }

    // GET /api/bookings (admin)
    public function index(Request $request)
    {
        $query = Booking::with(['court.sport', 'user']);

        if ($request->filled('booking_date')) {
            $query->where('booking_date', $request->booking_date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('court_id')) {
            $query->where('court_id', $request->court_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%');
            });
        }

        // ganti paginate -> get
        $bookings = $query->latest()->get();
        $this->bookingPaymentStatusService->syncCollection($bookings);

        $bookings = $query->with('payment.details.verifiedBy')->latest()->get();

        $data = $bookings->map(function ($booking) {
            return $this->formatBooking($booking);
        });

        return response()->json([
            'status' => true,
            'message' => 'Daftar semua booking',
            'data' => $data,
        ]);
    }

    // GET /api/bookings/{id} (admin)
    public function show($id)
    {
        $booking = Booking::with(['court.sport', 'user', 'payment.details.verifiedBy'])->find($id);

        if (! $booking) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak ditemukan',
            ], 404);
        }

        $booking = $this->bookingPaymentStatusService->syncBooking($booking)->load(['court.sport', 'user', 'payment.details.verifiedBy']);

        return response()->json([
            'status' => true,
            'message' => 'Detail booking berhasil diambil',
            'data' => $this->formatBooking($booking),
        ]);
    }

    // PUT /api/bookings/{id} (admin)
    public function update(Request $request, $id)
    {
        $booking = Booking::with(['court.sport', 'user'])->find($id);

        if (! $booking) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:dibooking,in_use,completed,cancelled',

        ]);

        $booking->update([
            'status' => $validated['status'],
        ]);

        $booking->load(['court.sport', 'user']);

        return response()->json([
            'status' => true,
            'message' => 'Status booking berhasil diupdate',
            'data' => $this->formatBooking($booking),
        ]);
    }

    // DELETE /api/bookings/{id} (admin)
    public function destroy($id)
    {
        $booking = Booking::find($id);

        if (! $booking) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak ditemukan',
            ], 404);
        }

        $booking->delete();

        return response()->json([
            'status' => true,
            'message' => 'Booking berhasil dihapus',
        ]);
    }
}
