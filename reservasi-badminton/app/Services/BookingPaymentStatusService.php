<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Carbon\Carbon;

class BookingPaymentStatusService
{
    public const PAYMENT_MENUNGGU = 'menunggu';
    public const PAYMENT_PEMBAYARAN_AWAL = 'pembayaran_awal';
    public const PAYMENT_VERIFIKASI_SISA = 'verifikasi_pembayaran_sisa';
    public const PAYMENT_LUNAS = 'lunas';

    public const BOOKING_DIBOOKING = 'dibooking';
    public const BOOKING_SEDANG_DIGUNAKAN = 'sedang_digunakan';
    public const BOOKING_SELESAI = 'selesai';
    public const BOOKING_DIBATALKAN = 'dibatalkan';

    public function syncBooking(Booking $booking): Booking
    {
        $booking->loadMissing('payment');

        $payment = $booking->payment;

        if (! $payment) {
            return $booking;
        }

        $startAt = Carbon::parse($booking->booking_date.' '.$booking->start_time);
        $endAt = Carbon::parse($booking->booking_date.' '.$booking->end_time);
        $now = now();
        $isFullyPaid = $this->isFullyPaid($payment);

        if ($now->greaterThanOrEqualTo($endAt)) {
            if ($isFullyPaid) {
                $this->updatePaymentStatus($payment, self::PAYMENT_LUNAS);
                $this->updateBookingStatus($booking, self::BOOKING_SELESAI);
            } else {
                $this->updatePaymentStatus($payment, $this->resolvePrePlayPaymentStatus($payment));
                $this->updateBookingStatus($booking, self::BOOKING_DIBATALKAN);
            }

            return $booking->fresh(['payment']);
        }

        if ($now->greaterThanOrEqualTo($startAt)) {
            if ($isFullyPaid) {
                $this->updatePaymentStatus($payment, self::PAYMENT_LUNAS);
                $this->updateBookingStatus($booking, self::BOOKING_SEDANG_DIGUNAKAN);
            }

            return $booking->fresh(['payment']);
        }

        $this->updatePaymentStatus($payment, $this->resolvePrePlayPaymentStatus($payment));

        if (! in_array($booking->status, [self::BOOKING_DIBATALKAN, self::BOOKING_SELESAI, 'cancelled', 'completed'], true)) {
            $this->updateBookingStatus($booking, self::BOOKING_DIBOOKING);
        }

        return $booking->fresh(['payment']);
    }

    public function syncCollection(iterable $bookings): void
    {
        foreach ($bookings as $booking) {
            $this->syncBooking($booking);
        }
    }

    public function isFullyPaid(Payment $payment): bool
    {
        return (float) $payment->remaining_amount <= 0
            && $payment->payment_status !== self::PAYMENT_MENUNGGU;
    }

    public function normalizeAmounts(Payment $payment, ?float $paidAmount = null): array
    {
        $totalAmount = (float) $payment->amount;
        $normalizedPaidAmount = min(max((float) ($paidAmount ?? $payment->paid_amount ?? 0), 0), $totalAmount);

        return [
            'paid_amount' => $normalizedPaidAmount,
            'remaining_amount' => max($totalAmount - $normalizedPaidAmount, 0),
        ];
    }

    public function resolvePaidAmountForUpdate(Payment $payment, ?string $requestedStatus, ?float $paidAmount = null): float
    {
        if ($requestedStatus === self::PAYMENT_LUNAS) {
            return (float) $payment->amount;
        }

        if ($requestedStatus === self::PAYMENT_PEMBAYARAN_AWAL && $payment->payment_method === 'cash') {
            return (float) ($paidAmount ?? round((float) $payment->amount * 0.25, 2));
        }

        return (float) ($paidAmount ?? $payment->paid_amount ?? 0);
    }

    public function resolveStatusForUpdate(Payment $payment, ?string $requestedStatus, ?float $paidAmount = null): string
    {
        $amounts = $this->normalizeAmounts($payment, $paidAmount);

        if ($amounts['remaining_amount'] <= 0) {
            return self::PAYMENT_LUNAS;
        }

        if (
            $requestedStatus
            && in_array($requestedStatus, [
                self::PAYMENT_PEMBAYARAN_AWAL,
                self::PAYMENT_VERIFIKASI_SISA,
                self::PAYMENT_MENUNGGU,
            ], true)
        ) {
            return $requestedStatus;
        }

        if ($amounts['paid_amount'] > 0) {
            return $this->resolvePartialPaymentStatus($payment, (float) $amounts['paid_amount']);
        }

        return self::PAYMENT_MENUNGGU;
    }

    public function resolvePrePlayPaymentStatus(Payment $payment): string
    {
        $payment->loadMissing('details');

        if ($payment->details->contains('status', 'menunggu')) {
            return self::PAYMENT_MENUNGGU;
        }

        if ($this->isFullyPaid($payment)) {
            return self::PAYMENT_LUNAS;
        }

        if ((float) $payment->paid_amount > 0) {
            return $this->resolvePartialPaymentStatus($payment, (float) $payment->paid_amount);
        }

        return self::PAYMENT_MENUNGGU;
    }

    public function resolvePartialPaymentStatus(Payment $payment, float $paidAmount): string
    {
        if ($paidAmount <= 0) {
            return self::PAYMENT_MENUNGGU;
        }

        if ($payment->payment_method === 'cash') {
            $minimumDp = round((float) $payment->amount * 0.25, 2);

            return $paidAmount <= $minimumDp
                ? self::PAYMENT_PEMBAYARAN_AWAL
                : self::PAYMENT_VERIFIKASI_SISA;
        }

        return self::PAYMENT_VERIFIKASI_SISA;
    }

    private function updatePaymentStatus(Payment $payment, string $status): void
    {
        if ($payment->payment_status === $status) {
            return;
        }

        $payment->forceFill([
            'payment_status' => $status,
            'paid_at' => $status === self::PAYMENT_LUNAS ? ($payment->paid_at ?? now()) : null,
        ])->save();
    }

    private function updateBookingStatus(Booking $booking, string $status): void
    {
        if ($booking->status === $status) {
            return;
        }

        $booking->forceFill([
            'status' => $status,
        ])->save();
    }
}
