"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, MessageSquare } from "lucide-react";
import { useFallAlerts } from "@/lib/hooks/useFallAlerts";
import { FallAlertToast } from "@/lib/components/FallAlertToast";
import { CaregiverHeader } from "./components/CaregiverHeader";
import { PatientTable } from "./components/PatientTable";
import { DeviceTable } from "./components/DeviceTable";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { AlertsTab } from "./components/AlertsTab";
import { AddPatientSheet } from "./components/AddPatientSheet";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Users, Heart, TrendingUp } from "lucide-react";
import PatientDetailsDialog from "@/app/PatientDetailsDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  clearAllRepeatingFallAlerts,
  getFallAlertAudioStatus,
  primeFallAlertAudio,
  startRepeatingFallAlert,
  stopRepeatingFallAlert,
} from "@/lib/fall-alert-audio";

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
  isMuted: boolean;
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
  caregiverId?: string | number;
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState<boolean>(false);
  const [messageTarget, setMessageTarget] = useState<Patient | null>(null);
  const [messageForm, setMessageForm] = useState({
    subject: "",
    message: "",
    isUrgent: false,
  });
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const caregiverPollId =
    caregiver?.caregiverId || caregiver?.caregiver_id || caregiver?.id;

  // Use fall alerts hook (starts polling after caregiver loads)
  const {
    falls: liveFalls,
    newFallCount,
    clearNewFallCount,
  } = useFallAlerts(caregiverPollId ? String(caregiverPollId) : undefined);

  // Track previous falls to detect new ones for toast display
  const previousFallIdsRef = useRef<Set<string>>(new Set());
  const liveFallNotificationsInitializedRef = useRef(false);
  const activeFallToastIdsRef = useRef<Map<string, string | number>>(new Map());

  const dismissFallToast = (fallId: string) => {
    const toastId = activeFallToastIdsRef.current.get(fallId);
    if (toastId !== undefined) {
      toast.dismiss(toastId);
      activeFallToastIdsRef.current.delete(fallId);
    }
    stopRepeatingFallAlert(`caregiver-fall:${fallId}`);
  };

  const clearAllFallNotifications = () => {
    activeFallToastIdsRef.current.forEach((toastId) => {
      toast.dismiss(toastId);
    });
    activeFallToastIdsRef.current.clear();
    clearAllRepeatingFallAlerts();
    clearNewFallCount();
  };

  // Show toast for new falls
  useEffect(() => {
    if (!liveFallNotificationsInitializedRef.current) {
      previousFallIdsRef.current = new Set(liveFalls.map((f) => f.id));
      liveFallNotificationsInitializedRef.current = true;
      return;
    }

    liveFalls.forEach((fall) => {
      if (!previousFallIdsRef.current.has(fall.id)) {
        void (async () => {
          const patientName =
            `${fall.patient?.user.firstName || "Unknown"} ${fall.patient?.user.lastName || ""}`.trim();
          const audioBlocked = (await getFallAlertAudioStatus()) !== "ready";

          startRepeatingFallAlert(`caregiver-fall:${fall.id}`);
          const toastId = toast.custom(
            () => (
              <FallAlertToast
                patientName={patientName}
                confidenceLevel={fall.confidenceLevel}
                confidenceScore={fall.confidenceScore}
                audioBlocked={audioBlocked}
                onDismiss={() => dismissFallToast(fall.id)}
                onClearAll={clearAllFallNotifications}
                onViewDetails={() => dismissFallToast(fall.id)}
              />
            ),
            {
              duration: Number.POSITIVE_INFINITY,
              position: "top-right",
            },
          );
          activeFallToastIdsRef.current.set(fall.id, toastId);
        })();
      }
    });

    // Update tracked fall IDs
    previousFallIdsRef.current = new Set(liveFalls.map((f) => f.id));
  }, [liveFalls]);

  useEffect(() => {
    primeFallAlertAudio();
    return () => {
      clearAllFallNotifications();
    };
  }, []);

  const API_BASE_URL = "/api";

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const caregiverRes = await fetch(`${API_BASE_URL}/caregiver/current`, {
          credentials: "include",
        });

        if (!caregiverRes.ok) {
          throw new Error("Failed to fetch caregiver data");
        }

        const caregiverData: Caregiver = await caregiverRes.json();
        setCaregiver(caregiverData);

        const unassignedRes = await fetch(
          `${API_BASE_URL}/patients/unassigned`,
          {
            credentials: "include",
          },
        );

        if (!unassignedRes.ok) {
          throw new Error("Failed to fetch unassigned patients");
        }

        const unassignedData: Patient[] = await unassignedRes.json();
        setUnassignedPatients(unassignedData);

        const myPatientsRes = await fetch(
          `${API_BASE_URL}/caregiver/patients`,
          {
            credentials: "include",
          },
        );

        if (!myPatientsRes.ok) {
          throw new Error("Failed to fetch assigned patients");
        }

        const myPatientsData: Patient[] = await myPatientsRes.json();
        setMyPatients(myPatientsData);

        const statsRes = await fetch(`${API_BASE_URL}/caregiver/stats`, {
          credentials: "include",
        });

        if (!statsRes.ok) {
          throw new Error("Failed to fetch statistics");
        }

        const statsData: Stats = await statsRes.json();
        setStats(statsData);

        const devicesRes = await fetch(`${API_BASE_URL}/caregiver/devices`, {
          credentials: "include",
        });

        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          setDevices(devicesData.devices || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error(
          "Failed to load dashboard data. Please make sure you are logged in and try again.",
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
          credentials: "include",
        });

        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          setDevices(devicesData.devices || []);
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };

    const intervalId = setInterval(fetchDevices, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Logged out successfully");
        window.location.href = "/login";
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout. Please try again.");
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
        toast.error("Cannot assign patient: missing patient id");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/caregiver-patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
          serverMessage || `Failed to assign patient (HTTP ${response.status})`,
        );
      }

      const updatedPatients = [...myPatients, patient];
      setMyPatients(updatedPatients);
      setUnassignedPatients(
        unassignedPatients.filter((p) => (p.id ?? p.patient_id) !== patientId),
      );

      const statsRes = await fetch(`${API_BASE_URL}/caregiver/stats`, {
        credentials: "include",
      });

      if (statsRes.ok) {
        const statsData: Stats = await statsRes.json();
        setStats(statsData);
      }

      setSheetOpen(false);
      toast.success("Patient assigned successfully");
    } catch (error) {
      console.error("Error assigning patient:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to assign patient. Please try again.";
      toast.error(message);
    }
  };

  const handleOpenMessageDialog = (patient: Patient) => {
    setMessageTarget(patient);
    setMessageForm({ subject: "", message: "", isUrgent: false });
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!messageTarget || !messageForm.message.trim()) return;

    const patientId =
      messageTarget.id ?? messageTarget.patient_id ?? messageTarget.patientId;
    if (patientId == null) {
      toast.error("Cannot send message: missing patient id");
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientId: String(patientId),
          subject: messageForm.subject,
          messageText: messageForm.message,
          isUrgent: messageForm.isUrgent,
        }),
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          err.error || `Failed to send message (HTTP ${response.status})`,
        );
      }

      toast.success("Message sent successfully");
      setMessageDialogOpen(false);
      setMessageForm({ subject: "", message: "", isUrgent: false });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
    } finally {
      setSendingMessage(false);
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
              label: "Logout",
              onClick: handleLogout,
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
        <Tabs
          defaultValue="patients"
          className="w-full"
          onValueChange={(v) => {
            if (v === "alerts") clearNewFallCount();
          }}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alerts
              {newFallCount > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
                  {newFallCount}
                </span>
              )}
            </TabsTrigger>
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
              onSendMessage={handleOpenMessageDialog}
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
              recentFalls={liveFalls}
              unresolvedFalls={stats.recentFalls}
              highRiskPatients={stats.highRiskPatients}
              offlineDevices={Math.max(
                0,
                devices.length - Math.floor(devices.length * 0.8),
              )}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Patient Details Dialog with Notifications and Messaging */}
      <PatientDetailsDialog
        patient={selectedPatient}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Message to{" "}
              {messageTarget
                ? `${messageTarget.firstName || messageTarget.first_name || ""} ${messageTarget.lastName || messageTarget.last_name || ""}`.trim()
                : "Patient"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Optional subject"
                value={messageForm.subject}
                onChange={(e) =>
                  setMessageForm((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                rows={5}
                value={messageForm.message}
                onChange={(e) =>
                  setMessageForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="urgent"
                checked={messageForm.isUrgent}
                onCheckedChange={(checked) =>
                  setMessageForm((prev) => ({ ...prev, isUrgent: checked }))
                }
              />
              <Label htmlFor="urgent" className="cursor-pointer">
                Mark as urgent
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMessageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageForm.message.trim()}
              className="bg-[#1a1a96] hover:bg-[#15157a]"
            >
              {sendingMessage ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
