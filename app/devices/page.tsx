'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  ArrowLeft,
  Wifi,
  WifiOff,
  Battery,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import {
  isDeviceOnline,
  formatLastSeen,
  getBatteryColor,
} from '@/lib/dashboard-utils';

interface Device {
  id: string;
  deviceId: string;
  deviceName?: string;
  lastSeen?: Date | string;
  batteryLevel?: number;
  firmwareVersion?: string;
  createdAt?: Date | string;
}

interface SensorData {
  id: string;
  timestamp: Date | string;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  pressure?: number;
  fsr?: number;
}

interface ChartDataPoint {
  timestamp: string;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  pressure?: number;
}

export default function DevicesPage() {
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('accelerometer');

  const API_BASE_URL = '/api';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('[DevicesPage] Fetching device and sensor data from API...');
        // Fetch device and sensor data
        const sensorRes = await fetch(
          `${API_BASE_URL}/patient/device/sensor-data`,
          {
            credentials: 'include',
          }
        );

        console.log('[DevicesPage] Sensor API response status:', sensorRes.status);

        if (!sensorRes.ok) {
          if (sensorRes.status === 401) {
            console.log('[DevicesPage] Unauthorized - redirecting to login');
            router.push('/login');
            return;
          }
          throw new Error(`Failed to fetch sensor data: ${sensorRes.status}`);
        }

        const sensorDataResponse = await sensorRes.json();
        console.log('[DevicesPage] Sensor data response:', {
          device: sensorDataResponse.device ? {
            id: sensorDataResponse.device.id,
            deviceId: sensorDataResponse.device.deviceId,
            batteryLevel: sensorDataResponse.device.batteryLevel,
            lastSeen: sensorDataResponse.device.lastSeen,
          } : null,
          sensorDataCount: (sensorDataResponse.sensorData || []).length,
        });

        setDevice(sensorDataResponse.device);
        setSensorData(sensorDataResponse.sensorData || []);

        if (!sensorDataResponse.device) {
          console.warn('[DevicesPage] No device returned from API');
        }

        if (!sensorDataResponse.sensorData || sensorDataResponse.sensorData.length === 0) {
          console.warn('[DevicesPage] No sensor data returned from API');
        } else {
          console.log('[DevicesPage] First sensor reading:', sensorDataResponse.sensorData[0]);
        }
      } catch (err) {
        console.error('[DevicesPage] Error fetching device data:', err);
        const message = err instanceof Error ? err.message : 'Failed to load device data';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const online = device && isDeviceOnline(device.lastSeen as string);
  const batteryColor = device?.batteryLevel
    ? getBatteryColor(device.batteryLevel)
    : '#999999';

  // Format sensor data for charts
  const chartData: ChartDataPoint[] = (sensorData || []).map((data) => ({
    timestamp: new Date(data.timestamp).toLocaleTimeString(),
    accelX: parseFloat(data.accelX.toFixed(2)),
    accelY: parseFloat(data.accelY.toFixed(2)),
    accelZ: parseFloat(data.accelZ.toFixed(2)),
    gyroX: parseFloat(data.gyroX.toFixed(2)),
    gyroY: parseFloat(data.gyroY.toFixed(2)),
    gyroZ: parseFloat(data.gyroZ.toFixed(2)),
    pressure: data.pressure ? parseFloat(data.pressure.toFixed(2)) : undefined,
  }));

  // Get latest sensor reading
  const latestSensor = (sensorData || [])[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a96] mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading device information...</p>
        </div>
      </div>
    );
  }

  if (!device || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {error || 'Failed to load device information.'}
          </p>
          <Button
            onClick={() => router.push('/user-dashboard')}
            className="bg-[#1a1a96] hover:bg-[#15157a]"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/user-dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a96]">Device Details</h1>
                <p className="text-sm text-muted-foreground">
                  {device.deviceName || 'SmartFall Device'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Battery Level */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent className="pt-6 flex flex-col items-center text-center">
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
                <Battery
                  style={{
                    width: '32px',
                    height: '32px',
                    color: batteryColor,
                    strokeWidth: 2,
                  }}
                />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Battery Level</p>
              <p className="text-5xl font-bold" style={{ color: batteryColor }}>
                {device.batteryLevel ?? 'N/A'}
                {device.batteryLevel !== undefined && '%'}
              </p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div
                style={{
                  backgroundColor: online ? '#dcfce7' : '#f3f4f6',
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
                {online ? (
                  <Wifi
                    style={{
                      width: '32px',
                      height: '32px',
                      color: '#16a34a',
                      strokeWidth: 2,
                    }}
                  />
                ) : (
                  <WifiOff
                    style={{
                      width: '32px',
                      height: '32px',
                      color: '#9ca3af',
                      strokeWidth: 2,
                    }}
                  />
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
              <Badge
                className={
                  online
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {online ? 'Online' : 'Offline'}
              </Badge>
            </CardContent>
          </Card>

          {/* Last Seen */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div
                style={{
                  backgroundColor: '#e0e7ff',
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
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Last Seen</p>
              <p className="text-lg font-semibold">
                {formatLastSeen(device.lastSeen as string)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Info Card */}
          <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold">Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">MAC Address</p>
                <p className="font-mono text-sm font-semibold break-all">{device.deviceId}</p>
              </div>

              {device.firmwareVersion && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Firmware</p>
                  <p className="text-sm font-medium">{device.firmwareVersion}</p>
                </div>
              )}

              {device.createdAt && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Registered</p>
                  <p className="text-sm font-medium">
                    {new Date(device.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="w-full"
                >
                  Change Device
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Latest Sensor Readings */}
          <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold">Latest Sensor Readings</CardTitle>
              <CardDescription>Current sensor values</CardDescription>
            </CardHeader>
            <CardContent>
              {latestSensor ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Accelerometer */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">
                      Accel X
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {latestSensor.accelX.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">m/s²</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">
                      Accel Y
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {latestSensor.accelY.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">m/s²</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">
                      Accel Z
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {latestSensor.accelZ.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">m/s²</p>
                  </div>

                  {/* Gyroscope */}
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">
                      Gyro X
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {latestSensor.gyroX.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">°/s</p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">
                      Gyro Y
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {latestSensor.gyroY.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">°/s</p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">
                      Gyro Z
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {latestSensor.gyroZ.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">°/s</p>
                  </div>

                  {/* Pressure */}
                  {latestSensor.pressure !== undefined && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">
                        Pressure
                      </p>
                      <p className="text-lg font-bold text-orange-600">
                        {latestSensor.pressure.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">hPa</p>
                    </div>
                  )}

                  {/* FSR */}
                  {latestSensor.fsr !== undefined && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">
                        FSR
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {latestSensor.fsr.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">0-1023</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No sensor data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sensor History Charts */}
        {chartData.length > 0 && (
          <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold">Sensor History</CardTitle>
              <CardDescription>Last 20 readings</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="accelerometer">Accelerometer</TabsTrigger>
                  <TabsTrigger value="gyroscope">Gyroscope</TabsTrigger>
                  {chartData[0]?.pressure !== undefined && (
                    <TabsTrigger value="pressure">Pressure</TabsTrigger>
                  )}
                </TabsList>

                {/* Accelerometer Chart */}
                <TabsContent value="accelerometer" className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="accelX"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Accel X (m/s²)"
                      />
                      <Line
                        type="monotone"
                        dataKey="accelY"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Accel Y (m/s²)"
                      />
                      <Line
                        type="monotone"
                        dataKey="accelZ"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Accel Z (m/s²)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>

                {/* Gyroscope Chart */}
                <TabsContent value="gyroscope" className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="gyroX"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Gyro X (°/s)"
                      />
                      <Line
                        type="monotone"
                        dataKey="gyroY"
                        stroke="#ec4899"
                        strokeWidth={2}
                        name="Gyro Y (°/s)"
                      />
                      <Line
                        type="monotone"
                        dataKey="gyroZ"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        name="Gyro Z (°/s)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>

                {/* Pressure Chart */}
                {chartData[0]?.pressure !== undefined && (
                  <TabsContent value="pressure" className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="pressure"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Pressure (hPa)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
