'use server';

import { z } from 'zod';
import { auth, db, storageAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// --- Helper for checking Firebase Admin initialization ---
function checkAdminInit() {
  if (!auth || !db || !storageAdmin) {
    const errorMessage = 'A configuração do Firebase Admin não foi carregada. Verifique as variáveis de ambiente do servidor.';
    console.error(errorMessage);
    return { success: false, message: errorMessage, errors: null };
  }
  return null;
}

// --- Create User Action ---

const CreateUserSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['Admin', 'Therapist', 'Receptionist', 'Coordinator']),
  unitIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma unidade.' }),
});

export async function createUserAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = CreateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
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

  const { name, role, unitIds, email, password } = validatedFields.data;

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
      message = 'Este e-mail já está em uso por outra conta.';
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

// --- Upload Document Action ---
const fileSchema = z.custom<File>(val => val instanceof File, "Por favor, envie um arquivo.");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const UploadDocumentSchema = z.object({
  documentFile: fileSchema
    .refine((file) => file.size <= MAX_FILE_SIZE, `O tamanho máximo do arquivo é 10MB.`)
    .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), "Formato de arquivo não suportado."),
});

export async function uploadDocumentAction(patientId: string, formData: FormData): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
  
  const validatedFields = UploadDocumentSchema.safeParse({
    documentFile: formData.get('documentFile'),
  });

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors.documentFile?.[0];
    return { success: false, message: error || 'Dados do arquivo inválidos.' };
  }

  const { documentFile } = validatedFields.data;

  try {
    const bucket = storageAdmin.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `documents/${patientId}/${Date.now()}-${documentFile.name}`;
    const fileUpload = bucket.file(filePath);

    const buffer = Buffer.from(await documentFile.arrayBuffer());

    await fileUpload.save(buffer, {
      metadata: { contentType: documentFile.type },
    });
    
    await fileUpload.makePublic();

    const fileUrl = fileUpload.publicUrl();
    
    await db.collection('patients').doc(patientId).collection('documents').add({
      fileName: documentFile.name,
      url: fileUrl,
      fileType: documentFile.type,
      size: documentFile.size,
      uploadedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Documento enviado com sucesso!' };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { success: false, message: 'Ocorreu um erro durante o upload do documento.' };
  }
}

// --- Delete Patient Action ---
async function deleteCollection(collectionPath: string, batchSize: number) {
  if (!db) return;
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise<void>((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });

  async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: () => void) {
     if (!db) return;
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
      deleteQueryBatch(query, resolve);
    });
  }
}

export async function deletePatientAction(patientId: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  if (!patientId) {
    return { success: false, message: 'ID do paciente é obrigatório.' };
  }

  try {
    const patientRef = db.collection('patients').doc(patientId);

    // Delete subcollections
    await deleteCollection(`patients/${patientId}/evolutionRecords`, 50);
    await deleteCollection(`patients/${patientId}/documents`, 50);

    // TODO: Delete files in Storage

    // Delete the patient document
    await patientRef.delete();

    return { success: true, message: 'Paciente e todos os seus dados foram excluídos com sucesso.' };
  } catch (error: any) {
    console.error("Error deleting patient:", error);
    return { success: false, message: 'Falha ao excluir o paciente.' };
  }
}
