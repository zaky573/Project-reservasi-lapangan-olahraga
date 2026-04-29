<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function index()
    {
        $admins = User::whereIn('role', ['admin', 'super_admin'])
            ->orderByRaw("CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Daftar akun admin berhasil diambil',
            'data' => $admins,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Admin berhasil dibuat',
            'data' => $admin,
        ], 201);
    }

    public function resetPassword(Request $request, $id)
    {
        $validated = $request->validate([
            'password' => 'nullable|string|min:6',
        ]);

        $admin = User::whereIn('role', ['admin', 'super_admin'])->find($id);

        if (! $admin) {
            return response()->json([
                'status' => false,
                'message' => 'Akun admin tidak ditemukan',
            ], 404);
        }

        $plainPassword = $validated['password'] ?? $this->generateTemporaryPassword();

        $admin->forceFill([
            'password' => Hash::make($plainPassword),
        ])->save();

        return response()->json([
            'status' => true,
            'message' => 'Password admin berhasil direset',
            'data' => [
                'user' => $admin,
                'temporary_password' => $plainPassword,
            ],
        ]);
    }

    private function generateTemporaryPassword(): string
    {
        return 'Arena-'.Str::random(8).random_int(10, 99);
    }
}
