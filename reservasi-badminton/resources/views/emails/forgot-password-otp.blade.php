<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:8px;">
        
        <h2>Halo, {{ $name }} 👋</h2>

        <p>Kami menerima permintaan reset password untuk akun kamu.</p>

        <p>Gunakan kode OTP berikut:</p>

        <h1 style="text-align:center; color:red;">
            {{ $otpCode }}
        </h1>

        <p>Berlaku sampai:</p>
        <p><b>{{ $expiresAt }}</b></p>

        <p>Jika kamu tidak meminta reset password, abaikan email ini.</p>

        <hr>

        <p style="font-size:12px; color:#888;">
            Reservasi Badminton System
        </p>

    </div>
</body>
</html>