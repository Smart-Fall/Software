"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Cpu } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

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

interface DevicesTableProps {
  devices: DeviceRecord[];
  total: number;
  onRefresh: () => Promise<void>;
}

export function DevicesTable({ devices, total, onRefresh }: DevicesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDevices = devices.filter((d) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      d.deviceId.toLowerCase().includes(search) ||
      (d.deviceName || "").toLowerCase().includes(search) ||
      (d.firmwareVersion || "").toLowerCase().includes(search)
    );
  });

  const handleToggleActive = async (device: DeviceRecord) => {
    try {
      const res = await fetch(`/api/admin/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !device.isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        `Device ${device.isActive ? "deactivated" : "activated"} successfully`,
      );
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update device";
      toast.error(message);
    }
  };

  const getBatteryColor = (level?: number) => {
    if (level == null) return "bg-gray-300";
    if (level > 60) return "bg-green-500";
    if (level > 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices ({total})</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by device ID, name, or firmware..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredDevices.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="No devices found"
            description={
              searchQuery
                ? "Try adjusting your search query"
                : "No devices registered yet"
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Firmware</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-mono text-sm">
                      {device.deviceId}
                    </TableCell>
                    <TableCell>{device.deviceName || "-"}</TableCell>
                    <TableCell>
                      {device.patient?.user
                        ? `${device.patient.user.firstName || ""} ${device.patient.user.lastName || ""}`
                        : "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {device.batteryLevel != null ? (
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress
                            value={device.batteryLevel}
                            className={`h-2 w-16 ${getBatteryColor(device.batteryLevel)}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(device.batteryLevel)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {device.lastSeen
                        ? format(new Date(device.lastSeen), "MMM d, h:mm a")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {device.firmwareVersion || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {device.isActive ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(device)}
                      >
                        {device.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
