<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegisterOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $otpCode;
    public $expiresAt;

    public function __construct($name, $otpCode, $expiresAt)
    {
        $this->name = $name;
        $this->otpCode = $otpCode;
        $this->expiresAt = $expiresAt;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kode OTP Registrasi',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.register-otp',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}