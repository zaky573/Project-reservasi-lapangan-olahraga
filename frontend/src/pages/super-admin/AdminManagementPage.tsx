import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { KeyRound, Plus, Trash2, Search } from 'lucide-react';
import { User } from '../../data/mockData';

export function AdminManagementPage() {
  const { users, currentUser, addUser, deleteUser, resetAdminPassword } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const admins = users.filter((u) => u.role === 'admin' || u.role === 'super_admin');

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newAdmin: User = {
      id: String(Date.now()),
      ...formData,
      role: 'admin',
    };

    addUser(newAdmin);
    setIsModalOpen(false);
    setFormData({ name: '', email: '', phone: '', password: '' });
  };

  const openResetModal = (admin: User) => {
    setSelectedAdmin(admin);
    setResetPasswordValue('');
    setGeneratedPassword('');
    setResetMessage('');
    setResetError('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    if (resetPasswordValue && resetPasswordValue.length < 6) {
      setResetError('Password baru minimal 6 karakter.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetMessage('');
    setGeneratedPassword('');

    const result = await resetAdminPassword(selectedAdmin.id, resetPasswordValue || undefined);

    setResetLoading(false);

    if (!result.success) {
      setResetError(result.message);
      return;
    }

    setGeneratedPassword(result.password || resetPasswordValue);
    setResetMessage('Password baru berhasil dibuat. Berikan password ini kepada admin yang bersangkutan.');
    setResetPasswordValue('');
  };

  const copyGeneratedPassword = async () => {
    if (!generatedPassword) return;

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setResetMessage('Password berhasil disalin.');
    } catch {
      setResetMessage('Password baru siap diberikan kepada admin.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="danger">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="info">Admin</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kelola Admin</h1>
          <p className="text-muted-foreground mt-2">Lihat akun super admin dan admin, serta reset password jika lupa</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari admin..."
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nama</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">No. HP</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Peran</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium text-foreground">{admin.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{admin.email}</td>
                    <td className="py-3 px-4 text-muted-foreground">{admin.phone}</td>
                    <td className="py-3 px-4">{getRoleBadge(admin.role)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {admin.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openResetModal(admin)}
                          >
                            <KeyRound className="w-4 h-4 mr-2" />
                            Reset Password
                          </Button>
                        )}
                        {admin.role !== 'super_admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus admin ini?')) {
                                deleteUser(admin.id);
                              }
                            }}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Admin Baru"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Nomor HP"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Tambah Admin
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Password Admin"
      >
        {selectedAdmin && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Akun</p>
              <p className="font-medium text-foreground">{selectedAdmin.name}</p>
              <p className="text-sm text-muted-foreground">{selectedAdmin.email}</p>
              <div className="mt-3 rounded-md bg-warning/10 px-3 py-2 text-sm text-foreground">
                Password lama tidak bisa dilihat karena disimpan aman dalam bentuk hash. Buat password baru lalu berikan ke admin yang lupa.
              </div>
            </div>

            <Input
              label="Password Baru"
              type="text"
              value={resetPasswordValue}
              onChange={(e) => {
                setResetPasswordValue(e.target.value);
                setResetError('');
              }}
              placeholder="Kosongkan untuk dibuat otomatis"
              error={resetError}
            />

            {generatedPassword && (
              <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                <p className="text-sm text-muted-foreground">Password Baru</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <code className="rounded-md bg-background px-3 py-2 font-mono text-sm text-foreground">
                    {generatedPassword}
                  </code>
                  <Button type="button" variant="outline" onClick={copyGeneratedPassword}>
                    Salin
                  </Button>
                </div>
              </div>
            )}

            {resetMessage && (
              <p className="rounded-lg bg-success/10 px-4 py-2 text-sm text-foreground">{resetMessage}</p>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsResetModalOpen(false)}>
                Tutup
              </Button>
              <Button type="submit" variant="primary" disabled={resetLoading}>
                {resetLoading ? 'Mereset...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
