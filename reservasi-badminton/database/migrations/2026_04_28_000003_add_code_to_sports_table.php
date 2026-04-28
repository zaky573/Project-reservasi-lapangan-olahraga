<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sports', function (Blueprint $table) {
            $table->string('code', 10)->nullable()->after('name');
        });

        $usedCodes = [];

        DB::table('sports')
            ->orderBy('id')
            ->get()
            ->each(function ($sport) use (&$usedCodes) {
                $baseCode = match (Str::lower($sport->name)) {
                    'badminton' => 'BDM',
                    'futsal' => 'FTS',
                    'basket', 'basketball' => 'BSK',
                    default => Str::upper(Str::substr(preg_replace('/[^A-Za-z0-9]/', '', $sport->name), 0, 3)) ?: 'SPT',
                };

                $code = $baseCode;
                $counter = 2;

                while (in_array($code, $usedCodes, true)) {
                    $code = $baseCode.$counter;
                    $counter++;
                }

                $usedCodes[] = $code;

                DB::table('sports')
                    ->where('id', $sport->id)
                    ->update(['code' => $code]);
            });

        Schema::table('sports', function (Blueprint $table) {
            $table->unique('code');
        });

        DB::statement('ALTER TABLE sports ALTER COLUMN code SET NOT NULL');
    }

    public function down(): void
    {
        Schema::table('sports', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
    }
};
