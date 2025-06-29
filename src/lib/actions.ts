
'use server';

import { z } from 'zod';
import { auth, db, storageAdmin } from '@/lib/firebase-admin';
import { FieldValue, WriteResult } from 'firebase-admin/firestore';
import type { Appointment, Unit, Service, Availability, Log, TreatmentPlan } from './types';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

// --- Helper for creating logs ---
async function createLog(data: {
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
      avatarUrl: 'https://placehold.co/400x400.png',
      createdAt: FieldValue.serverTimestamp(),
      availability: [],
      professionalCouncil: null,
      councilNumber: null,
      specialties: [],
    });
    
    // Log this action. Assuming we need an actor, which we don't have here.
    // For now, we might skip logging for initial creation or decide on a system actor.
    
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

// --- Update User Professional Details Action ---

const ProfessionalDetailsSchema = z.object({
  userId: z.string().min(1),
  professionalCouncil: z.string().min(2, { message: 'O conselho profissional é obrigatório.' }),
  councilNumber: z.string().min(1, { message: 'O número do conselho é obrigatório.' }),
  specialties: z.string().optional(),
});

export async function updateUserProfessionalDetailsAction(prevState: any, formData: FormData) {
    const adminCheck = checkAdminInit();
    if (adminCheck) return adminCheck;

    const validatedFields = ProfessionalDetailsSchema.safeParse({
        userId: formData.get('userId'),
        professionalCouncil: formData.get('professionalCouncil'),
        councilNumber: formData.get('councilNumber'),
        specialties: formData.get('specialties'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Dados inválidos. Verifique os campos em vermelho.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { userId, professionalCouncil, councilNumber, specialties } = validatedFields.data;
    const specialtiesArray = specialties ? specialties.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
        await db.collection('users').doc(userId).update({
            professionalCouncil,
            councilNumber,
            specialties: specialtiesArray,
        });
        revalidatePath('/profile');
        return { success: true, message: 'Dados profissionais atualizados com sucesso!', errors: null };
    } catch (error) {
        console.error('Error updating professional details:', error);
        return { success: false, message: 'Ocorreu um erro ao salvar os dados.', errors: null };
    }
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
  details: z.string().min(1, 'Os detalhes são obrigatórios.'),
  author: z.string().min(1, 'Autor é obrigatório.'),
  linkedObjectiveIds: z.array(z.string()).optional(),
});

export async function createEvolutionRecordAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
  const validatedFields = CreateEvolutionRecordSchema.safeParse({
    patientId: formData.get('patientId'),
    title: formData.get('title'),
    details: formData.get('details'),
    author: formData.get('author'),
    linkedObjectiveIds: formData.getAll('linkedObjectiveIds'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { patientId, title, details, author, linkedObjectiveIds } = validatedFields.data;

  try {
     const patientDoc = await db.collection('patients').doc(patientId).get();
    if (!patientDoc.exists) {
        return { success: false, message: 'Paciente não encontrado.', errors: null };
    }
    const patientData = patientDoc.data();
    const patientName = patientData?.name || '';

    await db
      .collection('patients')
      .doc(patientId)
      .collection('evolutionRecords')
      .add({
        title,
        details,
        author,
        linkedObjectiveIds: linkedObjectiveIds || [],
        patientId,
        patientName,
        createdAt: FieldValue.serverTimestamp(),
      });
    
    await createLog({
        actorId: 'system', // TODO: Get current user ID
        actorName: author,
        action: 'CREATE_EVOLUTION_RECORD',
        details: `Criou o registro de evolução "${title}" para o paciente ${patientName}.`,
        entity: { type: 'patient', id: patientId },
        unitId: patientData?.unitIds?.[0],
    });

    revalidatePath(`/patients/${patientId}`);
    revalidatePath('/evolutions');
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
  cpf: z.string().optional(),
  rg: z.string().optional(),
  maritalStatus: z.string().optional(),
  profession: z.string().optional(),
  cns: z.string().optional(),
  healthPlanId: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  additionalInfo: z.string().optional(),
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

  const { patientId, addressCity, addressState, addressStreet, addressZip, healthPlanId, ...patientData } = validatedFields.data;
  
  const address = (addressStreet || addressCity || addressState || addressZip) 
    ? { street: addressStreet || '', city: addressCity || '', state: addressState || '', zip: addressZip || '' } 
    : null;
    
  const updatePayload: any = { ...patientData, address };

  try {
    const patientDoc = await db.collection('patients').doc(patientId).get();
    if (!patientDoc.exists) {
      return { success: false, message: 'Paciente não encontrado.', errors: null };
    }
    const currentPatientData = patientDoc.data();
    
    if (healthPlanId && healthPlanId !== 'none') {
        updatePayload.healthPlanId = healthPlanId;
        
        const unitIdsToSearch = [...(currentPatientData?.unitIds || []), 'central'];
        
        let foundPlan = false;
        for (const unitIdToSearch of unitIdsToSearch) {
            const planDoc = await db.collection('units').doc(unitIdToSearch).collection('healthPlans').doc(healthPlanId).get();
            if (planDoc.exists) {
                updatePayload.healthPlanName = planDoc.data()?.name || null;
                foundPlan = true;
                break;
            }
        }
        if (!foundPlan) {
            updatePayload.healthPlanName = null;
        }
    } else {
        updatePayload.healthPlanId = null;
        updatePayload.healthPlanName = null;
    }
    
    await db.collection('patients').doc(patientId).update(updatePayload);

    await createLog({
        actorId: 'system', // TODO: Get current user ID
        actorName: 'Sistema', // TODO: Get current user name
        action: 'UPDATE_PATIENT',
        details: `Atualizou os dados do paciente ${patientData.name}.`,
        entity: { type: 'patient', id: patientId },
        unitId: currentPatientData?.unitIds?.[0],
    });

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
    const patientDoc = await db.collection('patients').doc(patientId).get();
    if (!patientDoc.exists) return { success: false, message: 'Paciente não encontrado.'};
    
    await db.collection('patients').doc(patientId).update({ status });

     await createLog({
        actorId: 'system',
        actorName: 'Sistema',
        action: 'UPDATE_PATIENT_STATUS',
        details: `Alterou o status do paciente ${patientDoc.data()?.name} para ${status}.`,
        entity: { type: 'patient', id: patientId },
        unitId: patientDoc.data()?.unitIds?.[0],
    });

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
    const patientDoc = await patientRef.get();
    if (!patientDoc.exists) return { success: false, message: 'Paciente não encontrado.'};

    await deleteCollection(`patients/${patientId}/evolutionRecords`, 50);
    await deleteCollection(`patients/${patientId}/documents`, 50);
    await deleteCollection(`patients/${patientId}/familyMembers`, 50);

    // TODO: Delete files in Storage

    await patientRef.delete();
    
     await createLog({
        actorId: 'system',
        actorName: 'Sistema',
        action: 'DELETE_PATIENT',
        details: `Excluiu o paciente ${patientDoc.data()?.name} (ID: ${patientId}).`,
        unitId: patientDoc.data()?.unitIds?.[0],
    });

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

// --- Complete Appointment with Evolution Action ---

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
    
    // We need the appointment date to update the patient's lastVisit
    const appointmentDoc = await appointmentRef.get();
    if (!appointmentDoc.exists) {
        return { success: false, message: 'Agendamento não encontrado.', errors: null };
    }
    const appointmentData = appointmentDoc.data() as Appointment;

    // Update appointment status
    batch.update(appointmentRef, { status: 'Realizado' });

    // Update patient's last visit
    if (appointmentData?.date) {
        batch.update(patientRef, { lastVisit: appointmentData.date });
    }

    // Create evolution record
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

// --- Create Pending Evolution Reminders Action ---
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


// --- Evolution Template Actions ---

const TemplateFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['header', 'text', 'textarea', 'checkbox', 'radio']),
  label: z.string().min(1, { message: 'O rótulo do campo não pode estar vazio.' }),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

const EvolutionTemplateSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  content: z.string().min(1, 'O conteúdo do modelo é obrigatório.'),
  userId: z.string().min(1, { message: 'ID do usuário é obrigatório.' }),
});

export async function createEvolutionTemplateAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = EvolutionTemplateSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let parsedContent;
  try {
    parsedContent = JSON.parse(validatedFields.data.content);
    z.array(TemplateFieldSchema).min(1, { message: "O modelo deve ter pelo menos um campo." }).parse(parsedContent);
  } catch (e) {
    return { success: false, message: 'Formato de conteúdo do modelo inválido.', errors: null };
  }

  try {
    await db.collection('evolutionTemplates').add({
      title: validatedFields.data.title,
      content: parsedContent,
      userId: validatedFields.data.userId,
      createdAt: FieldValue.serverTimestamp(),
    });
    revalidatePath('/templates');
    return { success: true, message: 'Modelo criado com sucesso!', errors: null };
  } catch (error) {
    console.error('Error creating evolution template:', error);
    return { success: false, message: 'Ocorreu um erro ao salvar o modelo.', errors: null };
  }
}

const UpdateEvolutionTemplateSchema = EvolutionTemplateSchema.extend({
  templateId: z.string().min(1, { message: 'ID do modelo é obrigatório.' }),
});

export async function updateEvolutionTemplateAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
  const validatedFields = UpdateEvolutionTemplateSchema.safeParse({
    templateId: formData.get('templateId'),
    title: formData.get('title'),
    content: formData.get('content'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { templateId, title, content, userId } = validatedFields.data;

  let parsedContent;
  try {
    parsedContent = JSON.parse(content);
    z.array(TemplateFieldSchema).min(1, { message: "O modelo deve ter pelo menos um campo." }).parse(parsedContent);
  } catch (e) {
    return { success: false, message: 'Formato de conteúdo do modelo inválido.', errors: null };
  }

  try {
    // Optional: Add a check to ensure the user owns the template they are editing
    // const doc = await db.collection('evolutionTemplates').doc(templateId).get();
    // if (!doc.exists || doc.data()?.userId !== userId) {
    //   return { success: false, message: 'Você não tem permissão para editar este modelo.', errors: null };
    // }

    await db.collection('evolutionTemplates').doc(templateId).update({
      title,
      content: parsedContent,
    });
    revalidatePath('/templates');
    return { success: true, message: 'Modelo atualizado com sucesso!', errors: null };
  } catch (error) {
    console.error('Error updating evolution template:', error);
    return { success: false, message: 'Ocorreu um erro ao atualizar o modelo.', errors: null };
  }
}

export async function deleteEvolutionTemplateAction(templateId: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
  
  if (!templateId) {
    return { success: false, message: 'ID do modelo é obrigatório.' };
  }

  try {
    await db.collection('evolutionTemplates').doc(templateId).delete();
    revalidatePath('/templates');
    return { success: true, message: 'Modelo excluído com sucesso.' };
  } catch (error: any) {
    console.error("Error deleting evolution template:", error);
    return { success: false, message: 'Falha ao excluir o modelo.' };
  }
}


// --- Assessment Actions ---

const CreateAssessmentSchema = z.object({
  patientSelectionType: z.enum(['existing', 'new']),
  patientId: z.string().optional(),
  newPatientName: z.string().optional(),
  unitId: z.string().min(1, { message: 'A unidade é obrigatória.' }),
  templateId: z.string().min(1, 'Selecione um modelo.'),
  templateTitle: z.string().min(1),
  answers: z.string().min(2, 'As respostas não podem estar vazias.'), // JSON string
  authorId: z.string().min(1),
  authorName: z.string().min(1),
}).superRefine((data, ctx) => {
  if (data.patientSelectionType === 'existing' && !data.patientId) {
    ctx.addIssue({ code: 'custom', message: 'Selecione um paciente existente.', path: ['patientId'] });
  }
  if (data.patientSelectionType === 'new' && (!data.newPatientName || data.newPatientName.length < 3)) {
    ctx.addIssue({ code: 'custom', message: 'O nome do novo paciente deve ter pelo menos 3 caracteres.', path: ['newPatientName'] });
  }
});

export async function createAssessmentAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = CreateAssessmentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { patientSelectionType, patientId, newPatientName, unitId, templateId, templateTitle, answers, authorId, authorName } = validatedFields.data;
  
  let finalPatientId: string;
  let finalPatientName: string;
  let finalUnitId: string;

  try {
    if (patientSelectionType === 'new' && newPatientName) {
      const newPatientData = {
          name: newPatientName,
          unitIds: [unitId],
          status: 'Active' as const,
          lastVisit: null,
          avatarUrl: 'https://placehold.co/400x400.png',
          createdAt: FieldValue.serverTimestamp(),
          imageUseConsent: false,
      };
      const newPatientRef = await db.collection('patients').add(newPatientData);
      finalPatientId = newPatientRef.id;
      finalPatientName = newPatientData.name;
      finalUnitId = unitId;
      
       await createLog({
            actorId: authorId,
            actorName: authorName,
            action: 'CREATE_PATIENT_VIA_ASSESSMENT',
            details: `Criou o paciente ${finalPatientName} através de uma avaliação de triagem.`,
            entity: { type: 'patient', id: finalPatientId },
            unitId: finalUnitId,
        });

      revalidatePath('/patients');
    } else if (patientId) {
      const patientDoc = await db.collection('patients').doc(patientId).get();
      if (!patientDoc.exists) {
          return { success: false, message: 'Paciente selecionado não encontrado.', errors: null };
      }
      const patientData = patientDoc.data();
      finalPatientId = patientDoc.id;
      finalPatientName = patientData?.name || '';
      finalUnitId = patientData?.unitIds?.[0] || unitId;
    } else {
        return { success: false, message: 'Nenhum paciente selecionado ou criado.', errors: null };
    }
  
    let parsedAnswers;
    try {
      parsedAnswers = JSON.parse(answers);
    } catch (e) {
      return { success: false, message: 'Formato de respostas inválido.', errors: null };
    }

    const assessmentRef = await db.collection('assessments').add({
      patientId: finalPatientId,
      patientName: finalPatientName,
      unitId: finalUnitId,
      templateId,
      templateTitle,
      answers: parsedAnswers,
      authorId,
      authorName,
      createdAt: FieldValue.serverTimestamp(),
    });
    
     await createLog({
        actorId: authorId,
        actorName: authorName,
        action: 'CREATE_ASSESSMENT',
        details: `Criou a avaliação "${templateTitle}" para o paciente ${finalPatientName}.`,
        entity: { type: 'assessment', id: assessmentRef.id },
        unitId: finalUnitId,
    });
    
    revalidatePath('/assessments');
    revalidatePath(`/patients/${finalPatientId}`);
    return { success: true, message: 'Avaliação salva com sucesso!', errors: null };

  } catch (error) {
    console.error('Error creating assessment:', error);
    return { success: false, message: 'Ocorreu um erro ao salvar a avaliação.', errors: null };
  }
}

// --- Health Plan Actions ---

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

const defaultTemplates = [
    {
      title: "Anamnese Infantil",
      content: [
        { id: crypto.randomUUID(), type: "header", label: "Identificação do Paciente", },
        { id: crypto.randomUUID(), type: "text", label: "Nome da Escola", placeholder: "Nome da escola atual" },
        { id: crypto.randomUUID(), type: "text", label: "Professor(a) Responsável", placeholder: "Nome do(a) professor(a)" },
        { id: crypto.randomUUID(), type: "header", label: "Motivo da Avaliação", },
        { id: crypto.randomUUID(), type: "textarea", label: "Queixa Principal", placeholder: "Descreva a principal queixa ou motivo da busca por avaliação." },
        { id: crypto.randomUUID(), type: "textarea", label: "Histórico da Moléstia Atual (HMA)", placeholder: "Detalhe o início e a evolução da queixa principal." },
        { id: crypto.randomUUID(), type: "header", label: "Desenvolvimento Neuropsicomotor", },
        { id: crypto.randomUUID(), type: "checkbox", label: "Marcos do Desenvolvimento", options: ["Sustentou a cabeça", "Sentou sem apoio", "Engatinhou", "Andou", "Controle dos esfíncteres", "Primeiras palavras", "Primeiras frases"] },
        { id: crypto.randomUUID(), type: "textarea", label: "Observações sobre o Desenvolvimento", placeholder: "Houve alguma particularidade no desenvolvimento? Atrasos? Doenças?" },
        { id: crypto.randomUUID(), type: "header", label: "Rotina e Comportamento", },
        { id: crypto.randomUUID(), type: "textarea", label: "Sono", placeholder: "Como é a rotina de sono? Dorme bem? Tem pesadelos?" },
        { id: crypto.randomUUID(), type: "textarea", label: "Alimentação", placeholder: "Como é a alimentação? Aceita variedade de alimentos? Tem alguma restrição?" },
        { id: crypto.randomUUID(), type: "textarea", label: "Sociabilidade", placeholder: "Como interage com outras crianças e adultos?" },
        { id: crypto.randomUUID(), type: "header", label: "Histórico Familiar", },
        { id: crypto.randomUUID(), type: "textarea", label: "Composição Familiar e Relacionamento", placeholder: "Descreva quem mora com a criança e como é a dinâmica familiar." },
      ]
    },
    {
      title: "Evolução (Método SOAP)",
      content: [
        { id: crypto.randomUUID(), type: "textarea", label: "Subjetivo (S)", placeholder: "Relato do paciente, familiares ou cuidadores sobre o estado e progresso desde a última sessão." },
        { id: crypto.randomUUID(), type: "textarea", label: "Objetivo (O)", placeholder: "Observações mensuráveis, dados de testes, e observações clínicas realizadas pelo terapeuta durante a sessão." },
        { id: crypto.randomUUID(), type: "textarea", label: "Avaliação (A)", placeholder: "Análise e interpretação dos dados subjetivos e objetivos. Progresso em relação às metas." },
        { id: crypto.randomUUID(), type: "textarea", label: "Plano (P)", placeholder: "Plano para a próxima sessão, incluindo modificações na terapia, orientações para casa, etc." }
      ]
    },
    {
      title: "Relatório de Sessão Simples",
      content: [
        { id: crypto.randomUUID(), type: "textarea", label: "Objetivos Trabalhados na Sessão", placeholder: "Liste os objetivos do plano terapêutico que foram abordados." },
        { id: crypto.randomUUID(), type: "textarea", label: "Atividades Realizadas", placeholder: "Descreva as principais atividades e estratégias utilizadas." },
        { id: crypto.randomUUID(), type: "radio", label: "Comportamento e Engajamento", options: ["Excelente", "Bom", "Regular", "Ruim"] },
        { id: crypto.randomUUID(), type: "textarea", label: "Orientações para Casa/Escola", placeholder: "Sugestões de atividades ou estratégias para dar continuidade ao trabalho." }
      ]
    }
];

export async function seedDefaultTemplatesAction(userId: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };

  if (!userId) {
    return { success: false, message: "ID do usuário não fornecido." };
  }

  try {
    const templatesRef = db.collection('evolutionTemplates');
    const q = templatesRef.where('userId', '==', userId);
    
    const existingTemplatesSnapshot = await q.get();
    const existingTemplateTitles = new Set(existingTemplatesSnapshot.docs.map(doc => doc.data().title.toLowerCase()));

    const batch = db.batch();
    let templatesAddedCount = 0;

    for (const template of defaultTemplates) {
      if (!existingTemplateTitles.has(template.title.toLowerCase())) {
        const newTemplateRef = templatesRef.doc();
        batch.set(newTemplateRef, {
            ...template,
            userId: userId,
            createdAt: FieldValue.serverTimestamp(),
        });
        templatesAddedCount++;
      }
    }

    if (templatesAddedCount > 0) {
      await batch.commit();
      revalidatePath('/templates');
      return { success: true, message: `${templatesAddedCount} modelo(s) padrão foram adicionados com sucesso.` };
    } else {
      return { success: true, message: 'Todos os modelos padrão já estavam cadastrados.' };
    }
  } catch (error) {
    console.error("Error seeding default templates:", error);
    return { success: false, message: 'Ocorreu um erro ao cadastrar os modelos padrão.' };
  }
}

// --- Treatment Plan Action ---
const TreatmentObjectiveSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'A descrição do objetivo não pode ser vazia.'),
  status: z.enum(['Não Iniciado', 'Em Andamento', 'Atingido', 'Pausa']),
  masteryCriterion: z.string().min(1, 'O critério de mestria é obrigatório.'),
  dataCollectionType: z.enum(['Frequência', 'Duração', 'Latência', 'Tentativas', 'Outro']),
});

const TreatmentGoalSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'A descrição da meta não pode ser vazia.'),
  objectives: z.array(TreatmentObjectiveSchema),
});

const TreatmentPlanSchema = z.object({
  goals: z.array(TreatmentGoalSchema),
});

export async function updatePatientTreatmentPlanAction(patientId: string, plan: TreatmentPlan): Promise<{ success: boolean; message: string, errors?: any }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };

  const validatedPlan = TreatmentPlanSchema.safeParse(plan);

  if (!validatedPlan.success) {
    return {
      success: false,
      message: 'O Plano Terapêutico Individual contém dados inválidos.',
      errors: validatedPlan.error.flatten(),
    };
  }

  try {
    const patientRef = db.collection('patients').doc(patientId);
    await patientRef.update({
      treatmentPlan: validatedPlan.data,
    });
    revalidatePath(`/patients/${patientId}`);
    return { success: true, message: 'Plano Terapêutico Individual atualizado com sucesso!' };
  } catch (error) {
    console.error("Error updating treatment plan:", error);
    return { success: false, message: 'Ocorreu um erro ao salvar o Plano Terapêutico Individual.' };
  }
}
