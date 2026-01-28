'use client';

import React from 'react';
import { AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getRiskLevel } from '@/lib/dashboard-utils';

interface StatsOverviewProps {
  totalFalls: number;
  recentFalls: number;
  unresolvedFalls: number;
  riskScore: number;
  isHighRisk: boolean;
  isLoading?: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalFalls,
  recentFalls,
  unresolvedFalls,
  riskScore,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  const riskLevel = getRiskLevel(riskScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Falls"
        value={totalFalls}
        icon={AlertTriangle}
        description="All time"
        color="red"
      />

      <MetricCard
        title="Recent Falls"
        value={recentFalls}
        icon={TrendingUp}
        description="Last 30 days"
        color="orange"
      />

      <MetricCard
        title="Pending Alerts"
        value={unresolvedFalls}
        icon={Activity}
        description="Needs attention"
        color="orange"
      />

      <div className="rounded-lg shadow-sm hover:shadow-md transition-shadow border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Risk Score</h3>
        <div className="space-y-3">
          <div className="text-3xl font-bold text-foreground">
            {riskScore}
          </div>
          <Progress value={riskScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {riskLevel === 'high' && '⚠️ High risk'}
            {riskLevel === 'medium' && '⚠️ Medium risk'}
            {riskLevel === 'low' && '✓ Low risk'}
          </p>
        </div>
      </div>
    </div>
  );
};
