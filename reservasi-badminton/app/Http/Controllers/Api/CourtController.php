<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Court;
use Illuminate\Http\Request;

class CourtController extends Controller
{
    // GET /api/courts
    public function index(Request $request)
    {
        $query = Court::with('sport');

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('sport_id')) {
            $query->where('sport_id', $request->sport_id);
        }

        // 🔥 GANTI paginate -> get
        $courts = $query->latest()->get();

        // 🔥 format manual
        $data = $courts->map(function ($court) {
            return [
                'id_court' => $court->id,
                'name' => $court->name,
                'code' => $court->code,
                'price_per_hour' => $court->price_per_hour,
                'status' => $court->status,
                'description' => $court->description,
                'created_at' => $court->created_at,
                'updated_at' => $court->updated_at,
                'sport' => $court->sport ? [
                    'id' => $court->sport->id,
                    'name' => $court->sport->name,
                ] : null,
            ];
        });

        return response()->json([
            'status' => true,
            'message' => 'Daftar lapangan',
            'data' => $data,
        ]);
    }

    // GET /api/courts/{id}
    public function show($id)
    {
        $court = Court::with('sport')->find($id);

        if (! $court) {
            return response()->json([
                'status' => false,
                'message' => 'Lapangan tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => [
                'id_court' => $court->id,
                'name' => $court->name,
                'code' => $court->code,
                'price_per_hour' => $court->price_per_hour,
                'status' => $court->status,
                'description' => $court->description,
                'created_at' => $court->created_at,
                'updated_at' => $court->updated_at,
                'sport' => $court->sport ? [
                    'id' => $court->sport->id,
                    'name' => $court->sport->name,
                ] : null,
            ],
        ]);
    }

    // POST /api/courts (admin)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sport_id' => 'required|exists:sports,id',
            'name' => 'required',
            'code' => 'required|unique:courts,code',
            'price_per_hour' => 'required|numeric',
            'status' => 'required|in:active,inactive',
            'description' => 'nullable',
        ]);

        $court = Court::create($validated);
        $court->load('sport');

        return response()->json([
            'status' => true,
            'message' => 'Lapangan berhasil ditambahkan',
            'data' => [
                'id_court' => $court->id,
                'name' => $court->name,
                'code' => $court->code,
                'price_per_hour' => $court->price_per_hour,
                'status' => $court->status,
                'description' => $court->description,
                'created_at' => $court->created_at,
                'updated_at' => $court->updated_at,
                'sport' => $court->sport ? [
                    'id' => $court->sport->id,
                    'name' => $court->sport->name,
                ] : null,
            ],
        ], 201);
    }

    // PUT /api/courts/{id} (admin)
    public function update(Request $request, $id)
    {
        $court = Court::find($id);

        if (! $court) {
            return response()->json([
                'status' => false,
                'message' => 'Lapangan tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'sport_id' => 'required|exists:sports,id',
            'name' => 'required',
            'code' => 'required|unique:courts,code,'.$id,
            'price_per_hour' => 'required|numeric',
            'status' => 'required|in:active,inactive',
            'description' => 'nullable',
        ]);

        $court->update($validated);
        $court->load('sport');

        return response()->json([
            'status' => true,
            'message' => 'Lapangan berhasil diupdate',
            'data' => [
                'id_court' => $court->id,
                'name' => $court->name,
                'code' => $court->code,
                'price_per_hour' => $court->price_per_hour,
                'status' => $court->status,
                'description' => $court->description,
                'created_at' => $court->created_at,
                'updated_at' => $court->updated_at,
                'sport' => $court->sport ? [
                    'id' => $court->sport->id,
                    'name' => $court->sport->name,
                ] : null,
            ],
        ]);
    }

    // DELETE /api/courts/{id} (admin)
    public function destroy($id)
    {
        $court = Court::find($id);

        if (! $court) {
            return response()->json([
                'status' => false,
                'message' => 'Lapangan tidak ditemukan',
            ], 404);
        }

        $court->delete();

        return response()->json([
            'status' => true,
            'message' => 'Lapangan berhasil dihapus',
        ]);
    }
}
