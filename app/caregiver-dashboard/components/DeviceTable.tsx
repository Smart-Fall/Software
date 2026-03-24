"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  formatLastSeen,
  getDeviceStatus,
  getBatteryColor,
} from "@/lib/dashboard-utils";
import { Wifi, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

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

interface DeviceTableProps {
  devices: Device[];
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices: initialDevices,
}) => {
  const [devices, setDevices] = useState(initialDevices);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleMute = async (device: Device) => {
    setLoadingId(device.id);
    const newMuted = !device.isMuted;
    try {
      const res = await fetch("/api/caregiver/devices/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.deviceId, muted: newMuted }),
      });
      if (!res.ok) throw new Error("Failed to update mute state");
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, isMuted: newMuted } : d)),
      );
      toast.success(
        newMuted
          ? `${device.deviceName || device.deviceId} muted`
          : `${device.deviceName || device.deviceId} unmuted`,
      );
    } catch {
      toast.error("Failed to update device mute state");
    } finally {
      setLoadingId(null);
    }
  };

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>
            All ESP32 devices linked to patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Wifi}
            title="No devices connected"
            description="Devices will appear here once they're assigned to patients"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Devices</CardTitle>
        <CardDescription>
          All ESP32 devices linked to patients ({devices.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Name</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Audio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => {
                const status = getDeviceStatus(device.lastSeen);
                const patientName = device.patient
                  ? `${device.patient.user.firstName} ${device.patient.user.lastName}`
                  : "Unassigned";
                const batteryLevel =
                  typeof device.batteryLevel === "number" &&
                  Number.isFinite(device.batteryLevel)
                    ? Math.min(100, Math.max(0, device.batteryLevel))
                    : null;

                return (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">
                      {device.deviceName || device.deviceId}
                    </TableCell>
                    <TableCell>{patientName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={status === "online" ? "default" : "secondary"}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {batteryLevel !== null ? (
                        <div className="flex items-center gap-2">
                          <Progress value={batteryLevel} className="h-2 w-12" />
                          <span
                            className="text-xs font-medium"
                            style={{ color: getBatteryColor(batteryLevel) }}
                          >
                            {Math.round(batteryLevel)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          N/A
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatLastSeen(device.lastSeen)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loadingId === device.id}
                        onClick={() => toggleMute(device)}
                        title={device.isMuted ? "Unmute device" : "Mute device"}
                      >
                        {device.isMuted ? (
                          <VolumeX className="h-4 w-4 text-destructive" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
