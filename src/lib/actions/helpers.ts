'use server';

import { auth, db } from '@/lib/firebase-admin';
import type { Log } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function createLog(data: {
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  entity?: { type: string, id: string };
  unitId?: string | null;
}) {
  if (!db) return;
  const { actorId, actorName, action, details, entity, unitId } = data;
  
  const logData: Omit<Log, 'id'|'createdAt'> & {createdAt: FieldValue} = {
    actorId,
    actorName,
    action,
    details,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (entity) {
    logData.entityType = entity.type;
    logData.entityId = entity.id;
  }

  if (unitId) {
    logData.unitId = unitId;
  }

  await db.collection('logs').add(logData);
}

export function checkAdminInit() {
  if (!auth || !db) {
    const errorMessage = 'A configuração do Firebase Admin não foi carregada. Verifique as variáveis de ambiente do servidor.';
    console.error(errorMessage);
    return { success: false, message: errorMessage, errors: null };
  }
  return null;
}
