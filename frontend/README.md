# THE ARENA - Sistem Reservasi Lapangan Olahraga

Aplikasi web lengkap untuk reservasi lapangan olahraga dengan 3 role: User, Admin, dan Super Admin.

## 🎨 Fitur Utama

### User (Customer)
- ✅ Landing page informatif
- ✅ Login & Register dengan validasi
- ✅ Browse daftar sport (Badminton, Futsal, Basketball)
- ✅ Browse daftar lapangan per sport
- ✅ Detail lapangan dengan informasi lengkap
- ✅ **Pilih jadwal slot seperti kursi bioskop** (dengan status: available, booked, maintenance)
- ✅ Form booking dengan validasi
- ✅ Pilih metode pembayaran (Cash / Transfer)
- ✅ Upload bukti pembayaran (untuk transfer)
- ✅ Halaman konfirmasi booking
- ✅ Riwayat booking dengan status lengkap

### Admin
- ✅ Dashboard dengan ringkasan data & chart
- ✅ Management Sports (CRUD)
- ✅ Management Lapangan (CRUD) dengan status
- ✅ Management Bookings (view & filter)
- ✅ **Management Payments** dengan fitur:
  - View bukti pembayaran
  - Approve / Reject pembayaran
  - Filter by status

### Super Admin
- ✅ Semua fitur Admin
- ✅ Management Admin (create & delete admin)
- ✅ Reports & Analytics dengan:
  - Filter berdasarkan periode
  - Chart pendapatan per hari
  - Chart booking per sport
  - Summary total pendapatan

## 🎨 Design System

**Color Palette:**
- Primary: `#281C59` (Dark Purple)
- Secondary: `#4E8D9C` (Teal)
- Accent/Success: `#85C79A` (Sage Green)
- Muted/Warning: `#EDF7BD` (Light Yellow-Green)

## 🔐 Demo Accounts

```
User:
Email: user@thearena.com
Password: user123

Admin:
Email: admin@thearena.com
Password: admin123

Super Admin:
Email: superadmin@thearena.com
Password: super123
```

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Charts:** Recharts
- **Icons:** Lucide React
- **State:** React Context API

## 📦 Mock Data

Aplikasi saat ini menggunakan mock data untuk demonstrasi. Data tersimpan di `src/data/mockData.ts` dan dikelola melalui Context API.

## 🔄 Integrasi Supabase (Opsional)

Untuk production dengan database real:
1. Buka **Make Settings Page**
2. Connect Supabase project
3. Setup database tables sesuai struktur di `mockData.ts`
4. Update Context untuk menggunakan Supabase client

## 📱 Fitur Responsif

Aplikasi dirancang responsive dan dapat diakses dari desktop, tablet, dan mobile.

## 🎯 Flow Aplikasi

### User Flow:
1. Landing Page → Register/Login
2. Pilih Sport → Pilih Lapangan
3. Pilih Tanggal & Slot Waktu (UI seperti kursi bioskop)
4. Isi Form Booking + Pilih Payment Method
5. Upload Bukti (jika transfer)
6. Konfirmasi → Lihat Riwayat

### Admin Flow:
1. Login → Dashboard
2. Manage: Sports, Courts, Bookings, Payments
3. Verifikasi pembayaran (approve/reject)

### Super Admin Flow:
1. Login → Dashboard Global
2. Manage Admins
3. View Reports & Analytics

## 📊 Status Definitions

**Court Status:**
- `active`: Lapangan tersedia untuk booking
- `inactive`: Lapangan tidak aktif
- `maintenance`: Lapangan dalam perbaikan

**Slot Status:**
- `available`: Slot tersedia (hijau)
- `booked`: Sudah dibooking (abu-abu)
- `maintenance`: Maintenance (kuning)

**Booking Status:**
- `pending`: Menunggu konfirmasi
- `confirmed`: Terkonfirmasi
- `completed`: Selesai
- `cancelled`: Dibatalkan

**Payment Status:**
- `pending`: Belum dibayar
- `pending_verification`: Menunggu verifikasi admin
- `paid`: Sudah dibayar
- `rejected`: Ditolak admin

---

**© 2026 THE ARENA - Built with ❤️ using Figma Make**
