'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle } from 'lucide-react';
import { CaregiverHeader } from './components/CaregiverHeader';
import { PatientTable } from './components/PatientTable';
import { DeviceTable } from './components/DeviceTable';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AlertsTab } from './components/AlertsTab';
import { AddPatientSheet } from './components/AddPatientSheet';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Users, Heart, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RiskScoreBadge } from '@/components/dashboard/RiskScoreBadge';
import { calculateAge } from '@/lib/dashboard-utils';

interface Patient {
  id?: number;
  patient_id?: number;
  patientId?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  dob: string;
  riskScore?: number;
  risk_score?: number;
  isHighRisk?: boolean;
  is_high_risk?: boolean;
  medicalConditions?: string;
  medical_conditions?: string;
}

interface Device {
  id: string;
  deviceId: string;
  deviceName: string | null;
  isActive: boolean;
  lastSeen: string | null;
  batteryLevel: number | null;
  patient: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

interface Caregiver {
  id?: number;
  caregiver_id?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  facilityName?: string;
  facility_name?: string;
  specialization?: string;
}

interface Stats {
  totalPatients: number;
  recentFalls: number;
  avgHealthScore: number;
  highRiskPatients: number;
}

export default function CaregiverDashboard() {
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    recentFalls: 0,
    avgHealthScore: 0,
    highRiskPatients: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  const API_BASE_URL = '/api';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const caregiverRes = await fetch(`${API_BASE_URL}/caregiver/current`, {
          credentials: 'include',
        });

        if (!caregiverRes.ok) {
          throw new Error('Failed to fetch caregiver data');
        }

        const caregiverData: Caregiver = await caregiverRes.json();
        setCaregiver(caregiverData);

        const unassignedRes = await fetch(
          `${API_BASE_URL}/patients/unassigned`,
          {
            credentials: 'include',
          }
        );

        if (!unassignedRes.ok) {
          throw new Error('Failed to fetch unassigned patients');
        }

        const unassignedData: Patient[] = await unassignedRes.json();
        setUnassignedPatients(unassignedData);

        const myPatientsRes = await fetch(
          `${API_BASE_URL}/caregiver/patients`,
          {
            credentials: 'include',
          }
        );

        if (!myPatientsRes.ok) {
          throw new Error('Failed to fetch assigned patients');
        }

        const myPatientsData: Patient[] = await myPatientsRes.json();
        setMyPatients(myPatientsData);

        const statsRes = await fetch(`${API_BASE_URL}/caregiver/stats`, {
          credentials: 'include',
        });

        if (!statsRes.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const statsData: Stats = await statsRes.json();
        setStats(statsData);

        const devicesRes = await fetch(`${API_BASE_URL}/caregiver/devices`, {
          credentials: 'include',
        });

        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          setDevices(devicesData.devices || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error(
          'Failed to load dashboard data. Please make sure you are logged in and try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const devicesRes = await fetch(`${API_BASE_URL}/caregiver/devices`, {
          credentials: 'include',
        });

        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          setDevices(devicesData.devices || []);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    const intervalId = setInterval(fetchDevices, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Logged out successfully');
        window.location.href = '/login';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const handleAddPatient = async (patient: Patient) => {
    try {
      const patientId = patient.id ?? patient.patient_id;

      if (patientId == null) {
        toast.error('Cannot assign patient: missing patient id');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/caregiver-patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patient_id: patientId,
        }),
      });

      if (!response.ok) {
        let serverMessage: string | undefined;
        try {
          const errorBody = await response.json();
          serverMessage = errorBody?.error;
        } catch {
          // ignore JSON parse failures
        }

        throw new Error(
          serverMessage || `Failed to assign patient (HTTP ${response.status})`
        );
      }

      const updatedPatients = [...myPatients, patient];
      setMyPatients(updatedPatients);
      setUnassignedPatients(
        unassignedPatients.filter((p) => (p.id ?? p.patient_id) !== patientId)
      );

      const statsRes = await fetch(`${API_BASE_URL}/caregiver/stats`, {
        credentials: 'include',
      });

      if (statsRes.ok) {
        const statsData: Stats = await statsRes.json();
        setStats(statsData);
      }

      setSheetOpen(false);
      toast.success('Patient assigned successfully');
    } catch (error) {
      console.error('Error assigning patient:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to assign patient. Please try again.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <CaregiverHeader
          firstName="Caregiver"
          onSearch={() => {}}
          onLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <LoadingSpinner message="Loading dashboard..." />
        </main>
      </div>
    );
  }

  if (!caregiver) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <CaregiverHeader
          firstName="Caregiver"
          onSearch={() => {}}
          onLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load dashboard"
            description="Unable to fetch caregiver information. Please refresh or contact support."
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
      <CaregiverHeader
        firstName={caregiver.firstName || caregiver.first_name}
        lastName={caregiver.lastName || caregiver.last_name}
        facilityName={caregiver.facilityName || caregiver.facility_name}
        alertCount={stats.highRiskPatients + stats.recentFalls}
        onSearch={setSearchQuery}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={Users}
            description="Currently assigned"
            color="blue"
          />

          <MetricCard
            title="Falls (Last 7d)"
            value={stats.recentFalls}
            icon={AlertTriangle}
            description="Fall events"
            color="red"
          />

          <MetricCard
            title="Avg Health Score"
            value={stats.avgHealthScore}
            icon={Heart}
            description="Overall health"
            color="green"
          />

          <MetricCard
            title="High Risk Patients"
            value={stats.highRiskPatients}
            icon={TrendingUp}
            description="Require attention"
            color="orange"
          />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-4">
            <div className="flex justify-end">
              <AddPatientSheet
                unassignedPatients={unassignedPatients}
                onAddPatient={handleAddPatient}
                isOpen={sheetOpen}
                onOpenChange={setSheetOpen}
              />
            </div>
            <PatientTable
              patients={myPatients}
              searchQuery={searchQuery}
              onViewDetails={handleViewDetails}
            />
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices">
            <DeviceTable devices={devices} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab
              totalPatients={stats.totalPatients}
              highRiskPatients={stats.highRiskPatients}
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <AlertsTab
              unresolvedFalls={stats.recentFalls}
              highRiskPatients={stats.highRiskPatients}
              offlineDevices={Math.max(0, devices.length - Math.floor(devices.length * 0.8))}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Patient Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedPatient?.firstName} {selectedPatient?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <p className="text-lg font-semibold">
                    {selectedPatient.firstName || selectedPatient.first_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <p className="text-lg font-semibold">
                    {selectedPatient.lastName || selectedPatient.last_name || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-lg font-semibold">
                    {new Date(selectedPatient.dob).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Age</label>
                  <p className="text-lg font-semibold">{calculateAge(selectedPatient.dob)} years</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Risk Score</label>
                  <div className="mt-2">
                    <RiskScoreBadge
                      score={selectedPatient.riskScore || selectedPatient.risk_score || 0}
                      showLabel
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">High Risk Status</label>
                  <p className="text-lg font-semibold">
                    {selectedPatient.isHighRisk || selectedPatient.is_high_risk ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {(selectedPatient.medicalConditions || selectedPatient.medical_conditions) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Medical Conditions</label>
                  <p className="text-sm text-foreground mt-2">
                    {selectedPatient.medicalConditions || selectedPatient.medical_conditions}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
