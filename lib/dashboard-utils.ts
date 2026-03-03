import { Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';

type FallLike = {
  fallDatetime?: string | Date;
  fall_datetime?: string | Date;
};

type PatientNameLike = {
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
};

type PatientRiskLike = PatientNameLike & {
  riskScore?: number;
  risk_score?: number;
};

// Time formatting utilities
export const formatLastSeen = (lastSeen: string | null): string => {
  if (!lastSeen) return 'Never';

  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const formatRelativeTime = (date: string): string => {
  return formatLastSeen(date);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Risk calculation utilities
export const getRiskColor = (score: number): string => {
  if (score >= 75) return '#dc2626'; // Red for high risk
  if (score >= 50) return '#ea580c'; // Orange for medium risk
  return '#16a34a'; // Green for low risk
};

export const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

export const getRiskBgColor = (score: number): string => {
  if (score >= 75) return '#fee2e2'; // Light red
  if (score >= 50) return '#fed7aa'; // Light orange
  return '#dcfce7'; // Light green
};

// Battery level utilities
export const getBatteryColor = (level: number): string => {
  if (level < 20) return '#dc2626'; // Red
  if (level < 50) return '#ea580c'; // Orange
  return '#16a34a'; // Green
};

export const getBatteryIcon = (level: number | null) => {
  if (level === null) return Battery;
  if (level < 20) return BatteryLow;
  if (level < 50) return BatteryMedium;
  return BatteryFull;
};

// Device online status check
export const isDeviceOnline = (lastSeen: string | null): boolean => {
  if (!lastSeen) return false;
  const diffMs = new Date().getTime() - new Date(lastSeen).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  return diffMins < 5; // Consider online if seen within 5 minutes
};

export const getDeviceStatus = (lastSeen: string | null): 'online' | 'offline' => {
  return isDeviceOnline(lastSeen) ? 'online' : 'offline';
};

// Severity color utilities
export const getSeverityColor = (severity: string | null): string => {
  if (!severity) return 'hsl(var(--muted))';
  switch (severity.toLowerCase()) {
    case 'high':
    case 'severe':
      return '#dc2626';
    case 'medium':
    case 'moderate':
      return '#ea580c';
    case 'low':
    case 'minor':
      return '#16a34a';
    default:
      return 'hsl(var(--muted))';
  }
};

// Trend calculation
export const calculateTrendPercentage = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

// Format fall trend data for charts
export interface FallTrendDataPoint {
  date: string;
  falls: number;
}

export const formatFallTrendData = (falls: FallLike[]): FallTrendDataPoint[] => {
  // Group falls by date over last 30 days
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const fallsByDate: { [key: string]: number } = {};

  // Initialize all dates in range
  for (let i = 0; i < 30; i++) {
    const date = new Date(last30Days);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    fallsByDate[dateStr] = 0;
  }

  // Count falls by date
  falls.forEach((fall) => {
    const fallDateValue = fall.fallDatetime ?? fall.fall_datetime;
    if (!fallDateValue) return;
    const fallDate = new Date(fallDateValue).toISOString().split('T')[0];
    if (fallsByDate.hasOwnProperty(fallDate)) {
      fallsByDate[fallDate]++;
    }
  });

  // Convert to array and format for chart
  return Object.entries(fallsByDate).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    falls: count
  }));
};

// Age calculation
export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Sorting utilities
export const sortPatientsByRisk = (patients: PatientRiskLike[]): PatientRiskLike[] => {
  return [...patients].sort((a, b) => {
    const scoreA = a.riskScore || a.risk_score || 0;
    const scoreB = b.riskScore || b.risk_score || 0;
    return scoreB - scoreA;
  });
};

export const sortPatientsByName = (patients: PatientRiskLike[]): PatientRiskLike[] => {
  return [...patients].sort((a, b) => {
    const nameA = `${a.firstName || a.first_name || ''} ${a.lastName || a.last_name || ''}`.toLowerCase();
    const nameB = `${b.firstName || b.first_name || ''} ${b.lastName || b.last_name || ''}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

// Filtering utilities
export const filterPatientsBySearch = (patients: PatientRiskLike[], query: string): PatientRiskLike[] => {
  if (!query) return patients;
  const lowerQuery = query.toLowerCase();
  return patients.filter((patient) => {
    const firstName = (patient.firstName || patient.first_name || '').toLowerCase();
    const lastName = (patient.lastName || patient.last_name || '').toLowerCase();
    return firstName.includes(lowerQuery) || lastName.includes(lowerQuery);
  });
};

export const filterPatientsByRisk = (patients: PatientRiskLike[], riskLevel: 'all' | 'low' | 'medium' | 'high'): PatientRiskLike[] => {
  if (riskLevel === 'all') return patients;
  return patients.filter((patient) => {
    const score = patient.riskScore || patient.risk_score || 0;
    return getRiskLevel(score) === riskLevel;
  });
};
