<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Court extends Model
{
    use HasFactory;

    protected $fillable = [
        'sport_id',
        'name',
        'code',
        'price_per_hour',
        'status',
        'description',
        'image',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function sport()
    {
        return $this->belongsTo(Sport::class);
    }
}
