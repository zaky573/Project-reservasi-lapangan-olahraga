<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PendingRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'otp_code',
        'otp_expires_at',
        'last_otp_sent_at',
    ];

    protected $hidden = [
        'password',
        'otp_code',
    ];

    protected function casts(): array
    {
        return [
            'otp_expires_at' => 'datetime',
            'last_otp_sent_at' => 'datetime',
        ];
    }
}
