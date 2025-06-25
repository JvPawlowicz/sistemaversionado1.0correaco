'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Patient } from '@/lib/types';
import { patients as initialPatients } from '@/lib/placeholder-data';

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);

  const addPatient = (patient: Patient) => {
    setPatients((prevPatients) => [patient, ...prevPatients]);
  };

  return (
    <PatientContext.Provider value={{ patients, addPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
