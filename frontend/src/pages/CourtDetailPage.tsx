import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
import { TimeSlot } from '../data/mockData';
import { Calendar, Clock, MapPin, Info, Plus, Minus } from 'lucide-react';

export function CourtDetailPage() {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const { courts, sports, fetchSchedule } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  const court = courts.find((c) => c.id === courtId);
  const sport = court ? sports.find((s) => s.id === court.sport_id) : null;

  if (!court || !sport) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lapangan tidak ditemukan</p>
      </div>
    );
  }

  useEffect(() => {
    if (!courtId || !court) return;

    let mounted = true;

    setScheduleLoading(true);
    setScheduleError('');
    fetchSchedule(courtId, selectedDate)
      .then((apiSlots) => {
        if (mounted) {
          setSlots(apiSlots);
        }
      })
      .catch(() => {
        if (mounted) {
          setSlots([]);
          setScheduleError('Jadwal gagal dimuat. Pastikan backend Laravel sedang berjalan.');
        }
      })
      .finally(() => {
        if (mounted) {
          setScheduleLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [courtId, court, selectedDate, fetchSchedule]);

  const selectedStartSlot = selectedSlots[0] ?? null;
  const selectedEndSlot = selectedSlots[selectedSlots.length - 1] ?? null;
  const selectedEndIndex = selectedEndSlot
    ? slots.findIndex((slot) => slot.id === selectedEndSlot.id)
    : -1;
  const nextAvailableSlot = selectedEndIndex >= 0 ? slots[selectedEndIndex + 1] : null;

  const getSlotStyle = (status: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-primary text-primary-foreground border-primary';
    }
    switch (status) {
      case 'available':
        return 'bg-success/20 text-success-foreground border-success hover:bg-success/30 cursor-pointer';
      case 'booked':
        return 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-60';
      case 'maintenance':
        return 'bg-warning/20 text-warning-foreground border-warning cursor-not-allowed opacity-60';
      default:
        return '';
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status === 'available') {
      setSelectedSlots([slot]);
    }
  };

  const handleAddHour = () => {
    if (!selectedEndSlot) return;

    const currentIndex = slots.findIndex((slot) => slot.id === selectedEndSlot.id);
    const nextSlot = slots[currentIndex + 1];

    if (!nextSlot || nextSlot.status !== 'available') return;

    setSelectedSlots((currentSlots) => [...currentSlots, nextSlot]);
  };

  const handleRemoveHour = () => {
    setSelectedSlots((currentSlots) => currentSlots.slice(0, -1));
  };

  const handleBooking = () => {
    if (selectedSlots.length > 0) {
      navigate('/booking', {
        state: {
          court,
          sport,
          slot: selectedStartSlot,
          slots: selectedSlots,
          date: selectedDate,
        },
      });
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <img
                src={court.image}
                alt={court.name}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{court.name}</h1>
                    <p className="text-muted-foreground">{court.code}</p>
                  </div>
                  <Badge variant="success">
                    {court.status === 'active' ? 'Tersedia' : court.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{sport.name}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>Operasional: 08:00 - 22:00</span>
                  </div>
                  <p className="text-foreground">{court.description}</p>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(court.price_per_hour)} / jam
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Pilih Jadwal</h2>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlots([]);
                      }}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    Pilih jam mulai terlebih dulu, lalu gunakan tombol tambah untuk menambah durasi.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Customer bisa booking lebih dari satu jam, tetapi penambahan waktu hanya mengikuti slot berikutnya yang masih tersedia.
                  </p>
                </div>

                {selectedSlots.length > 0 && (
                  <div className="mb-4 rounded-lg border border-secondary/20 bg-secondary/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Durasi dipilih: {selectedSlots.length} jam
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedStartSlot?.start_time} - {selectedEndSlot?.end_time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveHour}
                          disabled={selectedSlots.length === 0}
                          className="border-primary/30 text-primary"
                        >
                          <Minus className="w-4 h-4 mr-2" />
                          Kurangi Jam
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleAddHour}
                          disabled={
                            !selectedEndSlot ||
                            selectedEndIndex === slots.length - 1 ||
                            nextAvailableSlot?.status !== 'available'
                          }
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Jam
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start space-x-2 text-sm">
                    <Info className="w-4 h-4 text-info mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium mb-2">Keterangan:</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-success/20 border border-success rounded"></div>
                          <span className="text-muted-foreground">Tersedia</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-muted border border-muted rounded"></div>
                          <span className="text-muted-foreground">Sudah dibooking</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-warning/20 border border-warning rounded"></div>
                          <span className="text-muted-foreground">Maintenance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {scheduleError && (
                  <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {scheduleError}
                  </div>
                )}

                {scheduleLoading && (
                  <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Memuat jadwal...
                  </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      disabled={slot.status !== 'available'}
                      aria-pressed={selectedSlots.some((selectedSlot) => selectedSlot.id === slot.id)}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${getSlotStyle(
                        slot.status,
                        selectedSlots.some((selectedSlot) => selectedSlot.id === slot.id)
                      )}`}
                    >
                      <div>{slot.start_time}</div>
                      <div className="text-xs opacity-75">{slot.end_time}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Ringkasan Booking</h2>
              </CardHeader>
              <CardContent>
                {selectedSlots.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Lapangan</p>
                      <p className="font-medium text-foreground">{court.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal</p>
                      <p className="font-medium text-foreground">
                        {new Date(selectedDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Waktu</p>
                      <p className="font-medium text-foreground">
                        {selectedStartSlot?.start_time} - {selectedEndSlot?.end_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Durasi</p>
                      <p className="font-medium text-foreground">{selectedSlots.length} jam</p>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Total Harga</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(court.price_per_hour * selectedSlots.length)}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleBooking}
                    >
                      Lanjut ke Booking
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Pilih jam mulai, lalu tambah durasi jika ingin booking lebih dari satu jam
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
