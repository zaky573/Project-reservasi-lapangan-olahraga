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
            $table->string('icon', 20)->nullable()->after('code');
            $table->text('description')->nullable()->after('icon');
        });

        DB::table('sports')
            ->orderBy('id')
            ->get()
            ->each(function ($sport) {
                $name = Str::lower($sport->name);
                $icon = match ($name) {
                    'badminton' => '🏸',
                    'futsal', 'football', 'soccer' => '⚽',
                    'basket', 'basketball' => '🏀',
                    'voli', 'volleyball' => '🏐',
                    'tenis', 'tennis' => '🎾',
                    default => '🏆',
                };

                DB::table('sports')
                    ->where('id', $sport->id)
                    ->update([
                        'icon' => $icon,
                        'description' => 'Reservasi lapangan '.$sport->name.'.',
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('sports', function (Blueprint $table) {
            $table->dropColumn(['icon', 'description']);
        });
    }
};
