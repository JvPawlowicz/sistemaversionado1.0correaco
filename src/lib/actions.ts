'use server';

import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// --- Helper for checking Firebase Admin initialization ---
function checkAdminInit() {
  if (!auth || !db) {
    const errorMessage = 'A configuração do Firebase Admin não foi carregada. Verifique as variáveis de ambiente do servidor.';
    console.error(errorMessage);
    return { success: false, message: errorMessage, errors: null };
  }
  return null;
}

// --- Create User Action ---

const CreateUserSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  role: z.enum(['Admin', 'Therapist', 'Receptionist', 'Coordinator']),
  unitIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma unidade.' }),
});

export async function createUserAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = CreateUserSchema.safeParse({
    name: formData.get('name'),
    role: formData.get('role'),
    unitIds: formData.getAll('unitIds'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos. Verifique os campos em vermelho.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, role, unitIds } = validatedFields.data;
  const email = `${name.toLowerCase().replace(/\s/g, '.').replace(/[^a-z0-9.]/g, '')}@clinic.local`;
  const password = 'password';

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
      unitIds,
      status: 'Active',
      avatarUrl: `https://i.pravatar.cc/150?u=${userRecord.uid}`,
      createdAt: FieldValue.serverTimestamp(),
    });

  } catch (error: any) {
    let message = 'Ocorreu um erro desconhecido.';
    if (error.code === 'auth/email-already-exists') {
      message = 'Este e-mail já está em uso por outra conta (gerado a partir de um nome duplicado). Tente um nome diferente.';
    }
    console.error('Error creating user:', error);
    return { success: false, message: message, errors: null };
  }

  return { success: true, message: 'Usuário criado com sucesso!', errors: null };
}

// --- Update User Action ---

const UpdateUserSchema = z.object({
  uid: z.string().min(1, { message: 'ID do usuário é obrigatório.' }),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  role: z.enum(['Admin', 'Therapist', 'Receptionist', 'Coordinator']),
  unitIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma unidade.' }),
});

export async function updateUserAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = UpdateUserSchema.safeParse({
    uid: formData.get('uid'),
    name: formData.get('name'),
    role: formData.get('role'),
    unitIds: formData.getAll('unitIds'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos. Verifique os campos em vermelho.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { uid, name, role, unitIds } = validatedFields.data;

  try {
    await auth.updateUser(uid, { displayName: name });
    await db.collection('users').doc(uid).update({
      name,
      role,
      unitIds,
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, message: 'Ocorreu um erro desconhecido ao atualizar o usuário.', errors: null };
  }

  return { success: true, message: 'Usuário atualizado com sucesso!', errors: null };
}


// --- Update User Password Action ---

export async function updateUserPasswordAction(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const adminCheck = checkAdminInit();
    if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };

    if (!uid || !newPassword) {
        return { success: false, message: 'UID do usuário e nova senha são obrigatórios.' };
    }

    if (newPassword.length < 6) {
        return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    try {
        await auth.updateUser(uid, {
            password: newPassword,
        });
        return { success: true, message: 'Senha atualizada com sucesso!' };
    } catch (error: any) {
        console.error("Error updating password:", error);
        return { success: false, message: 'Falha ao atualizar a senha. Verifique os logs do servidor para mais detalhes.' };
    }
}

// --- Delete User Action ---

export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
  
  if (!uid) {
    return { success: false, message: 'UID do usuário é obrigatório.' };
  }
  try {
    await auth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    return { success: true, message: 'Usuário excluído com sucesso.' };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: 'Falha ao excluir o usuário.' };
  }
}

// --- Delete Unit Action ---

export async function deleteUnitAction(unitId: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
  
  if (!unitId) {
    return { success: false, message: 'ID da unidade é obrigatório.' };
  }
  try {
    const unitRef = db.collection('units').doc(unitId);
    
    const usersRef = db.collection('users');
    const usersQuery = usersRef.where('unitIds', 'array-contains', unitId);
    const usersSnapshot = await usersQuery.get();

    const batch = db.batch();
    usersSnapshot.forEach(doc => {
      batch.update(doc.ref, { unitIds: FieldValue.arrayRemove(unitId) });
    });
    await batch.commit();

    await unitRef.delete();

    return { success: true, message: 'Unidade excluída com sucesso.' };
  } catch (error: any) {
    console.error("Error deleting unit:", error);
    return { success: false, message: 'Falha ao excluir a unidade.' };
  }
}


// --- Create Notification Action ---

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
    return { success: true, message: 'Notificação criada com sucesso!', errors: null };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, message: "Ocorreu um erro ao salvar a notificação.", errors: null };
  }
}

// --- Create Evolution Record Action ---

const CreateEvolutionRecordSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório.'),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  details: z.string().min(10, 'Os detalhes devem ter pelo menos 10 caracteres.'),
  author: z.string().min(1, 'Autor é obrigatório.'),
});

export async function createEvolutionRecordAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
  const validatedFields = CreateEvolutionRecordSchema.safeParse({
    patientId: formData.get('patientId'),
    title: formData.get('title'),
    details: formData.get('details'),
    author: formData.get('author'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { patientId, title, details, author } = validatedFields.data;

  try {
    await db
      .collection('patients')
      .doc(patientId)
      .collection('evolutionRecords')
      .add({
        title,
        details,
        author,
        createdAt: FieldValue.serverTimestamp(),
      });
    
    return { success: true, message: 'Registro de evolução salvo com sucesso!', errors: null };
  } catch (error) {
    console.error('Error creating evolution record:', error);
    return { success: false, message: 'Ocorreu um erro ao salvar o registro.', errors: null };
  }
}


// --- Update Patient Status Action ---
const UpdatePatientStatusSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório.'),
  status: z.enum(['Active', 'Inactive']),
});

export async function updatePatientStatusAction(patientId: string, status: 'Active' | 'Inactive'): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };

  const validatedFields = UpdatePatientStatusSchema.safeParse({ patientId, status });

  if (!validatedFields.success) {
    return { success: false, message: 'Dados inválidos.' };
  }

  try {
    await db.collection('patients').doc(patientId).update({ status });
    return { success: true, message: 'Status do paciente atualizado com sucesso!' };
  } catch (error) {
    console.error('Error updating patient status:', error);
    return { success: false, message: 'Ocorreu um erro ao atualizar o status do paciente.' };
  }
}
