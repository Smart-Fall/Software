import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'red' | 'green' | 'orange' | 'purple';
  tooltipContent?: string;
  className?: string;
}

const colorConfig = {
  blue: { bg: '#dbeafe', text: '#3b82f6' },
  red: { bg: '#fee2e2', text: '#dc2626' },
  green: { bg: '#dcfce7', text: '#16a34a' },
  orange: { bg: '#fed7aa', text: '#ea580c' },
  purple: { bg: '#f3e8ff', text: '#a855f7' }
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'blue',
  tooltipContent,
  className = ''
}) => {
  const colorTheme = colorConfig[color];

  const cardContent = (
    <Card className={`rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-3xl font-bold text-foreground mb-1">
              {value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trend && (
              <div className={`text-xs font-medium mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          <div
            className="p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: colorTheme.bg }}
          >
            <Icon
              size={20}
              style={{ color: colorTheme.text }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};
