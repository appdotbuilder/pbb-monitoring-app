
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  LoginInput,
  Village,
  Hamlet,
  PbbPayment,
  VillageDashboardData,
  HamletDashboardData,
  PbbReportItem,
  CreateUserInput,
  CreateHamletInput,
  CreatePbbPaymentInput,
  UpdateHamletInput,
  UpdatePbbPaymentInput,
  UpdateUserInput,
  HamletFilter,
  PbbPaymentFilter
} from '../../server/src/schema';

// Import components
import { LoginForm } from '@/components/LoginForm';
import { DashboardGlobal } from '@/components/DashboardGlobal';
import { DashboardHamlet } from '@/components/DashboardHamlet';
import { HamletManagement } from '@/components/HamletManagement';
import { PbbDataManagement } from '@/components/PbbDataManagement';
import { PbbReport } from '@/components/PbbReport';
import { UserManagement } from '@/components/UserManagement';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard-global');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [villages, setVillages] = useState<Village[]>([]);
  const [hamlets, setHamlets] = useState<Hamlet[]>([]);
  const [pbbPayments, setPbbPayments] = useState<PbbPayment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [villageDashboard, setVillageDashboard] = useState<VillageDashboardData[]>([]);
  const [hamletDashboard, setHamletDashboard] = useState<HamletDashboardData[]>([]);
  const [pbbReport, setPbbReport] = useState<PbbReportItem[]>([]);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const [
        villagesData,
        hamletsData,
        pbbPaymentsData,
        villageDashboardData,
        hamletDashboardData,
        pbbReportData
      ] = await Promise.all([
        trpc.getVillages.query(),
        trpc.getHamlets.query(currentUser.role === 'village_user' && currentUser.village_id 
          ? { village_id: currentUser.village_id } 
          : undefined),
        trpc.getPbbPayments.query(currentUser.role === 'village_user' && currentUser.village_id 
          ? { village_id: currentUser.village_id } 
          : undefined),
        trpc.getVillageDashboard.query(),
        trpc.getHamletDashboard.query(currentUser.role === 'village_user' && currentUser.village_id 
          ? { village_id: currentUser.village_id } 
          : undefined),
        trpc.getPbbReport.query(currentUser.role === 'village_user' && currentUser.village_id 
          ? { village_id: currentUser.village_id } 
          : undefined)
      ]);

      setVillages(villagesData);
      setHamlets(hamletsData);
      setPbbPayments(pbbPaymentsData);
      setVillageDashboard(villageDashboardData);
      setHamletDashboard(hamletDashboardData);
      setPbbReport(pbbReportData);

      // Load users only for super admin
      if (currentUser.role === 'super_admin') {
        const usersData = await trpc.getUsers.query();
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = async (credentials: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await trpc.login.mutate(credentials);
      setCurrentUser(response.user);
      // Store user data in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login gagal. Periksa username dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('dashboard-global');
  };

  // Check for stored user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Show login form if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-800">🏛️ Monitoring PBB</CardTitle>
              <CardDescription>
                Sistem Monitoring Pajak Bumi dan Bangunan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              <LoginForm onLogin={handleLogin} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser.role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-800">🏛️ Monitoring PBB</h1>
              <Badge variant={isSuperAdmin ? "default" : "secondary"}>
                {isSuperAdmin ? "Super Admin" : "Pengguna Desa"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Selamat datang, <strong>{currentUser.full_name}</strong>
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="dashboard-global">📊 Dashboard Global</TabsTrigger>
            <TabsTrigger value="dashboard-hamlet">🏘️ Dashboard Dusun</TabsTrigger>
            <TabsTrigger value="hamlet-management">📋 Manajemen Dusun</TabsTrigger>
            <TabsTrigger value="pbb-data">💰 Data PBB Masuk</TabsTrigger>
            <TabsTrigger value="pbb-report">📈 Laporan PBB</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="user-management">👥 Manajemen Pengguna</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard-global">
            <DashboardGlobal 
              data={villageDashboard}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="dashboard-hamlet">
            <DashboardHamlet 
              data={hamletDashboard}
              villages={villages}
              currentUser={currentUser}
              onFilterChange={async (filter: HamletFilter) => {
                setIsLoading(true);
                try {
                  const data = await trpc.getHamletDashboard.query(filter);
                  setHamletDashboard(data);
                } catch (err) {
                  console.error('Failed to load hamlet dashboard:', err);
                  setError('Gagal memuat data dashboard dusun');
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="hamlet-management">
            <HamletManagement 
              hamlets={hamlets}
              villages={villages}
              currentUser={currentUser}
              onCreateHamlet={async (hamlet: CreateHamletInput) => {
                const newHamlet = await trpc.createHamlet.mutate(hamlet);
                setHamlets(prev => [...prev, newHamlet]);
              }}
              onUpdateHamlet={async (hamlet: UpdateHamletInput) => {
                const updatedHamlet = await trpc.updateHamlet.mutate(hamlet);
                setHamlets(prev => prev.map(h => h.id === hamlet.id ? updatedHamlet : h));
              }}
              onFilterChange={async (filter: HamletFilter) => {
                const data = await trpc.getHamlets.query(filter);
                setHamlets(data);
              }}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="pbb-data">
            <PbbDataManagement 
              payments={pbbPayments}
              hamlets={hamlets}
              villages={villages}
              currentUser={currentUser}
              onCreatePayment={async (payment: CreatePbbPaymentInput) => {
                const newPayment = await trpc.createPbbPayment.mutate(payment);
                setPbbPayments(prev => [...prev, newPayment]);
                // Refresh dashboard data
                loadData();
              }}
              onUpdatePayment={async (payment: UpdatePbbPaymentInput) => {
                const updatedPayment = await trpc.updatePbbPayment.mutate(payment);
                setPbbPayments(prev => prev.map(p => p.id === payment.id ? updatedPayment : p));
                // Refresh dashboard data
                loadData();
              }}
              onDeletePayment={async (id: number) => {
                await trpc.deletePbbPayment.mutate({ id });
                setPbbPayments(prev => prev.filter(p => p.id !== id));
                // Refresh dashboard data
                loadData();
              }}
              onFilterChange={async (filter: PbbPaymentFilter) => {
                const data = await trpc.getPbbPayments.query(filter);
                setPbbPayments(data);
              }}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="pbb-report">
            <PbbReport 
              data={pbbReport}
              villages={villages}
              currentUser={currentUser}
              onFilterChange={async (filter: PbbPaymentFilter) => {
                setIsLoading(true);
                try {
                  const data = await trpc.getPbbReport.query(filter);
                  setPbbReport(data);
                } catch (err) {
                  console.error('Failed to load PBB report:', err);
                  setError('Gagal memuat laporan PBB');
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="user-management">
              <UserManagement 
                users={users}
                villages={villages}
                onCreateUser={async (user: CreateUserInput) => {
                  const newUser = await trpc.createUser.mutate(user);
                  setUsers(prev => [...prev, newUser]);
                }}
                onUpdateUser={async (user: UpdateUserInput) => {
                  const updatedUser = await trpc.updateUser.mutate(user);
                  setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
                }}
                onDeleteUser={async (id: number) => {
                  await trpc.deleteUser.mutate({ id });
                  setUsers(prev => prev.filter(u => u.id !== id));
                }}
                isLoading={isLoading}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default App;
