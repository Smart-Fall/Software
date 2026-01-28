'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatLastSeen, getDeviceStatus, getBatteryColor } from '@/lib/dashboard-utils';
import { Wifi } from 'lucide-react';

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

interface DeviceTableProps {
  devices: Device[];
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices
}) => {
  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>All ESP32 devices linked to patients</CardDescription>
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
        <CardDescription>All ESP32 devices linked to patients ({devices.length})</CardDescription>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => {
                const status = getDeviceStatus(device.lastSeen);
                const patientName = device.patient
                  ? `${device.patient.user.firstName} ${device.patient.user.lastName}`
                  : 'Unassigned';

                return (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">
                      {device.deviceName || device.deviceId}
                    </TableCell>
                    <TableCell>{patientName}</TableCell>
                    <TableCell>
                      <Badge variant={status === 'online' ? 'default' : 'secondary'}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {device.batteryLevel !== null ? (
                        <div className="flex items-center gap-2">
                          <Progress value={device.batteryLevel} className="h-2 w-12" />
                          <span
                            className="text-xs font-medium"
                            style={{ color: getBatteryColor(device.batteryLevel) }}
                          >
                            {Math.round(device.batteryLevel)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatLastSeen(device.lastSeen)}
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
