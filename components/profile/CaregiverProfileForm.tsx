import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface CaregiverProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  caregiver: {
    id: string;
    facilityName?: string;
    specialization?: string;
    yearsOfExperience?: number;
  };
}

interface CaregiverProfileFormProps {
  profile: CaregiverProfile;
  isEditing: boolean;
  onChange: (field: string, value: string | number) => void;
  errors: Record<string, string>;
}

export const CaregiverProfileForm: React.FC<CaregiverProfileFormProps> = ({
  profile,
  isEditing,
  onChange,
  errors,
}) => {
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
        </CardContent>
      </Card>

      {/* Professional Information Card */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Facility Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Facility Name
            </label>
            <Input
              value={profile.caregiver.facilityName || ''}
              onChange={(e) => onChange('facilityName', e.target.value)}
              disabled={!isEditing}
              maxLength={200}
              className={errors.facilityName ? 'border-red-500' : ''}
            />
            {errors.facilityName && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.facilityName}
              </div>
            )}
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Specialization
            </label>
            <Input
              value={profile.caregiver.specialization || ''}
              onChange={(e) => onChange('specialization', e.target.value)}
              disabled={!isEditing}
              maxLength={100}
              className={errors.specialization ? 'border-red-500' : ''}
            />
            {errors.specialization && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.specialization}
              </div>
            )}
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Years of Experience
            </label>
            <Input
              type="number"
              min="0"
              max="70"
              value={profile.caregiver.yearsOfExperience ?? ''}
              onChange={(e) => onChange('yearsOfExperience', e.target.value)}
              disabled={!isEditing}
              className={errors.yearsOfExperience ? 'border-red-500' : ''}
            />
            {errors.yearsOfExperience && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.yearsOfExperience}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
