<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SportController extends Controller
{
    // GET /api/sports
    public function index()
    {
        $sports = Sport::latest()->get()->map(fn ($sport) => $this->formatSport($sport));

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
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $validated['name'] = strtolower($validated['name']);
        $validated['code'] = strtoupper($validated['code']);
        $validated['image'] = $request->file('image')->store('sport_images', 'public');

        $sport = Sport::create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Olahraga berhasil ditambahkan',
            'data' => $this->formatSport($sport),
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
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $validated['name'] = strtolower($validated['name']);
        $validated['code'] = strtoupper($validated['code']);

        if ($request->hasFile('image')) {
            if ($sport->image && str_starts_with($sport->image, 'sport_images/')) {
                Storage::disk('public')->delete($sport->image);
            }

            $validated['image'] = $request->file('image')->store('sport_images', 'public');
        } else {
            unset($validated['image']);
        }

        $sport->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Olahraga berhasil diperbarui',
            'data' => $this->formatSport($sport),
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

        if ($sport->image && str_starts_with($sport->image, 'sport_images/')) {
            Storage::disk('public')->delete($sport->image);
        }

        $sport->delete();

        return response()->json([
            'status' => true,
            'message' => 'Olahraga berhasil dihapus',
        ]);
    }

    private function formatSport(Sport $sport): array
    {
        return [
            'id_sport' => $sport->id,
            'name' => $sport->name,
            'code' => $sport->code,
            'icon' => $sport->icon,
            'description' => $sport->description,
            'image' => $sport->image,
            'created_at' => $sport->created_at,
            'updated_at' => $sport->updated_at,
        ];
    }
}
