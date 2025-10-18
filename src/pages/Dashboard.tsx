import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Container, PackageSearch, AlertTriangle, TrendingUp, Activity, Calendar, BarChart3 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Badge } from '@/components/ui/badge';
import { FloatingMenuButton } from '@/components/FloatingMenuButton';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalDrivers: number;
  activeDrivers: number;
  totalTrucks: number;
  totalTrailers: number;
  totalShipments: number;
  waitingShipments: number;
  expiringDocuments: number;
  completedShipments: number;
  inTransitShipments: number;
  totalCompanies: number;
}

interface RecentActivity {
  id: string;
  type: 'shipment' | 'driver' | 'truck' | 'trailer';
  action: string;
  description: string;
  timestamp: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    activeDrivers: 0,
    totalTrucks: 0,
    totalTrailers: 0,
    totalShipments: 0,
    waitingShipments: 0,
    expiringDocuments: 0,
    completedShipments: 0,
    inTransitShipments: 0,
    totalCompanies: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [drivers, trucks, trailers, shipments, companies] = await Promise.all([
        supabase.from('drivers').select('status, full_name, created_at'),
        supabase.from('trucks').select('expiry_date, truck_number, created_at'),
        supabase.from('trailers').select('expiry_date, trailer_number, created_at'),
        supabase.from('shipments').select('status, doc_no, created_at'),
        supabase.from('companies').select('id, short_name, created_at'),
      ]);

      const activeDrivers = drivers.data?.filter(d => d.status === 'active').length || 0;
      const waitingShipments = shipments.data?.filter(s => s.status === 'waiting').length || 0;
      const completedShipments = shipments.data?.filter(s => s.status === 'completed').length || 0;
      const inTransitShipments = shipments.data?.filter(s => s.status === 'in_transit').length || 0;
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringTrucks = trucks.data?.filter(t => 
        new Date(t.expiry_date) <= thirtyDaysFromNow
      ).length || 0;
      
      const expiringTrailers = trailers.data?.filter(t => 
        new Date(t.expiry_date) <= thirtyDaysFromNow
      ).length || 0;

      // Generate recent activity
      const activities: RecentActivity[] = [];
      
      // Recent drivers
      drivers.data?.slice(0, 2).forEach(driver => {
        activities.push({
          id: `driver-${Math.random()}`,
          type: 'driver',
          action: 'added',
          description: `New driver ${driver.full_name} was added`,
          timestamp: driver.created_at
        });
      });

      // Recent shipments
      shipments.data?.slice(0, 3).forEach(shipment => {
        activities.push({
          id: `shipment-${Math.random()}`,
          type: 'shipment',
          action: 'created',
          description: `Shipment ${shipment.doc_no} was created`,
          timestamp: shipment.created_at
        });
      });

      setStats({
        totalDrivers: drivers.data?.length || 0,
        activeDrivers,
        totalTrucks: trucks.data?.length || 0,
        totalTrailers: trailers.data?.length || 0,
        totalShipments: shipments.data?.length || 0,
        waitingShipments,
        completedShipments,
        inTransitShipments,
        totalCompanies: companies.data?.length || 0,
        expiringDocuments: expiringTrucks + expiringTrailers,
      });

      setRecentActivity(activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Drivers',
      value: stats.totalDrivers,
      subtitle: `${stats.activeDrivers} active`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Fleet Vehicles',
      value: stats.totalTrucks + stats.totalTrailers,
      subtitle: `${stats.totalTrucks} trucks, ${stats.totalTrailers} trailers`,
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Active Shipments',
      value: stats.totalShipments,
      subtitle: `${stats.waitingShipments} waiting, ${stats.inTransitShipments} in transit`,
      icon: PackageSearch,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Companies',
      value: stats.totalCompanies,
      subtitle: 'Registered partners',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+3%',
      trend: 'up'
    },
  ];

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1">
            <header className="sticky top-0 z-40 bg-card border-b border-border">
              <div className="flex items-center justify-between h-16 px-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold">Dashboard</h1>
                </div>
              </div>
            </header>
            <div className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          </main>
          <FloatingMenuButton />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Dashboard</h1>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  <Activity className="w-3 h-3 mr-1" />
                  Live Data
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchDashboardStats}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
              <p className="text-gray-600">Here's what's happening with your fleet today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {statCards.map((card, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {card.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                        <Badge variant="secondary" className="text-xs">
                          {card.change}
                        </Badge>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {card.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>



            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Quick Stats */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Driver Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Drivers</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {stats.activeDrivers}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Drivers</span>
                        <Badge variant="secondary">{stats.totalDrivers}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Availability Rate</span>
                        <span className="text-sm font-medium text-green-600">
                          {stats.totalDrivers > 0 ? Math.round((stats.activeDrivers / stats.totalDrivers) * 100) : 0}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PackageSearch className="h-5 w-5 text-orange-600" />
                        Shipment Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Waiting</span>
                        <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                          {stats.waitingShipments}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">In Transit</span>
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          {stats.inTransitShipments}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completed</span>
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          {stats.completedShipments}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Fleet Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-green-600" />
                      Fleet Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{stats.totalTrucks}</div>
                        <div className="text-sm text-gray-600">Trucks</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{stats.totalTrailers}</div>
                        <div className="text-sm text-gray-600">Trailers</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</div>
                        <div className="text-sm text-gray-600">Companies</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{stats.expiringDocuments}</div>
                        <div className="text-sm text-gray-600">Expiring</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="p-1 bg-white rounded-full">
                              {activity.type === 'driver' && <Users className="h-4 w-4 text-blue-600" />}
                              {activity.type === 'shipment' && <PackageSearch className="h-4 w-4 text-orange-600" />}
                              {activity.type === 'truck' && <Truck className="h-4 w-4 text-green-600" />}
                              {activity.type === 'trailer' && <Container className="h-4 w-4 text-purple-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <FloatingMenuButton />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
