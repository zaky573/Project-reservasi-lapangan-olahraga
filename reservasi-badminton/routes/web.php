<?php

use App\Mail\SendMail;
use App\Models\PendingRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/debug/register', function () {
    abort_unless(app()->environment('local'), 404);

    return view('debug-register');
});

Route::post('/debug/register', function (Request $request) {
    abort_unless(app()->environment('local'), 404);

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users,email',
        'phone' => 'required|string|max:20',
        'password' => 'required|string|min:6|confirmed',
    ]);

    $otpCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = now()->addMinutes(5);

    $pendingRegistration = PendingRegistration::updateOrCreate(
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

    try {
        Mail::to($validated['email'])->send(new SendMail($validated['name'], $otpCode, $expiresAt, 'registration'));

        return back()->with(
            'status',
            'Email OTP berhasil dikirim ke '.$validated['email'].'. Kode debug lokal: '.$otpCode
        );
    } catch (\Throwable $exception) {
        return back()
            ->withInput()
            ->with('mail_error', $exception->getMessage());
    }
});

Route::get('/payment-proofs/{path}', function (string $path) {
    if (str_contains($path, '..') || str_starts_with($path, '/') || str_starts_with($path, '\\')) {
        abort(404);
    }

    $path = 'payment_proofs/'.ltrim($path, '/\\');
    $disk = Storage::disk('public');

    if (! $disk->exists($path)) {
        abort(404);
    }

    $fullPath = $disk->path($path);

    if (! is_file($fullPath)) {
        abort(404);
    }

    return response()->file($fullPath, [
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');

Route::get('/sport-images/{path}', function (string $path) {
    if (str_contains($path, '..') || str_starts_with($path, '/') || str_starts_with($path, '\\')) {
        abort(404);
    }

    $path = 'sport_images/'.ltrim($path, '/\\');
    $disk = Storage::disk('public');

    if (! $disk->exists($path)) {
        abort(404);
    }

    $fullPath = $disk->path($path);

    if (! is_file($fullPath)) {
        abort(404);
    }

    return response()->file($fullPath, [
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');

Route::get('/{any?}', function () {
    $reactIndex = public_path('app/index.html');

    if (file_exists($reactIndex)) {
        return response()->file($reactIndex);
    }

    return view('welcome');
})->where('any', '^(?!api|storage|up).*$');
