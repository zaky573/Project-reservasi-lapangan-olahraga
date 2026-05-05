<?php

namespace App\Mail;

use DateTimeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $otpCode,
        public DateTimeInterface $expiresAt,
        public string $type = 'registration'
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectText(),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.sendmail',
            with: [
                'name' => $this->name,
                'otpCode' => $this->otpCode,
                'expiresAt' => $this->expiresAt,
                'expiresAtText' => $this->expiresAt->format('Y-m-d H:i:s'),
                'subjectText' => $this->subjectText(),
                'titleText' => $this->titleText(),
                'bodyText' => $this->bodyText(),
                'noteText' => $this->noteText(),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }

    private function subjectText(): string
    {
        return match ($this->type) {
            'forgot_password' => 'Kode OTP Reset Password',
            default => 'Kode OTP Registrasi',
        };
    }

    private function titleText(): string
    {
        return match ($this->type) {
            'forgot_password' => 'Reset Password Akun',
            default => 'Verifikasi Registrasi Akun',
        };
    }

    private function bodyText(): string
    {
        return match ($this->type) {
            'forgot_password' => 'Gunakan kode OTP berikut untuk mereset password akun Reservasi Badminton Anda.',
            default => 'Gunakan kode OTP berikut untuk menyelesaikan registrasi akun Reservasi Badminton Anda.',
        };
    }

    private function noteText(): string
    {
        return match ($this->type) {
            'forgot_password' => 'Jika Anda tidak meminta reset password, abaikan email ini.',
            default => 'Jika Anda tidak merasa melakukan registrasi, abaikan email ini.',
        };
    }
}
