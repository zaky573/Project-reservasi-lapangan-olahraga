<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $subjectText }}</title>
</head>
<body style="margin:0; padding:0; background:#f4f7fb; color:#17202a; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb; margin:0; padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; background:#ffffff; border:1px solid #dbe3ef; border-radius:8px; overflow:hidden;">
                    <tr>
                        <td style="background:#0f766e; padding:22px 26px;">
                            <div style="color:#ffffff; font-size:20px; font-weight:700; line-height:1.35;">
                                Reservasi Badminton
                            </div>
                            <div style="color:#ccfbf1; font-size:13px; line-height:1.6; margin-top:3px;">
                                {{ $titleText }}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 26px 8px;">
                            <p style="margin:0 0 14px; color:#17202a; font-size:16px; line-height:1.6;">
                                Halo {{ $name }},
                            </p>
                            <p style="margin:0; color:#334155; font-size:15px; line-height:1.7;">
                                {{ $bodyText }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:22px 26px;">
                            <div style="display:inline-block; border:1px solid #99f6e4; border-radius:8px; background:#ecfdf5; padding:16px 24px;">
                                <div style="color:#0f766e; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">
                                    Kode OTP
                                </div>
                                <div style="color:#0f172a; font-size:36px; font-weight:700; letter-spacing:8px; line-height:1.25; margin-top:6px;">
                                    {{ $otpCode }}
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 26px 26px;">
                            <p style="margin:0 0 12px; color:#475569; font-size:14px; line-height:1.7;">
                                Kode ini berlaku sampai <strong>{{ $expiresAtText }}</strong>.
                            </p>
                            <p style="margin:0; color:#64748b; font-size:13px; line-height:1.7;">
                                Jangan berikan kode ini kepada siapa pun. {{ $noteText }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="border-top:1px solid #e2e8f0; padding:16px 26px; background:#f8fafc;">
                            <p style="margin:0; color:#64748b; font-size:12px; line-height:1.6;">
                                Email ini dikirim otomatis oleh sistem Reservasi Badminton.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
