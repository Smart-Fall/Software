'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Heart, Wifi } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface AlertsTabProps {
  unresolvedFalls?: number;
  offlineDevices?: number;
  highRiskPatients?: number;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  unresolvedFalls = 0,
  offlineDevices = 0,
  highRiskPatients = 0
}) => {
  const totalAlerts = unresolvedFalls + offlineDevices + highRiskPatients;

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Critical notifications requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={AlertTriangle}
            title="No active alerts"
            description="All systems are operating normally"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <CardDescription>Critical notifications requiring attention ({totalAlerts})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unresolved Falls */}
        {unresolvedFalls > 0 && (
          <Alert className="border-orange-300 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900">Unresolved Falls</AlertTitle>
            <AlertDescription className="text-orange-800">
              {unresolvedFalls} fall{unresolvedFalls !== 1 ? 's' : ''} detected that need attention.
              <Button variant="outline" size="sm" className="ml-2">
                Review
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Offline Devices */}
        {offlineDevices > 0 && (
          <Alert className="border-red-300 bg-red-50">
            <Wifi className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">Offline Devices</AlertTitle>
            <AlertDescription className="text-red-800">
              {offlineDevices} device{offlineDevices !== 1 ? 's' : ''} offline or disconnected.
              <Button variant="outline" size="sm" className="ml-2">
                Check
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* High Risk Patients */}
        {highRiskPatients > 0 && (
          <Alert className="border-red-300 bg-red-50">
            <Heart className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">High Risk Patients</AlertTitle>
            <AlertDescription className="text-red-800">
              {highRiskPatients} patient{highRiskPatients !== 1 ? 's' : ''} with high fall risk scores.
              <Button variant="outline" size="sm" className="ml-2">
                Monitor
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
