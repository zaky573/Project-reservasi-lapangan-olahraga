<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'court_id',
        'booking_date',
        'start_time',
        'end_time',
        'total_hours',
        'total_price',
        'customer_name',
        'phone',
        'notes',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function court()
    {
        return $this->belongsTo(Court::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}