import type { Booking, Court, Payment, Sport, TimeSlot, User } from '../data/mockData';
import { buildStorageUrl } from './api';

const DEFAULT_DATE = new Date().toISOString();

const SPORT_META: Record<string, { icon: string; description: string; image: string }> = {
  badminton: {
    icon: 'BD',
    description: 'Lapangan badminton indoor untuk pemesanan harian.',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
  },
  futsal: {
    icon: 'FS',
    description: 'Lapangan futsal untuk latihan dan pertandingan.',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
  },
  basketball: {
    icon: 'BS',
    description: 'Lapangan basket untuk latihan dan permainan tim.',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
  },
};

function asString(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function normalizeName(value: unknown) {
  const raw = asString(value, 'Olahraga');
  return titleCase(raw);
}

function sportMeta(name: string) {
  return SPORT_META[name.toLowerCase()] || {
    icon: name.slice(0, 2).toUpperCase() || 'SP',
    description: `Pemesanan lapangan ${name}.`,
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
  };
}

export function mapUser(item: any): User {
  return {
    id: asString(item?.id ?? item?.id_user),
    name: asString(item?.name),
    email: asString(item?.email),
    phone: asString(item?.phone),
    role: item?.role || 'user',
    password: '',
  };
}

export function mapSport(item: any): Sport {
  const name = normalizeName(item?.name);
  const meta = sportMeta(name);

  return {
    id: asString(item?.id_sport ?? item?.id),
    name,
    code: asString(item?.code, name.slice(0, 3).toUpperCase()),
    description: asString(item?.description, meta.description),
    icon: asString(item?.icon, meta.icon),
    created_at: asString(item?.created_at, DEFAULT_DATE),
  };
}

export function mapCourt(item: any): Court {
  const sportName = normalizeName(item?.sport?.name || item?.sport_name || 'Olahraga');
  const meta = sportMeta(sportName);

  return {
    id: asString(item?.id_court ?? item?.id),
    sport_id: asString(item?.sport?.id_sport ?? item?.sport?.id ?? item?.sport_id),
    code: asString(item?.code),
    name: asString(item?.name),
    price_per_hour: asNumber(item?.price_per_hour),
    status: item?.status || 'active',
    description: asString(item?.description, `Lapangan ${item?.name || ''}`.trim()),
    image: asString(item?.image, meta.image),
    created_at: asString(item?.created_at, DEFAULT_DATE),
  };
}

export function mapBookingStatus(status: string): Booking['status'] {
  switch (status) {
    case 'dibooking':
    case 'sedang_digunakan':
    case 'selesai':
    case 'dibatalkan':
      return status;
    case 'in_use':
      return 'sedang_digunakan';
    case 'completed':
      return 'selesai';
    case 'cancelled':
      return 'dibatalkan';
    case 'pending':
    case 'confirmed':
      return 'dibooking';
    default:
      return (status as Booking['status']) || 'dibooking';
  }
}

export function toBackendPaymentStatus(status?: string) {
  switch (status) {
    case 'paid':
      return 'lunas';
    case 'pending':
      return 'pembayaran_awal';
    case 'pending_verification':
      return 'menunggu';
    case 'rejected':
      return 'menunggu';
    default:
      return status;
  }
}

export function mapPaymentStatus(status: string): Payment['status'] {
  switch (status) {
    case 'menunggu':
    case 'pembayaran_awal':
    case 'verifikasi_pembayaran_sisa':
    case 'lunas':
      return status;
    case 'sedang_digunakan':
      return 'lunas';
    case 'dibayar_sebagian':
      return 'pembayaran_awal';
    case 'ditolak':
      return 'menunggu';
    case 'paid':
      return 'lunas';
    case 'pending':
      return 'pembayaran_awal';
    case 'pending_verification':
      return 'menunggu';
    default:
      return (status as Payment['status']) || 'menunggu';
  }
}

export function mapBooking(item: any): Booking {
  return {
    id: asString(item?.id_booking ?? item?.id),
    user_id: asString(item?.user?.id_user ?? item?.user?.id ?? item?.user_id),
    court_id: asString(item?.court?.id_court ?? item?.court?.id ?? item?.court_id),
    date: asString(item?.booking_date ?? item?.date),
    start_time: asString(item?.start_time),
    end_time: asString(item?.end_time),
    total_price: asNumber(item?.total_price),
    customer_name: asString(item?.customer_name),
    customer_phone: asString(item?.phone ?? item?.customer_phone),
    status: mapBookingStatus(asString(item?.status, 'dibooking')),
    created_at: asString(item?.created_at, DEFAULT_DATE),
  };
}

export function mapPayment(item: any): Payment {
  const details = Array.isArray(item?.payment_details) ? item.payment_details : [];
  const pendingDetail = details.find((detail: any) => detail?.status === 'menunggu' && detail?.proof_file);
  const acceptedDetail = details.find((detail: any) => detail?.status === 'diterima' && detail?.proof_file);
  const latestDetail = pendingDetail || acceptedDetail || details[0];
  const paidAmount = asNumber(item?.paid_amount);
  const totalAmount = asNumber(item?.total_amount ?? item?.amount);
  const submittedAmount = asNumber(latestDetail?.amount, paidAmount || totalAmount);
  const status = mapPaymentStatus(asString(item?.payment_status ?? item?.status, 'menunggu'));
  const displayAmount = status === 'lunas' || status === 'pembayaran_awal' || status === 'verifikasi_pembayaran_sisa'
    ? paidAmount || submittedAmount
    : submittedAmount;
  const proofPath = acceptedDetail?.proof_file || (!pendingDetail ? latestDetail?.proof_file || item?.proof_file : undefined);

  return {
    id: asString(item?.id_payment ?? item?.id),
    booking_id: asString(item?.booking?.id_booking ?? item?.booking?.id ?? item?.booking_id),
    amount: displayAmount,
    paid_amount: paidAmount,
    total_amount: totalAmount,
    method: item?.payment_method || item?.method || 'transfer',
    status,
    proof_url: buildStorageUrl(proofPath),
    admin_note: asString(item?.remaining_notice || latestDetail?.notes || item?.admin_note, undefined as any),
    pending_amount: status === 'menunggu' ? submittedAmount : undefined,
    pending_proof_url: pendingDetail ? buildStorageUrl(pendingDetail.proof_file) : undefined,
    verified_by: asString(latestDetail?.verified_by?.id_user ?? latestDetail?.verified_by, undefined as any),
    verified_at: asString(latestDetail?.verified_at, undefined as any),
    created_at: asString(item?.created_at, DEFAULT_DATE),
  };
}

export function mapPaymentFromBooking(item: any) {
  if (!item?.payment) return null;
  return mapPayment({
    ...item.payment,
    booking: {
      id_booking: item.id_booking,
    },
  });
}

export function mapTimeSlot(item: any, courtId: string, date: string): TimeSlot {
  return {
    id: asString(item?.slot_id, `${courtId}-${date}-${item?.start_time}`),
    court_id: courtId,
    date,
    start_time: asString(item?.start_time),
    end_time: asString(item?.end_time),
    status: item?.status || (item?.is_available ? 'available' : 'booked'),
  };
}

export function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}
