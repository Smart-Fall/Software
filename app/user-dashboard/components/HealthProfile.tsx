'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { calculateAge, getRiskLevel } from '@/lib/dashboard-utils';

interface HealthProfileProps {
  firstName: string;
  lastName: string;
  dob: string | null;
  riskScore: number;
  medicalConditions: string | null;
}

export const HealthProfile: React.FC<HealthProfileProps> = ({
  firstName,
  lastName,
  dob,
  riskScore,
  medicalConditions
}) => {
  const age = dob ? calculateAge(dob) : null;
  const riskLevel = getRiskLevel(riskScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Health Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-lg font-semibold text-foreground">
              {firstName} {lastName}
            </p>
          </div>

          {age && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Age</label>
              <p className="text-lg font-semibold text-foreground">
                {age} years old
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">Risk Level</label>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'secondary' : 'default'}
              >
                {riskScore} - {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
              </Badge>
            </div>
          </div>

          {medicalConditions && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Medical Conditions</label>
              <p className="text-sm text-foreground mt-2">
                {medicalConditions}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
