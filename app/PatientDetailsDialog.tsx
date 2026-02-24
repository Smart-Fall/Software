'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Heart, AlertTriangle, MessageSquare, TrendingDown, Activity, Calendar, CheckCircle2, XCircle, MapPin, Phone, ExternalLink } from 'lucide-react';

interface Patient {
  id?: number;
  patient_id?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  dob: string;
  riskScore?: number;
  risk_score?: number;
}

interface DailyScore {
  date: string;
  score: number;
  falls: number;
  alerts: number;
}

interface Alert {
  id: number;
  type: string;
  severity: string;
  timestamp: string;
  details: string;
}

interface Message {
  id: number;
  subject: string;
  message_text: string;
  is_read: boolean;
  is_urgent: boolean;
  sent_at: string;
  read_at?: string;
}

interface PatientStats {
  totalAlerts: number;
  totalMessages: number;
  unreadMessages: number;
  currentHealthScore: number;
  fallsThisWeek: number;
  fallsThisMonth: number;
}

interface PatientDetailsDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PatientDetailsDialog: React.FC<PatientDetailsDialogProps> = ({ patient, open, onOpenChange }) => {
  const [dailyScores, setDailyScores] = useState<DailyScore[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
    lastUpdated?: string;
  } | null>(null);
  const [stats, setStats] = useState<PatientStats>({
    totalAlerts: 0,
    totalMessages: 0,
    unreadMessages: 0,
    currentHealthScore: 0,
    fallsThisWeek: 0,
    fallsThisMonth: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // FIX: Change this from '/api' to '/api/auth'
  const API_BASE_URL = '/api/auth';

  useEffect(() => {
    if (patient && open) {
      fetchPatientDetails();
    }
  }, [patient, open]);

  const fetchPatientDetails = async () => {
    if (!patient) return;
    
    setIsLoading(true);
    try {
      const patientId = patient.id || patient.patient_id;

      console.log('Fetching details for patient:', patientId); // Debug log

      // Fetch daily scores (last 7 days)
      const scoresRes = await fetch(
        `${API_BASE_URL}/caregiver/patients/${patientId}/daily-scores`,
        { credentials: 'include' }
      );
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        console.log('Daily scores:', scoresData); // Debug log
        setDailyScores(scoresData);
      } else {
        console.error('Failed to fetch daily scores:', scoresRes.status);
      }

      // Fetch alerts
      const alertsRes = await fetch(
        `${API_BASE_URL}/caregiver/patients/${patientId}/alerts`,
        { credentials: 'include' }
      );
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        console.log('Alerts:', alertsData); // Debug log
        setAlerts(alertsData);
      } else {
        console.error('Failed to fetch alerts:', alertsRes.status);
      }

      // Fetch messages sent to this patient
      const messagesRes = await fetch(
        `${API_BASE_URL}/caregiver/patients/${patientId}/messages`,
        { credentials: 'include' }
      );
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        console.log('Messages:', messagesData); // Debug log
        setMessages(messagesData);
      } else {
        console.error('Failed to fetch messages:', messagesRes.status);
      }

      // Fetch patient stats
      const statsRes = await fetch(
        `${API_BASE_URL}/caregiver/patients/${patientId}/stats`,
        { credentials: 'include' }
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('Stats:', statsData); // Debug log
        setStats(statsData);
      } else {
        console.error('Failed to fetch stats:', statsRes.status);
      }

      // Fetch current location
      const locationRes = await fetch(
        `${API_BASE_URL}/caregiver/patients/${patientId}/location`,
        { credentials: 'include' }
      );
      
      console.log('Location response status:', locationRes.status);
      
      if (locationRes.ok) {
        const locationData = await locationRes.json();
        console.log('Location data received:', locationData);
        setLocation(locationData);
      } else {
        console.log('No location data available for patient');
        setLocation(null);
      }

    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setIsLoading(false);
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

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#ea580c';
    return '#dc2626';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  if (!patient) return null;

  const firstName = patient.firstName || patient.first_name;
  const lastName = patient.lastName || patient.last_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {firstName} {lastName}
          </DialogTitle>
          <DialogDescription>
            Age: {calculateAge(patient.dob)} | Current Health Score: {stats.currentHealthScore}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a96]"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="daily-scores">Daily Scores</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <ScrollArea className="h-[500px] pr-4">
                {/* Location Card - EMERGENCY ACCESS */}
                {location ? (
                  <Card className="mb-6 border-2 border-blue-500 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <p className="font-semibold text-blue-900">Current Location</p>
                          </div>
                          <p className="text-sm text-blue-800 mb-2">
                            {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                          </p>
                          {location.lastUpdated && (
                            <p className="text-xs text-blue-700">
                              Last updated: {formatDateTime(location.lastUpdated)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-600 text-blue-600 hover:bg-blue-100"
                            onClick={() => window.open(
                              `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
                              '_blank'
                            )}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            View Map
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="mb-6 border-2 border-gray-300 bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        <p className="font-semibold text-gray-700">Location Not Available</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        No recent location data for this patient. Location will be available after the patient records their first activity or fall.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Stats Cards */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                          <Heart className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Health Score</p>
                          <p className="text-2xl font-bold" style={{ color: getScoreColor(stats.currentHealthScore) }}>
                            {stats.currentHealthScore}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-full">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Alerts</p>
                          <p className="text-2xl font-bold">{stats.totalAlerts}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 rounded-full">
                          <TrendingDown className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Falls This Week</p>
                          <p className="text-2xl font-bold">{stats.fallsThisWeek}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <MessageSquare className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Unread Messages</p>
                          <p className="text-2xl font-bold">{stats.unreadMessages} / {stats.totalMessages}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            alert.severity === 'high' ? 'text-red-500' : 
                            alert.severity === 'medium' ? 'text-yellow-500' : 
                            'text-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{alert.type}</p>
                            <p className="text-xs text-muted-foreground">{alert.details}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDateTime(alert.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>

            {/* Daily Scores Tab */}
            <TabsContent value="daily-scores">
              <ScrollArea className="h-[500px] pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle>7-Day Health Score Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyScores}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#16a34a" 
                          strokeWidth={2}
                          name="Health Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-lg mb-3">Daily Breakdown</h3>
                  {dailyScores.map((day, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{formatDate(day.date)}</p>
                            <p className="text-sm text-muted-foreground">
                              {day.falls} fall{day.falls !== 1 ? 's' : ''} · {day.alerts} alert{day.alerts !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: getScoreColor(day.score) }}>
                              {day.score}
                            </p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No alerts recorded</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              alert.severity === 'high' ? 'bg-red-100' :
                              alert.severity === 'medium' ? 'bg-yellow-100' :
                              'bg-blue-100'
                            }`}>
                              <AlertTriangle className={`h-5 w-5 ${
                                alert.severity === 'high' ? 'text-red-600' :
                                alert.severity === 'medium' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold">{alert.type}</h4>
                                <Badge variant={
                                  alert.severity === 'high' ? 'destructive' :
                                  alert.severity === 'medium' ? 'default' :
                                  'secondary'
                                }>
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{alert.details}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(alert.timestamp)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <ScrollArea className="h-[500px] pr-4">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium">
                    {stats.unreadMessages} of {stats.totalMessages} messages unread
                  </p>
                </div>
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No messages sent yet</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <Card key={message.id} className={message.is_read ? 'opacity-60' : 'border-l-4 border-l-[#1a1a96]'}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{message.subject || 'No Subject'}</h4>
                              {message.is_urgent && (
                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                              )}
                            </div>
                            {message.is_read ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">Read</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400">
                                <XCircle className="h-4 w-4" />
                                <span className="text-xs">Unread</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {message.message_text}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <p>Sent: {formatDateTime(message.sent_at)}</p>
                            {message.read_at && (
                              <p>Read: {formatDateTime(message.read_at)}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsDialog;