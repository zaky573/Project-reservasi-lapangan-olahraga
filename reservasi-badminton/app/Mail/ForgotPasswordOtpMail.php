<?php
namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Content;

class ForgotPasswordOtpMail extends Mailable
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
            subject: 'Reset Password OTP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.forgot-password-otp',
        );
    }
}