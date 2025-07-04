'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { checkAdminInit } from './helpers';

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
