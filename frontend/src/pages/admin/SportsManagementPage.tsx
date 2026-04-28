import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Sport } from '../../data/mockData';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function SportsManagementPage() {
  const { sports, addSport, updateSport, deleteSport } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', icon: '' });

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
    setFormData({ name: '', code: '', description: '', icon: '' });
  };

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport);
    setFormData({ name: sport.name, code: sport.code, description: sport.description, icon: sport.icon });
    setIsModalOpen(true);
  };

  const handleDelete = (sportId: string) => {
    if (confirm('Yakin ingin menghapus sport ini?')) {
      deleteSport(sportId);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sports Management</h1>
          <p className="text-muted-foreground mt-2">Kelola jenis olahraga</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingSport(null);
            setFormData({ name: '', code: '', description: '', icon: '' });
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Sport
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari sport..."
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Icon</th>
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
                Tidak ada sport ditemukan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSport ? 'Edit Sport' : 'Tambah Sport'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Sport"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Kode Sport"
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
          <Input
            label="Icon (Emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="🏸"
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editingSport ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
