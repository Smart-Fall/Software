'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Wifi, WifiOff, Edit2 } from 'lucide-react';
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

interface DeviceProfileCardProps {
  patientId?: string;
}

const MAC_REGEX = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})|([0-9A-Fa-f]{12})$/;

export const DeviceProfileCard: React.FC<DeviceProfileCardProps> = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedMac, setEditedMac] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = '/api';

  // Fetch device on mount
  useEffect(() => {
    const fetchDevice = async () => {
      setIsLoading(true);
      try {
        console.log('[DeviceProfileCard] Fetching device from API...');
        const response = await fetch(`${API_BASE_URL}/patient/device`, {
          credentials: 'include',
        });

        console.log('[DeviceProfileCard] Response status:', response.status);

        if (!response.ok) {
          if (response.status === 404) {
            console.log('[DeviceProfileCard] Device not found (404)');
            setDevice(null);
            return;
          }
          throw new Error(`Failed to fetch device: ${response.status}`);
        }

        const data = await response.json();
        console.log('[DeviceProfileCard] Fetched data:', data);

        if (data.devices && data.devices.length > 0) {
          const device = data.devices[0];
          console.log('[DeviceProfileCard] Device found:', {
            id: device.id,
            deviceId: device.deviceId,
            batteryLevel: device.batteryLevel,
            lastSeen: device.lastSeen,
            firmwareVersion: device.firmwareVersion,
          });
          setDevice(device);
          setEditedMac(device.deviceId);
        } else {
          console.log('[DeviceProfileCard] No devices in response');
          setDevice(null);
        }
      } catch (err) {
        console.error('[DeviceProfileCard] Error fetching device:', err);
        toast.error('Failed to load device information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevice();
  }, []);

  const validateMac = (mac: string): boolean => {
    return MAC_REGEX.test(mac);
  };

  const handleSave = async () => {
    setError('');

    if (!editedMac.trim()) {
      setError('MAC address is required');
      return;
    }

    if (!validateMac(editedMac)) {
      setError('Invalid MAC address format. Use XX:XX:XX:XX:XX:XX or XXXXXXXXXXXX');
      return;
    }

    if (editedMac === device?.deviceId) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/patient/device/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceMacAddress: editedMac }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update device');
      }

      const data = await response.json();
      setDevice(data.device);
      setIsEditing(false);
      toast.success('Device MAC address updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save device';
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (device) {
      setEditedMac(device.deviceId);
    }
    setError('');
    setIsEditing(false);
  };

  const online = device && isDeviceOnline(device.lastSeen as string);
  const batteryColor = device?.batteryLevel
    ? getBatteryColor(device.batteryLevel)
    : '#999999';

  if (isLoading) {
    return (
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">My Device</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!device) {
    return (
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">My Device</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No device registered yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">My Device</CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Change Device
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            {/* Edit Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Device MAC Address
              </label>
              <Input
                value={editedMac}
                onChange={(e) => {
                  setEditedMac(e.target.value);
                  setError('');
                }}
                placeholder="XX:XX:XX:XX:XX:XX or XXXXXXXXXXXX"
                className={error ? 'border-red-500' : ''}
              />
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#1a1a96] hover:bg-[#15157a] flex-1"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* View Mode */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">MAC Address</p>
              <p className="font-mono text-sm font-semibold break-all">{device.deviceId}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  {online ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-gray-400" />
                      <Badge className="bg-gray-100 text-gray-800">Offline</Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Last Seen</p>
                <p className="text-sm font-medium">
                  {formatLastSeen(device.lastSeen as string)}
                </p>
              </div>
            </div>

            {device.batteryLevel !== undefined && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Battery Level</p>
                <div className="flex items-center gap-3">
                  <Progress
                    value={device.batteryLevel}
                    className="flex-1"
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: batteryColor }}
                  >
                    {device.batteryLevel}%
                  </span>
                </div>
              </div>
            )}

            {device.firmwareVersion && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Firmware Version</p>
                <p className="text-sm font-medium">{device.firmwareVersion}</p>
              </div>
            )}

            {device.createdAt && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Registered Date</p>
                <p className="text-sm font-medium">
                  {new Date(device.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
