"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, Cpu, Link2, BarChart3, Usb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { StatsOverview } from "./components/StatsOverview";
import { UsersTable } from "./components/UsersTable";
import { FallsTable } from "./components/FallsTable";
import { DevicesTable } from "./components/DevicesTable";
import { AssignmentsTable } from "./components/AssignmentsTable";

interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalCaregivers: number;
  totalFalls: number;
  totalDevices: number;
  unresolvedFalls: number;
}

interface UserRecord {
  id: string;
  email: string;
  accountType: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  isActive: boolean;
  createdAt: string;
}

interface FallRecord {
  id: string;
  patientId?: string;
  deviceId?: string;
  fallDatetime: string;
  confidenceScore?: number;
  confidenceLevel?: string;
  severity?: string;
  location?: string;
  sosTriggered: boolean;
  wasInjured?: boolean;
  notes?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  patient?: { user?: { firstName?: string; lastName?: string } };
}

interface DeviceRecord {
  id: string;
  deviceId: string;
  patientId?: string;
  deviceName?: string;
  isActive: boolean;
  lastSeen?: string;
  batteryLevel?: number;
  firmwareVersion?: string;
  createdAt: string;
  patient?: { user?: { firstName?: string; lastName?: string } };
}

interface AssignmentRecord {
  id: string;
  caregiverId: string;
  patientId: string;
  assignedDate: string;
  isActive: boolean;
  caregiverName: string;
  patientName: string;
  facilityName?: string;
}

interface NavbarUser {
  firstName?: string;
  lastName?: string;
  accountType?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [falls, setFalls] = useState<FallRecord[]>([]);
  const [fallsTotal, setFallsTotal] = useState(0);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?take=100", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
      setUsersTotal(data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  const fetchFalls = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/falls?take=100", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch falls");
      const data = await res.json();
      setFalls(data.falls);
      setFallsTotal(data.total);
    } catch (error) {
      console.error("Error fetching falls:", error);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/devices?take=100", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data = await res.json();
      setDevices(data.devices);
      setDevicesTotal(data.total);
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/assignments", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data = await res.json();
      setAssignments(data.assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Check auth
        const meRes = await fetch("/api/me", { credentials: "include" });
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        if (meData.accountType !== "admin") {
          router.push("/error");
          return;
        }
        setUser(meData);

        // Fetch initial data
        await Promise.all([
          fetchStats(),
          fetchUsers(),
          fetchFalls(),
          fetchDevices(),
          fetchAssignments(),
        ]);
      } catch (error) {
        console.error("Admin dashboard init error:", error);
        toast.error("Failed to load admin dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [
    router,
    fetchStats,
    fetchUsers,
    fetchFalls,
    fetchDevices,
    fetchAssignments,
  ]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("user");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchFalls(),
      fetchDevices(),
      fetchAssignments(),
    ]);
    toast.success("Data refreshed");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              System overview and management
            </p>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="falls" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Falls</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <StatsOverview stats={stats} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTable
              users={users}
              total={usersTotal}
              onRefresh={async () => {
                await fetchUsers();
                await fetchStats();
              }}
            />
          </TabsContent>

          <TabsContent value="falls">
            <FallsTable
              falls={falls}
              total={fallsTotal}
              onRefresh={async () => {
                await fetchFalls();
                await fetchStats();
              }}
            />
          </TabsContent>

          <TabsContent value="devices">
            <DevicesTable
              devices={devices}
              total={devicesTotal}
              onRefresh={fetchDevices}
            />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTable
              assignments={assignments}
              onRefresh={fetchAssignments}
            />
          </TabsContent>
        </Tabs>

        {/* Device Tools Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Device Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/provision">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Provision Device
                  </CardTitle>
                  <Usb className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configure WiFi credentials on a SmartFall device via USB
                    serial.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
