'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Heart, Wifi, Clock } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface Fall {
  id: string;
  fallDatetime: string;
  confidenceScore: number;
  confidenceLevel: string;
  sosTriggered: boolean;
  patient?: {
    user: {
      firstName: string;
      lastName: string;
    }
  };
  device?: {
    deviceId: string;
    deviceName: string;
  };
}

interface AlertsTabProps {
  recentFalls?: Fall[];
  unresolvedFalls?: number;
  offlineDevices?: number;
  highRiskPatients?: number;
}

// Format time elapsed (e.g., "2 min ago", "1 hour ago")
function formatTimeElapsed(dateString: string): string {
  const now = new Date();
  const fallTime = new Date(dateString);
  const diffMs = now.getTime() - fallTime.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

// Get confidence level badge color
function getConfidenceLevelColor(level: string): string {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return 'bg-red-100 text-red-800';
    case 'MEDIUM':
      return 'bg-orange-100 text-orange-800';
    case 'LOW':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  recentFalls = [],
  unresolvedFalls = 0,
  offlineDevices = 0,
  highRiskPatients = 0
}) => {
  const [newFallIds, setNewFallIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Track newly arrived falls and apply pulse animation for 10s
  useEffect(() => {
    if (!recentFalls.length) return;

    const knownIds = seenIdsRef.current;
    const arrived = recentFalls.filter(f => !knownIds.has(f.id)).map(f => f.id);

    if (arrived.length) {
      setNewFallIds(new Set(arrived));
      const timer = setTimeout(() => setNewFallIds(new Set()), 10000);
      arrived.forEach(id => knownIds.add(id));
      return () => clearTimeout(timer);
    }
  }, [recentFalls]);

  const totalAlerts = (recentFalls?.length || unresolvedFalls) + offlineDevices + highRiskPatients;

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
        {/* Recent Falls - Individual Cards */}
        {recentFalls && recentFalls.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">Fall Detected ({recentFalls.length})</h3>
            {recentFalls.map((fall) => (
              <div
                key={fall.id}
                className={`${newFallIds.has(fall.id) ? 'animate-pulse' : ''} p-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="font-medium text-red-900">
                        {fall.patient?.user.firstName || 'Unknown Patient'}{' '}
                        {fall.patient?.user.lastName || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-700 ml-6">
                      <Clock className="h-3 w-3" />
                      {formatTimeElapsed(fall.fallDatetime)}
                    </div>
                  </div>
                  <Badge className={`ml-2 text-xs font-semibold ${getConfidenceLevelColor(fall.confidenceLevel)}`}>
                    {fall.confidenceLevel}
                  </Badge>
                </div>
                <div className="mt-2 ml-6 text-xs text-red-600">
                  Confidence: {fall.confidenceScore}%
                  {fall.sosTriggered && <span className="ml-2 font-semibold text-red-700">• SOS Triggered</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unresolved Falls (static count if no live falls) */}
        {(!recentFalls || recentFalls.length === 0) && unresolvedFalls > 0 && (
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
