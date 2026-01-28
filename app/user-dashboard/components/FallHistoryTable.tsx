'use client';

import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatDate, getSeverityColor } from '@/lib/dashboard-utils';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { AlertTriangle } from 'lucide-react';

interface Fall {
  id: string;
  fallDatetime: string;
  confidenceScore: number | null;
  severity: string | null;
  sosTriggered: boolean;
  wasInjured: boolean | null;
  resolved: boolean;
  resolvedAt: string | null;
  notes: string | null;
  device: {
    deviceId: string;
    deviceName: string | null;
  } | null;
}

interface FallHistoryTableProps {
  falls: Fall[];
}

export const FallHistoryTable: React.FC<FallHistoryTableProps> = ({
  falls
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredFalls = falls.filter(fall => {
    if (severityFilter !== 'all' && fall.severity?.toLowerCase() !== severityFilter) {
      return false;
    }
    if (statusFilter !== 'all' && ((statusFilter === 'resolved' && !fall.resolved) || (statusFilter === 'pending' && fall.resolved))) {
      return false;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fall History</CardTitle>
        <CardDescription>Recent fall detection events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredFalls.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No falls detected"
            description="Great job staying safe!"
          />
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SOS</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFalls.map((fall) => (
                  <TableRow key={fall.id}>
                    <TableCell className="text-sm">
                      {formatDate(fall.fallDatetime)}
                    </TableCell>
                    <TableCell>
                      {fall.severity ? (
                        <Badge variant="outline" style={{ color: getSeverityColor(fall.severity) }}>
                          {fall.severity}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fall.confidenceScore ? `${Math.round(fall.confidenceScore)}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {fall.resolved ? (
                        <Badge variant="default" className="bg-green-600">
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {fall.sosTriggered ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fall.device?.deviceName || fall.device?.deviceId.slice(0, 8) || 'N/A'}
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
};
