<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@badminton.com'],
            [
                'name' => 'Admin',
                'phone' => '081111111111',
                'role' => 'admin',
                'password' => Hash::make('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'user@badminton.com'],
            [
                'name' => 'User Demo',
                'phone' => '082222222222',
                'role' => 'user',
                'password' => Hash::make('password123'),
            ]
        );
    }
}