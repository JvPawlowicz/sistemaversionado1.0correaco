import type { Patient, User, Appointment, EvolutionRecord, Report } from '@/lib/types';

export const patients: Patient[] = [
  { id: 'CF001', name: 'Alice Johnson', email: 'alice@example.com', phone: '(11) 98765-4321', lastVisit: '2024-07-20', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e29026704d`, dob: '1990-05-15', gender: 'Female' },
  { id: 'CF002', name: 'Bob Williams', email: 'bob@example.com', phone: '(21) 91234-5678', lastVisit: '2024-07-18', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e29026705d`, dob: '1985-08-22', gender: 'Male' },
  { id: 'CF003', name: 'Charlie Brown', email: 'charlie@example.com', phone: '(31) 95555-8888', lastVisit: '2024-06-30', status: 'Inactive', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e29026706d`, dob: '2002-01-10', gender: 'Male' },
  { id: 'CF004', name: 'Diana Miller', email: 'diana@example.com', phone: '(41) 94444-7777', lastVisit: '2024-07-21', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e29026707d`, dob: '1998-11-30', gender: 'Female' },
  { id: 'CF005', name: 'Ethan Davis', email: 'ethan@example.com', phone: '(51) 93333-6666', lastVisit: '2024-07-15', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e29026708d`, dob: '1976-03-25', gender: 'Male' },
];

export const users: User[] = [
  { id: 'U001', name: 'Dr. Evelyn Reed', email: 'evelyn.reed@clinicflow.com', role: 'Admin', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e29026709d` },
  { id: 'U002', name: 'Marco Silva', email: 'marco.silva@clinicflow.com', role: 'Therapist', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e2902670ad` },
  { id: 'U003', name: 'Ana Pereira', email: 'ana.pereira@clinicflow.com', role: 'Receptionist', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e2902670bd` },
  { id: 'U004', name: 'Carlos Santos', email: 'carlos.santos@clinicflow.com', role: 'Therapist', status: 'Inactive', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e2902670cd` },
];

const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const nextMonth = new Date();
nextMonth.setMonth(today.getMonth() + 1, 5);


export const appointments: Appointment[] = [
  { id: 'A001', patientName: 'Alice Johnson', discipline: 'Physiotherapy', time: '09:00', date: today, room: '1' },
  { id: 'A002', patientName: 'Bob Williams', discipline: 'Psychology', time: '10:00', date: today, room: '2' },
  { id: 'A003', patientName: 'Diana Miller', discipline: 'Nutrition', time: '11:00', date: today, room: '3' },
  { id: 'A004', patientName: 'Ethan Davis', discipline: 'Physiotherapy', time: '14:00', date: today, room: '1' },
  { id: 'A005', patientName: 'Alice Johnson', discipline: 'Physiotherapy', time: '09:00', date: tomorrow, room: '1' },
  { id: 'A006', patientName: 'Charlie Brown', discipline: 'Psychology', time: '15:00', date: tomorrow, room: '2' },
  { id: 'A007', patientName: 'Bob Williams', discipline: 'Physiotherapy', time: '10:00', date: yesterday, room: '1' },
  { id: 'A008', patientName: 'Diana Miller', discipline: 'Nutrition', time: '11:00', date: yesterday, room: '3' },
  { id: 'A009', patientName: 'Ethan Davis', discipline: 'Physiotherapy', time: '16:00', date: yesterday, room: '1' },
  { id: 'A010', patientName: 'Alice Johnson', discipline: 'Physiotherapy', time: '10:00', date: nextMonth, room: '1' },
];


export const evolutionRecords: EvolutionRecord[] = [
    { id: 'E001', date: '2024-07-20', title: 'Initial Assessment', details: 'Patient presents with lower back pain. ROM limited. Plan to start with light exercises.', author: 'Marco Silva'},
    { id: 'E002', date: '2024-07-10', title: 'Follow-up Session', details: 'Patient reports improvement in mobility. Pain level decreased from 8/10 to 6/10.', author: 'Marco Silva'},
    { id: 'E003', date: '2024-07-01', title: 'Progress Check', details: 'Significant improvement. Patient can now perform daily activities with minimal pain.', author: 'Marco Silva'},
];

export const reports: Report[] = [
    { id: 'R001', title: 'Full Physiotherapy Evaluation', date: '2024-07-20', url: '#' },
    { id: 'R002', title: 'Imaging Results Analysis', date: '2024-07-15', url: '#' },
    { id: 'R003', title: 'Discharge Summary', date: '2024-06-30', url: '#' },
];
