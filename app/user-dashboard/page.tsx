'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Heart, TrendingDown, User, LogOut, Smartphone, Bell, X, Mail } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface UserData {
  firstName?: string;
  lastName?: string;
  dob: string;
  riskScore: number;
  isHighRisk: boolean;
  medicalConditions?: string;
}

interface Message {
  id: string;
  caregiverId: string;
  patientId: string;
  subject?: string;
  messageText: string;
  isRead: boolean;
  isUrgent: boolean;
  sentAt: string;
  readAt?: string;
  caregiverFirstName: string;
  caregiverLastName: string;
}

interface Caregiver {
  firstName?: string;
  lastName?: string;
  facilityName?: string;
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
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalFalls: 0,
    fallsThisWeek: 0,
    fallsThisMonth: 0,
    fallsThisYear: 0,
    currentHealthScore: 0,
    isHighRisk: false,
  });
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('weekly');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [messagesDialogOpen, setMessagesDialogOpen] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const prevUnreadCountRef = useRef<number>(0);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const API_BASE_URL = '/api';

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/messages`, { credentials: 'include' });
      if (!res.ok) return;
      const data: Message[] = await res.json();
      const newUnread = data.filter((m) => !m.isRead).length;

      setMessages(data);
      setUnreadCount(newUnread);

      // Trigger notification only when unread count increases
      if (newUnread > prevUnreadCountRef.current) {
        const newest = data.find((m) => !m.isRead) ?? null;
        setLatestMessage(newest);
        setShowNotification(true);

        // Auto-dismiss after 10 seconds
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = setTimeout(() => setShowNotification(false), 10000);
      }
      prevUnreadCountRef.current = newUnread;
    } catch {
      // Silently ignore polling errors
    }
  };

  // Initial message fetch + 30-second polling
  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 30000);
    return () => {
      clearInterval(intervalId);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, []);

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      try {
        await fetch(`${API_BASE_URL}/messages/${message.id}/read`, {
          method: 'PUT',
          credentials: 'include',
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m))
        );
        const newUnread = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnread);
        prevUnreadCountRef.current = newUnread;
      } catch {
        // Ignore read errors
      }
    }
  };

  const formatMessageDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('[UserDashboard] Fetching user data from API...');
        // Fetch user data
        const userRes = await fetch(`${API_BASE_URL}/patient/stats`, {
          credentials: 'include',
        });

        console.log('[UserDashboard] User API response status:', userRes.status);

        if (!userRes.ok) {
          if (userRes.status === 401) {
            console.log('[UserDashboard] Unauthorized - redirecting to login');
            router.push('/login');
            return;
          }
          const errorData = await userRes.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Failed to fetch user data: ${errorData.error || userRes.statusText}`);
        }

        const userDataRes = await userRes.json();
        console.log('[UserDashboard] User data response:', {
          patient: {
            id: userDataRes.patient?.id,
            firstName: userDataRes.patient?.firstName,
            lastName: userDataRes.patient?.lastName,
            isHighRisk: userDataRes.patient?.isHighRisk,
          },
          stats: userDataRes.stats,
        });

        setUser(userDataRes.patient);
        setStats({
          totalFalls: userDataRes.stats.totalFalls,
          fallsThisWeek: userDataRes.stats.recentFalls,
          fallsThisMonth: userDataRes.stats.recentFalls,
          fallsThisYear: userDataRes.stats.totalFalls,
          currentHealthScore: 75,
          isHighRisk: userDataRes.patient.isHighRisk,
        });

        // Fetch caregiver data
        console.log('[UserDashboard] Fetching caregiver data...');
        const caregiverRes = await fetch(`${API_BASE_URL}/patient/caregiver`, {
          credentials: 'include',
        });

        if (caregiverRes.ok) {
          const caregiverData: Caregiver = await caregiverRes.json();
          console.log('[UserDashboard] Caregiver data:', caregiverData);
          setCaregiver(caregiverData);
        } else {
          console.log('[UserDashboard] Caregiver fetch status:', caregiverRes.status);
        }

        // Fetch weekly data
        console.log('[UserDashboard] Fetching weekly report data...');
        const weeklyRes = await fetch(`${API_BASE_URL}/patient/reports/weekly`, {
          credentials: 'include',
        });

        if (weeklyRes.ok) {
          const weekly: ChartData[] = await weeklyRes.json();
          console.log('[UserDashboard] Weekly data points:', weekly.length);
          setWeeklyData(weekly);
          // Update health score from latest data
          if (weekly.length > 0) {
            console.log('[UserDashboard] Latest health score:', weekly[weekly.length - 1].healthScore);
            setStats((prev) => ({
              ...prev,
              currentHealthScore: weekly[weekly.length - 1].healthScore,
            }));
          }
        } else {
          console.log('[UserDashboard] Weekly fetch status:', weeklyRes.status);
        }

        // Fetch monthly data
        console.log('[UserDashboard] Fetching monthly report data...');
        const monthlyRes = await fetch(`${API_BASE_URL}/patient/reports/monthly`, {
          credentials: 'include',
        });

        if (monthlyRes.ok) {
          const monthly: ChartData[] = await monthlyRes.json();
          console.log('[UserDashboard] Monthly data points:', monthly.length);
          setMonthlyData(monthly);
        } else {
          console.log('[UserDashboard] Monthly fetch status:', monthlyRes.status);
        }

        // Fetch yearly data
        console.log('[UserDashboard] Fetching yearly report data...');
        const yearlyRes = await fetch(`${API_BASE_URL}/patient/reports/yearly`, {
          credentials: 'include',
        });

        if (yearlyRes.ok) {
          const yearly: ChartData[] = await yearlyRes.json();
          console.log('[UserDashboard] Yearly data points:', yearly.length);
          setYearlyData(yearly);
        } else {
          console.log('[UserDashboard] Yearly fetch status:', yearlyRes.status);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.href = '/login';
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.error('Error logging out:', err);
      toast.error('Failed to logout. Please try again.');
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

  if (!user || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'Failed to load your information.'}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#1a1a96] hover:bg-[#15157a]"
          >
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
                <h1 className="text-2xl font-bold text-[#1a1a96]">Welcome, {user.firstName} {user.lastName}</h1>
                <p className="text-sm text-muted-foreground">Age: {calculateAge(user.dob)} years</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => { setMessagesDialogOpen(true); setSelectedMessage(null); }}
                className="rounded-lg px-4 relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-red-600 text-white border-0">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/devices')}
                className="rounded-lg px-6"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Devices
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
                className="rounded-lg px-6"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button variant="outline" onClick={handleLogout} className="rounded-lg px-6">
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          {/* Health Score */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div
                style={{
                  backgroundColor: '#dcfce7',
                  padding: '20px',
                  borderRadius: '9999px',
                  marginBottom: '20px',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
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
              <div
                style={{
                  backgroundColor: stats.isHighRisk ? '#fee2e2' : '#dcfce7',
                  padding: '20px',
                  borderRadius: '9999px',
                  marginBottom: '20px',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stats.isHighRisk ? (
                  <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626', strokeWidth: 2 }} />
                ) : (
                  <Heart style={{ width: '32px', height: '32px', color: '#16a34a', strokeWidth: 2 }} />
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Risk Status</p>
              <div className="mt-2">{getRiskBadge(stats.isHighRisk)}</div>
            </CardContent>
          </Card>

          {/* Falls This Week */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  padding: '20px',
                  borderRadius: '9999px',
                  marginBottom: '20px',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingDown style={{ width: '32px', height: '32px', color: '#eab308', strokeWidth: 2 }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Falls This Week</p>
              <p className="text-5xl font-bold text-foreground">{stats.fallsThisWeek}</p>
            </CardContent>
          </Card>

          {/* Total Falls */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  padding: '20px',
                  borderRadius: '9999px',
                  marginBottom: '20px',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
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
                        {(caregiver.firstName?.charAt(0) || 'C')}
                        {(caregiver.lastName?.charAt(0) || 'G')}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {caregiver.firstName} {caregiver.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{caregiver.specialization || 'Caregiver'}</p>
                      </div>
                    </div>
                    {caregiver.facilityName && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Facility</p>
                        <p className="text-sm font-medium text-foreground">{caregiver.facilityName}</p>
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
                <CardDescription className="text-base">Track your health score and falls over time</CardDescription>
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
                          <Line type="monotone" dataKey="healthScore" stroke="#16a34a" strokeWidth={2} name="Health Score" />
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
                          <Line type="monotone" dataKey="healthScore" stroke="#16a34a" strokeWidth={2} name="Health Score" />
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
                          <Line type="monotone" dataKey="healthScore" stroke="#16a34a" strokeWidth={2} name="Health Score" />
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

      {/* New Message Notification Toast */}
      {showNotification && latestMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-gray-200 rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1a1a96] flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                New message from {latestMessage.caregiverFirstName} {latestMessage.caregiverLastName}
                {latestMessage.isUrgent && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                    Urgent
                  </span>
                )}
              </p>
              {latestMessage.subject && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{latestMessage.subject}</p>
              )}
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{latestMessage.messageText}</p>
              <Button
                size="sm"
                className="mt-2 h-7 text-xs bg-[#1a1a96] hover:bg-[#15157a]"
                onClick={() => {
                  setShowNotification(false);
                  setMessagesDialogOpen(true);
                  handleOpenMessage(latestMessage);
                }}
              >
                View Message
              </Button>
            </div>
            <button
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              onClick={() => setShowNotification(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Dialog */}
      <Dialog open={messagesDialogOpen} onOpenChange={setMessagesDialogOpen}>
        <DialogContent className="sm:max-w-[750px] h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Messages
              {unreadCount > 0 && (
                <Badge className="bg-red-600 text-white border-0 ml-1">{unreadCount} unread</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Message List */}
            <div className="w-64 flex-shrink-0 border-r overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                  <Mail className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <button
                    key={message.id}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-blue-50 border-l-2 border-l-[#1a1a96]' : ''
                    }`}
                    onClick={() => handleOpenMessage(message)}
                  >
                    <div className="flex items-start gap-2">
                      {!message.isRead && (
                        <div className="w-2 h-2 rounded-full bg-[#1a1a96] flex-shrink-0 mt-1.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!message.isRead ? 'font-semibold' : 'font-medium text-gray-700'}`}>
                          {message.caregiverFirstName} {message.caregiverLastName}
                        </p>
                        {message.subject && (
                          <p className="text-xs text-gray-500 truncate">{message.subject}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{formatMessageDate(message.sentAt)}</p>
                        {message.isUrgent && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 mt-1">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedMessage ? (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedMessage.subject || '(No subject)'}
                      </h3>
                      {selectedMessage.isUrgent && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      From: {selectedMessage.caregiverFirstName} {selectedMessage.caregiverLastName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(selectedMessage.sentAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedMessage.messageText}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <Mail className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Select a message to read</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
