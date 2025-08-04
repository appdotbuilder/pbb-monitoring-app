
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { HamletDashboardData, Village, User, HamletFilter } from '../../../server/src/schema';

interface DashboardHamletProps {
  data: HamletDashboardData[];
  villages: Village[];
  currentUser: User;
  onFilterChange: (filter: HamletFilter) => void;
  isLoading: boolean;
}

export function DashboardHamlet({ 
  data, 
  villages, 
  currentUser, 
  onFilterChange, 
  isLoading 
}: DashboardHamletProps) {
  const [selectedVillage, setSelectedVillage] = useState<number | undefined>(
    currentUser.role === 'village_user' ? currentUser.village_id || undefined : undefined
  );

  const handleVillageChange = (value: string) => {
    const villageId = value === 'all' ? undefined : parseInt(value);
    setSelectedVillage(villageId);
    onFilterChange({ village_id: villageId });
  };

  const availableVillages = currentUser.role === 'village_user' && currentUser.village_id
    ? villages.filter(v => v.id === currentUser.village_id)
    : villages;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🏘️ Dashboard per Dusun</h2>
          <p className="text-gray-600">Pencapaian PBB untuk setiap dusun</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-4" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🏘️ Dashboard per Dusun</h2>
          <p className="text-gray-600">Pencapaian PBB untuk setiap dusun</p>
        </div>

        {currentUser.role === 'super_admin' && (
          <div className="w-64">
            <Select value={selectedVillage?.toString() || 'all'} onValueChange={handleVillageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Desa" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((hamlet: HamletDashboardData) => (
          <Card key={hamlet.hamlet_id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">🏠 {hamlet.hamlet_name}</CardTitle>
                  <p className="text-sm text-gray-500">{hamlet.village_name}</p>
                </div>
                <Badge 
                  variant={hamlet.achievement_percentage >= 80 ? "default" : 
                          hamlet.achievement_percentage >= 60 ? "secondary" : "destructive"}
                >
                  {hamlet.achievement_percentage.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Target SPPT</p>
                  <p className="font-semibold">{hamlet.sppt_target.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-600">SPPT Terbayar</p>
                  <p className="font-semibold text-green-600">{hamlet.sppt_paid.toLocaleString('id-ID')}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Target PBB</span>
                  <span className="font-medium">Rp {hamlet.pbb_target.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PBB Terbayar</span>
                  <span className="font-medium text-green-600">Rp {hamlet.pbb_paid.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{hamlet.achievement_percentage.toFixed(1)}%</span>
                </div>
                <Progress value={hamlet.achievement_percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              Tidak ada data dusun yang tersedia.
              {selectedVillage && " Coba pilih desa lain atau reset filter."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
