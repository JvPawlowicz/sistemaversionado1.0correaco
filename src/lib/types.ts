export type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  lastVisit?: string | null;
  status: 'Active' | 'Inactive';
  avatarUrl: string;
  dob?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  unitIds: string[];
  createdAt?: any; // For Firestore serverTimestamp
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Therapist' | 'Receptionist' | 'Coordinator';
  status: 'Active' | 'Inactive';
  avatarUrl: string;
  unitIds: string[];
  createdAt?: any; // For Firestore serverTimestamp
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  professionalName: string;
  discipline: string;
  time: string;
  endTime: string;
  date: string; // ISO String 'YYYY-MM-DD'
  room: string;
  unitId: string;
  status: 'Agendado' | 'Realizado' | 'Faltou' | 'Cancelado';
  color: string;
  createdAt?: any; // For Firestore serverTimestamp
};

export type EvolutionRecord = {
  id: string;
  date: string;
  title: string;
  details: string;
  author: string;
  createdAt?: any; // For Firestore serverTimestamp
};

export type PatientDocument = {
  id: string;
  fileName: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: any; // Firestore serverTimestamp
};

export type Report = {
  id:string;
  title: string;
  date: string;
  url: string;
};

export type Unit = {
  id: string;
  name: string;
  rooms: string[];
  createdAt?: any;
};

export type Notification = {
  id: string;
  title: string;
  content: string;
  createdAt?: any;
  targetType?: 'ALL' | 'ROLE' | 'UNIT' | 'SPECIFIC';
  targetValue?: string | string[];
  seenBy?: string[];
};
