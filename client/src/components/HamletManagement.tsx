
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { 
  Hamlet, 
  Village, 
  User, 
  CreateHamletInput, 
  UpdateHamletInput, 
  HamletFilter 
} from '../../../server/src/schema';

interface HamletManagementProps {
  hamlets: Hamlet[];
  villages: Village[];
  currentUser: User;
  onCreateHamlet: (hamlet: CreateHamletInput) => Promise<void>;
  onUpdateHamlet: (hamlet: UpdateHamletInput) => Promise<void>;
  onFilterChange: (filter: HamletFilter) => void;
  isLoading: boolean;
}

export function HamletManagement({
  hamlets,
  villages,
  currentUser,
  onCreateHamlet,
  onUpdateHamlet,
  onFilterChange,
  isLoading
}: HamletManagementProps) {
  const [selectedVillage, setSelectedVillage] = useState<number | undefined>(
    currentUser.role === 'village_user' ? currentUser.village_id || undefined : undefined
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [createForm, setCreateForm] = useState<CreateHamletInput>({
    village_id: currentUser.village_id || 0,
    name: '',
    head_name: '',
    sppt_target: 0,
    pbb_target: 0
  });

  const [editForm, setEditForm] = useState<UpdateHamletInput>({
    id: 0,
    village_id: 0,
    name: '',
    head_name: '',
    sppt_target: 0,
    pbb_target: 0
  });

  const availableVillages = currentUser.role === 'village_user' && currentUser.village_id
    ? villages.filter(v => v.id === currentUser.village_id)
    : villages;

  const filteredHamlets = hamlets.filter((hamlet: Hamlet) => {
    const matchesSearch = hamlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hamlet.head_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleVillageChange = (value: string) => {
    const villageId = value === 'all' ? undefined : parseInt(value);
    setSelectedVillage(villageId);
    onFilterChange({ village_id: villageId });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreateHamlet(createForm);
      setIsCreateDialogOpen(false);
      setCreateForm({
        village_id: currentUser.village_id || 0,
        name: '',
        head_name: '',
        sppt_target: 0,
        pbb_target: 0
      });
    } catch (error) {
      console.error('Failed to create hamlet:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateHamlet(editForm);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update hamlet:', error);
    }
  };

  const openEditDialog = (hamlet: Hamlet) => {
    setEditForm({
      id: hamlet.id,
      village_id: hamlet.village_id,
      name: hamlet.name,
      head_name: hamlet.head_name,
      sppt_target: hamlet.sppt_target,
      pbb_target: hamlet.pbb_target
    });
    setIsEditDialogOpen(true);
  };

  const exportToExcel = () => {
    // Stub: Export functionality
    console.log('Export to Excel feature would be implemented here');
    alert('Fitur ekspor Excel akan diimplementasikan');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 Manajemen Dusun</h2>
          <p className="text-gray-600">Kelola data dusun dan target PBB</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 Manajemen Dusun</h2>
          <p className="text-gray-600">Kelola data dusun dan target PBB</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={exportToExcel} variant="outline">
            📊 Ekspor Excel
          </Button>
          {currentUser.role === 'super_admin' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>➕ Tambah Dusun</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Dusun Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="village">Desa</Label>
                    <Select 
                      value={createForm.village_id.toString()} 
                      onValueChange={(value) => setCreateForm((prev: CreateHamletInput) => ({ 
                        ...prev, 
                        village_id: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Desa" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVillages.map((village: Village) => (
                          <SelectItem key={village.id} value={village.id.toString()}>
                            {village.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="name">Nama Dusun</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateHamletInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Masukkan nama dusun"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="head_name">Nama Kepala Dusun</Label>
                    <Input
                      id="head_name"
                      value={createForm.head_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateHamletInput) => ({ ...prev, head_name: e.target.value }))
                      }
                      placeholder="Masukkan nama kepala dusun"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sppt_target">Target SPPT</Label>
                    <Input
                      id="sppt_target"
                      type="number"
                      value={createForm.sppt_target}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateHamletInput) => ({ 
                          ...prev, 
                          sppt_target: parseInt(e.target.value) || 0 
                        }))
                      }
                      placeholder="Target SPPT"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pbb_target">Target PBB (Rp)</Label>
                    <Input
                      id="pbb_target"
                      type="number"
                      value={createForm.pbb_target}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateHamletInput) => ({ 
                          ...prev, 
                          pbb_target: parseFloat(e.target.value) || 0 
                        }))
                      }
                      placeholder="Target PBB dalam Rupiah"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">Simpan</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari dusun atau kepala dusun..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
            {currentUser.role === 'super_admin' && (
              <div className="w-full sm:w-64">
                <Select value={selectedVillage?.toString() || 'all'} onValueChange={handleVillageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Desa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Desa</SelectItem>
                    {availableVillages.map((village: Village) => (
                      <SelectItem key={village.id} value={village.id.toString()}>
                        {village.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Desa</TableHead>
                <TableHead>Dusun</TableHead>
                <TableHead>Kepala Dusun</TableHead>
                <TableHead className="text-right">Target SPPT</TableHead>
                <TableHead className="text-right">Target PBB</TableHead>
                {currentUser.role === 'super_admin' && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHamlets.map((hamlet: Hamlet) => {
                const village = villages.find(v => v.id === hamlet.village_id);
                return (
                  <TableRow key={hamlet.id}>
                    <TableCell>
                      <Badge variant="outline">{village?.name || 'Unknown'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{hamlet.name}</TableCell>
                    <TableCell>{hamlet.head_name}</TableCell>
                    <TableCell className="text-right">
                      {hamlet.sppt_target.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {hamlet.pbb_target.toLocaleString('id-ID')}
                    </TableCell>
                    {currentUser.role === 'super_admin' && (
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(hamlet)}
                        >
                          ✏️ Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredHamlets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada data dusun yang ditemukan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dusun</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_village">Desa</Label>
              <Select 
                value={editForm.village_id?.toString() || ''} 
                onValueChange={(value) => setEditForm((prev: UpdateHamletInput) => ({ 
                  ...prev, 
                  village_id: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Desa" />
                </SelectTrigger>
                <SelectContent>
                  {availableVillages.map((village: Village) => (
                    <SelectItem key={village.id} value={village.id.toString()}>
                      {village.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_name">Nama Dusun</Label>
              <Input
                id="edit_name"
                value={editForm.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateHamletInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Masukkan nama dusun"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_head_name">Nama Kepala Dusun</Label>
              <Input
                id="edit_head_name"
                value={editForm.head_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateHamletInput) => ({ ...prev, head_name: e.target.value }))
                }
                placeholder="Masukkan nama kepala dusun"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_sppt_target">Target SPPT</Label>
              <Input
                id="edit_sppt_target"
                type="number"
                value={editForm.sppt_target || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateHamletInput) => ({ 
                    ...prev, 
                    sppt_target: parseInt(e.target.value) || 0 
                  }))
                }
                placeholder="Target SPPT"
                min="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_pbb_target">Target PBB (Rp)</Label>
              <Input
                id="edit_pbb_target"
                type="number"
                value={editForm.pbb_target || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateHamletInput) => ({ 
                    ...prev, 
                    pbb_target: parseFloat(e.target.value) || 0 
                  }))
                }
                placeholder="Target PBB dalam Rupiah"
                min="0"
                step="0.01"
                required
              />
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
