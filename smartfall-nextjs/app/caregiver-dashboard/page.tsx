'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserPlus, Activity, Users, AlertTriangle, Heart, TrendingUp } from 'lucide-react';

interface Patient {
  id?: number;
  patient_id?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  dob: string;
  riskScore?: number;
  risk_score?: number;
  isHighRisk?: boolean;
  is_high_risk?: boolean;
  medicalConditions?: string;
  medical_conditions?: string;
}

interface Caregiver {
  id?: number;
  caregiver_id?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  facilityName?: string;
  facility_name?: string;
  specialization?: string;
}

interface Stats {
  totalPatients: number;
  recentFalls: number;
  avgHealthScore: number;
  highRiskPatients: number;
}

export default function CaregiverDashboard() {
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    recentFalls: 0,
    avgHealthScore: 0,
    highRiskPatients: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  const API_BASE_URL = '/api';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const caregiverRes = await fetch(`${API_BASE_URL}/caregiver/current`, {
          credentials: 'include'
        });
        
        if (!caregiverRes.ok) {
          throw new Error('Failed to fetch caregiver data');
        }
        
        const caregiverData: Caregiver = await caregiverRes.json();
        setCaregiver(caregiverData);

        const unassignedRes = await fetch(`${API_BASE_URL}/patients/unassigned`, {
          credentials: 'include'
        });
        
        if (!unassignedRes.ok) {
          throw new Error('Failed to fetch unassigned patients');
        }
        
        const unassignedData: Patient[] = await unassignedRes.json();
        setUnassignedPatients(unassignedData);

        const myPatientsRes = await fetch(`${API_BASE_URL}/caregiver/patients`, {
          credentials: 'include'
        });
        
        if (!myPatientsRes.ok) {
          throw new Error('Failed to fetch assigned patients');
        }
        
        const myPatientsData: Patient[] = await myPatientsRes.json();
        setMyPatients(myPatientsData);

        const statsRes = await fetch(`${API_BASE_URL}/caregiver/stats`, {
          credentials: 'include'
        });
        
        if (!statsRes.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const statsData: Stats = await statsRes.json();
        setStats(statsData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        alert('Failed to load dashboard data. Please make sure you are logged in and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleAddPatient = async (patient: Patient) => {
    try {
      const patientId = patient.id || patient.patient_id;
      
      const response = await fetch(`${API_BASE_URL}/caregiver-patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patient_id: patientId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign patient');
      }

      const updatedPatients = [...myPatients, patient];
      setMyPatients(updatedPatients);
      setUnassignedPatients(unassignedPatients.filter(p => 
        (p.id || p.patient_id) !== patientId
      ));
      
      const statsRes = await fetch(`${API_BASE_URL}/caregiver/stats`, {
        credentials: 'include'
      });
      
      if (statsRes.ok) {
        const statsData: Stats = await statsRes.json();
        setStats(statsData);
      }
      
      setSheetOpen(false);
      
    } catch (error) {
      console.error('Error assigning patient:', error);
      alert('Failed to assign patient. Please try again.');
    }
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getRiskColor = (score: number): string => {
    if (score >= 75) return '#dc2626';
    if (score >= 50) return '#ea580c';
    return '#16a34a';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a96] mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!caregiver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load caregiver information.</p>
          <Button onClick={() => window.location.reload()} className="mt-4 bg-[#1a1a96] hover:bg-[#15157a]">
            Retry
          </Button>
        </div>
      </div>
    );
  }

   return (
  <div className="min-h-screen bg-[#f8f9fa]">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <Activity className="h-10 w-10 text-[#1a1a96]" strokeWidth={2.5} />
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a96]">
                  Welcome, {caregiver?.firstName || caregiver?.first_name} {caregiver?.lastName || caregiver?.last_name}
                </h1>
                <p className="text-sm text-muted-foreground">{caregiver?.facilityName || caregiver?.facility_name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button className="bg-[#1a1a96] hover:bg-[#15157a] text-white rounded-lg px-6">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Patients
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-96">
                  <SheetHeader>
                    <SheetTitle>Unassigned Patients</SheetTitle>
                    <SheetDescription>
                      Select patients to add to your care list
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                    {unassignedPatients.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No unassigned patients</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pr-4">
                        {unassignedPatients.map((patient: Patient) => {
                          const patientId = patient.id || patient.patient_id;
                          const firstName = patient.firstName || patient.first_name;
                          const lastName = patient.lastName || patient.last_name;
                          const riskScore = patient.riskScore || patient.risk_score || 0;
                          
                          return (
                            <Card key={patientId} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="font-semibold text-base text-foreground">
                                      {firstName} {lastName}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      Age: {calculateAge(patient.dob)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
                                    <p className="text-lg font-bold" style={{ color: getRiskColor(riskScore) }}>
                                      {riskScore}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => handleAddPatient(patient)}
                                  className="w-full bg-[#1a1a96] hover:bg-[#15157a]"
                                  size="sm"
                                >
                                  <UserPlus className="mr-2 h-3 w-3" />
                                  Add to My Patients
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - FORCE HORIZONTAL LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          {/* Total Patients */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div style={{ 
                backgroundColor: '#dbeafe', 
                padding: '20px', 
                borderRadius: '9999px', 
                marginBottom: '20px', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Users style={{ width: '32px', height: '32px', color: '#3b82f6', strokeWidth: 2 }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Patients</p>
              <p className="text-5xl font-bold text-foreground">{stats.totalPatients}</p>
            </CardContent>
          </Card>

          {/* Recent Falls */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div style={{ 
                backgroundColor: '#fee2e2', 
                padding: '20px', 
                borderRadius: '9999px', 
                marginBottom: '20px', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626', strokeWidth: 2 }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Falls (Last 7 Days)</p>
              <p className="text-5xl font-bold text-foreground">{stats.recentFalls}</p>
            </CardContent>
          </Card>

          {/* Average Health Score */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div style={{ 
                backgroundColor: '#dcfce7', 
                padding: '20px', 
                borderRadius: '9999px', 
                marginBottom: '20px', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Heart style={{ width: '32px', height: '32px', color: '#16a34a', strokeWidth: 2 }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Avg Health Score</p>
              <p className="text-5xl font-bold text-foreground">{stats.avgHealthScore}</p>
            </CardContent>
          </Card>

          {/* High Risk Patients */}
          <Card className="rounded-3xl shadow-lg border-border hover:shadow-xl transition-shadow">
            <CardContent style={{ padding: '32px', paddingTop: '32px' }} className="flex flex-col items-center text-center">
              <div style={{ 
                backgroundColor: '#fed7aa', 
                padding: '20px', 
                borderRadius: '9999px', 
                marginBottom: '20px', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <TrendingUp style={{ width: '32px', height: '32px', color: '#ea580c', strokeWidth: 2 }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">High Risk Patients</p>
              <p className="text-5xl font-bold text-foreground">{stats.highRiskPatients}</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-4">
            <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="ghost" disabled>
                  <Activity className="mr-3 h-5 w-5" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Area */}
          <div className="lg:col-span-8">
            <Card className="rounded-3xl shadow-md border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">My Patients</CardTitle>
                <CardDescription className="text-base">
                  Patients currently under your care
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myPatients.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg mb-2 font-medium">No patients assigned yet</p>
                    <p className="text-sm">Click "Add Patients" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myPatients.map((patient: Patient) => {
                      const patientId = patient.id || patient.patient_id;
                      const firstName = patient.firstName || patient.first_name;
                      const lastName = patient.lastName || patient.last_name;
                      const riskScore = patient.riskScore || patient.risk_score || 0;
                      
                      return (
                        <Card key={patientId} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow border-border">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-foreground">
                                  {firstName} {lastName}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Age: {calculateAge(patient.dob)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">Risk</p>
                                <p className="text-3xl font-bold" style={{ color: getRiskColor(riskScore) }}>
                                  {riskScore}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="default" className="w-full rounded-xl">
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}





// 'use client'

// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
// import { UserPlus, Activity, Users, AlertTriangle, Heart, TrendingUp } from 'lucide-react';

// interface Patient {
//   id?: number;
//   patient_id?: number;
//   firstName?: string;
//   first_name?: string;
//   lastName?: string;
//   last_name?: string;
//   dob: string;
//   riskScore?: number;
//   risk_score?: number;
//   isHighRisk?: boolean;
//   is_high_risk?: boolean;
//   medicalConditions?: string;
//   medical_conditions?: string;
// }

// interface Caregiver {
//   id?: number;
//   caregiver_id?: number;
//   firstName?: string;
//   first_name?: string;
//   lastName?: string;
//   last_name?: string;
//   facilityName?: string;
//   facility_name?: string;
//   specialization?: string;
// }

// interface Stats {
//   totalPatients: number;
//   recentFalls: number;
//   avgHealthScore: number;
//   highRiskPatients: number;
// }

// export default function CaregiverDashboard() {
//   const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
//   const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);
//   const [myPatients, setMyPatients] = useState<Patient[]>([]);
//   const [stats, setStats] = useState<Stats>({
//     totalPatients: 0,
//     recentFalls: 0,
//     avgHealthScore: 0,
//     highRiskPatients: 0
//   });
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [sheetOpen, setSheetOpen] = useState<boolean>(false);

//   const API_BASE_URL = '/api';

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       setIsLoading(true);
//       try {
//         const caregiverRes = await fetch(`${API_BASE_URL}/caregiver/current`, {
//           credentials: 'include'
//         });
        
//         if (!caregiverRes.ok) {
//           throw new Error('Failed to fetch caregiver data');
//         }
        
//         const caregiverData: Caregiver = await caregiverRes.json();
//         setCaregiver(caregiverData);

//         const unassignedRes = await fetch(`${API_BASE_URL}/patients/unassigned`, {
//           credentials: 'include'
//         });
        
//         if (!unassignedRes.ok) {
//           throw new Error('Failed to fetch unassigned patients');
//         }
        
//         const unassignedData: Patient[] = await unassignedRes.json();
//         setUnassignedPatients(unassignedData);

//         const myPatientsRes = await fetch(`${API_BASE_URL}/caregiver/patients`, {
//           credentials: 'include'
//         });
        
//         if (!myPatientsRes.ok) {
//           throw new Error('Failed to fetch assigned patients');
//         }
        
//         const myPatientsData: Patient[] = await myPatientsRes.json();
//         setMyPatients(myPatientsData);

//         const statsRes = await fetch(`${API_BASE_URL}/caregiver/stats`, {
//           credentials: 'include'
//         });
        
//         if (!statsRes.ok) {
//           throw new Error('Failed to fetch statistics');
//         }
        
//         const statsData: Stats = await statsRes.json();
//         setStats(statsData);

//       } catch (error) {
//         console.error('Error fetching dashboard data:', error);
//         alert('Failed to load dashboard data. Please make sure you are logged in and try again.');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchDashboardData();
//   }, []);

//   const handleAddPatient = async (patient: Patient) => {
//     try {
//       const patientId = patient.id || patient.patient_id;
      
//       const response = await fetch(`${API_BASE_URL}/caregiver-patients`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         credentials: 'include',
//         body: JSON.stringify({
//           patient_id: patientId
//         })
//       });

//       if (!response.ok) {
//         throw new Error('Failed to assign patient');
//       }

//       const updatedPatients = [...myPatients, patient];
//       setMyPatients(updatedPatients);
//       setUnassignedPatients(unassignedPatients.filter(p => 
//         (p.id || p.patient_id) !== patientId
//       ));
      
//       const statsRes = await fetch(`${API_BASE_URL}/caregiver/stats`, {
//         credentials: 'include'
//       });
      
//       if (statsRes.ok) {
//         const statsData: Stats = await statsRes.json();
//         setStats(statsData);
//       }
      
//       setSheetOpen(false);
      
//     } catch (error) {
//       console.error('Error assigning patient:', error);
//       alert('Failed to assign patient. Please try again.');
//     }
//   };

//   const calculateAge = (dob: string): number => {
//     const birthDate = new Date(dob);
//     const today = new Date();
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const monthDiff = today.getMonth() - birthDate.getMonth();
//     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//       age--;
//     }
//     return age;
//   };

//   const getRiskColor = (score: number): string => {
//     if (score >= 75) return '#dc2626';
//     if (score >= 50) return '#ea580c';
//     return '#16a34a';
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!caregiver) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
//           <p className="text-gray-600">Failed to load caregiver information.</p>
//           <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-900 hover:bg-blue-800">
//             Retry
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Navbar */}
//       <nav className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-3">
//               <Activity className="h-8 w-8 text-blue-900" strokeWidth={2.5} />
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">
//                   Welcome, {caregiver?.firstName || caregiver?.first_name} {caregiver?.lastName || caregiver?.last_name}
//                 </h1>
//                 <p className="text-sm text-gray-500">{caregiver?.facilityName || caregiver?.facility_name}</p>
//               </div>
//             </div>
//             <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
//               <SheetTrigger asChild>
//                 <Button className="bg-blue-900 hover:bg-blue-800 text-white">
//                   <UserPlus className="mr-2 h-4 w-4" />
//                   Add Patients
//                 </Button>
//               </SheetTrigger>
//               <SheetContent side="right" className="w-96">
//                 <SheetHeader>
//                   <SheetTitle>Unassigned Patients</SheetTitle>
//                   <SheetDescription>
//                     Select patients to add to your care list
//                   </SheetDescription>
//                 </SheetHeader>
//                 <ScrollArea className="h-[calc(100vh-120px)] mt-6">
//                   {unassignedPatients.length === 0 ? (
//                     <div className="text-center py-8 text-gray-500">
//                       <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
//                       <p>No unassigned patients</p>
//                     </div>
//                   ) : (
//                     <div className="space-y-3 pr-4">
//                       {unassignedPatients.map((patient: Patient) => {
//                         const patientId = patient.id || patient.patient_id;
//                         const firstName = patient.firstName || patient.first_name;
//                         const lastName = patient.lastName || patient.last_name;
//                         const riskScore = patient.riskScore || patient.risk_score || 0;
                        
//                         return (
//                           <Card key={patientId} className="border border-gray-200">
//                             <CardContent className="pt-4">
//                               <div className="flex justify-between items-start mb-3">
//                                 <div>
//                                   <h3 className="font-semibold text-base">
//                                     {firstName} {lastName}
//                                   </h3>
//                                   <p className="text-sm text-gray-500">
//                                     Age: {calculateAge(patient.dob)}
//                                   </p>
//                                 </div>
//                                 <div className="text-right">
//                                   <p className="text-xs text-gray-500 mb-1">Risk Score</p>
//                                   <p className="text-lg font-bold" style={{ color: getRiskColor(riskScore) }}>
//                                     {riskScore}
//                                   </p>
//                                 </div>
//                               </div>
//                               <Button 
//                                 onClick={() => handleAddPatient(patient)}
//                                 className="w-full bg-blue-900 hover:bg-blue-800"
//                                 size="sm"
//                               >
//                                 <UserPlus className="mr-2 h-3 w-3" />
//                                 Add to My Patients
//                               </Button>
//                             </CardContent>
//                           </Card>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </ScrollArea>
//               </SheetContent>
//             </Sheet>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-6 py-8">
//         {/* Stats Grid - 4 Column Grid */}
//         <div className="grid grid-cols-4 gap-4 mb-8">
//           {/* Total Patients */}
//           <Card className="border-0 bg-white shadow-sm">
//             <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
//               <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center mb-6">
//                 <Users className="w-10 h-10 text-blue-500" strokeWidth={2} />
//               </div>
//               <p className="text-sm font-medium text-gray-700 mb-3">Total Patients</p>
//               <p className="text-5xl font-bold text-gray-900">{stats.totalPatients}</p>
//             </CardContent>
//           </Card>

//           {/* Recent Falls */}
//           <Card className="border-0 bg-white shadow-sm">
//             <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
//               <div className="w-32 h-32 rounded-full bg-red-50 flex items-center justify-center mb-6">
//                 <AlertTriangle className="w-10 h-10 text-red-500" strokeWidth={2} />
//               </div>
//               <p className="text-sm font-medium text-gray-700 mb-3">Falls (Last 7 Days)</p>
//               <p className="text-5xl font-bold text-gray-900">{stats.recentFalls}</p>
//             </CardContent>
//           </Card>

//           {/* Average Health Score */}
//           <Card className="border-0 bg-white shadow-sm">
//             <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
//               <div className="w-32 h-32 rounded-full bg-green-50 flex items-center justify-center mb-6">
//                 <Heart className="w-10 h-10 text-green-500" strokeWidth={2} />
//               </div>
//               <p className="text-sm font-medium text-gray-700 mb-3">Avg Health Score</p>
//               <p className="text-5xl font-bold text-gray-900">{stats.avgHealthScore}</p>
//             </CardContent>
//           </Card>

//           {/* High Risk Patients */}
//           <Card className="border-0 bg-white shadow-sm">
//             <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
//               <div className="w-32 h-32 rounded-full bg-orange-50 flex items-center justify-center mb-6">
//                 <TrendingUp className="w-10 h-10 text-orange-500" strokeWidth={2} />
//               </div>
//               <p className="text-sm font-medium text-gray-700 mb-3">High Risk Patients</p>
//               <p className="text-5xl font-bold text-gray-900">{stats.highRiskPatients}</p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Two Column Layout */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Quick Actions Sidebar */}
//           <div className="lg:col-span-1">
//             <Card className="border border-gray-200 shadow-sm">
//               <CardHeader>
//                 <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
//                   <Activity className="mr-3 h-5 w-5" />
//                   View Analytics
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>

//           {/* My Patients Main Area */}
//           <div className="lg:col-span-2">
//             <Card className="border border-gray-200 shadow-sm">
//               <CardHeader>
//                 <CardTitle className="text-lg font-bold">My Patients</CardTitle>
//                 <CardDescription>
//                   Patients currently under your care
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {myPatients.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">
//                     <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
//                     <p className="text-base font-medium mb-1">No patients assigned yet</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     {myPatients.map((patient: Patient) => {
//                       const patientId = patient.id || patient.patient_id;
//                       const firstName = patient.firstName || patient.first_name;
//                       const lastName = patient.lastName || patient.last_name;
//                       const riskScore = patient.riskScore || patient.risk_score || 0;
                      
//                       return (
//                         <Card key={patientId} className="border border-gray-200">
//                           <CardContent className="p-6">
//                             <div className="flex justify-between items-start mb-4">
//                               <div>
//                                 <h3 className="text-lg font-bold text-gray-900">
//                                   {firstName} {lastName}
//                                 </h3>
//                                 <p className="text-sm text-gray-600 mt-1">
//                                   Age: {calculateAge(patient.dob)}
//                                 </p>
//                               </div>
//                               <div className="text-right">
//                                 <p className="text-xs text-gray-500 mb-1">Risk</p>
//                                 <p className="text-2xl font-bold" style={{ color: getRiskColor(riskScore) }}>
//                                   {riskScore}
//                                 </p>
//                               </div>
//                             </div>
//                             <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
//                               View Details
//                             </Button>
//                           </CardContent>
//                         </Card>
//                       );
//                     })}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }