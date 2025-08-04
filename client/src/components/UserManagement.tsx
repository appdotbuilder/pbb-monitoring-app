
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import type { 
  User, 
  Village, 
  CreateUserInput, 
  UpdateUserInput 
} from '../../../server/src/schema';

interface UserManagementProps {
  users: User[];
  villages: Village[];
  onCreateUser: (user: CreateUserInput) => Promise<void>;
  onUpdateUser: (user: UpdateUserInput) => Promise<void>;
  onDeleteUser: (id: number) => Promise<void>;
  isLoading: boolean;
}

export function UserManagement({
  users,
  villages,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  isLoading
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [createForm, setCreateForm] = useState<CreateUserInput>({
    username: '',
    password: '',
    full_name: '',
    role: 'village_user',
    village_id: undefined
  });

  const [editForm, setEditForm] = useState<UpdateUserInput>({
    id: 0,
    username: '',
    full_name: '',
    role: 'village_user',
    village_id: undefined,
    is_active: true
  });

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreateUser(createForm);
      setIsCreateDialogOpen(false);
      setCreateForm({
        username: '',
        password: '',
        full_name: '',
        role: 'village_user',
        village_id: undefined
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateUser(editForm);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const openEditDialog = (user: User) => {
    setEditForm({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      village_id: user.village_id,
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await onDeleteUser(id);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await onUpdateUser({
        id: user.id,
        is_active: !user.is_active
      });
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">👥 Manajemen Pengguna</h2>
          <p className="text-gray-600">Kelola akun pengguna sistem</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">👥 Manajemen Pengguna</h2>
          <p className="text-gray-600">Kelola akun pengguna sistem</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>➕ Tambah Pengguna</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={createForm.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Masukkan username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Masukkan password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  value={createForm.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Peran</Label>
                <Select 
                  value={createForm.role} 
                  onValueChange={(value: 'super_admin' | 'village_user') => 
                    setCreateForm((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="village_user">Pengguna Desa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createForm.role === 'village_user' && (
                <div>
                  <Label htmlFor="village">Desa</Label>
                  <Select 
                    value={createForm.village_id ? createForm.village_id.toString() : ''} 
                    onValueChange={(value) => setCreateForm((prev: CreateUserInput) => ({ 
                      ...prev, 
                      village_id: value ? parseInt(value) : undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Desa" />
                    </SelectTrigger>
                    <SelectContent>
                      {villages.map((village: Village) => (
                        <SelectItem key={village.id} value={village.id.toString()}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="w-full max-w-md">
            <Input
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Desa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: User) => {
                const village = villages.find(v => v.id === user.village_id);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                        {user.role === 'super_admin' ? 'Super Admin' : 'Pengguna Desa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {village ? (
                        <Badge variant="outline">{village.name}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => toggleUserStatus(user)}
                        />
                        <span className="text-sm">
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.created_at.toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          ✏️ Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              🗑️ Hapus
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus pengguna "{user.full_name}"? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada pengguna yang ditemukan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_username">Username</Label>
              <Input
                id="edit_username"
                value={editForm.username || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateUserInput) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Masukkan username"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_full_name">Nama Lengkap</Label>
              <Input
                id="edit_full_name"
                value={editForm.full_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateUserInput) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Peran</Label>
              <Select 
                value={editForm.role || 'village_user'} 
                onValueChange={(value: 'super_admin' | 'village_user') => 
                  setEditForm((prev: UpdateUserInput) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="village_user">Pengguna Desa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.role === 'village_user' && (
              <div>
                <Label htmlFor="edit_village">Desa</Label>
                <Select 
                  value={editForm.village_id ? editForm.village_id.toString() : ''} 
                  onValueChange={(value) => setEditForm((prev: UpdateUserInput) => ({ 
                    ...prev, 
                    village_id: value ? parseInt(value) : null 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Desa" />
                  </SelectTrigger>
                  <SelectContent>
                    {villages.map((village: Village) => (
                      <SelectItem key={village.id} value={village.id.toString()}>
                        {village.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={editForm.is_active || false}
                onCheckedChange={(checked) =>
                  setEditForm((prev: UpdateUserInput) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="edit_is_active">Pengguna Aktif</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
