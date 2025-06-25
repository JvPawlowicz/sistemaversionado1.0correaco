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
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Therapist' | 'Receptionist';
  status: 'Active' | 'Inactive';
  avatarUrl: string;
};

export type Appointment = {
  id: string;
  patientName: string;
  discipline: string;
  time: string;
  date: Date;
  room: string;
};

export type EvolutionRecord = {
  id: string;
  date: string;
  title: string;
  details: string;
  author: string;
};

export type Report = {
  id: string;
  title: string;
  date: string;
  url: string;
};
