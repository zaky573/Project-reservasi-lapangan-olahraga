import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, mockUsers, mockBookings, mockPayments, mockSports, mockCourts, Booking, Payment, Sport, Court } from '../data/mockData';

interface PasswordResetSession {
  email: string;
  otp: string;
  expires_at: string;
  verified: boolean;
}

interface RegisterOtpSession {
  email: string;
  otp: string;
  expires_at: string;
  verified: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  sendRegisterOtp: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyRegisterOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  sendPasswordResetOtp: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [sports, setSports] = useState<Sport[]>(mockSports);
  const [courts, setCourts] = useState<Court[]>(mockCourts);
  const [passwordResetSessions, setPasswordResetSessions] = useState<PasswordResetSession[]>([]);
  const [registerOtpSessions, setRegisterOtpSessions] = useState<RegisterOtpSession[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    const existingUser = users.find(u => u.email === email);
    const registerSession = registerOtpSessions.find(
      (session) => session.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return false;
    }

    if (!registerSession || !registerSession.verified) {
      return false;
    }

    const newUser: User = {
      id: String(users.length + 1),
      name,
      email,
      phone,
      password,
      role: 'user',
    };

    setUsers([...users, newUser]);
    setRegisterOtpSessions((currentSessions) =>
      currentSessions.filter((session) => session.email.toLowerCase() !== email.toLowerCase())
    );
    return true;
  };

  const sendRegisterOtp = async (email: string) => {
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return {
        success: false,
        message: 'Email sudah terdaftar',
      };
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    setRegisterOtpSessions((currentSessions) => [
      ...currentSessions.filter((session) => session.email.toLowerCase() !== email.toLowerCase()),
      {
        email,
        otp,
        expires_at: expiresAt,
        verified: false,
      },
    ]);

    return {
      success: true,
      message: 'OTP registrasi berhasil dikirim.',
      otp,
    };
  };

  const verifyRegisterOtp = async (email: string, otp: string) => {
    const session = registerOtpSessions.find(
      (item) => item.email.toLowerCase() === email.toLowerCase()
    );

    if (!session) {
      return {
        success: false,
        message: 'OTP registrasi belum dikirim untuk email ini',
      };
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return {
        success: false,
        message: 'OTP registrasi sudah kadaluarsa. Silakan kirim ulang OTP.',
      };
    }

    if (session.otp !== otp) {
      return {
        success: false,
        message: 'Kode OTP tidak valid',
      };
    }

    setRegisterOtpSessions((currentSessions) =>
      currentSessions.map((item) =>
        item.email.toLowerCase() === email.toLowerCase()
          ? { ...item, verified: true }
          : item
      )
    );

    return {
      success: true,
      message: 'OTP registrasi berhasil diverifikasi',
    };
  };

  const sendPasswordResetOtp = async (email: string) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return {
        success: false,
        message: 'Email tidak ditemukan',
      };
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    setPasswordResetSessions((currentSessions) => [
      ...currentSessions.filter((session) => session.email.toLowerCase() !== email.toLowerCase()),
      {
        email,
        otp,
        expires_at: expiresAt,
        verified: false,
      },
    ]);

    return {
      success: true,
      message: 'OTP berhasil dikirim. Silakan cek kode OTP Anda.',
      otp,
    };
  };

  const verifyPasswordResetOtp = async (email: string, otp: string) => {
    const session = passwordResetSessions.find(
      (item) => item.email.toLowerCase() === email.toLowerCase()
    );

    if (!session) {
      return {
        success: false,
        message: 'OTP belum dikirim untuk email ini',
      };
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return {
        success: false,
        message: 'OTP sudah kadaluarsa. Silakan kirim ulang OTP.',
      };
    }

    if (session.otp !== otp) {
      return {
        success: false,
        message: 'Kode OTP tidak valid',
      };
    }

    setPasswordResetSessions((currentSessions) =>
      currentSessions.map((item) =>
        item.email.toLowerCase() === email.toLowerCase()
          ? { ...item, verified: true }
          : item
      )
    );

    return {
      success: true,
      message: 'OTP berhasil diverifikasi',
    };
  };

  const resetPassword = async (email: string, newPassword: string) => {
    const session = passwordResetSessions.find(
      (item) => item.email.toLowerCase() === email.toLowerCase()
    );

    if (!session || !session.verified) {
      return {
        success: false,
        message: 'Verifikasi OTP diperlukan sebelum mengganti password',
      };
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.email.toLowerCase() === email.toLowerCase()
          ? { ...user, password: newPassword }
          : user
      )
    );

    setPasswordResetSessions((currentSessions) =>
      currentSessions.filter((item) => item.email.toLowerCase() !== email.toLowerCase())
    );

    return {
      success: true,
      message: 'Password berhasil diperbarui',
    };
  };

  const addBooking = (booking: Booking) => {
    setBookings([...bookings, booking]);
  };

  const addPayment = (payment: Payment) => {
    setPayments([...payments, payment]);
  };

  const updatePayment = (paymentId: string, updates: Partial<Payment>) => {
    setPayments(payments.map(p => p.id === paymentId ? { ...p, ...updates } : p));
  };

  const updateBooking = (bookingId: string, updates: Partial<Booking>) => {
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, ...updates } : b));
  };

  const addSport = (sport: Sport) => {
    setSports([...sports, sport]);
  };

  const updateSport = (sportId: string, updates: Partial<Sport>) => {
    setSports(sports.map(s => s.id === sportId ? { ...s, ...updates } : s));
  };

  const deleteSport = (sportId: string) => {
    setSports(sports.filter(s => s.id !== sportId));
  };

  const addCourt = (court: Court) => {
    setCourts([...courts, court]);
  };

  const updateCourt = (courtId: string, updates: Partial<Court>) => {
    setCourts(courts.map(c => c.id === courtId ? { ...c, ...updates } : c));
  };

  const deleteCourt = (courtId: string) => {
    setCourts(courts.filter(c => c.id !== courtId));
  };

  const addUser = (user: User) => {
    setUsers([...users, user]);
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        register,
        sendRegisterOtp,
        verifyRegisterOtp,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPassword,
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
