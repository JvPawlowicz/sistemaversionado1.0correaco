'use server';

import { db } from '@/lib/firebase-admin';
import type { EvolutionRecord } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Saves a new evolution record to a patient's subcollection in Firestore.
 * @param patientId The ID of the patient.
 * @param recordData The evolution record data to save.
 * @returns The ID of the newly created record.
 */
export async function saveEvolutionRecord(
  patientId: string,
  recordData: Omit<EvolutionRecord, 'id' | 'createdAt'>
): Promise<string> {
  if (!db) {
    throw new Error('Firebase Admin SDK not initialized.');
  }
  const evolutionRef = db
    .collection('patients')
    .doc(patientId)
    .collection('evolutionRecords');
  const newRecordRef = await evolutionRef.add({
    ...recordData,
    createdAt: FieldValue.serverTimestamp(),
  });
  return newRecordRef.id;
}
