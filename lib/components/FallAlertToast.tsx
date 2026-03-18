'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FallAlertToastProps {
  patientName: string;
  confidenceLevel: string;
  confidenceScore: number;
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

export const FallAlertToast: React.FC<FallAlertToastProps> = ({
  patientName,
  confidenceLevel,
  confidenceScore,
  onDismiss,
  onViewDetails,
}) => {
  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-600';
      case 'MEDIUM':
        return 'bg-orange-600';
      case 'LOW':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
      <div className={`${getLevelColor(confidenceLevel)} text-white p-4`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">FALL DETECTED</h3>
              <p className="text-sm font-semibold">{patientName}</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-white hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-white/20 rounded px-3 py-2 mb-3">
          <div className="flex justify-between items-center text-sm">
            <span>Confidence Level:</span>
            <span className="font-bold">{confidenceLevel}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Confidence Score:</span>
            <span className="font-bold">{confidenceScore}%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onViewDetails}
            size="sm"
            className="flex-1 bg-white text-red-600 hover:bg-gray-100 font-semibold"
          >
            View Details
          </Button>
          <Button
            onClick={onDismiss}
            size="sm"
            variant="outline"
            className="flex-1 border-white text-white hover:bg-white/20"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
