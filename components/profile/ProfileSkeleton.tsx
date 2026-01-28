import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-24 h-6" />
          </div>
        </div>
        <Skeleton className="w-32 h-10" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="rounded-3xl shadow-lg">
            <CardHeader>
              <Skeleton className="w-40 h-6" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-full h-10" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
