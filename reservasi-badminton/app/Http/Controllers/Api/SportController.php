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
                'code' => $sport->code,
                'icon' => $sport->icon,
                'description' => $sport->description,
                'created_at' => $sport->created_at,
                'updated_at' => $sport->updated_at,
            ];
        });

        return response()->json([
            'status' => true,
            'message' => 'Daftar olahraga berhasil diambil',
            'data' => $sports,
        ]);
    }

    // POST /api/sports
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:sports,name',
            'code' => 'required|string|max:10|alpha_num|unique:sports,code',
            'icon' => 'required|string|max:20',
            'description' => 'required|string|max:1000',
        ]);

        $validated['name'] = strtolower($validated['name']);
        $validated['code'] = strtoupper($validated['code']);

        $sport = Sport::create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Olahraga berhasil ditambahkan',
            'data' => [
                'id_sport' => $sport->id,
                'name' => $sport->name,
                'code' => $sport->code,
                'icon' => $sport->icon,
                'description' => $sport->description,
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
                'message' => 'Olahraga tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|unique:sports,name,'.$id,
            'code' => 'required|string|max:10|alpha_num|unique:sports,code,'.$id,
            'icon' => 'required|string|max:20',
            'description' => 'required|string|max:1000',
        ]);

        $validated['name'] = strtolower($validated['name']);
        $validated['code'] = strtoupper($validated['code']);

        $sport->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Olahraga berhasil diperbarui',
            'data' => [
                'id_sport' => $sport->id,
                'name' => $sport->name,
                'code' => $sport->code,
                'icon' => $sport->icon,
                'description' => $sport->description,
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
                'message' => 'Olahraga tidak ditemukan',
            ], 404);
        }

        $sport->delete();

        return response()->json([
            'status' => true,
            'message' => 'Olahraga berhasil dihapus',
        ]);
    }
}
