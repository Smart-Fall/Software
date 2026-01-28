'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Wifi, Clock, Battery } from 'lucide-react';
import { formatLastSeen, isDeviceOnline, getBatteryColor } from '@/lib/dashboard-utils';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface Device {
  id: string;
  deviceId: string;
  deviceName: string | null;
  isActive: boolean;
  lastSeen: string | null;
  batteryLevel: number | null;
  firmwareVersion: string | null;
}

interface DeviceStatusListProps {
  devices: Device[];
}

export const DeviceStatusList: React.FC<DeviceStatusListProps> = ({
  devices
}) => {
  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Device Status
          </CardTitle>
          <CardDescription>Monitor your connected devices</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Wifi}
            title="No devices connected"
            description="Connect a SmartFall device to get started"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Device Status
        </CardTitle>
        <CardDescription>Monitor your connected devices</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {devices.map((device, index) => {
              const online = isDeviceOnline(device.lastSeen);

              return (
                <div key={device.id}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`h-3 w-3 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {device.deviceName || `Device ${device.deviceId.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {device.deviceId.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={online ? 'default' : 'secondary'} className="text-xs">
                          {online ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Battery */}
                      {device.batteryLevel !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <Battery className="h-3.5 w-3.5" />
                              <span className="text-muted-foreground">Battery</span>
                            </div>
                            <span className="font-medium" style={{ color: getBatteryColor(device.batteryLevel) }}>
                              {Math.round(device.batteryLevel)}%
                            </span>
                          </div>
                          <Progress value={device.batteryLevel} className="h-2" />
                        </div>
                      )}

                      {/* Last Seen */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-muted-foreground">Last seen</span>
                        </div>
                        <span className="font-medium">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{formatLastSeen(device.lastSeen)}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      </div>

                      {/* Firmware */}
                      {device.firmwareVersion && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Firmware</span>
                          <span className="font-medium">v{device.firmwareVersion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {index < devices.length - 1 && <Separator className="mt-3" />}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
