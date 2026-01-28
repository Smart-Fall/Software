import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  role: 'patient' | 'caregiver';
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onBack: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  role,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onBack,
}) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');

  const roleDisplay = role === 'patient' ? 'Patient' : 'Caregiver';

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1a1a96] flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a96]">{name}</h1>
            <Badge className="mt-2 bg-blue-100 text-blue-800">
              {roleDisplay}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {!isEditing ? (
          <Button
            onClick={onEdit}
            className="bg-[#1a1a96] hover:bg-[#15157a]"
          >
            Edit Profile
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="bg-[#1a1a96] hover:bg-[#15157a]"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
