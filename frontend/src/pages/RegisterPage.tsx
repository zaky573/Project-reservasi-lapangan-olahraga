import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

type RegisterStep = 'form' | 'verify-otp';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<RegisterStep>('form');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, sendRegisterOtp, verifyRegisterOtp } = useAuth();
  const navigate = useNavigate();

  const validateRegisterForm = () => {
    if (password !== confirmPassword) {
      return 'Password tidak cocok';
    }

    if (password.length < 6) {
      return 'Password minimal 6 karakter';
    }

    if (phone.length < 10) {
      return 'Nomor HP tidak valid';
    }

    return '';
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationError = validateRegisterForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await sendRegisterOtp(email);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    setSuccessMessage('OTP registrasi berhasil dikirim. Silakan verifikasi OTP untuk melanjutkan pendaftaran.');
    setDemoOtp(result.otp || '');
    setStep('verify-otp');
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationError = validateRegisterForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const otpResult = await verifyRegisterOtp(email, otp);

    if (!otpResult.success) {
      setError(otpResult.message);
      setLoading(false);
      return;
    }

    const success = await register(name, email, phone, password);

    if (!success) {
      setError('Registrasi gagal. Pastikan OTP sudah diverifikasi dan email belum terdaftar.');
      setLoading(false);
      return;
    }

    setSuccessMessage('Registrasi berhasil. Silakan login dengan akun Anda.');
    setLoading(false);

    setTimeout(() => {
      navigate('/login');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">Daftar di THE ARENA</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Buat akun, kirim OTP, lalu verifikasi sebelum login
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'form' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                type="text"
                label="Nama Lengkap"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                label="Email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="tel"
                label="Nomor HP"
                placeholder="08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Konfirmasi Password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Mengirim OTP...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {step === 'verify-otp' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                type="email"
                label="Email"
                value={email}
                disabled
              />
              <Input
                type="text"
                label="Kode OTP"
                placeholder="Masukkan 6 digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Mendaftarkan...' : 'Verifikasi OTP dan Daftar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('form');
                  setOtp('');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Kembali dan Kirim Ulang OTP
              </Button>
            </form>
          )}

          {error && (
            <div className="mt-4 bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 bg-success/10 text-foreground px-4 py-2 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {demoOtp && step === 'verify-otp' && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs space-y-1">
              <p className="font-medium text-foreground">Demo OTP Registrasi:</p>
              <p className="text-muted-foreground">
                Karena ini masih mock auth, OTP yang dikirim adalah: <span className="font-semibold text-primary">{demoOtp}</span>
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login di sini
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
