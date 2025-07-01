'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkAdminInit, createLog } from './helpers';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

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
          avatarUrl: DEFAULT_AVATAR_URL,
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
