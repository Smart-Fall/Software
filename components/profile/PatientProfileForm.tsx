import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface PatientProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dob?: string;
  };
  patient: {
    id: string;
    medicalConditions?: string;
    riskScore?: number;
    isHighRisk?: boolean;
  };
}

interface PatientProfileFormProps {
  profile: PatientProfile;
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export const PatientProfileForm: React.FC<PatientProfileFormProps> = ({
  profile,
  isEditing,
  onChange,
  errors,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Information Card */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              First Name
            </label>
            <Input
              value={profile.user.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              disabled={!isEditing}
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.firstName}
              </div>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Last Name
            </label>
            <Input
              value={profile.user.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              disabled={!isEditing}
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.lastName}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              value={profile.user.email}
              onChange={(e) => onChange('email', e.target.value)}
              disabled={!isEditing}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.email}
              </div>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Date of Birth
            </label>
            <Input
              type="date"
              value={formatDate(profile.user.dob)}
              onChange={(e) => onChange('dob', e.target.value)}
              disabled={!isEditing}
              className={errors.dob ? 'border-red-500' : ''}
            />
            {errors.dob && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.dob}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Information Card */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Health Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Medical Conditions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Medical Conditions
            </label>
            <textarea
              value={profile.patient.medicalConditions || ''}
              onChange={(e) => onChange('medicalConditions', e.target.value)}
              disabled={!isEditing}
              maxLength={1000}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                !isEditing ? 'bg-muted' : ''
              } ${errors.medicalConditions ? 'border-red-500' : 'border-input'}`}
            />
            <div className="flex justify-between items-start">
              <div>
                {errors.medicalConditions && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.medicalConditions}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {profile.patient.medicalConditions?.length || 0}/1000
              </span>
            </div>
          </div>

          {/* Risk Score and High Risk Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Risk Score
              </label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-lg font-semibold">
                  {profile.patient.riskScore ?? 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Risk Status
              </label>
              <div className="p-3 bg-muted rounded-lg flex items-center justify-center">
                <Badge
                  className={
                    profile.patient.isHighRisk
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }
                >
                  {profile.patient.isHighRisk ? 'High Risk' : 'Low Risk'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
