<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

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
