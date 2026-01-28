'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle } from 'lucide-react';
import { PatientHeader } from './components/PatientHeader';
import { StatsOverview } from './components/StatsOverview';
import { FallTrendChart } from './components/FallTrendChart';
import { FallHistoryTable } from './components/FallHistoryTable';
import { DeviceStatusList } from './components/DeviceStatusList';
import { HealthProfile } from './components/HealthProfile';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface Fall {
  id: string;
  fallDatetime: string;
  confidenceScore: number | null;
  confidenceLevel: string | null;
  severity: string | null;
  sosTriggered: boolean;
  wasInjured: boolean | null;
  resolved: boolean;
  resolvedAt: string | null;
  notes: string | null;
  device: {
    deviceId: string;
    deviceName: string | null;
  } | null;
}

interface Device {
  id: string;
  deviceId: string;
  deviceName: string | null;
  isActive: boolean;
  lastSeen: string | null;
  batteryLevel: number | null;
  firmwareVersion: string | null;
  statusUpdates: Array<{
    timestamp: string;
    batteryPercentage: number;
    wifiConnected: boolean;
    bluetoothConnected: boolean;
    sensorsInitialized: boolean;
    currentStatus: string | null;
  }>;
}

interface PatientData {
  patient: {
    firstName: string;
    lastName: string;
    dob: string | null;
    riskScore: number;
    isHighRisk: boolean;
    medicalConditions: string | null;
  };
  stats: {
    totalFalls: number;
    recentFalls: number;
    unresolvedFalls: number;
    deviceCount: number;
  };
}

export default function UserDashboard() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [falls, setFalls] = useState<Fall[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const API_BASE_URL = '/api';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const statsRes = await fetch(`${API_BASE_URL}/patient/stats`, {
          credentials: 'include'
        });

        if (!statsRes.ok) {
          if (statsRes.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch patient data');
        }

        const statsData: PatientData = await statsRes.json();
        setPatientData(statsData);

        const fallsRes = await fetch(`${API_BASE_URL}/patient/falls`, {
          credentials: 'include'
        });

        if (fallsRes.ok) {
          const fallsData = await fallsRes.json();
          setFalls(fallsData.falls || []);
        }

        const devicesRes = await fetch(`${API_BASE_URL}/patient/device`, {
          credentials: 'include'
        });

        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          setDevices(devicesData.devices || []);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const devicesRes = await fetch(`${API_BASE_URL}/patient/device`, {
          credentials: 'include'
        });

        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          setDevices(devicesData.devices || []);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    const intervalId = setInterval(fetchDevices, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Logged out successfully');
        router.push('/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <PatientHeader firstName="Patient" onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <LoadingSpinner message="Loading your dashboard..." />
        </main>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <PatientHeader firstName="Patient" onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load dashboard"
            description="Unable to fetch your patient data. Please refresh or contact support."
            action={{
              label: 'Logout',
              onClick: handleLogout
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <PatientHeader
        firstName={patientData.patient.firstName}
        unresolvedAlerts={patientData.stats.unresolvedFalls}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <StatsOverview
          totalFalls={patientData.stats.totalFalls}
          recentFalls={patientData.stats.recentFalls}
          unresolvedFalls={patientData.stats.unresolvedFalls}
          riskScore={patientData.patient.riskScore}
          isHighRisk={patientData.patient.isHighRisk}
          isLoading={isLoading}
        />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="falls">Fall History</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="health">Health Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <FallTrendChart falls={falls} />
          </TabsContent>

          <TabsContent value="falls">
            <FallHistoryTable falls={falls} />
          </TabsContent>

          <TabsContent value="devices">
            <DeviceStatusList devices={devices} />
          </TabsContent>

          <TabsContent value="health">
            <HealthProfile
              firstName={patientData.patient.firstName}
              lastName={patientData.patient.lastName}
              dob={patientData.patient.dob}
              riskScore={patientData.patient.riskScore}
              medicalConditions={patientData.patient.medicalConditions}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
