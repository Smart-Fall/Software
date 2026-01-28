// Type definitions for the application
// Note: Prisma types will be available after running `npm run prisma:push` and `npm run prisma:generate`

// Basic model types (will be replaced by Prisma-generated types)
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  accountType: string;
  firstName: string | null;
  lastName: string | null;
  dob: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Patient {
  id: string;
  userId: string;
  riskScore: number;
  isHighRisk: boolean;
  medicalConditions: string | null;
  createdAt: Date;
}

export interface Caregiver {
  id: string;
  userId: string;
  specialization: string | null;
  yearsOfExperience: number | null;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string | null;
  sessionToken: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface Fall {
  id: string;
  patientId: string;
  fallDatetime: Date;
  severity: string | null;
  location: string | null;
  wasInjured: boolean | null;
  notes: string | null;
  createdAt: Date;
}

export interface CaregiverPatient {
  id: string;
  caregiverId: string;
  patientId: string;
  assignedDate: Date;
  isActive: boolean;
}

// User types without sensitive fields
export type SafeUser = Omit<User, "passwordHash">;

// User with related data
export type UserWithPatient = User & {
  patient: Patient | null;
};

export type UserWithCaregiver = User & {
  caregiver: Caregiver | null;
};

// Caregiver with related data
export type CaregiverWithUser = Caregiver & {
  user: User;
};

export type CaregiverWithPatients = Caregiver & {
  caregiverPatients: (CaregiverPatient & {
    patient: Patient & {
      user: User;
    };
  })[];
};

// Patient with related data
export type PatientWithUser = Patient & {
  user: User;
};

export type PatientWithFalls = Patient & {
  falls: Fall[];
};

export type PatientWithCaregiver = Patient & {
  caregiverPatients: (CaregiverPatient & {
    caregiver: Caregiver & {
      user: User;
    };
  })[];
};

// API Response types
export interface LoginResponse {
  message: string;
  user: SafeUser;
}

export interface SignupResponse {
  message: string;
  user: SafeUser;
}

export interface ErrorResponse {
  error: string;
}

export interface StatsResponse {
  totalPatients: number;
  recentFalls: number;
  avgHealthScore: number;
  highRiskPatients: number;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  firstName: string;
  lastName: string;
  dob: string | Date;
  email: string;
  password: string;
  accountType: "user" | "caregiver";
  specialization?: string;
  yearsOfExperience?: number;
  medicalConditions?: string;
}

// Session payload type
export interface SessionPayload {
  userId: string;
  accountType: string;
  iat?: number;
  exp?: number;
}

// Utility types
export type AccountType = "user" | "caregiver";
