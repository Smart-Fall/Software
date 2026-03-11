"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, Cpu, Link2, BarChart3, ScrollText } from "lucide-react";
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

interface LogRecord {
  id: string;
  deviceId: string;
  level: string;
  category: string;
  message: string;
  metadata?: { value?: number; threshold?: number } | null;
  createdAt: string;
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
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logDeviceFilter, setLogDeviceFilter] = useState("");
  const [logLevelFilter, setLogLevelFilter] = useState("");
  const [logCategoryFilter, setLogCategoryFilter] = useState("");
  const [isLogsLive, setIsLogsLive] = useState(false);
  const logsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ take: "100" });
      if (logDeviceFilter)   params.set("device_id", logDeviceFilter);
      if (logLevelFilter)    params.set("level",     logLevelFilter);
      if (logCategoryFilter) params.set("category",  logCategoryFilter);
      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  }, [logDeviceFilter, logLevelFilter, logCategoryFilter]);

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

  // Poll logs every 10s when the Logs tab is active
  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
      setIsLogsLive(true);
      logsIntervalRef.current = setInterval(fetchLogs, 10000);
    } else {
      setIsLogsLive(false);
      if (logsIntervalRef.current) {
        clearInterval(logsIntervalRef.current);
        logsIntervalRef.current = null;
      }
    }
    return () => {
      if (logsIntervalRef.current) {
        clearInterval(logsIntervalRef.current);
        logsIntervalRef.current = null;
      }
    };
  }, [activeTab, fetchLogs]);

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
          <TabsList className="grid w-full grid-cols-6 mb-6">
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
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
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

          <TabsContent value="logs">
            <div className="rounded-lg border bg-white shadow-sm">
              {/* Card Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold">Device Logs</h2>
                  <p className="text-sm text-muted-foreground">
                    {logsTotal} total entries
                  </p>
                </div>
                {isLogsLive && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 px-6 py-4 border-b bg-gray-50">
                <select
                  value={logDeviceFilter}
                  onChange={(e) => setLogDeviceFilter(e.target.value)}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="">All Devices</option>
                  {Array.from(new Set(logs.map((l) => l.deviceId))).map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>

                <select
                  value={logLevelFilter}
                  onChange={(e) => setLogLevelFilter(e.target.value)}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="">All Levels</option>
                  <option value="DEBUG">DEBUG</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                </select>

                <select
                  value={logCategoryFilter}
                  onChange={(e) => setLogCategoryFilter(e.target.value)}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="SYSTEM">SYSTEM</option>
                  <option value="FALL_DETECTION">FALL_DETECTION</option>
                  <option value="SENSOR">SENSOR</option>
                  <option value="WIFI">WIFI</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Device</th>
                      <th className="px-6 py-3">Level</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Message</th>
                      <th className="px-6 py-3">Value / Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                          No logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                            {format(new Date(log.createdAt), "MMM d, yyyy h:mm:ss a")}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap font-mono text-xs">
                            {log.deviceId.slice(-12)}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              log.level === "ERROR"
                                ? "bg-red-100 text-red-800"
                                : log.level === "WARN"
                                ? "bg-yellow-100 text-yellow-800"
                                : log.level === "INFO"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              {log.category}
                            </span>
                          </td>
                          <td className="px-6 py-3 max-w-xs truncate" title={log.message}>
                            {log.message}
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {log.metadata?.value !== undefined
                              ? `${Number(log.metadata.value).toFixed(3)} / ${Number(log.metadata.threshold ?? 0).toFixed(3)}`
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
