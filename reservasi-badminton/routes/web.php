<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    $reactIndex = public_path('app/index.html');

    if (file_exists($reactIndex)) {
        return response()->file($reactIndex);
    }

    return view('welcome');
})->where('any', '^(?!api|storage|up).*$');
