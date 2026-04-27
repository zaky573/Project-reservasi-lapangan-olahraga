<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sport;
use Illuminate\Http\Request;

class SportController extends Controller
{
    // GET /api/sports
    public function index()
    {
        $sports = Sport::latest()->get()->map(function ($sport) {
            return [
                'id_sport' => $sport->id,
                'name' => $sport->name,
                'created_at' => $sport->created_at,
                'updated_at' => $sport->updated_at,
            ];
        });

        return response()->json([
            'status' => true,
            'message' => 'Daftar sport berhasil diambil',
            'data' => $sports,
        ]);
    }

    // POST /api/sports
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:sports,name',
        ]);

        // biar konsisten
        $validated['name'] = strtolower($validated['name']);

        $sport = Sport::create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Sport berhasil ditambahkan',
            'data' => [
                'id_sport' => $sport->id,
                'name' => $sport->name,
                'created_at' => $sport->created_at,
                'updated_at' => $sport->updated_at,
            ],
        ], 201);
    }

    // PUT /api/sports/{id}
    public function update(Request $request, $id)
    {
        $sport = Sport::find($id);

        if (! $sport) {
            return response()->json([
                'status' => false,
                'message' => 'Sport tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|in:badminton,futsal|unique:sports,name,'.$id,
        ]);

        $sport->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Sport berhasil diupdate',
            'data' => [
                'id_sport' => $sport->id,
                'name' => $sport->name,
                'created_at' => $sport->created_at,
                'updated_at' => $sport->updated_at,
            ],
        ]);
    }

    // DELETE /api/sports/{id}
    public function destroy($id)
    {
        $sport = Sport::find($id);

        if (! $sport) {
            return response()->json([
                'status' => false,
                'message' => 'Sport tidak ditemukan',
            ], 404);
        }

        $sport->delete();

        return response()->json([
            'status' => true,
            'message' => 'Sport berhasil dihapus',
        ]);
    }
}
