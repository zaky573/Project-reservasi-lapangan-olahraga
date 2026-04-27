<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PendingRegistration;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $otpCode = $this->generateOtpCode();
        $expiresAt = now()->addMinutes(5);

        PendingRegistration::updateOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'otp_code' => $otpCode,
                'otp_expires_at' => $expiresAt,
                'last_otp_sent_at' => now(),
            ]
        );

        $this->sendRegistrationOtp($validated['email'], $validated['name'], $otpCode, $expiresAt);

        return response()->json([
            'status' => true,
            'message' => 'Kode OTP berhasil dikirim ke email',
            'data' => [
                'email' => $validated['email'],
                'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
            ],
        ], 202);
    }

    public function verifyRegisterOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        $pendingRegistration = PendingRegistration::where('email', $validated['email'])->first();

        if (! $pendingRegistration) {
            throw ValidationException::withMessages([
                'email' => ['Permintaan registrasi tidak ditemukan atau sudah kedaluwarsa.'],
            ]);
        }

        if ($pendingRegistration->otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP sudah kedaluwarsa. Silakan kirim ulang OTP.'],
            ]);
        }

        if ($pendingRegistration->otp_code !== $validated['otp']) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP tidak valid.'],
            ]);
        }

        if (User::where('email', $pendingRegistration->email)->exists()) {
            $pendingRegistration->delete();

            throw ValidationException::withMessages([
                'email' => ['Email sudah terdaftar.'],
            ]);
        }

        $user = User::create([
            'name' => $pendingRegistration->name,
            'email' => $pendingRegistration->email,
            'phone' => $pendingRegistration->phone,
            'password' => $pendingRegistration->password,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $pendingRegistration->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Registrasi berhasil diverifikasi',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

    public function resendRegisterOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $pendingRegistration = PendingRegistration::where('email', $validated['email'])->first();

        if (! $pendingRegistration) {
            throw ValidationException::withMessages([
                'email' => ['Permintaan registrasi tidak ditemukan. Silakan daftar ulang.'],
            ]);
        }

        if (
            $pendingRegistration->last_otp_sent_at
            && $pendingRegistration->last_otp_sent_at->diffInSeconds(now()) < 60
        ) {
            throw ValidationException::withMessages([
                'email' => ['Tunggu 60 detik sebelum meminta OTP baru.'],
            ]);
        }

        $otpCode = $this->generateOtpCode();
        $expiresAt = now()->addMinutes(5);

        $pendingRegistration->update([
            'otp_code' => $otpCode,
            'otp_expires_at' => $expiresAt,
            'last_otp_sent_at' => now(),
        ]);

        $this->sendRegistrationOtp($pendingRegistration->email, $pendingRegistration->name, $otpCode, $expiresAt);

        return response()->json([
            'status' => true,
            'message' => 'Kode OTP baru berhasil dikirim',
            'data' => [
                'email' => $pendingRegistration->email,
                'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    public function requestForgotPasswordOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return response()->json([
                'status' => true,
                'message' => 'Jika email terdaftar, kode OTP reset password akan dikirim.',
            ]);
        }

        $passwordResetOtp = PasswordResetOtp::where('email', $validated['email'])->first();

        if (
            $passwordResetOtp?->last_otp_sent_at
            && $passwordResetOtp->last_otp_sent_at->diffInSeconds(now()) < 60
        ) {
            throw ValidationException::withMessages([
                'email' => ['Tunggu 60 detik sebelum meminta OTP baru.'],
            ]);
        }

        $otpCode = $this->generateOtpCode();
        $expiresAt = now()->addMinutes(5);

        PasswordResetOtp::updateOrCreate(
            ['email' => $validated['email']],
            [
                'otp_code' => $otpCode,
                'otp_expires_at' => $expiresAt,
                'last_otp_sent_at' => now(),
            ]
        );

        $this->sendForgotPasswordOtp($user->email, $user->name, $otpCode, $expiresAt);

        return response()->json([
            'status' => true,
            'message' => 'Jika email terdaftar, kode OTP reset password akan dikirim.',
            'data' => [
                'email' => $validated['email'],
                'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    public function verifyForgotPasswordOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['Email tidak ditemukan.'],
            ]);
        }

        $passwordResetOtp = PasswordResetOtp::where('email', $validated['email'])->first();

        if (! $passwordResetOtp) {
            throw ValidationException::withMessages([
                'email' => ['Permintaan reset password tidak ditemukan.'],
            ]);
        }

        if ($passwordResetOtp->otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP sudah kedaluwarsa. Silakan kirim ulang OTP.'],
            ]);
        }

        if ($passwordResetOtp->otp_code !== $validated['otp']) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP tidak valid.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        $user->tokens()->delete();
        $passwordResetOtp->delete();

        return response()->json([
            'status' => true,
            'message' => 'Password berhasil direset. Silakan login dengan password baru.',
        ]);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'status' => true,
            'message' => 'Data user berhasil diambil',
            'data' => $request->user(),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logout berhasil',
        ]);
    }

    public function loginSuperAdmin(Request $request)
    {
        // validasi
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // cek user
        $user = User::where('email', $request->email)->first();

        if (! $user || ! \Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah',
            ], 401);
        }

        // cek role
        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Bukan akun super admin',
            ], 403);
        }

        // buat token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login super admin berhasil',
            'token' => $token,
            'data' => $user,
        ]);
    }

    public function logoutSuperAdmin(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'message' => 'Bukan akun super admin',
            ], 403);
        }

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logout super admin berhasil',
        ]);
    }

    public function loginAdmin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah',
            ], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Bukan akun admin',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login admin berhasil',
            'token' => $token,
            'data' => $user,
        ]);
    }

    public function logoutAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Bukan akun admin',
            ], 403);
        }

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logout admin berhasil',
        ]);
    }

    public function loginUser(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah',
            ], 401);
        }

        if ($user->role !== 'user') {
            return response()->json([
                'message' => 'Bukan akun user',
            ], 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login user berhasil',
            'token' => $token,
            'data' => $user,
        ]);
    }

    private function generateOtpCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private function sendRegistrationOtp(string $email, string $name, string $otpCode, $expiresAt): void
    {
        Mail::raw(
            "Halo {$name},\n\nKode OTP registrasi akun Anda adalah: {$otpCode}\nKode ini berlaku sampai ".$expiresAt->format('Y-m-d H:i:s').".\n\nJangan berikan kode ini kepada siapa pun.",
            function ($message) use ($email) {
                $message->to($email)->subject('Kode OTP Registrasi');
            }
        );
    }

    private function sendForgotPasswordOtp(string $email, string $name, string $otpCode, $expiresAt): void
    {
        Mail::raw(
            "Halo {$name},\n\nKode OTP reset password akun Anda adalah: {$otpCode}\nKode ini berlaku sampai ".$expiresAt->format('Y-m-d H:i:s').".\n\nJika Anda tidak meminta reset password, abaikan email ini.",
            function ($message) use ($email) {
                $message->to($email)->subject('Kode OTP Reset Password');
            }
        );
    }
}
