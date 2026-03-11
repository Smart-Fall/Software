'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { PatientProfileForm } from '@/components/profile/PatientProfileForm';
import { CaregiverProfileForm } from '@/components/profile/CaregiverProfileForm';
import { DeviceProfileCard } from '@/components/profile/DeviceProfileCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Profile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dob?: string;
  };
  patient?: {
    id: string;
    medicalConditions?: string;
    riskScore?: number;
    isHighRisk?: boolean;
  };
  caregiver?: {
    id: string;
    facilityName?: string;
    specialization?: string;
    yearsOfExperience?: number;
  };
}

type AccountType = 'patient' | 'caregiver';

type PatientProfile = Profile & { patient: NonNullable<Profile['patient']> };
type CaregiverProfile = Profile & { caregiver: NonNullable<Profile['caregiver']> };

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('patient');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalProfile, setOriginalProfile] = useState<Profile | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);

  const API_BASE_URL = '/api';

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
        setEditedProfile(data);
        setOriginalProfile(data);

        // Determine account type
        if (data.patient) {
          setAccountType('patient');
        } else if (data.caregiver) {
          setAccountType('caregiver');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        const message = error instanceof Error ? error.message : 'Failed to load profile';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedProfile) return false;

    // Common validations
    if (!editedProfile.user.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!editedProfile.user.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!editedProfile.user.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(editedProfile.user.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Patient-specific validations
    if (accountType === 'patient') {
      if (!editedProfile.user.dob) {
        newErrors.dob = 'Date of birth is required';
      }
      if (editedProfile.patient?.medicalConditions && editedProfile.patient.medicalConditions.length > 1000) {
        newErrors.medicalConditions = 'Medical conditions cannot exceed 1000 characters';
      }
    }

    // Caregiver-specific validations
    if (accountType === 'caregiver') {
      if (editedProfile.caregiver?.facilityName && editedProfile.caregiver.facilityName.length > 200) {
        newErrors.facilityName = 'Facility name cannot exceed 200 characters';
      }
      if (editedProfile.caregiver?.specialization && editedProfile.caregiver.specialization.length > 100) {
        newErrors.specialization = 'Specialization cannot exceed 100 characters';
      }
      if (editedProfile.caregiver?.yearsOfExperience !== undefined) {
        const years = Number(editedProfile.caregiver.yearsOfExperience);
        if (isNaN(years) || years < 0 || years > 70) {
          newErrors.yearsOfExperience = 'Years of experience must be between 0 and 70';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: string | number) => {
    if (!editedProfile) return;

    const updated = { ...editedProfile };

    // Handle nested user fields
    if (field === 'firstName' || field === 'lastName' || field === 'email' || field === 'dob') {
      updated.user = { ...updated.user, [field]: value };
    }
    // Handle patient fields
    else if (updated.patient && field in updated.patient) {
      updated.patient = { ...updated.patient, [field]: value };
    }
    // Handle caregiver fields
    else if (updated.caregiver && field in updated.caregiver) {
      updated.caregiver = { ...updated.caregiver, [field]: value };
    }

    setEditedProfile(updated);
    // Clear error for this field when user starts editing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!editedProfile) return;

    setIsSaving(true);
    try {
      // Save user data
      const userResponse = await fetch(`${API_BASE_URL}/profile/user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: editedProfile.user.firstName,
          lastName: editedProfile.user.lastName,
          email: editedProfile.user.email,
          ...(accountType === 'patient' && { dob: editedProfile.user.dob }),
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update user profile');
      }

      // Save role-specific data
      if (accountType === 'patient' && editedProfile.patient) {
        const patientResponse = await fetch(`${API_BASE_URL}/profile/patient`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            medicalConditions: editedProfile.patient.medicalConditions,
          }),
        });

        if (!patientResponse.ok) {
          const errorData = await patientResponse.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to update patient profile');
        }
      } else if (accountType === 'caregiver' && editedProfile.caregiver) {
        const caregiverResponse = await fetch(`${API_BASE_URL}/profile/caregiver`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            facilityName: editedProfile.caregiver.facilityName,
            specialization: editedProfile.caregiver.specialization,
            yearsOfExperience: editedProfile.caregiver.yearsOfExperience,
          }),
        });

        if (!caregiverResponse.ok) {
          const errorData = await caregiverResponse.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to update caregiver profile');
        }
      }

      setProfile(editedProfile);
      setOriginalProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setEditedProfile(originalProfile);
    setIsEditing(false);
    setErrors({});
    setShowCancelDialog(false);
  };

  const handleBack = () => {
    if (accountType === 'patient') {
      router.push('/user-dashboard');
    } else {
      router.push('/caregiver-dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-8">
        <div className="max-w-6xl mx-auto">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load profile</p>
        </div>
      </div>
    );
  }

  const displayName = `${profile.user.firstName} ${profile.user.lastName}`;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader
          name={displayName}
          role={accountType}
          isEditing={isEditing}
          isSaving={isSaving}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          onBack={handleBack}
        />

        {accountType === 'patient' && editedProfile.patient ? (
          <>
            <PatientProfileForm
              profile={editedProfile as PatientProfile}
              isEditing={isEditing}
              onChange={handleFieldChange}
              errors={errors}
            />

            {/* Device Profile Card */}
            <div className="mt-8">
              <DeviceProfileCard patientId={editedProfile.patient.id} />
            </div>
          </>
        ) : accountType === 'caregiver' && editedProfile.caregiver ? (
          <CaregiverProfileForm
            profile={editedProfile as CaregiverProfile}
            isEditing={isEditing}
            onChange={handleFieldChange}
            errors={errors}
          />
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Caregiver profile data is missing. Please contact support.
            </p>
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard your changes? This action cannot be undone.
            </AlertDialogDescription>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>No, Keep Editing</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">
                Yes, Discard
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
