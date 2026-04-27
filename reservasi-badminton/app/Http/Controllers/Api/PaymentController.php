<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingPaymentStatusService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function __construct(
        private readonly BookingPaymentStatusService $bookingPaymentStatusService
    ) {}

    public function uploadProof(Request $request, $bookingId)
    {
        $request->validate([
            'proof_file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $booking = Booking::with('payment')->find($bookingId);

        if (! $booking || ! $booking->payment) {
            return response()->json([
                'status' => false,
                'message' => 'Payment tidak ditemukan',
            ], 404);
        }

        if ($booking->user_id !== $request->user()->id) {
            return response()->json([
                'status' => false,
                'message' => 'Tidak punya akses',
            ], 403);
        }

        $payment = $booking->payment;
        $path = $request->file('proof_file')->store('payment_proofs', 'public');

        $payment->update([
            'proof_file' => $path,
        ]);

        $booking = $this->bookingPaymentStatusService->syncBooking($booking->fresh(['payment']));

        return response()->json([
            'status' => true,
            'message' => 'Bukti pembayaran berhasil diupload',
            'data' => $this->formatPayment($booking->payment->load('booking')),
        ]);
    }

    public function index()
    {
        $payments = Payment::with(['booking.court.sport', 'booking.user'])
            ->latest()
            ->get();

        $this->bookingPaymentStatusService->syncCollection($payments->pluck('booking')->filter());

        $payments = Payment::with(['booking.court.sport', 'booking.user'])
            ->latest()
            ->get()
            ->map(function ($payment) {
                return [
                    'id_payment' => $payment->id,
                    'total_amount' => $payment->amount,
                    'paid_amount' => $payment->paid_amount,
                    'remaining_amount' => $payment->remaining_amount,
                    'payment_method' => $payment->payment_method,
                    'payment_breakdown' => $this->buildPaymentBreakdown($payment),
                    'proof_file' => $payment->proof_file,
                    'payment_status' => $payment->payment_status,
                    'paid_at' => $payment->paid_at,
                    'booking' => $payment->booking ? [
                        'id_booking' => $payment->booking->id,
                        'booking_date' => $payment->booking->booking_date,
                        'start_time' => Carbon::parse($payment->booking->start_time)->format('H:i'),
                        'end_time' => Carbon::parse($payment->booking->end_time)->format('H:i'),
                        'customer_name' => $payment->booking->customer_name,
                        'phone' => $payment->booking->phone,
                        'court' => $payment->booking->court ? [
                            'id_court' => $payment->booking->court->id,
                            'name' => $payment->booking->court->name,
                            'sport' => $payment->booking->court->sport ? [
                                'id_sport' => $payment->booking->court->sport->id,
                                'name' => $payment->booking->court->sport->name,
                            ] : null,
                        ] : null,
                        'user' => $payment->booking->user ? [
                            'id_user' => $payment->booking->user->id,
                            'name' => $payment->booking->user->name,
                            'email' => $payment->booking->user->email,
                        ] : null,
                    ] : null,
                    'created_at' => $payment->created_at,
                    'updated_at' => $payment->updated_at,
                ];
            });

        return response()->json([
            'status' => true,
            'message' => 'Daftar pembayaran',
            'data' => $payments,
        ]);
    }

    public function verify(Request $request, $id)
    {
        $request->validate([
            'payment_status' => 'nullable|in:menunggu,dibayar_sebagian,lunas,sedang_digunakan,ditolak',
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        $payment = Payment::with('booking')->find($id);

        if (! $payment) {
            return response()->json([
                'status' => false,
                'message' => 'Payment tidak ditemukan',
            ], 404);
        }

        if (
            $request->payment_status === 'dibayar_sebagian'
            && $payment->payment_method === 'transfer'
            && $request->paid_amount === null
        ) {
            throw ValidationException::withMessages([
                'paid_amount' => ['Nominal pembayaran wajib diisi untuk transfer yang dibayar sebagian.'],
            ]);
        }

        $resolvedPaidAmount = $this->bookingPaymentStatusService->resolvePaidAmountForUpdate(
            $payment,
            $request->payment_status,
            $request->paid_amount !== null ? (float) $request->paid_amount : null
        );

        $amounts = $this->bookingPaymentStatusService->normalizeAmounts($payment, $resolvedPaidAmount);
        $paymentStatus = $this->bookingPaymentStatusService->resolveStatusForUpdate(
            $payment,
            $request->payment_status,
            $resolvedPaidAmount
        );

        $updateData = array_merge($amounts, [
            'payment_status' => $paymentStatus,
            'paid_at' => in_array($paymentStatus, ['lunas', 'sedang_digunakan'], true) ? now() : null,
        ]);

        $payment->update($updateData);
        $booking = $this->bookingPaymentStatusService->syncBooking($payment->booking->fresh(['payment']));

        return response()->json([
            'status' => true,
            'message' => 'Payment berhasil diverifikasi',
            'data' => $this->formatPayment($booking->payment->load('booking')),
        ]);
    }

    public function store(Request $request, $bookingId)
    {
        $request->validate([
            'payment_method' => 'required|in:transfer,cash',
        ]);

        $booking = Booking::with('payment')->find($bookingId);

        if (! $booking) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak ditemukan',
            ], 404);
        }

        if ($booking->user_id !== $request->user()->id) {
            return response()->json([
                'status' => false,
                'message' => 'Tidak punya akses ke booking ini',
            ], 403);
        }

        if ($booking->payment) {
            return response()->json([
                'status' => false,
                'message' => 'Payment sudah dibuat',
            ], 422);
        }

        if (in_array($booking->status, ['cancelled', 'completed'], true)) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak bisa dibayar',
            ], 422);
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'amount' => $booking->total_price,
            'paid_amount' => 0,
            'remaining_amount' => $booking->total_price,
            'payment_method' => $request->payment_method,
            'payment_status' => 'menunggu',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Metode pembayaran berhasil dipilih',
            'data' => $this->formatPayment($payment->load('booking')),
        ]);
    }

    private function formatPayment($payment)
    {
        return [
            'id_payment' => $payment->id,
            'total_amount' => $payment->amount,
            'paid_amount' => $payment->paid_amount,
            'remaining_amount' => $payment->remaining_amount,
            'payment_method' => $payment->payment_method,
            'payment_breakdown' => $this->buildPaymentBreakdown($payment),
            'proof_file' => $payment->proof_file,
            'payment_status' => $payment->payment_status,
            'paid_at' => $payment->paid_at,
            'booking' => $payment->booking ? [
                'id_booking' => $payment->booking->id,
                'booking_date' => $payment->booking->booking_date,
                'start_time' => Carbon::parse($payment->booking->start_time)->format('H:i'),
                'end_time' => Carbon::parse($payment->booking->end_time)->format('H:i'),
                'customer_name' => $payment->booking->customer_name,
                'phone' => $payment->booking->phone,
                'status' => $payment->booking->status,
            ] : null,
            'created_at' => $payment->created_at,
            'updated_at' => $payment->updated_at,
        ];
    }

    public function preview($bookingId)
    {
        $booking = Booking::with('payment')->find($bookingId);

        if (! $booking) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak ditemukan',
            ], 404);
        }

        $booking = $this->bookingPaymentStatusService->syncBooking($booking);

        $total = $booking->total_price;
        $dp = $total * 0.25;
        $remaining = $total - $dp;

        return response()->json([
            'status' => true,
            'message' => 'Preview pembayaran',
            'data' => [
                'booking_id' => $booking->id,
                'total_price' => $total,
                'paid_amount' => $booking->payment?->paid_amount ?? 0,
                'remaining_amount' => $booking->payment?->remaining_amount ?? $total,
                'payment_options' => [
                    'transfer' => [
                        'label' => 'Bayar penuh atau bertahap (Transfer)',
                        'amount' => $total,
                        'percentage' => '100%',
                    ],
                    'cash' => [
                        'label' => 'Bayar DP 25% (Cash)',
                        'dp_amount' => $dp,
                        'dp_percentage' => '25%',
                        'remaining_amount' => $remaining,
                        'remaining_percentage' => '75%',
                    ],
                ],
            ],
        ]);
    }

    private function buildPaymentBreakdown(Payment $payment): array
    {
        $totalAmount = (float) $payment->amount;

        if ($payment->payment_method === 'cash') {
            $dpAmount = round($totalAmount * 0.25, 2);
            $remainingAfterDp = max($totalAmount - $dpAmount, 0);

            return [
                'total_amount' => $totalAmount,
                'dp_amount' => $dpAmount,
                'dp_percentage' => '25%',
                'remaining_after_dp' => $remainingAfterDp,
                'remaining_percentage' => '75%',
                'note' => 'Cash membayar DP 25% terlebih dahulu, sisanya dibayar di lokasi.',
            ];
        }

        return [
            'total_amount' => $totalAmount,
            'full_payment_amount' => $totalAmount,
            'full_payment_percentage' => '100%',
            'note' => 'Transfer dibayar penuh atau bertahap sampai lunas.',
        ];
    }
}
