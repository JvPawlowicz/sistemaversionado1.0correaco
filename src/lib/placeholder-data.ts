import type { Patient, User, Appointment, EvolutionRecord, Report } from '@/lib/types';

export const patients: Patient[] = [];

export const users: User[] = [
  { id: 'U001', name: 'Dr. Evelyn Reed', email: 'evelyn.reed@clinicflow.com', role: 'Admin', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e29026709d` },
  { id: 'U002', name: 'Marco Silva', email: 'marco.silva@clinicflow.com', role: 'Therapist', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e2902670ad` },
  { id: 'U003', name: 'Ana Pereira', email: 'ana.pereira@clinicflow.com', role: 'Receptionist', status: 'Active', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e2902670bd` },
  { id: 'U004', name: 'Carlos Santos', email: 'carlos.santos@clinicflow.com', role: 'Therapist', status: 'Inactive', avatarUrl: `https://i.pravatar.cc/150?u=a042581f4e2902670cd` },
];

function getDayOfWeek(date: Date, dayOfWeek: number) { // 1=Monday, ... 7=Sunday
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : dayOfWeek);
  return new Date(d.setDate(diff));
}

const colors = [
    '#34D399',
    '#60A5FA',
    '#F472B6',
    '#FBBF24',
    '#F97316',
];

export const appointments: Appointment[] = [
  // Monday of current week
  { id: 'A001', date: getDayOfWeek(new Date(), 1), patientName: 'Alice Johnson', professionalName: 'Marco Silva', discipline: 'Physiotherapy', time: '08:00', endTime: '09:00', room: '1', color: colors[0] },
  { id: 'A002', date: getDayOfWeek(new Date(), 1), patientName: 'Bob Williams', professionalName: 'Carlos Santos', discipline: 'Physiotherapy', time: '10:00', endTime: '11:00', room: '1', color: colors[1] },
  { id: 'A003', date: getDayOfWeek(new Date(), 1), patientName: 'Charlie Brown', professionalName: 'Marco Silva', discipline: 'Physiotherapy', time: '14:00', endTime: '15:00', room: '2', color: colors[0] },
  
  // Tuesday
  { id: 'A004', date: getDayOfWeek(new Date(), 2), patientName: 'Diana Miller', professionalName: 'Dr. Evelyn Reed', discipline: 'Psychology', time: '09:00', endTime: '10:00', room: '3', color: colors[2] },
  { id: 'A005', date: getDayOfWeek(new Date(), 2), patientName: 'Ethan Davis', professionalName: 'Carlos Santos', discipline: 'Physiotherapy', time: '11:00', endTime: '12:30', room: '1', color: colors[1] },

  // Wednesday
  { id: 'A006', date: getDayOfWeek(new Date(), 3), patientName: 'Alice Johnson', professionalName: 'Marco Silva', discipline: 'Physiotherapy', time: '08:30', endTime: '09:30', room: '1', color: colors[0] },
  { id: 'A007', date: getDayOfWeek(new Date(), 3), patientName: 'Fiona Green', professionalName: 'Dr. Evelyn Reed', discipline: 'Psychology', time: '13:00', endTime: '14:00', room: '3', color: colors[2] },

  // Thursday
  { id: 'A008', date: getDayOfWeek(new Date(), 4), patientName: 'George King', professionalName: 'Carlos Santos', discipline: 'Physiotherapy', time: '10:00', endTime: '11:00', room: '1', color: colors[1] },
  { id: 'A009', date: getDayOfWeek(new Date(), 4), patientName: 'Bob Williams', professionalName: 'Marco Silva', discipline: 'Physiotherapy', time: '15:00', endTime: '16:00', room: '2', color: colors[0] },

  // Friday
  { id: 'A010', date: getDayOfWeek(new Date(), 5), patientName: 'Hannah White', professionalName: 'Dr. Evelyn Reed', discipline: 'Psychology', time: '09:00', endTime: '10:00', room: '3', color: colors[2] },
  { id: 'A011', date: getDayOfWeek(new Date(), 5), patientName: 'Ian Black', professionalName: 'Carlos Santos', discipline: 'Physiotherapy', time: '11:00', endTime: '12:00', room: '1', color: colors[1] },
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
