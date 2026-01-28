'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { UserPlus, Users } from 'lucide-react';
import { RiskScoreBadge } from '@/components/dashboard/RiskScoreBadge';
import { calculateAge } from '@/lib/dashboard-utils';
import { EmptyState } from '@/components/dashboard/EmptyState';

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
}

interface AddPatientSheetProps {
  unassignedPatients: Patient[];
  onAddPatient: (patient: Patient) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddPatientSheet: React.FC<AddPatientSheetProps> = ({
  unassignedPatients,
  onAddPatient,
  isOpen,
  onOpenChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = unassignedPatients.filter((patient) => {
    const firstName = patient.firstName || patient.first_name || '';
    const lastName = patient.lastName || patient.last_name || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="bg-[#1a1a96] hover:bg-[#15157a] text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Patients
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle>Add Patients</SheetTitle>
          <SheetDescription>
            Select unassigned patients to add to your care list
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <ScrollArea className="h-[calc(100vh-200px)]">
            {filteredPatients.length === 0 ? (
              <EmptyState
                icon={Users}
                title={searchQuery ? 'No patients found' : 'No unassigned patients'}
                description={searchQuery ? 'Try adjusting your search' : 'All patients are already assigned'}
                className="py-8"
              />
            ) : (
              <div className="space-y-3 pr-4">
                {filteredPatients.map((patient) => {
                  const patientId = patient.id || patient.patient_id || patient.patientId;
                  const firstName = patient.firstName || patient.first_name || '';
                  const lastName = patient.lastName || patient.last_name || '';
                  const riskScore = patient.riskScore || patient.risk_score || 0;
                  const age = calculateAge(patient.dob);

                  return (
                    <Card key={String(patientId)} className="rounded-lg shadow-sm">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">
                              {firstName} {lastName}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Age: {age}
                            </p>
                          </div>
                          <RiskScoreBadge score={riskScore} />
                        </div>
                        <Button
                          onClick={() => onAddPatient(patient)}
                          className="w-full bg-[#1a1a96] hover:bg-[#15157a]"
                          size="sm"
                        >
                          <UserPlus className="mr-2 h-3 w-3" />
                          Add to My Patients
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
