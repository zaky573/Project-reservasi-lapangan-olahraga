<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('status')->default('dibooking')->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_status')->default('menunggu')->change();
        });

        DB::table('bookings')
            ->whereIn('status', ['pending', 'confirmed'])
            ->update(['status' => 'dibooking']);

        DB::table('payments')
            ->whereIn('payment_status', ['unpaid', 'pending_verification', 'waiting_balance'])
            ->update(['payment_status' => 'menunggu']);

        DB::table('payments')
            ->where('payment_status', 'pending')
            ->update(['payment_status' => 'menunggu']);

        DB::table('payments')
            ->where('payment_status', 'completed')
            ->update(['payment_status' => 'lunas']);

        DB::table('payments')
            ->where('payment_status', 'in_use')
            ->update(['payment_status' => 'sedang_digunakan']);

        DB::table('payments')
            ->where('payment_status', 'rejected')
            ->update(['payment_status' => 'ditolak']);
    }

    public function down(): void
    {
        DB::table('bookings')
            ->where('status', 'dibooking')
            ->update(['status' => 'pending']);

        DB::table('payments')
            ->where('payment_status', 'menunggu')
            ->update(['payment_status' => 'unpaid']);

        DB::table('payments')
            ->where('payment_status', 'dibayar_sebagian')
            ->update(['payment_status' => 'pending']);

        DB::table('payments')
            ->where('payment_status', 'lunas')
            ->update(['payment_status' => 'completed']);

        DB::table('payments')
            ->where('payment_status', 'sedang_digunakan')
            ->update(['payment_status' => 'in_use']);

        DB::table('payments')
            ->where('payment_status', 'ditolak')
            ->update(['payment_status' => 'rejected']);

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_status')->default('unpaid')->change();
        });
    }
};
