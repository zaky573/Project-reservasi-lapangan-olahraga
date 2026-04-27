<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || $request->user()->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk super admin'
            ], 403);
        }

        return $next($request);
    }
}
