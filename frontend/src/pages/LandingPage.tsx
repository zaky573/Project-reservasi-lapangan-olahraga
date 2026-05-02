import { useMemo } from 'react';
import { Link } from 'react-router';
import { Trophy, MapPin, Clock, CreditCard, CheckCircle, Mail, Phone, Users, ShieldCheck, Wifi, Coffee } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';

export function LandingPage() {
  const { sports, courts } = useAuth();

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
      title: 'Pemesanan Mudah & Cepat',
      description: 'Pilih jadwal, bayar, dan main!',
    },
    {
      icon: CreditCard,
      title: 'Pembayaran Fleksibel',
      description: 'Tunai atau transfer, semuanya bisa',
    },
  ];

  const facilities = [
    {
      icon: Users,
      title: 'Ruang Ganti Nyaman',
      description: 'Fasilitas ganti dan loker yang bersih dan aman untuk setiap pemain.',
    },
    {
      icon: Wifi,
      title: 'Internet Gratis',
      description: 'Wi-Fi tersedia di area lapangan untuk kenyamanan pengguna.',
    },
    {
      icon: ShieldCheck,
      title: 'Keamanan Terjamin',
      description: 'Area yang terjaga dengan baik sehingga Anda bisa fokus bermain.',
    },
    {
      icon: Coffee,
      title: 'Area Santai',
      description: 'Tempat istirahat dengan minuman ringan setelah bermain.',
    },
  ];

  const courtShowcase = useMemo(() => {
    if (sports.length === 0) {
      return [
        {
          name: 'Futsal',
          image: '/images/hero-background.jpg',
          label: 'Favorit',
          price: 'Mulai Rp150.000/jam',
          courtCount: '2 lapangan aktif',
          courtNames: 'Lapangan Futsal',
          description: 'Rumput sintetis premium dengan area bermain luas untuk tim Anda.',
        },
        {
          name: 'Badminton',
          image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop',
          label: 'Indoor',
          price: 'Mulai Rp80.000/jam',
          courtCount: '3 lapangan aktif',
          courtNames: 'Lapangan Badminton',
          description: 'Lapangan nyaman dengan pencahayaan terang untuk latihan maupun pertandingan.',
        },
        {
          name: 'Basket',
          image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop',
          label: 'Reguler',
          price: 'Mulai Rp120.000/jam',
          courtCount: '1 lapangan aktif',
          courtNames: 'Lapangan Basket',
          description: 'Area basket terawat dengan ring standar dan ruang gerak yang lega.',
        },
        {
          name: 'Tenis',
          image: '/images/Tennis.jpg',
          label: 'Premium',
          price: 'Mulai Rp120.000/jam',
          courtCount: 'Area raket',
          courtNames: 'Lapangan Tenis',
          description: 'Lapangan raket indoor untuk bermain santai atau sesi latihan rutin.',
        },
      ];
    }

    return sports.map((sport) => {
      const sportCourts = courts.filter((court) => court.sport_id === sport.id);
      const activeCourts = sportCourts.filter((court) => court.status === 'active');
      const displayCourts = activeCourts.length > 0 ? activeCourts : sportCourts;
      const minPrice = displayCourts.length > 0
        ? Math.min(...displayCourts.map((court) => court.price_per_hour))
        : 0;

      return {
        name: sport.name,
        image: sport.image || displayCourts[0]?.image || '/images/hero-background.jpg',
        label: activeCourts.length > 0 ? 'Tersedia' : 'Belum Aktif',
        price: minPrice > 0 ? `Mulai ${formatCurrency(minPrice)}/jam` : 'Harga belum diatur',
        courtCount: `${activeCourts.length} lapangan aktif`,
        courtNames: displayCourts.slice(0, 3).map((court) => court.name).join(', '),
        description: sport.description,
      };
    });
  }, [courts, sports]);

  return (
    <div className="min-h-screen scroll-smooth md:h-screen md:overflow-y-auto md:snap-y md:snap-mandatory">
      <section
        className="relative flex min-h-screen items-center text-white bg-cover bg-center py-20 md:snap-start"
        style={{
          backgroundImage: "url('/images/PREAU.jpg')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-bold sm:text-5xl md:text-6xl">
            Selamat Datang di THE ARENA
          </h1>
          <p className="mb-8 text-lg text-white/90 sm:text-xl md:text-2xl">
            Platform pemesanan lapangan olahraga terlengkap dan termudah.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-primary hover:bg-white/90">
                Mulai Pesan Sekarang
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                Masuk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center bg-muted/30 py-16 md:snap-start">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground">Lapangan yang Tersedia</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Sebelum login, Anda bisa melihat pilihan lapangan yang dapat dipesan di THE ARENA.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courtShowcase.map((court) => (
              <Card key={court.name} className="group h-full transition-shadow hover:shadow-lg">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={court.image}
                    alt={court.name}
                    onError={(event) => {
                      if (!event.currentTarget.src.includes('/images/hero-background.jpg')) {
                        event.currentTarget.src = '/images/hero-background.jpg';
                      }
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-foreground">{court.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">
                    {court.description}
                  </p>
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-sm font-semibold text-primary">{court.price}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{court.courtCount}</p>
                    {court.courtNames && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {court.courtNames}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Lihat Jadwal dan Pesan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center bg-background py-16 md:snap-start">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Fasilitas Unggulan Kami</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Rasakan kenyamanan pemesanan lapangan dengan fasilitas lengkap dan area yang terawat.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map((facility, index) => {
              const Icon = facility.icon;
              return (
                <Card key={index}>
                  <CardContent className="text-center pt-8 pb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2 text-foreground">{facility.title}</h3>
                    <p className="text-sm text-muted-foreground">{facility.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center bg-muted/30 py-16 md:snap-start">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

      <section className="flex min-h-screen items-center bg-background py-16 md:snap-start">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                Cara Pemesanan di THE ARENA
              </h2>
              <div className="space-y-4">
                {[
                  'Pilih jenis olahraga favorit Anda',
                  'Pilih lapangan yang tersedia',
                  'Tentukan tanggal dan waktu bermain',
                  'Isi data pemesanan dan pilih metode pembayaran',
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

      <footer className="flex min-h-screen items-center bg-gradient-to-br from-primary via-secondary to-accent text-white md:snap-start">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-2xl font-bold mb-3">THE ARENA</h3>
              <p className="text-white/85 leading-relaxed">
                Platform pemesanan lapangan olahraga yang memudahkan Anda menemukan, memesan, dan bermain tanpa ribet.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Navigasi Cepat</h4>
              <div className="space-y-3 text-white/90">
                <Link to="/register" className="block hover:text-white transition-colors">
                  Mulai Pesan
                </Link>
                <Link to="/login" className="block hover:text-white transition-colors">
                  Masuk
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
