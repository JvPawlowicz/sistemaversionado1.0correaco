'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Appointment, Availability } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { checkAdminInit, createLog } from './helpers';

export async function createTimeBlockAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
  const CreateTimeBlockSchema = z.object({
    title: z.string().min(3, { message: 'O motivo do bloqueio deve ter pelo menos 3 caracteres.' }),
    unitId: z.string().min(1, { message: 'ID da unidade é obrigatório.' }),
    date: z.string().min(1, { message: 'Selecione uma data.' }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido.' }),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido.' }),
    userIds: z.array(z.string()).optional(),
  }).refine(data => data.endTime > data.startTime, {
    message: "O horário final deve ser após o horário inicial.",
    path: ["endTime"],
  });

  const validatedFields = CreateTimeBlockSchema.safeParse({
    title: formData.get('title'),
    unitId: formData.get('unitId'),
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    userIds: formData.getAll('userIds'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const dataToSave: any = {
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (dataToSave.userIds && dataToSave.userIds.length === 0) {
      delete dataToSave.userIds;
    }

    const blockRef = await db.collection('timeBlocks').add(dataToSave);
    
     await createLog({
        actorId: 'system',
        actorName: 'Sistema',
        action: 'CREATE_TIME_BLOCK',
        details: `Criou um bloqueio de agenda: "${validatedFields.data.title}" em ${validatedFields.data.date}.`,
        entity: { type: 'timeBlock', id: blockRef.id },
        unitId: validatedFields.data.unitId,
    });
    
    revalidatePath('/planning');
    revalidatePath('/schedule');
    return { success: true, message: 'Bloqueio de horário criado com sucesso!', errors: null };
  } catch (error: any) {
    console.error('Error creating time block:', error);
    return { success: false, message: "Ocorreu um erro ao salvar o bloqueio.", errors: null };
  }
}

const AvailabilitySchema = z.object({
  type: z.enum(['Free', 'Planning', 'Supervision']),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
}).refine(data => data.endTime > data.startTime, {
  message: "O horário final deve ser após o horário inicial.",
  path: ["endTime"],
});

export async function updateUserAvailabilityAction(userId: string, availability: z.infer<typeof AvailabilitySchema>[]): Promise<{ success: boolean, message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  try {
    await db.collection('users').doc(userId).update({ availability });
    revalidatePath('/planning');
    revalidatePath('/schedule');
    return { success: true, message: 'Disponibilidade atualizada com sucesso!' };
  } catch (error) {
    console.error("Error updating availability:", error);
    return { success: false, message: 'Ocorreu um erro ao salvar a disponibilidade.' };
  }
}

const CompleteAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'ID do agendamento é obrigatório.'),
  patientId: z.string().min(1, 'ID do paciente é obrigatório.'),
  author: z.string().min(1, 'Autor é obrigatório.'),
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  details: z.string().min(1, { message: 'Os detalhes são obrigatórios.' }),
});

export async function completeAppointmentWithEvolutionAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = CompleteAppointmentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { appointmentId, patientId, author, title, details } = validatedFields.data;
  const batch = db.batch();

  try {
    const appointmentRef = db.collection('appointments').doc(appointmentId);
    const patientRef = db.collection('patients').doc(patientId);
    const evolutionRecordRef = db.collection('patients').doc(patientId).collection('evolutionRecords').doc();
    
    const appointmentDoc = await appointmentRef.get();
    if (!appointmentDoc.exists) {
        return { success: false, message: 'Agendamento não encontrado.', errors: null };
    }
    const appointmentData = appointmentDoc.data() as Appointment;

    batch.update(appointmentRef, { status: 'Realizado' });

    if (appointmentData?.date) {
        batch.update(patientRef, { lastVisit: appointmentData.date });
    }

    batch.set(evolutionRecordRef, {
      title,
      details,
      author,
      patientId,
      patientName: appointmentData.patientName,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    
    await createLog({
        actorId: 'system',
        actorName: author,
        action: 'COMPLETE_APPOINTMENT',
        details: `Marcou o agendamento com o paciente ${appointmentData.patientName} como "Realizado" e registrou a evolução.`,
        entity: { type: 'appointment', id: appointmentId },
        unitId: appointmentData.unitId,
    });


    revalidatePath('/schedule');
    revalidatePath('/evolutions');
    revalidatePath(`/patients/${patientId}`);
    
    return { success: true, message: 'Atendimento concluído e evolução registrada!', errors: null };
  } catch (error) {
    console.error('Error completing appointment with evolution:', error);
    return { success: false, message: 'Ocorreu um erro ao concluir o atendimento.', errors: null };
  }
}

const UpdateAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'ID do agendamento é obrigatório.'),
  serviceId: z.string().min(1, 'Selecione um serviço.'),
  professionalName: z.string().min(1, 'Selecione um profissional.'),
  date: z.string().min(1, { message: 'Selecione uma data.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido.' }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido.' }),
  room: z.string().min(1, { message: 'Selecione uma sala.' }),
}).refine(data => data.endTime > data.time, {
  message: "O horário final deve ser após o horário inicial.",
  path: ["endTime"],
});

export async function updateAppointmentAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = UpdateAppointmentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { appointmentId, ...updateData } = validatedFields.data;

  try {
    const appointmentRef = db.collection('appointments').doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    if (!appointmentDoc.exists) {
      return { success: false, message: 'Agendamento não encontrado.', errors: null };
    }
    const appointment = appointmentDoc.data() as Appointment;
    
    let serviceName = '';
    const serviceDoc = await db.collection('units').doc(appointment.unitId).collection('services').doc(updateData.serviceId).get();
    if (serviceDoc.exists) {
        serviceName = serviceDoc.data()?.name || '';
    }

    await appointmentRef.update({
      ...updateData,
      serviceName,
    });
    
    revalidatePath('/schedule');
    return { success: true, message: 'Agendamento atualizado com sucesso!', errors: null };

  } catch(error) {
    console.error('Error updating appointment:', error);
    return { success: false, message: 'Ocorreu um erro ao atualizar o agendamento.', errors: null };
  }
}
