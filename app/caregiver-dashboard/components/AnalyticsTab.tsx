'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsTabProps {
  totalPatients: number;
  highRiskPatients: number;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  totalPatients,
  highRiskPatients
}) => {
  // Fall frequency by day of week
  const fallFrequencyData = [
    { day: 'Mon', falls: 2 },
    { day: 'Tue', falls: 1 },
    { day: 'Wed', falls: 3 },
    { day: 'Thu', falls: 1 },
    { day: 'Fri', falls: 2 },
    { day: 'Sat', falls: 4 },
    { day: 'Sun', falls: 1 }
  ];

  // Risk distribution
  const lowRiskPatients = totalPatients - highRiskPatients - Math.max(0, totalPatients - highRiskPatients - 20);
  const mediumRiskPatients = Math.max(0, totalPatients - highRiskPatients - lowRiskPatients);
  const riskDistributionData = [
    { name: 'Low Risk', value: Math.max(0, totalPatients - highRiskPatients - mediumRiskPatients), fill: '#16a34a' },
    { name: 'Medium Risk', value: mediumRiskPatients, fill: '#ea580c' },
    { name: 'High Risk', value: highRiskPatients, fill: '#dc2626' }
  ];

  return (
    <div className="space-y-6">
      {/* Fall Frequency Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Fall Frequency by Day</CardTitle>
          <CardDescription>Falls detected this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fallFrequencyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="falls" fill="#ea580c" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Risk Distribution</CardTitle>
          <CardDescription>Risk levels of all patients</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
