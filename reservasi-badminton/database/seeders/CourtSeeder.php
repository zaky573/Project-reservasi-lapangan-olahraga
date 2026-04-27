<?php

namespace Database\Seeders;

use App\Models\Court;
use Illuminate\Database\Seeder;

class CourtSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 8; $i++) {
            Court::updateOrCreate(
                ['code' => 'BDM-' . $i],
                [
                    'name' => 'Lapangan ' . $i,
                    'price_per_hour' => 50000,
                    'status' => 'active',
                    'description' => 'Lapangan badminton nomor ' . $i,
                ]
            );
        }
    }
}