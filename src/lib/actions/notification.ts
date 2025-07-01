'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { checkAdminInit } from './helpers';
import { format } from 'date-fns';

const NotificationSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres.'),
  targetType: z.enum(['ALL', 'ROLE', 'UNIT', 'SPECIFIC']),
  targetRole: z.string().optional(),
  targetUnitId: z.string().optional(),
  targetUserIds: z.array(z.string()).optional(),
});

export async function createNotificationAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
  const validatedFields = NotificationSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    targetType: formData.get('targetType'),
    targetRole: formData.get('targetRole'),
    targetUnitId: formData.get('targetUnitId'),
    targetUserIds: formData.getAll('targetUserIds'),
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Dados inválidos.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { title, content, targetType, targetRole, targetUnitId, targetUserIds } = validatedFields.data;

  const notificationData: any = {
    title,
    content,
    targetType,
    createdAt: FieldValue.serverTimestamp(),
    seenBy: [],
  };

  switch (targetType) {
    case 'ROLE':
      if (!targetRole) return { success: false, message: 'A função do público-alvo é obrigatória.' };
      notificationData.targetValue = targetRole;
      break;
    case 'UNIT':
      if (!targetUnitId) return { success: false, message: 'A unidade do público-alvo é obrigatória.' };
      notificationData.targetValue = targetUnitId;
      break;
    case 'SPECIFIC':
      if (!targetUserIds || targetUserIds.length === 0) return { success: false, message: 'Pelo menos um usuário deve ser selecionado.' };
      notificationData.targetValue = targetUserIds;
      break;
  }

  try {
    await db.collection('notifications').add(notificationData);
    revalidatePath('/notifications');
    return { success: true, message: 'Notificação criada com sucesso!', errors: null };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, message: "Ocorreu um erro ao salvar a notificação.", errors: null };
  }
}

export async function markNotificationAsSeenAction(notificationId: string, userId: string) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: false, message: adminCheck.message };

  if (!notificationId || !userId) {
    return { success: false, message: 'ID da Notificação e ID do Usuário são obrigatórios.' };
  }

  try {
    const notificationRef = db.collection('notifications').doc(notificationId);
    await notificationRef.update({
      seenBy: FieldValue.arrayUnion(userId),
    });
    revalidatePath('/(dashboard)', 'layout'); // Revalidate the layout to update the header
    return { success: true, message: 'Notificação marcada como lida.' };
  } catch (error) {
    console.error('Error marking notification as seen:', error);
    return { success: false, message: 'Falha ao marcar notificação como lida.' };
  }
}

const CreatePendingEvolutionRemindersSchema = z.array(z.object({
  id: z.string(),
  patientName: z.string(),
  professionalName: z.string(),
  date: z.string(),
}));

export async function createPendingEvolutionRemindersAction(appointments: z.infer<typeof CreatePendingEvolutionRemindersSchema>): Promise<{ success: boolean; message: string }> {
    const adminCheck = checkAdminInit();
    if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
    if (!db) return { success: false, message: 'Database not initialized.' };

    try {
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        const userNameToIdMap = new Map(users.map(u => [u.name, u.id]));

        const batch = db.batch();
        let notificationsCreated = 0;

        for (const app of appointments) {
            const professionalId = userNameToIdMap.get(app.professionalName);

            if (professionalId) {
                const notificationRef = db.collection('notifications').doc();
                const notificationData = {
                    title: 'Evolução Pendente',
                    content: `Você tem uma evolução pendente para o paciente ${app.patientName} do atendimento em ${format(new Date(app.date + 'T00:00:00'), 'dd/MM/yyyy')}.`,
                    targetType: 'SPECIFIC',
                    targetValue: [professionalId],
                    createdAt: FieldValue.serverTimestamp(),
                    seenBy: [],
                };
                batch.set(notificationRef, notificationData);
                notificationsCreated++;
            }
        }

        if (notificationsCreated > 0) {
            await batch.commit();
        }
        
        revalidatePath('/(dashboard)', 'layout'); 

        return { success: true, message: `${notificationsCreated} lembretes de evolução pendente foram enviados.` };

    } catch(error) {
        console.error("Error creating pending evolution reminders:", error);
        return { success: false, message: 'Ocorreu um erro ao enviar os lembretes.' };
    }
}
