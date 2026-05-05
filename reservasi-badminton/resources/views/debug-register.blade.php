<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Debug Register OTP</title>
    <style>
        body {
            margin: 0;
            background: #f6f7f9;
            color: #17202a;
            font-family: Arial, sans-serif;
        }

        main {
            width: min(680px, calc(100% - 32px));
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #d9dee5;
            border-radius: 8px;
            padding: 24px;
        }

        h1 {
            margin: 0 0 18px;
            font-size: 24px;
        }

        label {
            display: block;
            margin: 14px 0 6px;
            font-weight: 700;
        }

        input {
            box-sizing: border-box;
            width: 100%;
            border: 1px solid #b8c0cc;
            border-radius: 6px;
            font: inherit;
            padding: 10px 12px;
        }

        button {
            margin-top: 18px;
            border: 0;
            border-radius: 6px;
            background: #2563eb;
            color: #ffffff;
            cursor: pointer;
            font: inherit;
            font-weight: 700;
            padding: 11px 16px;
        }

        .errors {
            background: #fff1f2;
            border: 1px solid #fecdd3;
            border-radius: 6px;
            color: #9f1239;
            margin-bottom: 18px;
            padding: 12px 14px;
        }

        .status {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 6px;
            color: #065f46;
            margin-bottom: 18px;
            padding: 12px 14px;
        }
    </style>
</head>
<body>
    <main>
        <h1>Debug Register OTP</h1>

        @if (session('status'))
            <div class="status">{{ session('status') }}</div>
        @endif

        @if (session('mail_error'))
            <div class="errors">{{ session('mail_error') }}</div>
        @endif

        @if ($errors->any())
            <div class="errors">
                @foreach ($errors->all() as $error)
                    <div>{{ $error }}</div>
                @endforeach
            </div>
        @endif

        <form method="post" action="{{ url('/debug/register') }}">
            @csrf

            <label for="name">Nama</label>
            <input id="name" name="name" value="{{ old('name', 'mas chep') }}" required>

            <label for="email">Email Tujuan</label>
            <input id="email" name="email" type="email" value="{{ old('email', 'chepisyahbudienbasil@gmail.com') }}" required>

            <label for="phone">Nomor Telepon</label>
            <input id="phone" name="phone" value="{{ old('phone', '081111111111111') }}" required>

            <label for="password">Password</label>
            <input id="password" name="password" type="password" value="password123" required>

            <label for="password_confirmation">Konfirmasi Password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" value="password123" required>

            <button type="submit">Register dan Kirim OTP</button>
        </form>
    </main>
</body>
</html>
