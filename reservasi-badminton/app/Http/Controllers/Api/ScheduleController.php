<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'court_id' => 'required|exists:courts,id',
        ]);

        $date = $request->date;
        $court = Court::with('sport')->find($request->court_id);
        $timezone = config('app.timezone', 'Asia/Jakarta');
        $now = Carbon::now($timezone);
        $requestedDate = Carbon::createFromFormat('Y-m-d', $date, $timezone)->toDateString();
        $today = $now->toDateString();

        if (! $court) {
            return response()->json([
                'status' => false,
                'message' => 'Lapangan tidak ditemukan',
            ], 404);
        }

        $bookings = Booking::where('court_id', $court->id)
            ->where('booking_date', $date)
            ->whereNotIn('status', ['dibatalkan', 'cancelled'])
            ->get();

        $slots = [];
        $startHour = 8;
        $endHour = 22;

        for ($hour = $startHour; $hour < $endHour; $hour++) {
            $slotStart = Carbon::createFromFormat('H:i', sprintf('%02d:00', $hour));
            $slotEnd = Carbon::createFromFormat('H:i', sprintf('%02d:00', $hour + 1));

            $status = 'available';
            $isExpired = $requestedDate < $today
                || (
                    $requestedDate === $today
                    && Carbon::createFromFormat('Y-m-d H:i', $date.' '.$slotStart->format('H:i'), $timezone)->lte($now)
                );

            if ($court->status === 'maintenance') {
                $status = 'maintenance';
            } else {
                foreach ($bookings as $booking) {
                    $bookingStart = Carbon::createFromFormat('H:i:s', $booking->start_time);
                    $bookingEnd = Carbon::createFromFormat('H:i:s', $booking->end_time);

                    if ($slotStart < $bookingEnd && $slotEnd > $bookingStart) {
                        $status = 'booked';
                        break;
                    }
                }

                if ($status === 'available' && $isExpired) {
                    $status = 'expired';
                }
            }

            $slots[] = [
                'slot_id' => $slotStart->format('H:i').'_'.$slotEnd->format('H:i'),
                'slot_label' => $slotStart->format('H:i').' - '.$slotEnd->format('H:i'),
                'start_time' => $slotStart->format('H:i'),
                'end_time' => $slotEnd->format('H:i'),
                'price_per_hour' => $court->price_per_hour,
                'status' => $status,
                'is_available' => $status === 'available',
            ];
        }

        $availableSlotsCount = collect($slots)->where('status', 'available')->count();
        $bookedSlotsCount = collect($slots)->where('status', 'booked')->count();

        return response()->json([
            'status' => true,
            'message' => 'Jadwal slot berhasil diambil',
            'data' => [
                'court' => [
                    'id_court' => $court->id,
                    'name' => $court->name,
                    'code' => $court->code,
                    'status' => $court->status,
                    'sport' => $court->sport ? [
                        'id_sport' => $court->sport->id,
                        'name' => $court->sport->name,
                    ] : null,
                ],
                'date' => $date,
                'available_slots_count' => $availableSlotsCount,
                'booked_slots_count' => $bookedSlotsCount,
                'slots' => $slots,
            ],
        ]);
    }
}
