import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getRiskLevel } from '@/lib/dashboard-utils';

interface RiskScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({ score, showLabel = false, className = '' }) => {
  const riskLevel = getRiskLevel(score);

  const variant = riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'secondary' : 'default';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={variant}>
        {score}
      </Badge>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </span>
      )}
    </div>
  );
};
