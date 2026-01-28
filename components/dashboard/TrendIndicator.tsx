import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendIndicatorProps {
  percentage: number;
  isPositive?: boolean;
  label?: string;
  className?: string;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  percentage,
  isPositive = percentage >= 0,
  label,
  className = ''
}) => {
  const textColor = isPositive ? 'text-green-600' : 'text-red-600';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center gap-1 ${textColor} ${className}`}>
      <Icon size={16} />
      <span className="text-sm font-medium">
        {Math.abs(percentage)}%
      </span>
      {label && (
        <span className="text-xs text-muted-foreground ml-1">
          {label}
        </span>
      )}
    </div>
  );
};
