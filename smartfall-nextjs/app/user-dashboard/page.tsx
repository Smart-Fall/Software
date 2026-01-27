'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Heart, TrendingDown, User, LogOut, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UserData {
  id?: number;
  user_id?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  dob: string;
  healthScore?: number;
  health_score?: number;
  isHighRisk?: boolean;
  is_high_risk?: boolean;
  medicalConditions?: string;
  medical_conditions?: string;
}

interface Caregiver {
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  facilityName?: string;
  facility_name?: string;
  specialization?: string;
}

interface Stats {
  totalFalls: number;
  fallsThisWeek: number;
  fallsThisMonth: number;
  fallsThisYear: number;
  currentHealthScore: number;
  isHighRisk: boolean;
}

interface ChartData {
  name: string;
  healthScore: number;
  falls: number;
}

export default function UserDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalFalls: 0,
    fallsThisWeek: 0,
    fallsThisMonth: 0,
    fallsThisYear: 0,
    currentHealthScore: 0,
    isHighRisk: false
  });
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('weekly');
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = '/api';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching user data from:', `${API_BASE_URL}/user/current`);
        
        // Fetch user data
        const userRes = await fetch(`${API_BASE_URL}/user/current`, {
          credentials: 'include'
        });
        
        console.log('User response status:', userRes.status);
        
        if (!userRes.ok) {
          const errorData = await userRes.json().catch(() => ({ error: 'Unknown error' }));
          console.error('User fetch error:', errorData);
          throw new Error(`Failed to fetch user data: ${errorData.error || userRes.statusText}`);
        }
        
        const userData: UserData = await userRes.json();
        console.log('User data received:', userData);
        setUser(userData);

        // Fetch caregiver data
        console.log('Fetching caregiver data...');
        const caregiverRes = await fetch(`${API_BASE_URL}/user/caregiver`, {
          credentials: 'include'
        });
        
        console.log('Caregiver response status:', caregiverRes.status);
        
        if (caregiverRes.ok) {
          const caregiverData: Caregiver = await caregiverRes.json();
          console.log('Caregiver data received:', caregiverData);
          setCaregiver(caregiverData);
        } else {
          console.log('No caregiver assigned or error fetching caregiver');
        }

        // Fetch stats
        console.log('Fetching stats...');
        const statsRes = await fetch(`${API_BASE_URL}/user/stats`, {
          credentials: 'include'
        });
        
        console.log('Stats response status:', statsRes.status);
        
        if (!statsRes.ok) {
          const errorData = await statsRes.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Stats fetch error:', errorData);
          throw new Error(`Failed to fetch statistics: ${errorData.error || statsRes.statusText}`);
        }
        
        const statsData: Stats = await statsRes.json();
        console.log('Stats data received:', statsData);
        setStats(statsData);

        // Fetch weekly data
        console.log('Fetching weekly data...');
        const weeklyRes = await fetch(`${API_BASE_URL}/user/reports/weekly`, {
          credentials: 'include'
        });
        
        if (weeklyRes.ok) {
          const weekly: ChartData[] = await weeklyRes.json();
          console.log('Weekly data received:', weekly);
          setWeeklyData(weekly);
        } else {
          console.log('Error fetching weekly data');
        }

        // Fetch monthly data
        console.log('Fetching monthly data...');
        const monthlyRes = await fetch(`${API_BASE_URL}/user/reports/monthly`, {
          credentials: 'include'
        });
        
        if (monthlyRes.ok) {
          const monthly: ChartData[] = await monthlyRes.json();
          console.log('Monthly data received:', monthly);
          setMonthlyData(monthly);
        } else {
          console.log('Error fetching monthly data');
        }

        // Fetch yearly data
        console.log('Fetching yearly data...');
        const yearlyRes = await fetch(`${API_BASE_URL}/user/reports/yearly`, {
          credentials: 'include'
        });
        
        if (yearlyRes.ok) {
          const yearly: ChartData[] = await yearlyRes.json();
          console.log('Yearly data received:', yearly);
          setYearlyData(yearly);
        } else {
          console.log('Error fetching yearly data');
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        window.location.href = '/login';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return '#16a34a'; // Green
    if (score >= 60) return '#eab308'; // Yellow
    if (score >= 40) return '#ea580c'; // Orange
    return '#dc2626'; // Red
  };

  const getRiskBadge = (isRisk: boolean) => {
    if (isRisk) {
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 mr-1" />
          High Risk
        </div>
      );
    }
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
          <Heart className="w-4 h-4 mr-1" />
          Low Risk
        </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a96] mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left">
            <p className="text-sm font-mono text-gray-700">Debug info:</p>
            <p className="text-xs font-mono text-gray-600 mt-2">
              Check the browser console for detailed logs.
            </p>
          </div>
          <Button onClick={() => window.location.reload()} className="bg-[#1a1a96] hover:bg-[#15157a]">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load your information.</p>
          <Button onClick={() => window.location.reload()} className="mt-4 bg-[#1a1a96] hover:bg-[#15157a]">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a96]">
                  Welcome, {user?.firstName || user?.first_name} {user?.lastName || user?.last_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Age: {calculateAge(user.dob)} years
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="rounded-lg px-6"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          {/* Health Score */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div style={{ 
                backgroundColor: '#dcfce7', 
                padding: '20px', 
                borderRadius: '9999px', 
                marginBottom: '20px', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Heart style={{ width: '32px', height: '32px', color: getHealthScoreColor(stats.currentHealthScore), strokeWidth: 2 }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Health Score</p>
              <p className="text-5xl font-bold" style={{ color: getHealthScoreColor(stats.currentHealthScore) }}>
                {stats.currentHealthScore}
              </p>
            </CardContent>
          </Card>

          {/* Risk Status */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div style={{ 
                backgroundColor: stats.isHighRisk ? '#fee2e2' : '#dcfce7', 
                padding: '20px', 
                borderRadius: '9999px', 
                marginBottom: '20px', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {stats.isHighRisk ? (
                  <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626', strokeWidth: 2 }} />
                ) : (
                  <Heart style={{ width: '32px', height: '32px', color: '#16a34a', strokeWidth: 2 }} />
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Risk Status</p>
              <div className="mt-2">
                {getRiskBadge(stats.isHighRisk)}
              </div>
            </CardContent>
          </Card>

          {/* Falls This Week */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div style={{ 
                backgroundColor: '#fef3c7', 
                padding: '20px', 
                borderRadius: '9999px', 
                marginBottom: '20px', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <TrendingDown style={{ width: '32px', height: '32px', color: '#eab308', strokeWidth: 2 }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Falls This Week</p>
              <p className="text-5xl font-bold text-foreground">{stats.fallsThisWeek}</p>
            </CardContent>
          </Card>

          {/* Total Falls */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div style={{ 
                backgroundColor: '#fee2e2', 
                padding: '20px', 
                borderRadius: '9999px', 
                marginBottom: '20px', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626', strokeWidth: 2 }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Falls</p>
              <p className="text-5xl font-bold text-foreground">{stats.totalFalls}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Caregiver Info */}
          <div className="lg:col-span-4">
            <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">Your Caregiver</CardTitle>
              </CardHeader>
              <CardContent>
                {caregiver ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-[#1a1a96] flex items-center justify-center text-white font-bold text-lg">
                        {(caregiver.firstName || caregiver.first_name)?.charAt(0)}
                        {(caregiver.lastName || caregiver.last_name)?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {caregiver.firstName || caregiver.first_name} {caregiver.lastName || caregiver.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {caregiver.specialization || 'Caregiver'}
                        </p>
                      </div>
                    </div>
                    {(caregiver.facilityName || caregiver.facility_name) && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Facility</p>
                        <p className="text-sm font-medium text-foreground">
                          {caregiver.facilityName || caregiver.facility_name}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No caregiver assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-[#f8f9fa] rounded-lg">
                  <span className="text-sm text-muted-foreground">Falls This Month</span>
                  <span className="text-lg font-bold text-foreground">{stats.fallsThisMonth}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#f8f9fa] rounded-lg">
                  <span className="text-sm text-muted-foreground">Falls This Year</span>
                  <span className="text-lg font-bold text-foreground">{stats.fallsThisYear}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Area - Charts */}
          <div className="lg:col-span-8">
            <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">Health Trends</CardTitle>
                <CardDescription className="text-base">
                  Track your health score and falls over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                  </TabsList>

                  {/* Weekly Chart */}
                  <TabsContent value="weekly" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Health Score Trend</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="healthScore" 
                            stroke="#16a34a" 
                            strokeWidth={2}
                            name="Health Score"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Falls Per Day</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="falls" fill="#dc2626" name="Falls" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>

                  {/* Monthly Chart */}
                  <TabsContent value="monthly" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Health Score Trend</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="healthScore" 
                            stroke="#16a34a" 
                            strokeWidth={2}
                            name="Health Score"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Falls Per Week</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="falls" fill="#dc2626" name="Falls" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>

                  {/* Yearly Chart */}
                  <TabsContent value="yearly" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Health Score Trend</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={yearlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="healthScore" 
                            stroke="#16a34a" 
                            strokeWidth={2}
                            name="Health Score"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Falls Per Month</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={yearlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="falls" fill="#dc2626" name="Falls" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


// 'use client'

// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { AlertTriangle, Heart, TrendingDown, User, LogOut, Activity } from 'lucide-react';
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// interface UserData {
//   id?: number;
//   user_id?: number;
//   firstName?: string;
//   first_name?: string;
//   lastName?: string;
//   last_name?: string;
//   dob: string;
//   healthScore?: number;
//   health_score?: number;
//   isHighRisk?: boolean;
//   is_high_risk?: boolean;
//   medicalConditions?: string;
//   medical_conditions?: string;
// }

// interface Caregiver {
//   firstName?: string;
//   first_name?: string;
//   lastName?: string;
//   last_name?: string;
//   facilityName?: string;
//   facility_name?: string;
//   specialization?: string;
// }

// interface Stats {
//   totalFalls: number;
//   fallsThisWeek: number;
//   fallsThisMonth: number;
//   fallsThisYear: number;
//   currentHealthScore: number;
//   isHighRisk: boolean;
// }

// interface ChartData {
//   name: string;
//   healthScore: number;
//   falls: number;
// }

// export default function UserDashboard() {
//   const [user, setUser] = useState<UserData | null>(null);
//   const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
//   const [stats, setStats] = useState<Stats>({
//     totalFalls: 0,
//     fallsThisWeek: 0,
//     fallsThisMonth: 0,
//     fallsThisYear: 0,
//     currentHealthScore: 0,
//     isHighRisk: false
//   });
//   const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
//   const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
//   const [yearlyData, setYearlyData] = useState<ChartData[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [activeTab, setActiveTab] = useState<string>('weekly');

//   const API_BASE_URL = '/api';

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       setIsLoading(true);
//       try {
//         // Fetch user data
//         const userRes = await fetch(`${API_BASE_URL}/user/current`, {
//           credentials: 'include'
//         });
        
//         if (!userRes.ok) {
//           throw new Error('Failed to fetch user data');
//         }
        
//         const userData: UserData = await userRes.json();
//         setUser(userData);

//         // Fetch caregiver data
//         const caregiverRes = await fetch(`${API_BASE_URL}/user/caregiver`, {
//           credentials: 'include'
//         });
        
//         if (caregiverRes.ok) {
//           const caregiverData: Caregiver = await caregiverRes.json();
//           setCaregiver(caregiverData);
//         }

//         // Fetch stats
//         const statsRes = await fetch(`${API_BASE_URL}/user/stats`, {
//           credentials: 'include'
//         });
        
//         if (!statsRes.ok) {
//           throw new Error('Failed to fetch statistics');
//         }
        
//         const statsData: Stats = await statsRes.json();
//         setStats(statsData);

//         // Fetch weekly data
//         const weeklyRes = await fetch(`${API_BASE_URL}/user/reports/weekly`, {
//           credentials: 'include'
//         });
        
//         if (weeklyRes.ok) {
//           const weekly: ChartData[] = await weeklyRes.json();
//           setWeeklyData(weekly);
//         }

//         // Fetch monthly data
//         const monthlyRes = await fetch(`${API_BASE_URL}/user/reports/monthly`, {
//           credentials: 'include'
//         });
        
//         if (monthlyRes.ok) {
//           const monthly: ChartData[] = await monthlyRes.json();
//           setMonthlyData(monthly);
//         }

//         // Fetch yearly data
//         const yearlyRes = await fetch(`${API_BASE_URL}/user/reports/yearly`, {
//           credentials: 'include'
//         });
        
//         if (yearlyRes.ok) {
//           const yearly: ChartData[] = await yearlyRes.json();
//           setYearlyData(yearly);
//         }

//       } catch (error) {
//         console.error('Error fetching dashboard data:', error);
//         alert('Failed to load dashboard data. Please make sure you are logged in and try again.');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchDashboardData();
//   }, []);

//   const handleLogout = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/auth/logout`, {
//         method: 'POST',
//         credentials: 'include'
//       });

//       if (response.ok) {
//         window.location.href = '/login';
//       } else {
//         throw new Error('Logout failed');
//       }
//     } catch (error) {
//       console.error('Error logging out:', error);
//       alert('Failed to logout. Please try again.');
//     }
//   };

//   const calculateAge = (dob: string): number => {
//     const birthDate = new Date(dob);
//     const today = new Date();
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const monthDiff = today.getMonth() - birthDate.getMonth();
//     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//       age--;
//     }
//     return age;
//   };

//   const getHealthScoreColor = (score: number): string => {
//     if (score >= 80) return '#16a34a'; // Green
//     if (score >= 60) return '#eab308'; // Yellow
//     if (score >= 40) return '#ea580c'; // Orange
//     return '#dc2626'; // Red
//   };

//   const getRiskBadge = (isRisk: boolean) => {
//     if (isRisk) {
//       return (
//         <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
//           <AlertTriangle className="w-4 h-4 mr-1" />
//           High Risk
//         </div>
//       );
//     }
//     return (
//       <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
//           <Heart className="w-4 h-4 mr-1" />
//           Low Risk
//         </div>
//     );
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a96] mx-auto"></div>
//           <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
//         <div className="text-center">
//           <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
//           <p className="text-muted-foreground">Failed to load your information.</p>
//           <Button onClick={() => window.location.reload()} className="mt-4 bg-[#1a1a96] hover:bg-[#15157a]">
//             Retry
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#f8f9fa]">
//       {/* Navbar */}
//       <nav className="bg-white border-b">
//         <div className="max-w-7xl mx-auto px-6 lg:px-8">
//           <div className="flex justify-between items-center h-20">
//             <div className="flex items-center gap-3">
//               <div>
//                 <h1 className="text-2xl font-bold text-[#1a1a96]">
//                   Welcome, {user?.firstName || user?.first_name} {user?.lastName || user?.last_name}
//                 </h1>
//                 <p className="text-sm text-muted-foreground">
//                   Age: {calculateAge(user.dob)} years
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <Button 
//                 variant="outline" 
//                 onClick={handleLogout}
//                 className="rounded-lg px-6"
//               >
//                 <LogOut className="mr-2 h-4 w-4" />
//                 Logout
//               </Button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Stats Cards */}
//         <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
//           {/* Health Score */}
//           <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
//             <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
//               <div style={{ 
//                 backgroundColor: '#dcfce7', 
//                 padding: '20px', 
//                 borderRadius: '9999px', 
//                 marginBottom: '20px', 
//                 width: '80px', 
//                 height: '80px', 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 justifyContent: 'center' 
//               }}>
//                 <Heart style={{ width: '32px', height: '32px', color: getHealthScoreColor(stats.currentHealthScore), strokeWidth: 2 }} />
//               </div>
//               <p className="text-sm font-medium text-muted-foreground mb-2">Health Score</p>
//               <p className="text-5xl font-bold" style={{ color: getHealthScoreColor(stats.currentHealthScore) }}>
//                 {stats.currentHealthScore}
//               </p>
//             </CardContent>
//           </Card>

//           {/* Risk Status */}
//           <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
//             <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
//               <div style={{ 
//                 backgroundColor: stats.isHighRisk ? '#fee2e2' : '#dcfce7', 
//                 padding: '20px', 
//                 borderRadius: '9999px', 
//                 marginBottom: '20px', 
//                 width: '80px', 
//                 height: '80px', 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 justifyContent: 'center' 
//               }}>
//                 {stats.isHighRisk ? (
//                   <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626', strokeWidth: 2 }} />
//                 ) : (
//                   <Heart style={{ width: '32px', height: '32px', color: '#16a34a', strokeWidth: 2 }} />
//                 )}
//               </div>
//               <p className="text-sm font-medium text-muted-foreground mb-2">Risk Status</p>
//               <div className="mt-2">
//                 {getRiskBadge(stats.isHighRisk)}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Falls This Week */}
//           <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
//             <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
//               <div style={{ 
//                 backgroundColor: '#fef3c7', 
//                 padding: '20px', 
//                 borderRadius: '9999px', 
//                 marginBottom: '20px', 
//                 width: '80px', 
//                 height: '80px', 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 justifyContent: 'center' 
//               }}>
//                 <TrendingDown style={{ width: '32px', height: '32px', color: '#eab308', strokeWidth: 2 }} />
//               </div>
//               <p className="text-sm font-medium text-muted-foreground mb-2">Falls This Week</p>
//               <p className="text-5xl font-bold text-foreground">{stats.fallsThisWeek}</p>
//             </CardContent>
//           </Card>

//           {/* Total Falls */}
//           <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
//             <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
//               <div style={{ 
//                 backgroundColor: '#fee2e2', 
//                 padding: '20px', 
//                 borderRadius: '9999px', 
//                 marginBottom: '20px', 
//                 width: '80px', 
//                 height: '80px', 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 justifyContent: 'center' 
//               }}>
//                 <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626', strokeWidth: 2 }} />
//               </div>
//               <p className="text-sm font-medium text-muted-foreground mb-2">Total Falls</p>
//               <p className="text-5xl font-bold text-foreground">{stats.totalFalls}</p>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//           {/* Sidebar - Caregiver Info */}
//           <div className="lg:col-span-4">
//             <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow mb-6">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-xl font-bold">Your Caregiver</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {caregiver ? (
//                   <div className="space-y-3">
//                     <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-xl">
//                       <div className="w-12 h-12 rounded-full bg-[#1a1a96] flex items-center justify-center text-white font-bold text-lg">
//                         {(caregiver.firstName || caregiver.first_name)?.charAt(0)}
//                         {(caregiver.lastName || caregiver.last_name)?.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="font-semibold text-foreground">
//                           {caregiver.firstName || caregiver.first_name} {caregiver.lastName || caregiver.last_name}
//                         </p>
//                         <p className="text-sm text-muted-foreground">
//                           {caregiver.specialization || 'Caregiver'}
//                         </p>
//                       </div>
//                     </div>
//                     {(caregiver.facilityName || caregiver.facility_name) && (
//                       <div className="p-3 bg-blue-50 rounded-lg">
//                         <p className="text-xs text-muted-foreground mb-1">Facility</p>
//                         <p className="text-sm font-medium text-foreground">
//                           {caregiver.facilityName || caregiver.facility_name}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-muted-foreground">
//                     <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
//                     <p className="text-sm">No caregiver assigned</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             {/* Quick Stats */}
//             <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-xl font-bold">Quick Stats</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div className="flex justify-between items-center p-3 bg-[#f8f9fa] rounded-lg">
//                   <span className="text-sm text-muted-foreground">Falls This Month</span>
//                   <span className="text-lg font-bold text-foreground">{stats.fallsThisMonth}</span>
//                 </div>
//                 <div className="flex justify-between items-center p-3 bg-[#f8f9fa] rounded-lg">
//                   <span className="text-sm text-muted-foreground">Falls This Year</span>
//                   <span className="text-lg font-bold text-foreground">{stats.fallsThisYear}</span>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Main Dashboard Area - Charts */}
//           <div className="lg:col-span-8">
//             <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-xl font-bold">Health Trends</CardTitle>
//                 <CardDescription className="text-base">
//                   Track your health score and falls over time
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//                   <TabsList className="grid w-full grid-cols-3 mb-6">
//                     <TabsTrigger value="weekly">Weekly</TabsTrigger>
//                     <TabsTrigger value="monthly">Monthly</TabsTrigger>
//                     <TabsTrigger value="yearly">Yearly</TabsTrigger>
//                   </TabsList>

//                   {/* Weekly Chart */}
//                   <TabsContent value="weekly" className="space-y-6">
//                     <div>
//                       <h3 className="text-lg font-semibold mb-4">Health Score Trend</h3>
//                       <ResponsiveContainer width="100%" height={250}>
//                         <LineChart data={weeklyData}>
//                           <CartesianGrid strokeDasharray="3 3" />
//                           <XAxis dataKey="name" />
//                           <YAxis domain={[0, 100]} />
//                           <Tooltip />
//                           <Legend />
//                           <Line 
//                             type="monotone" 
//                             dataKey="healthScore" 
//                             stroke="#16a34a" 
//                             strokeWidth={2}
//                             name="Health Score"
//                           />
//                         </LineChart>
//                       </ResponsiveContainer>
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-semibold mb-4">Falls Per Day</h3>
//                       <ResponsiveContainer width="100%" height={250}>
//                         <BarChart data={weeklyData}>
//                           <CartesianGrid strokeDasharray="3 3" />
//                           <XAxis dataKey="name" />
//                           <YAxis />
//                           <Tooltip />
//                           <Legend />
//                           <Bar dataKey="falls" fill="#dc2626" name="Falls" />
//                         </BarChart>
//                       </ResponsiveContainer>
//                     </div>
//                   </TabsContent>

//                   {/* Monthly Chart */}
//                   <TabsContent value="monthly" className="space-y-6">
//                     <div>
//                       <h3 className="text-lg font-semibold mb-4">Health Score Trend</h3>
//                       <ResponsiveContainer width="100%" height={250}>
//                         <LineChart data={monthlyData}>
//                           <CartesianGrid strokeDasharray="3 3" />
//                           <XAxis dataKey="name" />
//                           <YAxis domain={[0, 100]} />
//                           <Tooltip />
//                           <Legend />
//                           <Line 
//                             type="monotone" 
//                             dataKey="healthScore" 
//                             stroke="#16a34a" 
//                             strokeWidth={2}
//                             name="Health Score"
//                           />
//                         </LineChart>
//                       </ResponsiveContainer>
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-semibold mb-4">Falls Per Week</h3>
//                       <ResponsiveContainer width="100%" height={250}>
//                         <BarChart data={monthlyData}>
//                           <CartesianGrid strokeDasharray="3 3" />
//                           <XAxis dataKey="name" />
//                           <YAxis />
//                           <Tooltip />
//                           <Legend />
//                           <Bar dataKey="falls" fill="#dc2626" name="Falls" />
//                         </BarChart>
//                       </ResponsiveContainer>
//                     </div>
//                   </TabsContent>

//                   {/* Yearly Chart */}
//                   <TabsContent value="yearly" className="space-y-6">
//                     <div>
//                       <h3 className="text-lg font-semibold mb-4">Health Score Trend</h3>
//                       <ResponsiveContainer width="100%" height={250}>
//                         <LineChart data={yearlyData}>
//                           <CartesianGrid strokeDasharray="3 3" />
//                           <XAxis dataKey="name" />
//                           <YAxis domain={[0, 100]} />
//                           <Tooltip />
//                           <Legend />
//                           <Line 
//                             type="monotone" 
//                             dataKey="healthScore" 
//                             stroke="#16a34a" 
//                             strokeWidth={2}
//                             name="Health Score"
//                           />
//                         </LineChart>
//                       </ResponsiveContainer>
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-semibold mb-4">Falls Per Month</h3>
//                       <ResponsiveContainer width="100%" height={250}>
//                         <BarChart data={yearlyData}>
//                           <CartesianGrid strokeDasharray="3 3" />
//                           <XAxis dataKey="name" />
//                           <YAxis />
//                           <Tooltip />
//                           <Legend />
//                           <Bar dataKey="falls" fill="#dc2626" name="Falls" />
//                         </BarChart>
//                       </ResponsiveContainer>
//                     </div>
//                   </TabsContent>
//                 </Tabs>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

