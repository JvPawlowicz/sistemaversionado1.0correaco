'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { checkAdminInit } from './helpers';
import { FieldValue } from 'firebase-admin/firestore';

const unitFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'E-mail inválido.' }).optional().or(z.literal('')),
  responsibleTech: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
});

export async function updateUnitAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
  const validatedFields = unitFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Dados inválidos.', errors: validatedFields.error.flatten().fieldErrors };
  }

  const { id, addressCity, addressState, addressStreet, addressZip, ...unitData } = validatedFields.data;

  if (!id) {
     return { success: false, message: 'ID da unidade é obrigatório para atualização.', errors: null };
  }

  const address = (addressStreet || addressCity || addressState || addressZip) 
    ? { street: addressStreet || '', city: addressCity || '', state: addressState || '', zip: addressZip || '' } 
    : null;
  
  try {
    await db.collection('units').doc(id).update({ ...unitData, address });
    revalidatePath(`/units/${id}`);
    revalidatePath(`/units`);
    return { success: true, message: "Unidade atualizada com sucesso!", errors: null };
  } catch (error) {
     console.error("Error updating unit:", error);
    return { success: false, message: "Falha ao atualizar a unidade.", errors: null };
  }
}

const HealthPlanSchema = z.object({
  name: z.string().min(2, { message: 'O nome do plano é obrigatório.' }),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, { message: 'Cor inválida.' }),
  unitId: z.string().min(1, { message: 'Selecione uma unidade.' }),
});

export async function createHealthPlanAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = HealthPlanSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { unitId, name, color } = validatedFields.data;
  try {
     if (unitId === 'central') {
        const centralUnitRef = db.collection('units').doc('central');
        const centralUnitDoc = await centralUnitRef.get();
        if (!centralUnitDoc.exists) {
            await centralUnitRef.set({
                name: 'Central (Todas as Unidades)',
                createdAt: FieldValue.serverTimestamp(),
            });
        }
    }
    const plansCollection = db.collection('units').doc(unitId).collection('healthPlans');
    await plansCollection.add({ name, color });
    revalidatePath('/health-plans');
    revalidatePath(`/units/${unitId}`);
    return { success: true, message: 'Plano de saúde adicionado com sucesso.', errors: null };
  } catch (error) {
    console.error("Error adding health plan:", error);
    return { success: false, message: "Ocorreu um erro ao adicionar o plano.", errors: null };
  }
}

const UpdateHealthPlanSchema = HealthPlanSchema.extend({
  planId: z.string().min(1, { message: 'ID do plano é obrigatório.' }),
});

export async function updateHealthPlanAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = UpdateHealthPlanSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { unitId, planId, name, color } = validatedFields.data;
  try {
    const planRef = db.collection('units').doc(unitId).collection('healthPlans').doc(planId);
    await planRef.update({ name, color });
    revalidatePath('/health-plans');
    revalidatePath(`/units/${unitId}`);
    return { success: true, message: 'Plano de saúde atualizado com sucesso.', errors: null };
  } catch (error) {
    console.error("Error updating health plan:", error);
    return { success: false, message: "Ocorreu um erro ao atualizar o plano.", errors: null };
  }
}

export async function deleteHealthPlanAction(planId: string, unitId: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };

  if (!planId || !unitId) {
    return { success: false, message: 'IDs do plano e da unidade são obrigatórios.' };
  }
  try {
    const planRef = db.collection('units').doc(unitId).collection('healthPlans').doc(planId);
    await planRef.delete();
    revalidatePath('/health-plans');
    revalidatePath(`/units/${unitId}`);
    return { success: true, message: 'Plano de saúde removido com sucesso.' };
  } catch (error) {
    console.error("Error deleting health plan:", error);
    return { success: false, message: 'Ocorreu um erro ao remover o plano de saúde.' };
  }
}
