export type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  status: 'Active' | 'Inactive';
  avatarUrl: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  unitIds: string[];
  createdAt?: any; // For Firestore serverTimestamp
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Therapist' | 'Receptionist';
  status: 'Active' | 'Inactive';
  avatarUrl: string;
  unitIds: string[];
  createdAt?: any; // For Firestore serverTimestamp
};

export type Appointment = {
  id: string;
  patientId?: string; // Optional now
  patientName: string;
  professionalName: string;
  discipline: string;
  time: string;
  endTime: string;
  date: string; // ISO String 'YYYY-MM-DD'
  room: string;
  unitId: string;
  color: string;
  createdAt?: any; // For Firestore serverTimestamp
};

export type EvolutionRecord = {
  id: string;
  date: string;
  title: string;
  details: string;
  author: string;
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
