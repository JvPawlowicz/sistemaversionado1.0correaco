
'use server';

import { z } from 'zod';
import { auth, db, storageAdmin } from '@/lib/firebase-admin';
import { FieldValue, WriteResult } from 'firebase-admin/firestore';
import type { Unit, Service, Availability } from './types';
import { revalidatePath } from 'next/cache';

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
      availability: [],
    });
    revalidatePath('/users');
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
    revalidatePath('/users');
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
        revalidatePath('/users');
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
    revalidatePath('/users');
    return { success: true, message: 'Usuário excluído com sucesso.' };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: 'Falha ao excluir o usuário.' };
  }
}

// --- Unit and Service Actions ---
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
    revalidatePath('/notifications');
    return { success: true, message: 'Notificação criada com sucesso!', errors: null };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, message: "Ocorreu um erro ao salvar a notificação.", errors: null };
  }
}

// --- Mark Notification as Seen ---
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
    revalidatePath(`/patients/${patientId}`);
    return { success: true, message: 'Registro de evolução salvo com sucesso!', errors: null };
  } catch (error) {
    console.error('Error creating evolution record:', error);
    return { success: false, message: 'Ocorreu um erro ao salvar o registro.', errors: null };
  }
}

// --- Update Patient Details Action ---
const UpdatePatientSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório.'),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'E-mail inválido.' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional(),
  diagnosis: z.string().optional(),
  referringProfessional: z.string().optional(),
  imageUseConsent: z.preprocess((val) => val === 'on' || val === true, z.boolean()),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  unitIds: z.array(z.string()).optional(),
});

export async function updatePatientDetailsAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = UpdatePatientSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    unitIds: formData.getAll('unitIds'),
    imageUseConsent: formData.get('imageUseConsent')
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { patientId, addressCity, addressState, addressStreet, addressZip, ...patientData } = validatedFields.data;
  
  const address = (addressStreet || addressCity || addressState || addressZip) 
    ? { street: addressStreet || '', city: addressCity || '', state: addressState || '', zip: addressZip || '' } 
    : null;

  try {
    await db.collection('patients').doc(patientId).update({ ...patientData, address });
    revalidatePath(`/patients/${patientId}`);
    revalidatePath('/patients');
    return { success: true, message: 'Dados do paciente atualizados com sucesso!', errors: null };
  } catch (error) {
    console.error('Error updating patient details:', error);
    return { success: false, message: 'Ocorreu um erro ao atualizar os dados do paciente.', errors: null };
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
    revalidatePath(`/patients/${patientId}`);
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
    .refine((file) => file.type ? ACCEPTED_FILE_TYPES.includes(file.type) : false, "Formato de arquivo não suportado."),
  category: z.enum(['Exame', 'Documento Legal', 'Foto Terapêutica', 'Outro']),
  description: z.string().optional(),
});

export async function uploadDocumentAction(patientId: string, formData: FormData): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
  
  const validatedFields = UploadDocumentSchema.safeParse({
    documentFile: formData.get('documentFile'),
    category: formData.get('category'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors.documentFile?.[0];
    return { success: false, message: error || 'Dados do arquivo inválidos.' };
  }

  const { documentFile, category, description } = validatedFields.data;

  try {
    const bucket = storageAdmin.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `documents/${patientId}/${Date.now()}-${documentFile.name}`;
    const fileUpload = bucket.file(filePath);

    const buffer = Buffer.from(await documentFile.arrayBuffer());

    await fileUpload.save(buffer, {
      metadata: { contentType: documentFile.type },
    });
    
    const fileUrl = fileUpload.publicUrl();
    
    await db.collection('patients').doc(patientId).collection('documents').add({
      fileName: documentFile.name,
      url: fileUrl,
      fileType: documentFile.type,
      size: documentFile.size,
      category,
      description: description || '',
      uploadedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath(`/patients/${patientId}`);
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
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
  if (!patientId) {
    return { success: false, message: 'ID do paciente é obrigatório.' };
  }

  try {
    const patientRef = db.collection('patients').doc(patientId);

    await deleteCollection(`patients/${patientId}/evolutionRecords`, 50);
    await deleteCollection(`patients/${patientId}/documents`, 50);
    await deleteCollection(`patients/${patientId}/familyMembers`, 50);

    // TODO: Delete files in Storage

    await patientRef.delete();
    revalidatePath('/patients');
    return { success: true, message: 'Paciente e todos os seus dados foram excluídos com sucesso.' };
  } catch (error: any) {
    console.error("Error deleting patient:", error);
    return { success: false, message: 'Falha ao excluir o paciente.' };
  }
}

// --- Family Member Actions ---
const FamilyMemberSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório.'),
  relationship: z.string().min(2, 'Parentesco é obrigatório.'),
  phone: z.string().optional(),
  observations: z.string().optional(),
});

export async function addFamilyMemberAction(patientId: string, prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = FamilyMemberSchema.safeParse({
    name: formData.get('name'),
    relationship: formData.get('relationship'),
    phone: formData.get('phone'),
    observations: formData.get('observations'),
  });

  if (!validatedFields.success) {
    return { success: false, message: "Dados inválidos.", errors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    await db.collection('patients').doc(patientId).collection('familyMembers').add({
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(),
    });
    revalidatePath(`/patients/${patientId}`);
    return { success: true, message: "Familiar adicionado com sucesso!", errors: null };
  } catch (error) {
    console.error("Error adding family member:", error);
    return { success: false, message: "Falha ao adicionar familiar.", errors: null };
  }
}

export async function deleteFamilyMemberAction(patientId: string, memberId: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
  
  if (!patientId || !memberId) {
    return { success: false, message: 'IDs são obrigatórios.' };
  }

  try {
    await db.collection('patients').doc(patientId).collection('familyMembers').doc(memberId).delete();
    revalidatePath(`/patients/${patientId}`);
    return { success: true, message: 'Familiar removido com sucesso.' };
  } catch (error) {
    console.error("Error deleting family member:", error);
    return { success: false, message: 'Falha ao remover familiar.' };
  }
}

// --- Create Therapy Group Action ---

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
    await db.collection('therapyGroups').add({
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(),
    });
    revalidatePath('/groups');
    revalidatePath('/patients');
  } catch (error: any) {
    console.error('Error creating therapy group:', error);
    return { success: false, message: 'Ocorreu um erro desconhecido ao criar o grupo.', errors: null };
  }

  return { success: true, message: 'Grupo de terapia criado com sucesso!', errors: null };
}


// --- Create Time Block Action ---

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

export async function createTimeBlockAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
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

    await db.collection('timeBlocks').add(dataToSave);
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
