
'use server';

import { z } from 'zod';
import { db, storageAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { checkAdminInit, createLog } from './helpers';
import type { Patient, TherapyGroup, TreatmentPlan } from '@/lib/types';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';

// --- Create Patient Action ---
const CreatePatientSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional(),
});

export async function createPatientAction(prevState: any, formData: FormData) {
    const adminCheck = checkAdminInit();
    if (adminCheck) return adminCheck;

    const validatedFields = CreatePatientSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        dob: formData.get('dob'),
        gender: formData.get('gender') === "" ? undefined : formData.get('gender'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Dados inválidos.', errors: validatedFields.error.flatten().fieldErrors };
    }

    const unitId = formData.get('unitId') as string;
    if (!unitId) {
        return { success: false, message: 'ID da unidade é obrigatório.', errors: null };
    }

    try {
        await db.collection('patients').add({
            ...validatedFields.data,
            unitIds: [unitId],
            status: 'Active',
            lastVisit: null,
            avatarUrl: DEFAULT_AVATAR_URL,
            createdAt: FieldValue.serverTimestamp(),
            imageUseConsent: false,
        });
        revalidatePath('/patients');
        return { success: true, message: 'Paciente criado com sucesso!', errors: null };
    } catch (error) {
        console.error('Error creating patient:', error);
        return { success: false, message: 'Ocorreu um erro ao criar o paciente.', errors: null };
    }
}


// --- Create Evolution Record Action ---

const CreateEvolutionRecordSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório.'),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  details: z.string().min(1, 'Os detalhes são obrigatórios.'),
  author: z.string().min(1, 'Autor é obrigatório.'),
  linkedObjectiveIds: z.array(z.string()).optional(),
  objectiveProgress: z.string().optional(),
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
    objectiveProgress: formData.get('objectiveProgress'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { patientId, title, details, author, linkedObjectiveIds, objectiveProgress } = validatedFields.data;

  let parsedObjectiveProgress = {};
  if (objectiveProgress) {
      try {
          parsedObjectiveProgress = JSON.parse(objectiveProgress);
          // TODO: Add Zod validation for the parsed object
      } catch (e) {
          return { success: false, message: 'Formato de progresso dos objetivos inválido.', errors: null };
      }
  }

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
        objectiveProgress: parsedObjectiveProgress,
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
        
        const unitIdsToSearch = [...(validatedFields.data.unitIds || []), 'central'];
        
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
    if (!storageAdmin) throw new Error("Firebase Storage Admin not initialized.");
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
  let query = collectionRef.orderBy('__name__').limit(batchSize);

  while (true) {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
      return; // All documents deleted
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
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

// --- Update Patient Avatar Action ---
const UpdatePatientAvatarSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório.'),
  avatar: z.custom<File>(val => val instanceof File, "Por favor, envie um arquivo.")
    .refine((file) => file.size > 0, 'O arquivo não pode estar vazio.')
    .refine((file) => file.size <= 2 * 1024 * 1024, `O tamanho máximo é 2MB.`)
    .refine((file) => file.type?.startsWith("image/"), ".Somente imagens são permitidas"),
});

export async function updatePatientAvatarAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = UpdatePatientAvatarSchema.safeParse({
    patientId: formData.get('patientId'),
    avatar: formData.get('avatar'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.avatar?.[0] || 'Arquivo inválido.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { patientId, avatar } = validatedFields.data;
  
  try {
    if (!storageAdmin) throw new Error("Firebase Storage Admin not initialized.");
    const bucket = storageAdmin.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `avatars/patients/${patientId}`;
    const fileUpload = bucket.file(filePath);

    const buffer = Buffer.from(await avatar.arrayBuffer());

    await fileUpload.save(buffer, {
      metadata: { contentType: avatar.type },
    });
    
    await fileUpload.makePublic();
    const downloadURL = fileUpload.publicUrl();
    
    await db.collection('patients').doc(patientId).update({
        avatarUrl: downloadURL,
    });
    
    revalidatePath(`/patients/${patientId}`);
    
    return { success: true, message: 'Foto do paciente atualizada com sucesso!', errors: null };

  } catch (error) {
    console.error('Error uploading patient avatar via server action:', error);
    return { success: false, message: 'Ocorreu um erro ao fazer upload da foto.', errors: null };
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

// --- Search Patients Globally Action ---
export async function searchPatientsGloballyAction(term: string): Promise<Patient[]> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return [];
  if (!term || term.trim().length < 3) return [];

  try {
    const patientsCollection = db.collection('patients');
    
    // Simple case-insensitive prefix search. For production, a dedicated search service like Algolia would be better.
    const searchTerm = term.toLowerCase();
    const snapshot = await patientsCollection.get();
    
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Patient))
      .filter(patient => patient.name.toLowerCase().includes(searchTerm) || (patient.cpf && patient.cpf.includes(searchTerm)));

    return results;
  } catch (error) {
    console.error('Error searching patients globally:', error);
    return [];
  }
}

// --- Link Patient to Unit Action ---
export async function linkPatientToUnitAction(patientId: string, unitId: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;
  
  if (!patientId || !unitId) {
    return { success: false, message: "ID do paciente e da unidade são obrigatórios." };
  }
  
  try {
    const patientRef = db.collection('patients').doc(patientId);
    await patientRef.update({
      unitIds: FieldValue.arrayUnion(unitId)
    });
    revalidatePath('/patients');
    return { success: true, message: "Paciente vinculado à nova unidade com sucesso!" };
  } catch (error) {
    console.error('Error linking patient to unit:', error);
    return { success: false, message: 'Ocorreu um erro ao vincular o paciente.' };
  }
}


// --- Merge Patients Action ---
const MergePatientsSchema = z.object({
  primaryPatientId: z.string().min(1, 'ID do paciente principal é obrigatório.'),
  secondaryPatientId: z.string().min(1, 'ID do paciente duplicado é obrigatório.'),
}).refine(data => data.primaryPatientId !== data.secondaryPatientId, {
  message: 'Os pacientes para mesclagem não podem ser os mesmos.',
});

export async function mergePatientsAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = MergePatientsSchema.safeParse({
    primaryPatientId: formData.get('primaryPatientId'),
    secondaryPatientId: formData.get('secondaryPatientId'),
  });

  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.errors[0].message, errors: null };
  }

  const { primaryPatientId, secondaryPatientId } = validatedFields.data;

  try {
    const batch = db.batch();

    // 1. Get patient docs
    const primaryPatientRef = db.collection('patients').doc(primaryPatientId);
    const secondaryPatientRef = db.collection('patients').doc(secondaryPatientId);
    const primaryDoc = await primaryPatientRef.get();
    const secondaryDoc = await secondaryPatientRef.get();

    if (!primaryDoc.exists || !secondaryDoc.exists) {
      return { success: false, message: 'Um ou ambos os pacientes não foram encontrados.', errors: null };
    }
    const primaryData = primaryDoc.data() as Patient;
    const secondaryData = secondaryDoc.data() as Patient;
    const primaryPatientName = primaryData.name;

    // 2. Merge data fields
    const mergedData: Partial<Patient> = {};
    const fieldsToMerge: (keyof Patient)[] = [
        'email', 'phone', 'dob', 'gender', 'cpf', 'rg', 'maritalStatus', 'profession', 
        'cns', 'healthPlanId', 'healthPlanName', 'motherName', 'fatherName', 'additionalInfo', 
        'diagnosis', 'referringProfessional', 'address'
    ];

    for (const field of fieldsToMerge) {
        if (!primaryData[field] && secondaryData[field]) {
            mergedData[field] = secondaryData[field];
        }
    }

    if (secondaryData.imageUseConsent && !primaryData.imageUseConsent) {
        mergedData.imageUseConsent = true;
    }
    if (!primaryData.treatmentPlan && secondaryData.treatmentPlan) {
        mergedData.treatmentPlan = secondaryData.treatmentPlan;
    }
    if ((!primaryData.avatarUrl || primaryData.avatarUrl === DEFAULT_AVATAR_URL) && (secondaryData.avatarUrl && secondaryData.avatarUrl !== DEFAULT_AVATAR_URL)) {
        mergedData.avatarUrl = secondaryData.avatarUrl;
    }
    const mergedUnitIds = [...new Set([...primaryData.unitIds, ...secondaryData.unitIds])];
    mergedData.unitIds = mergedUnitIds;

    if (Object.keys(mergedData).length > 0) {
        batch.update(primaryPatientRef, mergedData);
    }
    
    // 3. Re-associate top-level collections
    const collectionsToUpdate = ['appointments', 'assessments'];
    for (const collectionName of collectionsToUpdate) {
      const snapshot = await db.collection(collectionName).where('patientId', '==', secondaryPatientId).get();
      snapshot.forEach(doc => {
        batch.update(doc.ref, { patientId: primaryPatientId, patientName: primaryPatientName });
      });
    }

    // 4. Re-associate sub-collections by moving documents
    const subcollectionsToMove = ['evolutionRecords', 'documents', 'familyMembers'];
    for (const subcollectionName of subcollectionsToMove) {
        const subSnapshot = await secondaryPatientRef.collection(subcollectionName).get();
        subSnapshot.forEach(doc => {
            const newDocRef = primaryPatientRef.collection(subcollectionName).doc(doc.id);
            batch.set(newDocRef, doc.data());
            batch.delete(doc.ref);
        });
    }

    // 5. Update therapy groups
    const groupSnapshot = await db.collection('therapyGroups').where('patientIds', 'array-contains', secondaryPatientId).get();
    groupSnapshot.forEach(doc => {
        const groupData = doc.data() as TherapyGroup;
        const newPatientIds = [...new Set([...groupData.patientIds.filter(id => id !== secondaryPatientId), primaryPatientId])];
        batch.update(doc.ref, { patientIds: newPatientIds });
    });

    // 6. Delete secondary patient
    batch.delete(secondaryPatientRef);

    // 7. Commit batch
    await batch.commit();

    await createLog({
        actorId: 'system', // TODO: get current user id
        actorName: 'Admin',
        action: 'MERGE_PATIENTS',
        details: `Mesclou o paciente duplicado ${secondaryData.name} (ID: ${secondaryPatientId}) com o paciente principal ${primaryData.name} (ID: ${primaryPatientId}).`,
        unitId: null, // This action is global
    });

    revalidatePath('/patients');
    return { success: true, message: 'Pacientes mesclados com sucesso!', errors: null };

  } catch (error) {
    console.error("Error merging patients:", error);
    return { success: false, message: 'Ocorreu um erro inesperado durante a mesclagem.', errors: null };
  }
}
