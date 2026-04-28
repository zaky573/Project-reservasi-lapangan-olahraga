# Alur Integrasi Frontend dan Backend

Project ini bisa disatukan. Struktur yang paling aman adalah menjadikan `reservasi-badminton` sebagai backend utama Laravel, lalu frontend React/Vite dipasang sebagai tampilan aplikasi yang memanggil API Laravel.

## Target Struktur

```text
Tugas-UAS/
├─ frontend/               # React/Vite saat development
└─ reservasi-badminton/    # Laravel API + server utama
```

Untuk development, keduanya tetap boleh jalan terpisah:

```text
Frontend: http://localhost:5173
Backend : http://127.0.0.1:8000/api
```

Untuk produksi/pengumpulan, frontend bisa di-build lalu hasilnya disajikan oleh Laravel:

```text
reservasi-badminton/public/app
```

## Alur Besar

1. Backend Laravel tetap menjadi sumber data utama.
   Semua data user, lapangan, sport, booking, payment, dashboard, admin, dan laporan diambil dari database lewat route API Laravel.

2. Frontend tidak lagi memakai `mockData` sebagai data utama.
   Data di `frontend/src/data/mockData.ts` hanya dipakai sebagai referensi tipe atau sementara saat migrasi.

3. Frontend membuat layer API client.
   Nanti dibuat file seperti:

   ```text
   frontend/src/lib/api.ts
   ```

   File ini bertugas mengirim request ke Laravel, menyisipkan token login, dan menangani error validasi.

4. Login memakai token Sanctum dari backend.
   Setelah user login lewat `POST /api/login`, frontend menyimpan token ke `localStorage`, lalu request berikutnya memakai header:

   ```text
   Authorization: Bearer <token>
   ```

5. Role user diarahkan sesuai data backend.
   Backend sudah mengembalikan `redirect_to`, jadi frontend bisa mengikuti:

   ```text
   user        -> /sports
   admin       -> /dashboard
   super_admin -> /dashboard
   ```

6. Route React tetap dipakai untuk halaman.
   Laravel melayani API, React melayani navigasi halaman seperti `/login`, `/sports`, `/dashboard`, dan halaman admin.

## Alur Request Aplikasi

### 1. Register dan OTP

```text
User isi form register
Frontend POST /api/register
Backend simpan pending registration + kirim OTP email
User isi OTP
Frontend POST /api/register/verify-otp
Backend buat user + kirim token
Frontend simpan user/token
Frontend redirect sesuai role
```

Endpoint terkait:

```text
POST /api/register
POST /api/register/verify-otp
POST /api/register/resend-otp
```

### 2. Login

```text
User isi email/password
Frontend POST /api/login
Backend validasi user
Backend balikin token, user, role, redirect_to
Frontend simpan token + user ke localStorage
Frontend redirect ke halaman sesuai role
```

Endpoint:

```text
POST /api/login
GET  /api/me
POST /api/logout
```

### 3. Lihat Sport dan Lapangan

```text
Frontend buka /sports
Frontend GET /api/sports
User pilih sport
Frontend buka /sports/:sportId/courts
Frontend GET /api/courts
User pilih lapangan
Frontend GET /api/courts/{id}
```

Endpoint:

```text
GET /api/sports
GET /api/courts
GET /api/courts/{id}
GET /api/schedules
```

### 4. Booking

```text
User pilih lapangan, tanggal, dan jam
Frontend POST /api/bookings
Backend validasi jadwal dan simpan booking
Frontend lanjut ke pembayaran
Frontend GET /api/payments/{bookingId}/preview
User pilih metode pembayaran
Frontend POST /api/payments/{bookingId}
Jika transfer, frontend upload bukti
Frontend POST /api/payments/{bookingId}/upload-proof
Frontend tampilkan booking success
```

Endpoint:

```text
POST /api/bookings
GET  /api/my-bookings
GET  /api/payments/{bookingId}/preview
POST /api/payments/{bookingId}
POST /api/payments/{bookingId}/upload-proof
POST /api/payments/{bookingId}/details
GET  /api/payments/{bookingId}/details
```

### 5. Admin

```text
Admin login
Frontend simpan token admin
Frontend buka /dashboard
Frontend GET /api/dashboard
Admin kelola sport, lapangan, booking, dan payment
Setiap aksi frontend memanggil API admin Laravel
```

Endpoint:

```text
GET    /api/dashboard
POST   /api/sports
PUT    /api/sports/{id}
DELETE /api/sports/{id}
POST   /api/courts
PUT    /api/courts/{id}
DELETE /api/courts/{id}
GET    /api/bookings
PUT    /api/bookings/{id}
DELETE /api/bookings/{id}
GET    /api/payments
PUT    /api/payments/{id}/verify
PUT    /api/payment-details/{id}/verify
POST   /api/payments/{bookingId}/cash-payment
```

### 6. Super Admin

```text
Super admin login
Frontend buka menu super admin
Super admin tambah admin
Super admin lihat laporan booking
```

Endpoint:

```text
POST /api/admins
GET  /api/reports/bookings
```

## Tahapan Pengerjaan

### Tahap 1: Rapikan Koneksi API

1. Tambah konfigurasi URL backend di frontend.
2. Buat API client untuk `GET`, `POST`, `PUT`, `DELETE`, dan upload file.
3. Simpan token dari login ke `localStorage`.
4. Tambahkan header `Authorization` otomatis.

### Tahap 2: Ganti Auth Mock ke Backend

1. Ubah `AuthContext` supaya login memanggil `/api/login`.
2. Ubah register supaya mengikuti alur OTP backend.
3. Ubah forgot password supaya memanggil endpoint backend.
4. Saat refresh browser, panggil `/api/me` untuk cek user aktif.
5. Logout memanggil `/api/logout`.

### Tahap 3: Ganti Data Halaman User

1. `SportsPage` ambil data dari `/api/sports`.
2. `CourtsPage` dan `CourtDetailPage` ambil data dari `/api/courts`.
3. `BookingPage` membuat booking dan payment lewat API.
4. `MyBookingsPage` ambil data dari `/api/my-bookings`.

### Tahap 4: Ganti Data Halaman Admin

1. `DashboardPage` ambil data dari `/api/dashboard`.
2. `SportsManagementPage` pakai API CRUD sport.
3. `CourtsManagementPage` pakai API CRUD court.
4. `BookingsManagementPage` pakai API booking admin.
5. `PaymentsManagementPage` pakai API payment admin.

### Tahap 5: Build Frontend ke Laravel

1. Jalankan build di folder frontend:

   ```bash
   npm run build
   ```

2. Copy hasil build `frontend/dist` ke:

   ```text
   reservasi-badminton/public/app
   ```

3. Tambahkan route Laravel fallback untuk menampilkan React app.
4. Pastikan semua route React tetap bisa dibuka saat refresh browser.

## Opsi Penyatuan

### Opsi A: Tetap Dua Folder, Terhubung API

Ini paling cocok untuk pengerjaan sekarang.

Kelebihan:

```text
Lebih aman
Mudah debug
Frontend dan backend tidak saling merusak struktur
Cocok untuk development
```

Kekurangan:

```text
Saat jalan lokal perlu dua server
```

### Opsi B: Frontend Dipindah ke Laravel

Frontend React dipindahkan ke `reservasi-badminton/resources/js`.

Kelebihan:

```text
Satu project Laravel penuh
Satu dev server Laravel + Vite
Lebih rapi untuk deployment Laravel
```

Kekurangan:

```text
Butuh penyesuaian struktur import, Vite config, package.json, dan asset
Risiko error lebih besar kalau langsung dipindah
```

### Opsi C: Build Frontend Masuk Public Laravel

Frontend tetap dikembangkan di folder `frontend`, tapi hasil build masuk ke `reservasi-badminton/public/app`.

Kelebihan:

```text
Frontend dan backend tetap rapi
Deployment bisa lewat Laravel
Risiko lebih kecil daripada memindahkan source React
```

Kekurangan:

```text
Setiap update frontend perlu build ulang
```

## Rekomendasi

Gunakan alur ini:

```text
Development : Opsi A
Final/demo  : Opsi C
```

Jadi sekarang frontend dan backend tidak perlu langsung dicampur total. Yang penting frontend benar-benar memakai API Laravel dulu. Setelah semua fitur jalan, baru hasil build React dimasukkan ke Laravel supaya aplikasi terasa seperti satu project.

## Checklist Sebelum Implementasi

```text
[x] Pastikan backend Laravel bisa jalan
[ ] Pastikan database dan migration sudah siap
[x] Pastikan endpoint login/register berjalan
[x] Buat API client frontend
[x] Ganti AuthContext dari mock ke API
[x] Ganti halaman user dari mock ke API untuk auth, jadwal, booking, dan payment
[~] Ganti halaman admin dari mock ke API untuk data utama dan aksi pembayaran
[ ] Tes login user, admin, super_admin dengan akun database
[ ] Tes booking dan payment manual dari browser
[x] Build frontend
[x] Sajikan build frontend lewat Laravel
```

## Status Implementasi Saat Ini

```text
[x] Frontend punya API client: frontend/src/lib/api.ts
[x] Frontend punya adapter data backend ke format UI: frontend/src/lib/adapters.ts
[x] Vite proxy /api dan /storage ke Laravel saat development
[x] Vite build langsung masuk ke reservasi-badminton/public/app
[x] Laravel route web melayani React build untuk route seperti /login dan /sports
[x] AuthContext utama sudah memakai API Laravel
[x] Register memakai OTP backend
[x] Forgot password memakai OTP backend
[x] Jadwal lapangan memakai /api/schedules
[x] Booking membuat data ke /api/bookings
[x] Payment detail/upload bukti memakai /api/payments/{bookingId}/details
[x] Super admin bisa akses route admin karena AdminMiddleware menerima admin dan super_admin
```

Catatan verifikasi:

```text
Frontend build berhasil.
Laravel route:list berhasil dengan PHP 8.3.
http://127.0.0.1:8000/ mengembalikan React app.
http://127.0.0.1:8000/api/sports mengembalikan JSON dari database.
```
