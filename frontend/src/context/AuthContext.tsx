import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  generateTimeSlots,
  mockBookings,
  mockCourts,
  mockPayments,
  mockSports,
  mockUsers,
  type Booking,
  type Court,
  type Payment,
  type PaymentMethod,
  type Sport,
  type TimeSlot,
  type User,
} from '../data/mockData';
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
  refreshPublicData: () => Promise<void>;
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
  updateBooking: (bookingId: string, updates: Partial<Booking>) => Promise<{ success: boolean; message: string }>;
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

function getMockUserPayments(user: User) {
  const userBookingIds = new Set(mockBookings.filter((booking) => booking.user_id === user.id).map((booking) => booking.id));
  return mockPayments.filter((payment) => userBookingIds.has(payment.booking_id));
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
    try {
      const [sportsResponse, courtsResponse] = await Promise.all([
        apiClient.get<ApiResponse<any[]>>('/sports'),
        apiClient.get<ApiResponse<any[]>>('/courts'),
      ]);

      setSports(sportsResponse.data.map(mapSport));
      setCourts(courtsResponse.data.map(mapCourt));
    } catch (error) {
      console.warn(apiMessage(error, 'Gagal memuat data publik, memakai data mock'));
      setSports(mockSports);
      setCourts(mockCourts);
    }
  };

  const loadUserData = async (user = currentUser) => {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/my-bookings');
      const apiBookings = response.data;
      const mappedBookings = apiBookings.map(mapBooking);
      const mappedPayments = apiBookings.map(mapPaymentFromBooking).filter(Boolean) as Payment[];

      setBookings(mappedBookings);
      setPayments(mappedPayments);
    } catch (error) {
      console.warn(apiMessage(error, 'Gagal memuat booking user, memakai data mock'));
      setBookings(user ? mockBookings.filter((booking) => booking.user_id === user.id) : []);
      setPayments(user ? getMockUserPayments(user) : []);
    }
  };

  const loadAdminData = async (user = currentUser) => {
    try {
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
    } catch (error) {
      console.warn(apiMessage(error, 'Gagal memuat data admin, memakai data mock'));
      setBookings(mockBookings);
      setPayments(mockPayments);
      setUsers((currentUsers) => uniqueById([...(user ? [user] : []), ...currentUsers, ...mockUsers]));
    }
  };

  const loadProtectedData = async (user = currentUser) => {
    if (!user) return;

    if (user.role === 'user') {
      await loadUserData(user);
      return;
    }

    await loadAdminData(user);
  };

  const refreshData = async () => {
    await loadPublicData();
    await loadProtectedData();
  };

  const refreshPublicData = async () => {
    await loadPublicData();
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
      await loadPublicData();
      await loadProtectedData(user);
      return true;
    } catch (error) {
      const mockUser = mockUsers.find(
        (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
      );

      if (!mockUser) {
        console.warn(apiMessage(error, 'Login gagal'));
        return false;
      }

      localStorage.removeItem(TOKEN_KEY);
      persistAuth(mockUser);
      await loadPublicData();
      await loadProtectedData(mockUser);
      return true;
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
      await loadPublicData();
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

  const updateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const response = await apiClient.put<ApiResponse<any>>(`/bookings/${bookingId}`, {
        status: updates.status,
      });
      const booking = mapBooking(response.data);
      const payment = mapPaymentFromBooking(response.data);

      setBookings((currentBookings) => replaceById(currentBookings, booking));
      setPayments((currentPayments) => payment
        ? replaceById(currentPayments, payment)
        : currentPayments.filter((currentPayment) => currentPayment.booking_id !== booking.id)
      );

      return {
        success: true,
        message: response.message || 'Pemesanan berhasil diperbarui.',
      };
    } catch (error) {
      const message = apiMessage(error, 'Gagal memperbarui pemesanan');
      console.warn(message);

      return {
        success: false,
        message,
      };
    }
  };

  const addSport = (sport: Sport) => {
    const formData = new FormData();
    formData.append('name', sport.name.toLowerCase());
    formData.append('code', sport.code);
    formData.append('icon', sport.icon);
    formData.append('description', sport.description);

    if (sport.image_file) {
      formData.append('image', sport.image_file);
    }

    apiClient
      .postForm<ApiResponse<any>>('/sports', formData)
      .then((response) => {
        const mappedSport = mapSport(response.data);
        setSports((currentSports) => replaceById(currentSports, mappedSport));
      })
      .catch((error) => console.warn(apiMessage(error, 'Gagal menambahkan sport')));
  };

  const updateSport = (sportId: string, updates: Partial<Sport>) => {
    const previousSport = sports.find((sport) => sport.id === sportId);
    if (!previousSport) return;

    const payload = { ...previousSport, ...updates } as Sport;
    const formData = new FormData();

    formData.append('name', payload.name.toLowerCase());
    formData.append('code', payload.code);
    formData.append('icon', payload.icon);
    formData.append('description', payload.description);

    if (payload.image_file) {
      formData.append('image', payload.image_file);
    }

    setSports((currentSports) =>
      currentSports.map((sport) => (sport.id === sportId ? { ...sport, ...updates } : sport))
    );

    apiClient
      .postForm<ApiResponse<any>>(`/sports/${sportId}`, formData)
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
    try {
      const response = await apiClient.get<ApiResponse<{ slots: any[] }>>('/schedules', {
        court_id: courtId,
        date,
      });

      return response.data.slots.map((slot) => mapTimeSlot(slot, courtId, date));
    } catch (error) {
      console.warn(apiMessage(error, 'Gagal memuat jadwal, memakai data mock'));
      return generateTimeSlots(courtId, date);
    }
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
    const formData = new FormData();
    formData.append('court_id', payload.court_id);
    formData.append('booking_date', payload.booking_date);
    formData.append('start_time', payload.start_time);
    formData.append('end_time', payload.end_time);
    formData.append('customer_name', payload.customer_name);
    formData.append('phone', payload.phone);
    formData.append('payment_method', payload.payment_method);
    formData.append('amount', String(payload.amount));

    if (payload.notes) {
      formData.append('notes', payload.notes);
    }

    if (payload.proof_file) {
      formData.append('proof_file', payload.proof_file);
    }

    const bookingResponse = await apiClient.postForm<ApiResponse<any>>('/bookings', formData);
    const booking = mapBooking(bookingResponse.data);
    const paymentFromBooking = mapPaymentFromBooking(bookingResponse.data);

    setBookings((currentBookings) => replaceById(currentBookings, booking));
    if (paymentFromBooking) {
      setPayments((currentPayments) => replaceById(currentPayments, paymentFromBooking));
    }

    return { booking, payment: paymentFromBooking as Payment };
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
        refreshPublicData,
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
