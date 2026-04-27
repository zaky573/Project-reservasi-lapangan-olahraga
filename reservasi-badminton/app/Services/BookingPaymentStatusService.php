<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Carbon\Carbon;

class BookingPaymentStatusService
{
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
                $this->updatePaymentStatus($payment, 'lunas');
                $this->updateBookingStatus($booking, 'completed');
            } else {
                $this->updatePaymentStatus($payment, $this->resolvePrePlayPaymentStatus($payment));
                $this->updateBookingStatus($booking, 'cancelled');
            }

            return $booking->fresh(['payment']);
        }

        if ($now->greaterThanOrEqualTo($startAt)) {
            if ($isFullyPaid) {
                $this->updatePaymentStatus($payment, 'sedang_digunakan');
                $this->updateBookingStatus($booking, 'in_use');
            }

            return $booking->fresh(['payment']);
        }

        if ($payment->payment_status !== 'ditolak') {
            $this->updatePaymentStatus($payment, $this->resolvePrePlayPaymentStatus($payment));
        }

        if ($booking->status !== 'cancelled' && $booking->status !== 'completed') {
            $this->updateBookingStatus($booking, 'dibooking');
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
            && $payment->payment_status !== 'ditolak';
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
        if (in_array($requestedStatus, ['lunas', 'sedang_digunakan'], true)) {
            return (float) $payment->amount;
        }

        if ($requestedStatus === 'dibayar_sebagian' && $payment->payment_method === 'cash') {
            return round((float) $payment->amount * 0.25, 2);
        }

        return (float) ($paidAmount ?? $payment->paid_amount ?? 0);
    }

    public function resolveStatusForUpdate(Payment $payment, ?string $requestedStatus, ?float $paidAmount = null): string
    {
        if ($requestedStatus === 'ditolak') {
            return 'ditolak';
        }

        $amounts = $this->normalizeAmounts($payment, $paidAmount);

        if ($amounts['remaining_amount'] <= 0) {
            $startAt = Carbon::parse($payment->booking->booking_date.' '.$payment->booking->start_time);
            $endAt = Carbon::parse($payment->booking->booking_date.' '.$payment->booking->end_time);
            $now = now();

            if ($now->greaterThanOrEqualTo($startAt) && $now->lt($endAt)) {
                return 'sedang_digunakan';
            }

            return 'lunas';
        }

        if ($amounts['paid_amount'] > 0) {
            return 'dibayar_sebagian';
        }

        return 'menunggu';
    }

    private function resolvePrePlayPaymentStatus(Payment $payment): string
    {
        if ($this->isFullyPaid($payment)) {
            return 'lunas';
        }

        if ((float) $payment->paid_amount > 0) {
            return 'dibayar_sebagian';
        }

        return 'menunggu';
    }

    private function updatePaymentStatus(Payment $payment, string $status): void
    {
        if ($payment->payment_status === $status) {
            return;
        }

        $payment->forceFill([
            'payment_status' => $status,
            'paid_at' => in_array($status, ['lunas', 'sedang_digunakan'], true) ? ($payment->paid_at ?? now()) : null,
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
