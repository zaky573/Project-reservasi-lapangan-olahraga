<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('bookings')
            ->whereIn('status', ['pending', 'confirmed'])
            ->update(['status' => 'dibooking']);

        DB::table('bookings')
            ->where('status', 'in_use')
            ->update(['status' => 'sedang_digunakan']);

        DB::table('bookings')
            ->where('status', 'completed')
            ->update(['status' => 'selesai']);

        DB::table('bookings')
            ->where('status', 'cancelled')
            ->update(['status' => 'dibatalkan']);

        DB::table('payments')
            ->whereIn('payment_status', ['unpaid', 'pending_verification', 'waiting_balance', 'menunggu'])
            ->update(['payment_status' => 'menunggu']);

        DB::table('payments')
            ->whereIn('payment_status', ['completed', 'sedang_digunakan'])
            ->update(['payment_status' => 'lunas']);

        DB::table('payments')
            ->whereIn('payment_status', ['pending', 'dibayar_sebagian'])
            ->where('payment_method', 'cash')
            ->update(['payment_status' => 'pembayaran_awal']);

        DB::table('payments')
            ->whereIn('payment_status', ['pending', 'dibayar_sebagian'])
            ->where('payment_method', 'transfer')
            ->update(['payment_status' => 'verifikasi_pembayaran_sisa']);

        DB::table('payments')
            ->whereIn('payment_status', ['ditolak', 'rejected'])
            ->update(['payment_status' => 'menunggu']);
    }

    public function down(): void
    {
        DB::table('bookings')
            ->where('status', 'sedang_digunakan')
            ->update(['status' => 'in_use']);

        DB::table('bookings')
            ->where('status', 'selesai')
            ->update(['status' => 'completed']);

        DB::table('bookings')
            ->where('status', 'dibatalkan')
            ->update(['status' => 'cancelled']);

        DB::table('payments')
            ->where('payment_status', 'pembayaran_awal')
            ->update(['payment_status' => 'dibayar_sebagian']);

        DB::table('payments')
            ->where('payment_status', 'verifikasi_pembayaran_sisa')
            ->update(['payment_status' => 'dibayar_sebagian']);
    }
};
