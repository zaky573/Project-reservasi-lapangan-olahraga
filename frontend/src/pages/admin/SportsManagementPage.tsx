import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Sport } from '../../data/mockData';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const SPORT_ICON_OPTIONS = [
  { icon: '🏸', label: 'Badminton' },
  { icon: '⚽', label: 'Sepak bola atau futsal' },
  { icon: '🏀', label: 'Basket' },
  { icon: '🏐', label: 'Voli' },
  { icon: '🎾', label: 'Tenis' },
  { icon: '🏓', label: 'Tenis meja' },
  { icon: '🏈', label: 'American football' },
  { icon: '⚾', label: 'Baseball' },
  { icon: '🥎', label: 'Softball' },
  { icon: '🏉', label: 'Rugby' },
  { icon: '🏏', label: 'Kriket' },
  { icon: '🏑', label: 'Hoki lapangan' },
  { icon: '🏒', label: 'Hoki es' },
  { icon: '🥍', label: 'Lacrosse' },
  { icon: '🥊', label: 'Tinju' },
  { icon: '🥋', label: 'Bela diri' },
  { icon: '🤼', label: 'Gulat' },
  { icon: '🤺', label: 'Anggar' },
  { icon: '🏊', label: 'Renang' },
  { icon: '🚴', label: 'Bersepeda' },
  { icon: '🏃', label: 'Lari' },
  { icon: '🏋️', label: 'Angkat beban' },
  { icon: '🤸', label: 'Senam' },
  { icon: '🧘', label: 'Yoga' },
  { icon: '🧗', label: 'Panjat tebing' },
  { icon: '⛳', label: 'Golf' },
  { icon: '🏹', label: 'Panahan' },
  { icon: '🎯', label: 'Dart' },
  { icon: '🎱', label: 'Biliar' },
  { icon: '🎳', label: 'Bowling' },
  { icon: '⛸️', label: 'Seluncur es' },
  { icon: '🛹', label: 'Skateboard' },
  { icon: '🎿', label: 'Ski' },
  { icon: '🏂', label: 'Snowboard' },
  { icon: '🏆', label: 'Olahraga umum' },
];

const emptySportForm = {
  name: '',
  code: '',
  description: '',
  icon: '🏸',
};

export function SportsManagementPage() {
  const { sports, addSport, updateSport, deleteSport } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [formData, setFormData] = useState(emptySportForm);

  const filteredSports = sports.filter((sport) =>
    sport.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSport) {
      updateSport(editingSport.id, formData);
    } else {
      const newSport: Sport = {
        id: String(Date.now()),
        ...formData,
        created_at: new Date().toISOString(),
      };
      addSport(newSport);
    }

    setIsModalOpen(false);
    setEditingSport(null);
    setFormData(emptySportForm);
  };

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport);
    setFormData({ name: sport.name, code: sport.code, description: sport.description, icon: sport.icon || '🏆' });
    setIsModalOpen(true);
  };

  const handleDelete = (sportId: string) => {
    if (confirm('Yakin ingin menghapus olahraga ini?')) {
      deleteSport(sportId);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Olahraga</h1>
          <p className="text-muted-foreground mt-2">Kelola jenis olahraga</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingSport(null);
            setFormData(emptySportForm);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Olahraga
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari olahraga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ikon</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nama</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deskripsi</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dibuat</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSports.map((sport) => (
                  <tr key={sport.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 text-2xl">{sport.icon}</td>
                    <td className="py-3 px-4 font-medium text-primary">{sport.code}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{sport.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{sport.description}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(sport.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(sport)}
                        className="mr-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(sport.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSports.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada olahraga ditemukan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSport ? 'Edit Olahraga' : 'Tambah Olahraga'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Olahraga"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Kode Olahraga"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
            placeholder="Contoh: BDM"
            required
          />
          <Input
            label="Deskripsi"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm mb-1.5 text-foreground">Ikon Olahraga</label>
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="text-3xl leading-none">{formData.icon}</span>
              <span className="text-sm text-muted-foreground">Pilih ikon yang paling sesuai dengan olahraga.</span>
            </div>
            <div className="grid max-h-56 grid-cols-5 gap-2 overflow-y-auto rounded-lg border border-border bg-background p-3 sm:grid-cols-7">
              {SPORT_ICON_OPTIONS.map((option) => {
                const isSelected = formData.icon === option.icon;

                return (
                  <button
                    key={`${option.icon}-${option.label}`}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={isSelected}
                    onClick={() => setFormData({ ...formData, icon: option.icon })}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border text-2xl transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {option.icon}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editingSport ? 'Perbarui' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
