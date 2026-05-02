<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CourtController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SportController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/register/verify-otp', [AuthController::class, 'verifyRegisterOtp']);
Route::post('/register/resend-otp', [AuthController::class, 'resendRegisterOtp']);
Route::post('/forgot-password/request-otp', [AuthController::class, 'requestForgotPasswordOtp']);
Route::post('/forgot-password/verify-otp', [AuthController::class, 'verifyForgotPasswordOtp']);

// Login semua role: user, admin, super_admin
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Public Read Routes
|--------------------------------------------------------------------------
| Kalau daftar lapangan dan detail lapangan ingin bisa dilihat tanpa login,
| biarkan di luar auth.
*/
Route::get('/courts', [CourtController::class, 'index']);
Route::get('/courts/{id}', [CourtController::class, 'show']);
Route::get('/sports', [SportController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (semua role yang sudah login)
|--------------------------------------------------------------------------
| User, admin, dan super_admin bisa akses route di bawah ini.
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Booking user
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/my-bookings', [BookingController::class, 'myBookings']);
    Route::get('/payments/{bookingId}/preview', [PaymentController::class, 'preview']);

    Route::post('/payments/{bookingId}', [PaymentController::class, 'store']);
    Route::post('/payments/{bookingId}/upload-proof', [PaymentController::class, 'uploadProof']);
    Route::post('/payments/{bookingId}/details', [PaymentController::class, 'storeDetail']);
    Route::get('/payments/{bookingId}/details', [PaymentController::class, 'details']);

    // Schedule
    Route::get('/schedules', [ScheduleController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
| Hanya admin yang bisa akses.
*/
Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    Route::post('/admin/logout', [AuthController::class, 'logoutAdmin']);

    // Courts management
    Route::post('/courts', [CourtController::class, 'store']);
    Route::put('/courts/{id}', [CourtController::class, 'update']);
    Route::delete('/courts/{id}', [CourtController::class, 'destroy']);

    // Booking management
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::put('/bookings/{id}', [BookingController::class, 'update']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);

    // Payment management
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::put('/payments/{id}/verify', [PaymentController::class, 'verify']);
    Route::put('/payment-details/{id}/verify', [PaymentController::class, 'verifyDetail']);
    Route::post('/payments/{bookingId}/cash-payment', [PaymentController::class, 'storeCashPayment']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Sport
    Route::post('/sports', [SportController::class, 'store']);
    Route::post('/sports/{id}', [SportController::class, 'update']);
    Route::put('/sports/{id}', [SportController::class, 'update']);
    Route::delete('/sports/{id}', [SportController::class, 'destroy']);


});

/*
|--------------------------------------------------------------------------
| Super Admin Routes
|--------------------------------------------------------------------------
| Hanya super_admin yang bisa akses.
*/
Route::middleware(['auth:sanctum', 'super_admin'])->group(function () {
    // Create new admin
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::put('/admins/{id}/reset-password', [AdminController::class, 'resetPassword']);

    Route::post('/super-admin/logout', [AuthController::class, 'logoutSuperAdmin']);

    // rekap laporan
    Route::get('/reports/bookings', [ReportController::class, 'bookings']);
});
