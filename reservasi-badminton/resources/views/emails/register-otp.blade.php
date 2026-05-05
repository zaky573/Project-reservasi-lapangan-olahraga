<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>OTP Registrasi</title>
</head>
<body style="font-family: Arial; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:8px;">
        
        <h2>Halo 👋</h2>

        <p>Terima kasih sudah mendaftar di <b>Reservasi Badminton</b>.</p>

        <p>Berikut adalah kode OTP kamu:</p>

        <h1 style="text-align:center; color:#2d89ef;">
            {{ $otpCode }}
        </h1>

        <p>Kode ini berlaku sampai:</p>
        <p><b>{{ $expiresAt }}</b></p>

        <p>Jangan berikan kode ini kepada siapa pun.</p>

        <hr>

        <p style="font-size:12px; color:#888;">
            Jika kamu tidak melakukan pendaftaran, abaikan email ini.
        </p>

    </div>
</body>
</html>