import React from 'react';
import { Badge } from '@/components/ui/badge';

type StatusType = 'online' | 'offline' | 'resolved' | 'pending' | 'critical' | 'low' | 'medium' | 'high';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
  online: {
    variant: 'default',
    label: 'Online'
  },
  offline: {
    variant: 'secondary',
    label: 'Offline'
  },
  resolved: {
    variant: 'default',
    label: 'Resolved'
  },
  pending: {
    variant: 'secondary',
    label: 'Pending'
  },
  critical: {
    variant: 'destructive',
    label: 'Critical'
  },
  low: {
    variant: 'default',
    label: 'Low'
  },
  medium: {
    variant: 'secondary',
    label: 'Medium'
  },
  high: {
    variant: 'destructive',
    label: 'High'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
