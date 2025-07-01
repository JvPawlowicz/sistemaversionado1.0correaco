'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { checkAdminInit, createLog } from './helpers';

const CreateTherapyGroupSchema = z.object({
  name: z.string().min(3, { message: 'O nome do grupo deve ter pelo menos 3 caracteres.' }),
  serviceId: z.string().min(1, { message: 'Selecione um serviço.' }),
  unitId: z.string().min(1, { message: 'ID da unidade é obrigatório.' }),
  professionalIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos um profissional.' }),
  patientIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos um paciente.' }),
});

export async function createTherapyGroupAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
  const validatedFields = CreateTherapyGroupSchema.safeParse({
    name: formData.get('name'),
    serviceId: formData.get('serviceId'),
    unitId: formData.get('unitId'),
    professionalIds: formData.getAll('professionalIds'),
    patientIds: formData.getAll('patientIds'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos. Verifique os campos em vermelho.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const groupRef = await db.collection('therapyGroups').add({
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(),
    });
    
     await createLog({
        actorId: 'system',
        actorName: 'Sistema',
        action: 'CREATE_THERAPY_GROUP',
        details: `Criou o grupo de terapia "${validatedFields.data.name}".`,
        entity: { type: 'therapyGroup', id: groupRef.id },
        unitId: validatedFields.data.unitId,
    });
    
    revalidatePath('/groups');
    revalidatePath('/patients');
  } catch (error: any) {
    console.error('Error creating therapy group:', error);
    return { success: false, message: 'Ocorreu um erro desconhecido ao criar o grupo.', errors: null };
  }

  return { success: true, message: 'Grupo de terapia criado com sucesso!', errors: null };
}
