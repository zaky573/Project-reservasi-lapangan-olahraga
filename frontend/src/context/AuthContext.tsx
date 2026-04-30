import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Booking, Court, Payment, PaymentMethod, Sport, TimeSlot, User } from '../data/mockData';
import { apiClient, ApiError } from '../lib/api';
import {
  mapBooking,
  mapCourt,
  mapPayment,
  mapPaymentFromBooking,
  mapSport,
  mapTimeSlot,
  mapUser,
  toBackendPaymentStatus,
  uniqueById,
} from '../lib/adapters';

type ApiResponse<T> = {
  status: boolean;
  message: string;
  data: T;
  token?: string;
};

type BookingPaymentPayload = {
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  phone: string;
  payment_method: PaymentMethod;
  amount: number;
  proof_file?: File | null;
  notes?: string;
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  sendRegisterOtp: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyRegisterOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  sendPasswordResetOtp: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
  fetchSchedule: (courtId: string, date: string) => Promise<TimeSlot[]>;
  createBookingWithPayment: (payload: BookingPaymentPayload) => Promise<{ booking: Booking; payment: Payment }>;
  submitPaymentDetail: (
    bookingId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    proofFile?: File | null,
    notes?: string
  ) => Promise<Payment>;
  users: User[];
  bookings: Booking[];
  payments: Payment[];
  sports: Sport[];
  courts: Court[];
  addBooking: (booking: Booking) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  addSport: (sport: Sport) => void;
  updateSport: (sportId: string, updates: Partial<Sport>) => void;
  deleteSport: (sportId: string) => void;
  addCourt: (court: Court) => void;
  updateCourt: (courtId: string, updates: Partial<Court>) => void;
  deleteCourt: (courtId: string) => void;
  addUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  resetAdminPassword: (userId: string, password?: string) => Promise<{ success: boolean; message: string; password?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'currentUser';

function readSavedUser() {
  const savedUser = localStorage.getItem(USER_KEY);
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function apiMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

function replaceById<T extends { id: string }>(items: T[], item: T) {
  const exists = items.some((currentItem) => currentItem.id === item.id);
  return exists
    ? items.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
    : [item, ...items];
}

function extractBookingUsers(bookings: any[], payments: any[]) {
  const bookingUsers = bookings
    .map((booking) => booking?.user)
    .filter(Boolean)
    .map(mapUser);
  const paymentUsers = payments
    .map((payment) => payment?.booking?.user)
    .filter(Boolean)
    .map(mapUser);

  return uniqueById([...bookingUsers, ...paymentUsers]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => readSavedUser());
  const [users, setUsers] = useState<User[]>(() => {
    const savedUser = readSavedUser();
    return savedUser ? [savedUser] : [];
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordResetOtp, setPasswordResetOtp] = useState<{ email: string; otp: string } | null>(null);

  const persistAuth = (user: User, token?: string) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setUsers((currentUsers) => uniqueById([user, ...currentUsers]));
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
    setUsers([]);
    setBookings([]);
    setPayments([]);
  };

  const loadPublicData = async () => {
    const [sportsResponse, courtsResponse] = await Promise.all([
      apiClient.get<ApiResponse<any[]>>('/sports'),
      apiClient.get<ApiResponse<any[]>>('/courts'),
    ]);

    setSports(sportsResponse.data.map(mapSport));
    setCourts(courtsResponse.data.map(mapCourt));
  };

  const loadUserData = async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/my-bookings');
    const apiBookings = response.data;
    const mappedBookings = apiBookings.map(mapBooking);
    const mappedPayments = apiBookings.map(mapPaymentFromBooking).filter(Boolean) as Payment[];

    setBookings(mappedBookings);
    setPayments(mappedPayments);
  };

  const loadAdminData = async (user = currentUser) => {
    const [bookingsResponse, paymentsResponse, adminsResponse] = await Promise.all([
      apiClient.get<ApiResponse<any[]>>('/bookings'),
      apiClient.get<ApiResponse<any[]>>('/payments'),
      user?.role === 'super_admin'
        ? apiClient.get<ApiResponse<any[]>>('/admins')
        : Promise.resolve(null),
    ]);

    const apiBookings = bookingsResponse.data;
    const apiPayments = paymentsResponse.data;
    const apiAdmins = adminsResponse?.data || [];
    const mappedBookings = apiBookings.map(mapBooking);
    const mappedPayments = apiPayments.map(mapPayment);
    const relatedUsers = extractBookingUsers(apiBookings, apiPayments);
    const adminUsers = apiAdmins.map(mapUser);

    setBookings(mappedBookings);
    setPayments(mappedPayments);
    setUsers((currentUsers) => uniqueById([...(user ? [user] : []), ...currentUsers, ...relatedUsers, ...adminUsers]));
  };

  const loadProtectedData = async (user = currentUser) => {
    if (!user) return;

    if (user.role === 'user') {
      await loadUserData();
      return;
    }

    await loadAdminData(user);
  };

  const refreshData = async () => {
    await loadPublicData();
    await loadProtectedData();
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        await loadPublicData();

        if (localStorage.getItem(TOKEN_KEY)) {
          const response = await apiClient.get<ApiResponse<any>>('/me');
          const user = mapUser(response.data);
          persistAuth(user);
          await loadProtectedData(user);
        }
      } catch (error) {
        if (localStorage.getItem(TOKEN_KEY)) {
          clearAuth();
        }
        console.warn(apiMessage(error, 'Gagal memuat data awal'));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<ApiResponse<{ user: any; token: string; redirect_to?: string }>>('/login', {
        email,
        password,
      });
      const token = response.token || response.data.token;
      const user = mapUser(response.data.user);

      persistAuth(user, token);
      await loadProtectedData(user);
      return true;
    } catch (error) {
      console.warn(apiMessage(error, 'Login gagal'));
      return false;
    }
  };

  const logout = () => {
    apiClient.post('/logout').catch(() => undefined);
    clearAuth();
  };

  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    try {
      await apiClient.post('/register', {
        name,
        email,
        phone,
        password,
        password_confirmation: password,
      });

      return true;
    } catch (error) {
      console.warn(apiMessage(error, 'Registrasi gagal'));
      return false;
    }
  };

  const sendRegisterOtp = async (email: string) => {
    try {
      const response = await apiClient.post<ApiResponse<{ email: string; expires_at: string }>>('/register/resend-otp', {
        email,
      });

      return {
        success: true,
        message: response.message || 'Kode OTP baru berhasil dikirim.',
      };
    } catch (error) {
      return {
        success: false,
        message: apiMessage(error, 'Gagal mengirim ulang OTP. Silakan daftar ulang.'),
      };
    }
  };

  const verifyRegisterOtp = async (email: string, otp: string) => {
    try {
      const response = await apiClient.post<ApiResponse<{ user: any; token: string }>>('/register/verify-otp', {
        email,
        otp,
      });
      const user = mapUser(response.data.user);

      persistAuth(user, response.data.token);
      await loadProtectedData(user);

      return {
        success: true,
        message: response.message || 'Registrasi berhasil diverifikasi.',
      };
    } catch (error) {
      return {
        success: false,
        message: apiMessage(error, 'Kode OTP tidak valid.'),
      };
    }
  };

  const sendPasswordResetOtp = async (email: string) => {
    try {
      const response = await apiClient.post<ApiResponse<{ email: string; expires_at: string }>>(
        '/forgot-password/request-otp',
        { email }
      );

      return {
        success: true,
        message: response.message || 'OTP reset password berhasil dikirim.',
      };
    } catch (error) {
      return {
        success: false,
        message: apiMessage(error, 'Gagal mengirim OTP reset password.'),
      };
    }
  };

  const verifyPasswordResetOtp = async (email: string, otp: string) => {
    if (!/^\d{6}$/.test(otp)) {
      return {
        success: false,
        message: 'Kode OTP harus 6 digit.',
      };
    }

    setPasswordResetOtp({ email, otp });

    return {
      success: true,
      message: 'OTP siap dipakai untuk membuat password baru.',
    };
  };

  const resetPassword = async (email: string, newPassword: string) => {
    if (!passwordResetOtp || passwordResetOtp.email.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        message: 'Verifikasi OTP diperlukan sebelum mengganti password.',
      };
    }

    try {
      const response = await apiClient.post<ApiResponse<null>>('/forgot-password/verify-otp', {
        email,
        otp: passwordResetOtp.otp,
        password: newPassword,
        password_confirmation: newPassword,
      });

      setPasswordResetOtp(null);

      return {
        success: true,
        message: response.message || 'Password berhasil direset.',
      };
    } catch (error) {
      return {
        success: false,
        message: apiMessage(error, 'Gagal mereset password.'),
      };
    }
  };

  const addBooking = (booking: Booking) => {
    setBookings((currentBookings) => replaceById(currentBookings, booking));
  };

  const addPayment = (payment: Payment) => {
    setPayments((currentPayments) => replaceById(currentPayments, payment));
  };

  const updatePayment = (paymentId: string, updates: Partial<Payment>) => {
    setPayments((currentPayments) =>
      currentPayments.map((payment) => (payment.id === paymentId ? { ...payment, ...updates } : payment))
    );

    apiClient
      .put<ApiResponse<any>>(`/payments/${paymentId}/verify`, {
        payment_status: toBackendPaymentStatus(updates.status),
        paid_amount: updates.amount,
        notes: updates.admin_note,
      })
      .then((response) => {
        const payment = mapPayment(response.data);
        setPayments((currentPayments) => replaceById(currentPayments, payment));
      })
      .catch((error) => console.warn(apiMessage(error, 'Gagal memperbarui pembayaran')));
  };

  const updateBooking = (bookingId: string, updates: Partial<Booking>) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) => (booking.id === bookingId ? { ...booking, ...updates } : booking))
    );
  };

  const addSport = (sport: Sport) => {
    apiClient
      .post<ApiResponse<any>>('/sports', {
        name: sport.name.toLowerCase(),
        code: sport.code,
        icon: sport.icon,
        description: sport.description,
      })
      .then((response) => {
        const mappedSport = mapSport(response.data);
        setSports((currentSports) => replaceById(currentSports, mappedSport));
      })
      .catch((error) => console.warn(apiMessage(error, 'Gagal menambahkan sport')));
  };

  const updateSport = (sportId: string, updates: Partial<Sport>) => {
    setSports((currentSports) =>
      currentSports.map((sport) => (sport.id === sportId ? { ...sport, ...updates } : sport))
    );

    apiClient
      .put<ApiResponse<any>>(`/sports/${sportId}`, {
        name: updates.name?.toLowerCase(),
        code: updates.code,
        icon: updates.icon,
        description: updates.description,
      })
      .then((response) => {
        const sport = mapSport(response.data);
        setSports((currentSports) => replaceById(currentSports, sport));
      })
      .catch((error) => console.warn(apiMessage(error, 'Gagal memperbarui sport')));
  };

  const deleteSport = (sportId: string) => {
    setSports((currentSports) => currentSports.filter((sport) => sport.id !== sportId));
    apiClient.delete(`/sports/${sportId}`).catch((error) => console.warn(apiMessage(error, 'Gagal menghapus sport')));
  };

  const addCourt = (court: Court) => {
    apiClient
      .post<ApiResponse<any>>('/courts', {
        sport_id: court.sport_id,
        name: court.name,
        code: court.code || undefined,
        price_per_hour: court.price_per_hour,
        status: court.status,
        description: court.description,
      })
      .then((response) => {
        const mappedCourt = mapCourt(response.data);
        setCourts((currentCourts) => replaceById(currentCourts, mappedCourt));
      })
      .catch((error) => console.warn(apiMessage(error, 'Gagal menambahkan lapangan')));
  };

  const updateCourt = (courtId: string, updates: Partial<Court>) => {
    const previousCourt = courts.find((court) => court.id === courtId);
    const payload = { ...previousCourt, ...updates };

    setCourts((currentCourts) =>
      currentCourts.map((court) => (court.id === courtId ? { ...court, ...updates } : court))
    );

    apiClient
      .put<ApiResponse<any>>(`/courts/${courtId}`, {
        sport_id: payload.sport_id,
        name: payload.name,
        code: payload.code || undefined,
        price_per_hour: payload.price_per_hour,
        status: payload.status,
        description: payload.description,
      })
      .then((response) => {
        const court = mapCourt(response.data);
        setCourts((currentCourts) => replaceById(currentCourts, court));
      })
      .catch((error) => console.warn(apiMessage(error, 'Gagal memperbarui lapangan')));
  };

  const deleteCourt = (courtId: string) => {
    setCourts((currentCourts) => currentCourts.filter((court) => court.id !== courtId));
    apiClient.delete(`/courts/${courtId}`).catch((error) => console.warn(apiMessage(error, 'Gagal menghapus lapangan')));
  };

  const addUser = (user: User) => {
    apiClient
      .post<ApiResponse<any>>('/admins', {
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password,
      })
      .then((response) => {
        const admin = mapUser(response.data);
        setUsers((currentUsers) => uniqueById([admin, ...currentUsers]));
      })
      .catch((error) => console.warn(apiMessage(error, 'Gagal menambahkan admin')));
  };

  const deleteUser = (userId: string) => {
    setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
  };

  const resetAdminPassword = async (userId: string, password?: string) => {
    try {
      const response = await apiClient.put<ApiResponse<{ user: any; temporary_password: string }>>(
        `/admins/${userId}/reset-password`,
        password ? { password } : {}
      );
      const admin = mapUser(response.data.user);

      setUsers((currentUsers) => replaceById(currentUsers, admin));

      return {
        success: true,
        message: response.message || 'Password admin berhasil direset.',
        password: response.data.temporary_password,
      };
    } catch (error) {
      return {
        success: false,
        message: apiMessage(error, 'Gagal mereset password admin.'),
      };
    }
  };

  const fetchSchedule = async (courtId: string, date: string) => {
    const response = await apiClient.get<ApiResponse<{ slots: any[] }>>('/schedules', {
      court_id: courtId,
      date,
    });

    return response.data.slots.map((slot) => mapTimeSlot(slot, courtId, date));
  };

  const submitPaymentDetail = async (
    bookingId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    proofFile?: File | null,
    notes?: string
  ) => {
    const formData = new FormData();
    formData.append('payment_method', paymentMethod);
    formData.append('amount', String(amount));

    if (proofFile) {
      formData.append('proof_file', proofFile);
    }

    if (notes) {
      formData.append('notes', notes);
    }

    const response = await apiClient.postForm<ApiResponse<any>>(`/payments/${bookingId}/details`, formData);
    const payment = mapPayment(response.data);

    setPayments((currentPayments) => replaceById(currentPayments, payment));
    await loadProtectedData();

    return payment;
  };

  const createBookingWithPayment = async (payload: BookingPaymentPayload) => {
    const bookingResponse = await apiClient.post<ApiResponse<any>>('/bookings', {
      court_id: payload.court_id,
      booking_date: payload.booking_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      customer_name: payload.customer_name,
      phone: payload.phone,
      notes: payload.notes,
    });
    const booking = mapBooking(bookingResponse.data);

    await apiClient.post<ApiResponse<any>>(`/payments/${booking.id}`, {
      payment_method: payload.payment_method,
    });

    const payment = await submitPaymentDetail(
      booking.id,
      payload.payment_method,
      payload.amount,
      payload.proof_file,
      payload.notes
    );

    setBookings((currentBookings) => replaceById(currentBookings, booking));

    return { booking, payment };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        register,
        sendRegisterOtp,
        verifyRegisterOtp,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPassword,
        refreshData,
        fetchSchedule,
        createBookingWithPayment,
        submitPaymentDetail,
        users,
        bookings,
        payments,
        sports,
        courts,
        addBooking,
        addPayment,
        updatePayment,
        updateBooking,
        addSport,
        updateSport,
        deleteSport,
        addCourt,
        updateCourt,
        deleteCourt,
        addUser,
        deleteUser,
        resetAdminPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
