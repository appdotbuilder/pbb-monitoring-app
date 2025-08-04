
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { PbbReportItem, Village, User, PbbPaymentFilter } from '../../../server/src/schema';

interface PbbReportProps {
  data: PbbReportItem[];
  villages: Village[];
  currentUser: User;
  onFilterChange: (filter: PbbPaymentFilter) => void;
  isLoading: boolean;
}

export function PbbReport({ 
  data, 
  villages, 
  currentUser, 
  onFilterChange, 
  isLoading 
}: PbbReportProps) {
  const [selectedVillage, setSelectedVillage] = useState<number | undefined>(
    currentUser.role === 'village_user' ? currentUser.village_id || undefined : undefined
  );
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  const availableVillages = currentUser.role === 'village_user' && currentUser.village_id
    ? villages.filter(v => v.id === currentUser.village_id)
    : villages;

  const handleVillageChange = (value: string) => {
    const villageId = value === 'all' ? undefined : parseInt(value);
    setSelectedVillage(villageId);
    applyFilters({ village_id: villageId });
  };

  const applyFilters = (newFilter: Partial<PbbPaymentFilter> = {}) => {
    const filter: PbbPaymentFilter = {
      village_id: selectedVillage,
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

  const exportToExcel = () => {
    // Stub: Export functionality
    console.log('Export to Excel feature would be implemented here');
    alert('Fitur ekspor Excel akan diimplementasikan');
  };

  const totalPaymentAmount = data.reduce((sum, item) => sum + item.payment_amount, 0);
  const totalSpptPaid = data.reduce((sum, item) => sum + item.sppt_paid_count, 0);
  const averageAchievement = data.length > 0 
    ? data.reduce((sum, item) => sum + item.achievement_percentage, 0) / data.length 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📈 Laporan PBB</h2>
          <p className="text-gray-600">Laporan pencapaian PBB per dusun</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📈 Laporan PBB</h2>
          <p className="text-gray-600">Laporan pencapaian PBB per dusun</p>
        </div>
        <Button onClick={exportToExcel} variant="outline">
          📊 Ekspor Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {totalPaymentAmount.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total SPPT Terbayar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalSpptPaid.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Rata-rata Pencapaian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {averageAchievement.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={dateFilter.start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDateFilter(prev => ({ ...prev, start: e.target.value }));
                  setTimeout(() => applyFilters(), 500);
                }}
              />
            </div>
            <div>
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={dateFilter.end}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDateFilter(prev => ({ ...prev, end: e.target.value }));
                  setTimeout(() => applyFilters(), 500);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
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
                <TableHead className="text-right">Pencapaian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: PbbReportItem, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    {item.payment_date.toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.village_name}</Badge>
                  </TableCell>
                  <TableCell>{item.hamlet_name}</TableCell>
                  <TableCell className="text-right font-medium">
                    Rp {item.payment_amount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.sppt_paid_count.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        item.payment_type === 'tunai' ? 'default' :
                        item.payment_type === 'transfer' ? 'secondary' : 'outline'
                      }
                    >
                      {item.payment_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={
                        item.achievement_percentage >= 80 ? "default" : 
                        item.achievement_percentage >= 60 ? "secondary" : "destructive"
                      }
                    >
                      {item.achievement_percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada data laporan yang ditemukan.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
