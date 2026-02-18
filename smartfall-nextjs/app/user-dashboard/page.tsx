'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Heart, TrendingDown, User, LogOut, Activity, Bell, MessageSquare, AlertCircle, X } from 'lucide-react';
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

interface Message {
  id: number;
  subject: string;
  message_text: string;
  is_read: boolean;
  is_urgent: boolean;
  sent_at: string;
  read_at?: string;
  caregiver_first_name: string;
  caregiver_last_name: string;
  caregiver_id: number;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const [messagesDialogOpen, setMessagesDialogOpen] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
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

        // Fetch messages
        await fetchMessages();

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Poll for new messages every 30 seconds
    const messageInterval = setInterval(() => {
      fetchMessages(true); // Preserve local state during polling
    }, 30000);

    return () => clearInterval(messageInterval);
  }, []);

  const fetchMessages = async (preserveLocalState = false) => {
    try {
      console.log('Fetching messages...');
      
      // GET PATIENT INFO FROM LOCALSTORAGE
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.patient_id) {
        console.log('No patient ID found in localStorage');
        return;
      }
      
      const messagesRes = await fetch(
        `${API_BASE_URL}/user/messages?patient_id=${user.patient_id}`,
        { credentials: 'include' }
      );
      
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        console.log('Messages received:', messagesData);
        
        // Get the IDs of current messages
        const currentMessageIds = new Set(messages.map(m => m.id));
        
        // If preserving local state, merge server data with local read status
        let finalMessages = messagesData;
        if (preserveLocalState && messages.length > 0) {
          // Create a map of local read states
          const localReadStates = new Map(
            messages.filter(m => m.is_read).map(m => [m.id, true])
          );
          
          // Apply local read states to server data
          finalMessages = messagesData.map((m: Message) => ({
            ...m,
            is_read: m.is_read || localReadStates.has(m.id),
            read_at: m.read_at || (localReadStates.has(m.id) ? messages.find(msg => msg.id === m.id)?.read_at : undefined)
          }));
        }
        
        // Find truly NEW messages (not in current state)
        const newMessages = finalMessages.filter((m: Message) => 
          !m.is_read && !currentMessageIds.has(m.id)
        );
        
        const newUnreadCount = finalMessages.filter((m: Message) => !m.is_read).length;
        
        setMessages(finalMessages);
        setUnreadCount(newUnreadCount);
        
        // Only show notification if there are ACTUALLY NEW messages
        // (not just on page refresh or initial load)
        if (newMessages.length > 0 && currentMessageIds.size > 0) {
          // currentMessageIds.size > 0 ensures this isn't the initial load
          const newestUnread = newMessages[0]; // First new message
          setLatestMessage(newestUnread);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 10000);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      console.log('=== MARK AS READ DEBUG ===');
      console.log('Message ID:', messageId);
      
      // GET PATIENT INFO FROM LOCALSTORAGE
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      console.log('User from localStorage:', user);
      
      if (!user || !user.patient_id) {
        console.error('No patient_id found');
        return;
      }
      
      // Optimistically update UI first
      setMessages(messages.map((m: Message) => 
        m.id === messageId ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
      ));
      
      // Decrease unread count
      setUnreadCount(Math.max(0, unreadCount - 1));
      
      // Update selected message if it's the one being read
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({
          ...selectedMessage,
          is_read: true,
          read_at: new Date().toISOString()
        });
      }
      
      const fullUrl = `${window.location.origin}${API_BASE_URL}/messages/${messageId}/read`;
      console.log('Full URL:', fullUrl);
      console.log('Request body:', JSON.stringify({ patient_id: user.patient_id }));
      
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patient_id: user.patient_id
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS - Message marked as read:', data);
        
        // Refresh messages from server after a short delay
        setTimeout(() => {
          fetchMessages(true);
        }, 500);
      } else {
        const errorText = await response.text();
        console.error('❌ FAILED to mark as read:');
        console.error('- Status:', response.status);
        console.error('- Status Text:', response.statusText);
        console.error('- Response length:', errorText.length);
        console.error('- Is HTML response:', errorText.includes('<!DOCTYPE html>'));
        
        if (errorText.includes('<!DOCTYPE html>')) {
          console.error('⚠️ Received HTML instead of JSON - endpoint likely does not exist');
          console.error('Expected endpoint: app/api/messages/[messageId]/read/route.js or route.ts');
        }
        
        // Keep the optimistic update even on error
        console.warn('⚠️ Keeping message marked as read locally despite API error');
      }
      
      console.log('=== END MARK AS READ DEBUG ===');
    } catch (error) {
      console.error('❌ Exception in handleMarkAsRead:', error);
      console.warn('⚠️ Keeping message marked as read locally despite error');
    }
  };

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      handleMarkAsRead(message.id);
    }
  };

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
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#ea580c';
    return '#dc2626';
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

  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
      {/* Notification Toast */}
      {showNotification && latestMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
          <Card className="w-96 shadow-2xl border-2 border-[#1a1a96]">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {latestMessage.is_urgent ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      New message from {latestMessage.caregiver_first_name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowNotification(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {latestMessage.subject || latestMessage.message_text}
                  </p>
                  <Button
                    size="sm"
                    className="bg-[#1a1a96] hover:bg-[#15157a]"
                    onClick={() => {
                      setShowNotification(false);
                      setMessagesDialogOpen(true);
                      handleOpenMessage(latestMessage);
                    }}
                  >
                    View Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                className="rounded-lg px-6 relative"
                onClick={() => setMessagesDialogOpen(true)}
              >
                <Bell className="mr-2 h-4 w-4" />
                Messages
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 hover:bg-red-600 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
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

      {/* Messages Dialog */}
      <Dialog open={messagesDialogOpen} onOpenChange={setMessagesDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Your Messages</span>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 hover:bg-red-600">
                  {unreadCount} unread
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Messages from your caregiver
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-4 h-[500px]">
            {/* Message List */}
            <ScrollArea className="col-span-2 border-r pr-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <Card 
                      key={message.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedMessage?.id === message.id 
                          ? 'border-[#1a1a96] border-2' 
                          : message.is_read 
                          ? 'opacity-60' 
                          : 'border-l-4 border-l-[#1a1a96]'
                      }`}
                      onClick={() => handleOpenMessage(message)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {message.is_urgent && (
                              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                            <p className="text-sm font-semibold truncate">
                              {message.subject || 'No subject'}
                            </p>
                          </div>
                          {!message.is_read && (
                            <div className="w-2 h-2 rounded-full bg-[#1a1a96] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.caregiver_first_name} {message.caregiver_last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatMessageDate(message.sent_at)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Content */}
            <div className="col-span-3">
              {selectedMessage ? (
                <div className="h-full flex flex-col">
                  <div className="flex-shrink-0 pb-4 border-b mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-1">
                          {selectedMessage.subject || 'No subject'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          From: {selectedMessage.caregiver_first_name} {selectedMessage.caregiver_last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatMessageDate(selectedMessage.sent_at)}
                        </p>
                      </div>
                      {selectedMessage.is_urgent && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-foreground">
                        {selectedMessage.message_text}
                      </p>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a message to read</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}