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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { RiskScoreBadge } from '@/components/dashboard/RiskScoreBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { calculateAge, getRiskLevel } from '@/lib/dashboard-utils';
import { Users, MoreVertical, MessageSquare } from 'lucide-react';

interface Patient {
  id?: number;
  patient_id?: number;
  patientId?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  dob: string;
  riskScore?: number;
  risk_score?: number;
  isHighRisk?: boolean;
  is_high_risk?: boolean;
  medicalConditions?: string;
  medical_conditions?: string;
}

interface PatientTableProps {
  patients: Patient[];
  searchQuery: string;
  onViewDetails?: (patient: Patient) => void;
  onSendMessage?: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  searchQuery,
  onViewDetails,
  onSendMessage,
}) => {
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'age'>('name');

  const filteredPatients = patients.filter((patient) => {
    const firstName = patient.firstName || patient.first_name || '';
    const lastName = patient.lastName || patient.last_name || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();

    if (searchQuery && !fullName.includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (riskFilter !== 'all') {
      const score = patient.riskScore || patient.risk_score || 0;
      const level = getRiskLevel(score);
      if (level !== riskFilter) return false;
    }

    return true;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = `${a.firstName || a.first_name} ${a.lastName || a.last_name}`.toLowerCase();
      const nameB = `${b.firstName || b.first_name} ${b.lastName || b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    } else if (sortBy === 'risk') {
      const scoreA = a.riskScore || a.risk_score || 0;
      const scoreB = b.riskScore || b.risk_score || 0;
      return scoreB - scoreA;
    } else if (sortBy === 'age') {
      const ageA = calculateAge(a.dob);
      const ageB = calculateAge(b.dob);
      return ageB - ageA;
    }
    return 0;
  });

  if (sortedPatients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Patients</CardTitle>
          <CardDescription>Patients currently under your care</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Users}
            title={searchQuery ? 'No patients found' : 'No patients assigned yet'}
            description={searchQuery ? 'Try adjusting your search' : 'Click "Add Patients" to get started'}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Patients</CardTitle>
        <CardDescription>Patients currently under your care ({sortedPatients.length})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select
            value={riskFilter}
            onValueChange={(val: 'all' | 'low' | 'medium' | 'high') => setRiskFilter(val)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(val: 'name' | 'risk' | 'age') => setSortBy(val)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="risk">Risk Score</SelectItem>
              <SelectItem value="age">Age</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPatients.map((patient) => {
                const firstName = patient.firstName || patient.first_name || '';
                const lastName = patient.lastName || patient.last_name || '';
                const riskScore = patient.riskScore || patient.risk_score || 0;
                const age = calculateAge(patient.dob);
                const patientId = patient.id || patient.patient_id || patient.patientId;

                return (
                  <TableRow key={patientId}>
                    <TableCell className="font-medium">
                      {firstName} {lastName}
                    </TableCell>
                    <TableCell>{age}</TableCell>
                    <TableCell>
                      <RiskScoreBadge score={riskScore} showLabel />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onViewDetails?.(patient)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSendMessage?.(patient)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            Device Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
