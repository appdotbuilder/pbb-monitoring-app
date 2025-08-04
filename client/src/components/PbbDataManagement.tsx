
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { 
  PbbPayment, 
  Hamlet, 
  Village, 
  User, 
  CreatePbbPaymentInput, 
  UpdatePbbPaymentInput, 
  PbbPaymentFilter 
} from '../../../server/src/schema';

interface PbbDataManagementProps {
  payments: PbbPayment[];
  hamlets: Hamlet[];
  villages: Village[];
  currentUser: User;
  onCreatePayment: (payment: CreatePbbPaymentInput) => Promise<void>;
  onUpdatePayment: (payment: UpdatePbbPaymentInput) => Promise<void>;
  onDeletePayment: (id: number) => Promise<void>;
  onFilterChange: (filter: PbbPaymentFilter) => void;
  isLoading: boolean;
}

export function PbbDataManagement({
  payments,
  hamlets,
  villages,
  currentUser,
  onCreatePayment,
  onUpdatePayment,
  onDeletePayment,
  onFilterChange,
  isLoading
}: PbbDataManagementProps) {
  const [selectedVillage, setSelectedVillage] = useState<number | undefined>(
    currentUser.role === 'village_user' ? currentUser.village_id || undefined : undefined
  );
  const [selectedHamlet, setSelectedHamlet] = useState<number | undefined>();
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [createForm, setCreateForm] = useState<CreatePbbPaymentInput>({
    payment_date: new Date(),
    village_id: currentUser.village_id || 0,
    hamlet_id: 0,
    payment_amount: 0,
    sppt_paid_count: 0,
    payment_type: 'tunai',
    notes: null,
    created_by: currentUser.id
  });

  const [editForm, setEditForm] = useState<UpdatePbbPaymentInput>({
    id: 0,
    payment_date: new Date(),
    village_id: 0,
    hamlet_id: 0,
    payment_amount: 0,
    sppt_paid_count: 0,
    payment_type: 'tunai',
    notes: null
  });

  const availableVillages = currentUser.role === 'village_user' && currentUser.village_id
    ? villages.filter(v => v.id === currentUser.village_id)
    : villages;

  const availableHamlets = selectedVillage || currentUser.village_id
    ? hamlets.filter(h => h.village_id === (selectedVillage || currentUser.village_id))
    : hamlets;

  const filteredPayments = payments.filter((payment: PbbPayment) => {
    const hamlet = hamlets.find(h => h.id === payment.hamlet_id);
    const village = villages.find(v => v.id === payment.village_id);
    
    const matchesSearch = village?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hamlet?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleVillageChange = (value: string) => {
    const villageId = value === 'all' ? undefined : parseInt(value);
    setSelectedVillage(villageId);
    setSelectedHamlet(undefined);
    applyFilters({ village_id: villageId });
  };

  const handleHamletChange = (value: string) => {
    const hamletId = value === 'all' ? undefined : parseInt(value);
    setSelectedHamlet(hamletId);
    applyFilters({ hamlet_id: hamletId });
  };

  const applyFilters = (newFilter: Partial<PbbPaymentFilter> = {}) => {
    const filter: PbbPaymentFilter = {
      village_id: selectedVillage,
      hamlet_id: selectedHamlet,
      start_date: dateFilter.start ? new Date(dateFilter.start) : undefined,
      end_date: dateFilter.end ? new Date(dateFilter.end) : undefined,
      ...newFilter
    };
    
    // Remove undefined values
    Object.keys(filter).forEach(key => {
      if (filter[key as keyof PbbPaymentFilter] === undefined) {
        delete filter[key as keyof PbbPaymentFilter];
      }
    });

    onFilterChange(filter);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreatePayment(createForm);
      setIsCreateDialogOpen(false);
      setCreateForm({
        payment_date: new Date(),
        village_id: currentUser.village_id || 0,
        hamlet_id: 0,
        payment_amount: 0,
        sppt_paid_count: 0,
        payment_type: 'tunai',
        notes: null,
        created_by: currentUser.id
      });
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdatePayment(editForm);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update payment:', error);
    }
  };

  const openEditDialog = (payment: PbbPayment) => {
    setEditForm({
      id: payment.id,
      payment_date: payment.payment_date,
      village_id: payment.village_id,
      hamlet_id: payment.hamlet_id,
      payment_amount: payment.payment_amount,
      sppt_paid_count: payment.sppt_paid_count,
      payment_type: payment.payment_type,
      notes: payment.notes
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await onDeletePayment(id);
    } catch (error) {
      console.error('Failed to delete payment:', error);
    }
  };

  const canEditOrDelete = (payment: PbbPayment) => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'village_user') {
      return payment.village_id === currentUser.village_id;
    }
    return false;
  };

  const printReport = () => {
    // Stub: Print functionality
    console.log('Print report feature would be implemented here');
    alert('Fitur cetak laporan akan diimplementasikan');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">💰 Data PBB Masuk</h2>
          <p className="text-gray-600">Kelola catatan pembayaran PBB</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">💰 Data PBB Masuk</h2>
          <p className="text-gray-600">Kelola catatan pembayaran PBB</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={printReport} variant="outline">
            🖨️ Cetak Laporan
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>➕ Tambah Pembayaran</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Pembayaran PBB</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_date">Tanggal Pembayaran</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={createForm.payment_date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreatePbbPaymentInput) => ({ 
                          ...prev, 
                          payment_date: new Date(e.target.value) 
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_type">Jenis Pembayaran</Label>
                    <Select 
                      value={createForm.payment_type} 
                      onValueChange={(value: 'tunai' | 'transfer' | 'setoran') => 
                        setCreateForm((prev: CreatePbbPaymentInput) => ({ 
                          ...prev, 
                          payment_type: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tunai">Tunai</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="setoran">Setoran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="village">Desa</Label>
                  <Select 
                    value={createForm.village_id ? createForm.village_id.toString() : ''} 
                    onValueChange={(value) => {
                      const villageId = parseInt(value);
                      setCreateForm((prev: CreatePbbPaymentInput) => ({ 
                        ...prev, 
                        village_id: villageId,
                        hamlet_id: 0 // Reset hamlet when village changes
                      }));
                    }}
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
                  <Label htmlFor="hamlet">Dusun</Label>
                  <Select 
                    value={createForm.hamlet_id ? createForm.hamlet_id.toString() : ''} 
                    onValueChange={(value) => setCreateForm((prev: CreatePbbPaymentInput) => ({ 
                      ...prev, 
                      hamlet_id: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Dusun" />
                    </SelectTrigger>
                    <SelectContent>
                      {hamlets
                        .filter(h => h.village_id === createForm.village_id)
                        .map((hamlet: Hamlet) => (
                          <SelectItem key={hamlet.id} value={hamlet.id.toString()}>
                            {hamlet.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_amount">Jumlah Pembayaran (Rp)</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      value={createForm.payment_amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreatePbbPaymentInput) => ({ 
                          ...prev, 
                          payment_amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      placeholder="Jumlah dalam Rupiah"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sppt_paid_count">Jumlah SPPT Terbayar</Label>
                    <Input
                      id="sppt_paid_count"
                      type="number"
                      value={createForm.sppt_paid_count}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreatePbbPaymentInput) => ({ 
                          ...prev, 
                          sppt_paid_count: parseInt(e.target.value) || 0 
                        }))
                      }
                      placeholder="Jumlah SPPT"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={createForm.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateForm((prev: CreatePbbPaymentInput) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                    placeholder="Catatan tambahan..."
                    rows={3}
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
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Pencarian</Label>
              <Input
                placeholder="Cari desa atau dusun..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
            {currentUser.role === 'super_admin' && (
              <div>
                <Label>Filter Desa</Label>
                <Select value={selectedVillage?.toString() || 'all'} onValueChange={handleVillageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Desa" />
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
            <div>
              <Label>Filter Dusun</Label>
              <Select value={selectedHamlet?.toString() || 'all'} onValueChange={handleHamletChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Dusun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Dusun</SelectItem>
                  {availableHamlets.map((hamlet: Hamlet) => (
                    <SelectItem key={hamlet.id} value={hamlet.id.toString()}>
                      {hamlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rentang Tanggal</Label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDateFilter(prev => ({ ...prev, start: e.target.value }));
                    setTimeout(() => applyFilters(), 500);
                  }}
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDateFilter(prev => ({ ...prev, end: e.target.value }));
                    setTimeout(() => applyFilters(), 500);
                  }}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Desa</TableHead>
                <TableHead>Dusun</TableHead>
                <TableHead className="text-right">Jumlah Bayar</TableHead>
                <TableHead className="text-right">SPPT Terbayar</TableHead>
                <TableHead>Jenis Bayar</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment: PbbPayment) => {
                const village = villages.find(v => v.id === payment.village_id);
                const hamlet = hamlets.find(h => h.id === payment.hamlet_id);
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.payment_date.toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{village?.name || 'Unknown'}</Badge>
                    </TableCell>
                    <TableCell>{hamlet?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {payment.payment_amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.sppt_paid_count.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          payment.payment_type === 'tunai' ? 'default' :
                          payment.payment_type === 'transfer' ? 'secondary' : 'outline'
                        }
                      >
                        {payment.payment_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {canEditOrDelete(payment) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(payment)}
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
                                    Apakah Anda yakin ingin menghapus data pembayaran ini? 
                                    Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(payment.id)}>
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada data pembayaran yang ditemukan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pembayaran PBB</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_payment_date">Tanggal Pembayaran</Label>
                <Input
                  id="edit_payment_date"
                  type="date"
                  value={editForm.payment_date?.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdatePbbPaymentInput) => ({ 
                      ...prev, 
                      payment_date: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_payment_type">Jenis Pembayaran</Label>
                <Select 
                  value={editForm.payment_type} 
                  onValueChange={(value: 'tunai' | 'transfer' | 'setoran') => 
                    setEditForm((prev: UpdatePbbPaymentInput) => ({ 
                      ...prev, 
                      payment_type: value 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="setoran">Setoran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_village">Desa</Label>
              <Select 
                value={editForm.village_id ? editForm.village_id.toString() : ''} 
                onValueChange={(value) => {
                  const villageId = parseInt(value);
                  setEditForm((prev: UpdatePbbPaymentInput) => ({ 
                    ...prev, 
                    village_id: villageId,
                    hamlet_id: 0 // Reset hamlet when village changes
                  }));
                }}
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
              <Label htmlFor="edit_hamlet">Dusun</Label>
              <Select 
                value={editForm.hamlet_id ? editForm.hamlet_id.toString() : ''} 
                onValueChange={(value) => setEditForm((prev: UpdatePbbPaymentInput) => ({ 
                  ...prev, 
                  hamlet_id: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Dusun" />
                </SelectTrigger>
                <SelectContent>
                  {hamlets
                    .filter(h => h.village_id === editForm.village_id)
                    .map((hamlet: Hamlet) => (
                      <SelectItem key={hamlet.id} value={hamlet.id.toString()}>
                        {hamlet.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_payment_amount">Jumlah Pembayaran (Rp)</Label>
                <Input
                  id="edit_payment_amount"
                  type="number"
                  value={editForm.payment_amount || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdatePbbPaymentInput) => ({ 
                      ...prev, 
                      payment_amount: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="Jumlah dalam Rupiah"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_sppt_paid_count">Jumlah SPPT Terbayar</Label>
                <Input
                  id="edit_sppt_paid_count"
                  type="number"
                  value={editForm.sppt_paid_count || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdatePbbPaymentInput) => ({ 
                      ...prev, 
                      sppt_paid_count: parseInt(e.target.value) || 0 
                    }))
                  }
                  placeholder="Jumlah SPPT"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_notes">Catatan (Opsional)</Label>
              <Textarea
                id="edit_notes"
                value={editForm.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditForm((prev: UpdatePbbPaymentInput) => ({ 
                    ...prev, 
                    notes: e.target.value || null 
                  }))
                }
                placeholder="Catatan tambahan..."
                rows={3}
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
