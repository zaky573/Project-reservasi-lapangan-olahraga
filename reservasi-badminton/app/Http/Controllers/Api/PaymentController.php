<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentDetail;
use App\Services\BookingPaymentStatusService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function __construct(
        private readonly BookingPaymentStatusService $bookingPaymentStatusService
    ) {}

    public function uploadProof(Request $request, $bookingId)
    {
        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0.01',
            'notes' => 'nullable|string',
            'proof_file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $booking = Booking::with('payment.details')->find($bookingId);

        if (! $booking) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak ditemukan',
            ], 404);
        }

        if ($booking->user_id !== $request->user()->id) {
            return response()->json([
                'status' => false,
                'message' => 'Tidak punya akses',
            ], 403);
        }

        $this->ensureBookingCanBePaid($booking);

        $payment = $this->resolvePaymentForBooking($booking, 'transfer');
        $remainingAmount = (float) $payment->remaining_amount;

        if ($remainingAmount <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'Pembayaran sudah lunas',
            ], 422);
        }

        $submittedAmount = (float) ($validated['amount'] ?? $remainingAmount);
        $this->ensureSubmittedAmountWithinRemaining($submittedAmount, $remainingAmount);

        $path = $request->file('proof_file')->store('payment_proofs', 'public');

        $payment->details()->create([
            'amount' => $submittedAmount,
            'verified_amount' => 0,
            'payment_method' => 'transfer',
            'proof_file' => $path,
            'status' => 'menunggu',
            'notes' => $validated['notes'] ?? null,
        ]);

        $payment->update([
            'proof_file' => $path,
        ]);

        $payment = $this->recalculatePaymentFromDetails($payment->fresh(['booking', 'details']));

        return response()->json([
            'status' => true,
            'message' => 'Bukti pembayaran berhasil diupload dan menunggu verifikasi admin',
            'data' => $this->formatPayment($payment),
        ]);
    }

    public function storeDetail(Request $request, $bookingId)
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:transfer,cash',
            'amount' => 'required|numeric|min:0.01',
            'proof_file' => 'required_if:payment_method,transfer|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'notes' => 'nullable|string',
        ]);

        $booking = Booking::with('payment.details')->find($bookingId);

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

        $this->ensureBookingCanBePaid($booking);

        $payment = $this->resolvePaymentForBooking($booking, $validated['payment_method']);
        $remainingAmount = (float) $payment->remaining_amount;

        if ($remainingAmount <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'Pembayaran sudah lunas',
            ], 422);
        }

        $submittedAmount = (float) $validated['amount'];
        $this->ensureSubmittedAmountWithinRemaining($submittedAmount, $remainingAmount);

        $proofPath = null;

        if ($request->hasFile('proof_file')) {
            $proofPath = $request->file('proof_file')->store('payment_proofs', 'public');
        }

        $payment->details()->create([
            'amount' => $submittedAmount,
            'verified_amount' => 0,
            'payment_method' => $validated['payment_method'],
            'proof_file' => $proofPath,
            'status' => 'menunggu',
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($proofPath) {
            $payment->update([
                'proof_file' => $proofPath,
            ]);
        }

        $payment = $this->recalculatePaymentFromDetails($payment->fresh(['booking', 'details']));

        return response()->json([
            'status' => true,
            'message' => $validated['payment_method'] === 'cash'
                ? 'Pengajuan pembayaran cash berhasil dicatat dan menunggu konfirmasi admin'
                : 'Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin',
            'data' => $this->formatPayment($payment),
        ], 201);
    }

    public function details(Request $request, $bookingId)
    {
        $booking = Booking::with(['payment.details.verifiedBy'])->find($bookingId);

        if (! $booking) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak ditemukan',
            ], 404);
        }

        if (! $this->canAccessBooking($request, $booking)) {
            return response()->json([
                'status' => false,
                'message' => 'Tidak punya akses ke booking ini',
            ], 403);
        }

        return response()->json([
            'status' => true,
            'message' => 'Riwayat detail pembayaran berhasil diambil',
            'data' => $booking->payment
                ? $booking->payment->details->sortByDesc('created_at')->values()->map(fn ($detail) => $this->formatPaymentDetail($detail))
                : [],
        ]);
    }

    public function index()
    {
        $payments = Payment::with(['booking.court.sport', 'booking.user', 'details.verifiedBy'])
            ->latest()
            ->get();

        $this->bookingPaymentStatusService->syncCollection($payments->pluck('booking')->filter());

        $payments = Payment::with(['booking.court.sport', 'booking.user', 'details.verifiedBy'])
            ->latest()
            ->get()
            ->map(function ($payment) {
                return $this->formatPayment($payment, true);
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
            'notes' => 'nullable|string',
        ]);

        $payment = Payment::with(['booking', 'details'])->find($id);

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

        $payment = DB::transaction(function () use ($payment, $request) {
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

            $payment->update(array_merge($amounts, [
                'payment_status' => $paymentStatus,
                'paid_at' => in_array($paymentStatus, ['lunas', 'sedang_digunakan'], true) ? now() : null,
            ]));

            $this->syncLatestDetailFromPaymentVerification(
                $payment->fresh(['details']),
                $request,
                $resolvedPaidAmount,
                $paymentStatus
            );

            if ($payment->details()->exists()) {
                return $this->recalculatePaymentFromDetails($payment->fresh(['booking', 'details']));
            }

            $booking = $this->bookingPaymentStatusService->syncBooking($payment->booking->fresh(['payment']));

            return $booking->payment->load(['booking', 'details.verifiedBy']);
        });

        return response()->json([
            'status' => true,
            'message' => 'Payment berhasil diverifikasi',
            'data' => $this->formatPayment($payment),
        ]);
    }

    public function verifyDetail(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:diterima,ditolak',
            'verified_amount' => 'nullable|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        $detail = PaymentDetail::with(['payment.booking', 'payment.details'])->find($id);

        if (! $detail) {
            return response()->json([
                'status' => false,
                'message' => 'Detail pembayaran tidak ditemukan',
            ], 404);
        }

        $payment = DB::transaction(function () use ($detail, $request, $validated) {
            $verifiedAmount = 0;

            if ($validated['status'] === 'diterima') {
                $verifiedAmount = (float) ($validated['verified_amount'] ?? $detail->amount);
                $acceptedAmountExceptThisDetail = (float) $detail->payment
                    ->details()
                    ->where('status', 'diterima')
                    ->where('id', '!=', $detail->id)
                    ->sum('verified_amount');
                $maxVerifiableAmount = max((float) $detail->payment->amount - $acceptedAmountExceptThisDetail, 0);

                if ($verifiedAmount > $maxVerifiableAmount) {
                    throw ValidationException::withMessages([
                        'verified_amount' => ['Nominal verifikasi melebihi sisa pembayaran.'],
                    ]);
                }
            }

            $detail->update([
                'status' => $validated['status'],
                'verified_amount' => $verifiedAmount,
                'notes' => $validated['notes'] ?? $detail->notes,
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
            ]);

            return $this->recalculatePaymentFromDetails($detail->payment->fresh(['booking', 'details']));
        });

        return response()->json([
            'status' => true,
            'message' => 'Detail pembayaran berhasil diverifikasi',
            'data' => $this->formatPayment($payment),
        ]);
    }

    public function storeCashPayment(Request $request, $bookingId)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        $booking = Booking::with('payment.details')->find($bookingId);

        if (! $booking) {
            return response()->json([
                'status' => false,
                'message' => 'Booking tidak ditemukan',
            ], 404);
        }

        $this->ensureBookingCanBePaid($booking);

        $payment = DB::transaction(function () use ($booking, $request, $validated) {
            $payment = $this->resolvePaymentForBooking($booking, 'cash');
            $cashAmount = (float) $validated['amount'];
            $remainingAmount = (float) $payment->remaining_amount;

            $this->ensureSubmittedAmountWithinRemaining($cashAmount, $remainingAmount);

            $payment->details()->create([
                'amount' => $cashAmount,
                'verified_amount' => $cashAmount,
                'payment_method' => 'cash',
                'status' => 'diterima',
                'notes' => $validated['notes'] ?? 'Pembayaran cash di lapangan',
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
            ]);

            return $this->recalculatePaymentFromDetails($payment->fresh(['booking', 'details']));
        });

        return response()->json([
            'status' => true,
            'message' => 'Pembayaran cash berhasil dicatat',
            'data' => $this->formatPayment($payment),
        ], 201);
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

    private function formatPayment(Payment $payment, bool $includeFullBooking = false)
    {
        $payment->loadMissing(['details.verifiedBy']);

        return [
            'id_payment' => $payment->id,
            'total_amount' => $payment->amount,
            'paid_amount' => $payment->paid_amount,
            'remaining_amount' => $payment->remaining_amount,
            'remaining_notice' => $this->buildRemainingNotice($payment),
            'payment_method' => $payment->payment_method,
            'payment_breakdown' => $this->buildPaymentBreakdown($payment),
            'proof_file' => $payment->proof_file,
            'payment_status' => $payment->payment_status,
            'paid_at' => $payment->paid_at,
            'payment_details' => $payment->details
                ->sortByDesc('created_at')
                ->values()
                ->map(fn ($detail) => $this->formatPaymentDetail($detail)),
            'booking' => $payment->booking ? $this->formatPaymentBooking($payment, $includeFullBooking) : null,
            'created_at' => $payment->created_at,
            'updated_at' => $payment->updated_at,
        ];
    }

    private function formatPaymentDetail(PaymentDetail $detail): array
    {
        $detail->loadMissing('verifiedBy');

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

    private function formatPaymentBooking(Payment $payment, bool $includeFullBooking): array
    {
        $booking = $payment->booking;

        $data = [
            'id_booking' => $booking->id,
            'booking_date' => $booking->booking_date,
            'start_time' => Carbon::parse($booking->start_time)->format('H:i'),
            'end_time' => Carbon::parse($booking->end_time)->format('H:i'),
            'customer_name' => $booking->customer_name,
            'phone' => $booking->phone,
            'status' => $booking->status,
        ];

        if (! $includeFullBooking) {
            return $data;
        }

        $data['court'] = $booking->court ? [
            'id_court' => $booking->court->id,
            'name' => $booking->court->name,
            'sport' => $booking->court->sport ? [
                'id_sport' => $booking->court->sport->id,
                'name' => $booking->court->sport->name,
            ] : null,
        ] : null;

        $data['user'] = $booking->user ? [
            'id_user' => $booking->user->id,
            'name' => $booking->user->name,
            'email' => $booking->user->email,
        ] : null;

        return $data;
    }

    public function preview($bookingId)
    {
        $booking = Booking::with(['payment.details'])->find($bookingId);

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
                'payment_details' => $booking->payment
                    ? $booking->payment->details->sortByDesc('created_at')->values()->map(fn ($detail) => $this->formatPaymentDetail($detail))
                    : [],
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

    private function recalculatePaymentFromDetails(Payment $payment): Payment
    {
        $payment->loadMissing(['booking', 'details']);

        $acceptedAmount = (float) $payment->details()
            ->where('status', 'diterima')
            ->sum('verified_amount');
        $amounts = $this->bookingPaymentStatusService->normalizeAmounts($payment, $acceptedAmount);
        $paymentStatus = $this->bookingPaymentStatusService->resolveStatusForUpdate(
            $payment,
            null,
            (float) $amounts['paid_amount']
        );
        $hasPendingDetails = $payment->details()->where('status', 'menunggu')->exists();
        $hasRejectedDetails = $payment->details()->where('status', 'ditolak')->exists();

        if ((float) $amounts['paid_amount'] <= 0 && ! $hasPendingDetails && $hasRejectedDetails) {
            $paymentStatus = 'ditolak';
        }

        $payment->update(array_merge($amounts, [
            'payment_status' => $paymentStatus,
            'paid_at' => in_array($paymentStatus, ['lunas', 'sedang_digunakan'], true) ? now() : null,
        ]));

        $booking = $this->bookingPaymentStatusService->syncBooking($payment->booking->fresh(['payment']));

        return $booking->payment->load(['booking', 'details.verifiedBy']);
    }

    private function resolvePaymentForBooking(Booking $booking, string $paymentMethod): Payment
    {
        if ($booking->payment) {
            return $booking->payment;
        }

        return Payment::create([
            'booking_id' => $booking->id,
            'amount' => $booking->total_price,
            'paid_amount' => 0,
            'remaining_amount' => $booking->total_price,
            'payment_method' => $paymentMethod,
            'payment_status' => 'menunggu',
        ]);
    }

    private function ensureBookingCanBePaid(Booking $booking): void
    {
        if (in_array($booking->status, ['cancelled', 'completed'], true)) {
            throw ValidationException::withMessages([
                'booking' => ['Booking tidak bisa dibayar.'],
            ]);
        }
    }

    private function ensureSubmittedAmountWithinRemaining(float $amount, float $remainingAmount): void
    {
        if ($amount > $remainingAmount) {
            throw ValidationException::withMessages([
                'amount' => ['Nominal pembayaran melebihi sisa pembayaran.'],
            ]);
        }
    }

    private function canAccessBooking(Request $request, Booking $booking): bool
    {
        $user = $request->user();

        return $booking->user_id === $user->id
            || in_array($user->role, ['admin', 'super_admin'], true);
    }

    private function syncLatestDetailFromPaymentVerification(
        Payment $payment,
        Request $request,
        float $targetPaidAmount,
        string $paymentStatus
    ): void {
        $latestPendingDetail = $payment->details()
            ->where('status', 'menunggu')
            ->latest()
            ->first();

        if (! $latestPendingDetail && $payment->proof_file) {
            $latestPendingDetail = $payment->details()->create([
                'amount' => $payment->amount,
                'verified_amount' => 0,
                'payment_method' => $payment->payment_method ?? 'transfer',
                'proof_file' => $payment->proof_file,
                'status' => 'menunggu',
            ]);
        }

        if (! $latestPendingDetail) {
            return;
        }

        if ($paymentStatus === 'ditolak') {
            $latestPendingDetail->update([
                'status' => 'ditolak',
                'verified_amount' => 0,
                'notes' => $request->notes ?? $latestPendingDetail->notes,
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
            ]);

            return;
        }

        $acceptedAmountExceptLatest = (float) $payment->details()
            ->where('status', 'diterima')
            ->where('id', '!=', $latestPendingDetail->id)
            ->sum('verified_amount');
        $detailVerifiedAmount = max($targetPaidAmount - $acceptedAmountExceptLatest, 0);

        if ($detailVerifiedAmount <= 0) {
            return;
        }

        $latestPendingDetail->update([
            'amount' => max((float) $latestPendingDetail->amount, $detailVerifiedAmount),
            'verified_amount' => $detailVerifiedAmount,
            'status' => 'diterima',
            'notes' => $request->notes ?? $latestPendingDetail->notes,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);
    }

    private function buildRemainingNotice(Payment $payment): ?string
    {
        if ((float) $payment->remaining_amount <= 0) {
            return null;
        }

        if ((float) $payment->paid_amount <= 0) {
            return null;
        }

        return 'Pembayaran kurang Rp '.number_format((float) $payment->remaining_amount, 0, ',', '.');
    }
}
