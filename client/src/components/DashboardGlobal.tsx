
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { VillageDashboardData } from '../../../server/src/schema';

interface DashboardGlobalProps {
  data: VillageDashboardData[];
  isLoading: boolean;
}

export function DashboardGlobal({ data, isLoading }: DashboardGlobalProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Dashboard Global</h2>
          <p className="text-gray-600">Ringkasan pencapaian PBB untuk semua desa</p>
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

  const totalTarget = data.reduce((sum, village) => sum + village.total_pbb_target, 0);
  const totalPaid = data.reduce((sum, village) => sum + village.total_pbb_paid, 0);
  const overallAchievement = totalTarget > 0 ? (totalPaid / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Dashboard Global</h2>
        <p className="text-gray-600">Ringkasan pencapaian PBB untuk semua desa</p>
      </div>

      {/* Overall Summary */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-xl">📈 Ringkasan Keseluruhan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-blue-100">Total Target PBB</p>
              <p className="text-2xl font-bold">
                Rp {totalTarget.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-blue-100">Total Terbayar</p>
              <p className="text-2xl font-bold">
                Rp {totalPaid.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-blue-100">Pencapaian</p>
              <p className="text-2xl font-bold">{overallAchievement.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={overallAchievement} className="h-3 bg-blue-700" />
          </div>
        </CardContent>
      </Card>

      {/* Village Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((village: VillageDashboardData) => (
          <Card key={village.village_id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">🏘️ {village.village_name}</CardTitle>
                <Badge 
                  variant={village.achievement_percentage >= 80 ? "default" : 
                          village.achievement_percentage >= 60 ? "secondary" : "destructive"}
                >
                  {village.achievement_percentage.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Target SPPT</p>
                  <p className="font-semibold">{village.total_sppt_target.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-600">SPPT Terbayar</p>
                  <p className="font-semibold text-green-600">{village.total_sppt_paid.toLocaleString('id-ID')}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Target PBB</span>
                  <span className="font-medium">Rp {village.total_pbb_target.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PBB Terbayar</span>
                  <span className="font-medium text-green-600">Rp {village.total_pbb_paid.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{village.achievement_percentage.toFixed(1)}%</span>
                </div>
                <Progress value={village.achievement_percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Tidak ada data desa yang tersedia.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
