<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'status' => false,
                'message' => 'Akses ditolak. Hanya admin yang dapat mengakses.',
            ], 403);
        }

        return $next($request);
    }
}
