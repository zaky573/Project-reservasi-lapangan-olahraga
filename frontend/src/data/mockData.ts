export type UserRole = 'user' | 'admin' | 'super_admin';

export type CourtStatus = 'active' | 'inactive' | 'maintenance';
export type SlotStatus = 'available' | 'booked' | 'maintenance' | 'expired';
export type BookingStatus = 'dibooking' | 'sedang_digunakan' | 'selesai' | 'dibatalkan';
export type PaymentStatus = 'menunggu' | 'pembayaran_awal' | 'lunas' | 'menunggu_verifikasi_pembayaran_dp' | 'menunggu_verifikasi_pembayaran';
export type PaymentMethod = 'cash' | 'transfer';
export type SettlementMethod = 'transfer' | 'cash_at_venue';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
}

export interface Sport {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  image: string;
  image_file?: File | null;
  created_at: string;
}

export interface Court {
  id: string;
  sport_id: string;
  code: string;
  name: string;
  price_per_hour: number;
  status: CourtStatus;
  description: string;
  image: string;
  image_file?: File | null;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
}

export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  customer_name: string;
  customer_phone: string;
  status: BookingStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  paid_amount?: number;
  total_amount?: number;
  remaining_amount?: number;
  method: PaymentMethod;
  status: PaymentStatus;
  proof_url?: string;
  admin_note?: string;
  settlement_method?: SettlementMethod;
  pending_amount?: number;
  pending_proof_url?: string;
  customer_note?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'user@thearena.com',
    phone: '08123456789',
    role: 'user',
    password: 'user123',
  },
  {
    id: '2',
    name: 'Admin Arena',
    email: 'admin@thearena.com',
    phone: '08234567890',
    role: 'admin',
    password: 'admin123',
  },
  {
    id: '3',
    name: 'Super Admin',
    email: 'superadmin@thearena.com',
    phone: '08345678901',
    role: 'super_admin',
    password: 'super123',
  },
  {
    id: '4',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '08456789012',
    role: 'user',
    password: 'user123',
  },
];

export const mockSports: Sport[] = [
  {
    id: '1',
    name: 'Badminton',
    code: 'BDM',
    description: 'Lapangan badminton indoor dengan lantai vinyl berkualitas',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    icon: '🏸',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Futsal',
    code: 'FTS',
    description: 'Lapangan futsal outdoor dengan rumput sintetis premium',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
    icon: '⚽',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Basketball',
    code: 'BSK',
    description: 'Lapangan basket indoor dengan standar internasional',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    icon: '🏀',
    created_at: '2024-01-15T00:00:00Z',
  },
];

export const mockCourts: Court[] = [
  {
    id: '1',
    sport_id: '1',
    code: 'BDM-01',
    name: 'Badminton Court A',
    price_per_hour: 80000,
    status: 'active',
    description: 'Lapangan badminton standar internasional dengan pencahayaan LED',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: '2',
    sport_id: '1',
    code: 'BDM-02',
    name: 'Badminton Court B',
    price_per_hour: 80000,
    status: 'active',
    description: 'Lapangan badminton dengan AC dan sound system',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: '3',
    sport_id: '1',
    code: 'BDM-03',
    name: 'Badminton Court C',
    price_per_hour: 70000,
    status: 'maintenance',
    description: 'Lapangan badminton sedang dalam perbaikan lantai',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: '4',
    sport_id: '2',
    code: 'FSL-01',
    name: 'Futsal Court A',
    price_per_hour: 150000,
    status: 'active',
    description: 'Lapangan futsal outdoor dengan rumput sintetis premium',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
    created_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '5',
    sport_id: '2',
    code: 'FSL-02',
    name: 'Futsal Court B',
    price_per_hour: 150000,
    status: 'active',
    description: 'Lapangan futsal dengan lampu sorot untuk malam hari',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
    created_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '6',
    sport_id: '3',
    code: 'BSK-01',
    name: 'Basketball Court A',
    price_per_hour: 120000,
    status: 'active',
    description: 'Lapangan basket indoor dengan ring standar NBA',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    created_at: '2024-01-20T00:00:00Z',
  },
];

export const generateTimeSlots = (courtId: string, date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

  const court = mockCourts.find(c => c.id === courtId);

  hours.forEach((time, index) => {
    const endHour = hours[index + 1] || '22:00';
    let status: SlotStatus = 'available';

    if (court?.status === 'maintenance') {
      status = 'maintenance';
    } else {
      const random = Math.random();
      if (random < 0.3) {
        status = 'booked';
      }
    }

    slots.push({
      id: `slot-${courtId}-${date}-${time}`,
      court_id: courtId,
      date,
      start_time: time,
      end_time: endHour,
      status,
    });
  });

  return slots;
};

export const mockBookings: Booking[] = [
  {
    id: '1',
    user_id: '1',
    court_id: '1',
    date: '2026-04-25',
    start_time: '10:00',
    end_time: '11:00',
    total_price: 80000,
    customer_name: 'John Doe',
    customer_phone: '08123456789',
    status: 'dibooking',
    created_at: '2026-04-18T10:00:00Z',
  },
  {
    id: '2',
    user_id: '1',
    court_id: '4',
    date: '2026-04-22',
    start_time: '19:00',
    end_time: '20:00',
    total_price: 150000,
    customer_name: 'John Doe',
    customer_phone: '08123456789',
    status: 'dibooking',
    created_at: '2026-04-19T14:30:00Z',
  },
  {
    id: '3',
    user_id: '4',
    court_id: '2',
    date: '2026-04-21',
    start_time: '15:00',
    end_time: '16:00',
    total_price: 80000,
    customer_name: 'Jane Smith',
    customer_phone: '08456789012',
    status: 'selesai',
    created_at: '2026-04-15T09:00:00Z',
  },
];

export const mockPayments: Payment[] = [
  {
    id: '1',
    booking_id: '1',
    amount: 80000,
    method: 'transfer',
    status: 'lunas',
    proof_url: 'https://images.unsplash.com/photo-1554224311-beee460ae6fb?w=400',
    admin_note: 'Pembayaran sudah memenuhi syarat.',
    verified_by: '2',
    verified_at: '2026-04-18T11:00:00Z',
    created_at: '2026-04-18T10:30:00Z',
  },
  {
    id: '2',
    booking_id: '2',
    amount: 150000,
    method: 'transfer',
    status: 'menunggu',
    proof_url: 'https://images.unsplash.com/photo-1554224311-beee460ae6fb?w=400',
    created_at: '2026-04-19T15:00:00Z',
  },
  {
    id: '3',
    booking_id: '3',
    amount: 80000,
    method: 'cash',
    status: 'lunas',
    admin_note: 'Pembayaran sudah memenuhi syarat.',
    created_at: '2026-04-15T09:30:00Z',
  },
];
