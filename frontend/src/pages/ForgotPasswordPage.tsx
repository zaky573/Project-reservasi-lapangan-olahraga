import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

type ForgotPasswordStep = 'send-otp' | 'verify-otp' | 'reset-password';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { sendPasswordResetOtp, verifyPasswordResetOtp, resetPassword } = useAuth();

  const [step, setStep] = useState<ForgotPasswordStep>('send-otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const result = await sendPasswordResetOtp(email);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    setSuccessMessage(result.message);
    setDemoOtp(result.otp || '');
    setStep('verify-otp');
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const result = await verifyPasswordResetOtp(email, otp);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    setSuccessMessage(result.message);
    setStep('reset-password');
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, newPassword);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    setSuccessMessage(result.message);
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
            <h1 className="text-2xl font-bold text-primary">Lupa Password</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Kirim OTP, verifikasi kode, lalu buat password baru
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'send-otp' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                type="email"
                label="Email"
                placeholder="user@thearena.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Mengirim OTP...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {step === 'verify-otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('send-otp');
                  setOtp('');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Kirim Ulang OTP
              </Button>
            </form>
          )}

          {step === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                type="password"
                label="Password Baru"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Konfirmasi Password Baru"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Reset Password'}
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
              <p className="font-medium text-foreground">Demo OTP:</p>
              <p className="text-muted-foreground">
                Karena ini masih mock auth, OTP yang dikirim adalah: <span className="font-semibold text-primary">{demoOtp}</span>
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Kembali ke{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                halaman login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
