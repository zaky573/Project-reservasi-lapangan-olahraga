import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Court } from '../../data/mockData';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function CourtsManagementPage() {
  const { courts, sports, addCourt, updateCourt, deleteCourt } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [formData, setFormData] = useState({
    sport_id: '',
    code: '',
    name: '',
    price_per_hour: 0,
    status: 'active' as 'active' | 'inactive' | 'maintenance',
    description: '',
    image: '',
  });

  const filteredCourts = courts.filter((court) =>
    court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    court.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateCourtCode = (sportId: string, ignoreCourtId?: string) => {
    const sport = sports.find((item) => item.id === sportId);
    if (!sport) return '';

    const usedNumbers = courts
      .filter((court) => court.sport_id === sportId && court.id !== ignoreCourtId)
      .map((court) => {
        const match = court.code.match(new RegExp(`^${sport.code}-(\\d+)$`));
        return match ? Number(match[1]) : 0;
      });
    const nextNumber = Math.max(0, ...usedNumbers) + 1;

    return `${sport.code}-${String(nextNumber).padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCourt) {
      updateCourt(editingCourt.id, formData);
    } else {
      const newCourt: Court = {
        id: String(Date.now()),
        ...formData,
        created_at: new Date().toISOString(),
      };
      addCourt(newCourt);
    }

    setIsModalOpen(false);
    setEditingCourt(null);
    setFormData({
      sport_id: '',
      code: '',
      name: '',
      price_per_hour: 0,
      status: 'active',
      description: '',
      image: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="danger">Inactive</Badge>;
      case 'maintenance':
        return <Badge variant="warning">Maintenance</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Courts Management</h1>
          <p className="text-muted-foreground mt-2">Kelola lapangan olahraga</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingCourt(null);
            setFormData({
              sport_id: '',
              code: '',
              name: '',
              price_per_hour: 0,
              status: 'active',
              description: '',
              image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
            });
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Lapangan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari lapangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nama</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sport</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Harga/Jam</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourts.map((court) => {
                  const sport = sports.find((s) => s.id === court.sport_id);
                  return (
                    <tr key={court.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">{court.code}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{court.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{sport?.name || '-'}</td>
                      <td className="py-3 px-4 text-primary font-medium">{formatCurrency(court.price_per_hour)}</td>
                      <td className="py-3 px-4">{getStatusBadge(court.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCourt(court);
                            setFormData({
                              sport_id: court.sport_id,
                              code: court.code,
                              name: court.name,
                              price_per_hour: court.price_per_hour,
                              status: court.status,
                              description: court.description,
                              image: court.image,
                            });
                            setIsModalOpen(true);
                          }}
                          className="mr-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Yakin ingin menghapus lapangan ini?')) {
                              deleteCourt(court.id);
                            }
                          }}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourt ? 'Edit Lapangan' : 'Tambah Lapangan'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Sport</label>
              <select
                value={formData.sport_id}
                onChange={(e) => {
                  const sportId = e.target.value;
                  setFormData({
                    ...formData,
                    sport_id: sportId,
                    code: editingCourt ? formData.code : generateCourtCode(sportId),
                  });
                }}
                className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Pilih Sport</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Kode Lapangan"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Otomatis dari kode sport"
              disabled={!editingCourt}
              required
            />
          </div>
          <Input
            label="Nama Lapangan"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Harga per Jam"
              type="number"
              value={formData.price_per_hour}
              onChange={(e) => setFormData({ ...formData, price_per_hour: Number(e.target.value) })}
              required
            />
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <Input
            label="Deskripsi"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editingCourt ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
