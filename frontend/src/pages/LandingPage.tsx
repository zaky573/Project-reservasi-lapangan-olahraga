import { Link } from 'react-router';
import { Trophy, MapPin, Clock, CreditCard, CheckCircle, Mail, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function LandingPage() {
  const features = [
    {
      icon: Trophy,
      title: 'Berbagai Jenis Olahraga',
      description: 'Badminton, Futsal, Basketball, dan banyak lagi',
    },
    {
      icon: MapPin,
      title: 'Lokasi Strategis',
      description: 'Lapangan dengan fasilitas terbaik di kota',
    },
    {
      icon: Clock,
      title: 'Booking Mudah & Cepat',
      description: 'Pilih jadwal, bayar, dan main!',
    },
    {
      icon: CreditCard,
      title: 'Pembayaran Fleksibel',
      description: 'Cash atau transfer, semuanya bisa',
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary via-secondary to-accent text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Selamat Datang di THE ARENA
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Platform reservasi lapangan olahraga terlengkap dan termudah
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link to="/register">
                <Button variant="primary" size="lg" className="bg-white text-primary hover:bg-white/90">
                  Mulai Booking Sekarang
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Kenapa Pilih THE ARENA?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardContent className="text-center pt-8 pb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                Cara Booking di THE ARENA
              </h2>
              <div className="space-y-4">
                {[
                  'Pilih jenis olahraga favorit Anda',
                  'Pilih lapangan yang tersedia',
                  'Tentukan tanggal dan waktu bermain',
                  'Isi data booking dan pilih metode pembayaran',
                  'Upload bukti pembayaran (jika transfer)',
                  'Tunggu konfirmasi dan siap bermain!',
                ].map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary to-accent rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Siap Mulai?</h3>
              <p className="mb-6">
                Bergabunglah dengan ribuan pengguna yang sudah mempercayai THE ARENA untuk kebutuhan olahraga mereka.
              </p>
              <Link to="/register">
                <Button variant="primary" size="lg" className="w-full bg-white text-primary hover:bg-white/90">
                  Daftar Gratis Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-primary via-secondary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-2xl font-bold mb-3">THE ARENA</h3>
              <p className="text-white/85 leading-relaxed">
                Platform reservasi lapangan olahraga yang memudahkan Anda menemukan, memesan, dan bermain tanpa ribet.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Navigasi Cepat</h4>
              <div className="space-y-3 text-white/90">
                <Link to="/register" className="block hover:text-white transition-colors">
                  Mulai Booking
                </Link>
                <Link to="/login" className="block hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/sports" className="block hover:text-white transition-colors">
                  Lihat Olahraga
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Hubungi Kami</h4>
              <div className="space-y-3 text-white/90">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-white flex-shrink-0" />
                  <span>Jl. Olahraga No. 1, Kota Anda</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-white flex-shrink-0" />
                  <span>+62 812-3456-7890</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-white flex-shrink-0" />
                  <span>hello@thearena.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20 text-center text-sm text-white/80">
            &copy; 2026 THE ARENA. Semua hak dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}
