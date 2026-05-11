<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\Sport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
                'image' => $court->image,
                'created_at' => $court->created_at,
                'updated_at' => $court->updated_at,
                'sport' => $court->sport ? [
                    'id' => $court->sport->id,
                    'name' => $court->sport->name,
                    'code' => $court->sport->code,
                    'icon' => $court->sport->icon,
                    'description' => $court->sport->description,
                    'image' => $court->sport->image,
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
                'image' => $court->image,
                'created_at' => $court->created_at,
                'updated_at' => $court->updated_at,
                'sport' => $court->sport ? [
                    'id' => $court->sport->id,
                    'name' => $court->sport->name,
                    'code' => $court->sport->code,
                    'icon' => $court->sport->icon,
                    'description' => $court->sport->description,
                    'image' => $court->sport->image,
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
            'code' => 'nullable|unique:courts,code',
            'price_per_hour' => 'required|numeric',
            'status' => 'required|in:active,inactive,maintenance',
            'description' => 'nullable',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $validated['code'] = $validated['code'] ?: $this->generateCourtCode((int) $validated['sport_id']);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('court_images', 'public');
        }

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
                'image' => $court->image,
                'created_at' => $court->created_at,
                'updated_at' => $court->updated_at,
                'sport' => $court->sport ? [
                    'id' => $court->sport->id,
                    'name' => $court->sport->name,
                    'code' => $court->sport->code,
                    'icon' => $court->sport->icon,
                    'description' => $court->sport->description,
                    'image' => $court->sport->image,
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
            'code' => 'nullable|unique:courts,code,'.$id,
            'price_per_hour' => 'required|numeric',
            'status' => 'required|in:active,inactive,maintenance',
            'description' => 'nullable',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $validated['code'] = $validated['code'] ?: $this->generateCourtCode((int) $validated['sport_id'], (int) $id);

        if ($request->hasFile('image')) {
            if ($court->image && str_starts_with($court->image, 'court_images/')) {
                Storage::disk('public')->delete($court->image);
            }

            $validated['image'] = $request->file('image')->store('court_images', 'public');
        } else {
            unset($validated['image']);
        }

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
                'image' => $court->image,
                'created_at' => $court->created_at,
                'updated_at' => $court->updated_at,
                'sport' => $court->sport ? [
                    'id' => $court->sport->id,
                    'name' => $court->sport->name,
                    'code' => $court->sport->code,
                    'icon' => $court->sport->icon,
                    'description' => $court->sport->description,
                    'image' => $court->sport->image,
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

        if ($court->image && str_starts_with($court->image, 'court_images/')) {
            Storage::disk('public')->delete($court->image);
        }

        $court->delete();

        return response()->json([
            'status' => true,
            'message' => 'Lapangan berhasil dihapus',
        ]);
    }

    private function generateCourtCode(int $sportId, ?int $ignoreCourtId = null): string
    {
        $sport = Sport::findOrFail($sportId);
        $prefix = strtoupper($sport->code);
        $query = Court::where('sport_id', $sportId);

        if ($ignoreCourtId) {
            $query->where('id', '!=', $ignoreCourtId);
        }

        $numbers = $query
            ->pluck('code')
            ->map(function ($code) use ($prefix) {
                if (! preg_match('/^'.preg_quote($prefix, '/').'-(\d+)$/', (string) $code, $matches)) {
                    return null;
                }

                return (int) $matches[1];
            })
            ->filter()
            ->values();

        $nextNumber = ($numbers->max() ?? 0) + 1;

        do {
            $code = $prefix.'-'.str_pad((string) $nextNumber, 2, '0', STR_PAD_LEFT);
            $exists = Court::where('code', $code)
                ->when($ignoreCourtId, fn ($query) => $query->where('id', '!=', $ignoreCourtId))
                ->exists();
            $nextNumber++;
        } while ($exists);

        return $code;
    }
}
