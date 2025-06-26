'use server';
/**
 * @fileOverview An AI flow to assist with clinical note-taking.
 * - summarizeAndSaveNotes - A function that takes raw session notes, summarizes them into a structured format, and saves them as an evolution record in Firestore.
 * - AiAssistedNoteInput - The input type for the flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { saveEvolutionRecord } from '@/lib/services';
import type { EvolutionRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export const AiAssistedNoteInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient for whom the note is being written.'),
  sessionNotes: z.string().min(10, {message: 'Session notes must be at least 10 characters long.'}).describe('The raw, free-text notes from the clinical session.'),
  authorName: z.string().describe('The name of the therapist or professional writing the note.'),
});
export type AiAssistedNoteInput = z.infer<typeof AiAssistedNoteInputSchema>;

const EvolutionRecordOutputSchema = z.object({
    title: z.string().describe("A concise title for the session, e.g., 'Sessão de Fisioterapia' or 'Consulta de Acompanhamento'."),
    subjective: z.string().describe("The patient's subjective report of their condition, feelings, and goals as described in the notes."),
    objective: z.string().describe("The objective findings from the session, including measurements, test results, and professional observations from the notes."),
    assessment: z.string().describe("The professional's assessment of the patient's progress and current condition based on the subjective and objective information from the notes."),
    plan: z.string().describe("The plan for future sessions, including exercises, recommendations, and next steps, based on the notes."),
});

// Main function to be called from the UI
export async function summarizeAndSaveNotes(input: AiAssistedNoteInput): Promise<{success: boolean, message: string}> {
  try {
    const structuredNote = await summarizeNotesFlow(input);
    
    if (structuredNote) {
        const details = `**Subjetivo:**\n${structuredNote.subjective}\n\n**Objetivo:**\n${structuredNote.objective}\n\n**Avaliação:**\n${structuredNote.assessment}\n\n**Plano:**\n${structuredNote.plan}`;
        
        const recordToSave: Omit<EvolutionRecord, 'id' | 'createdAt'> = {
            date: new Date().toISOString(),
            title: structuredNote.title,
            details: details,
            author: input.authorName,
        };

        await saveEvolutionRecord(input.patientId, recordToSave);
        
        // Revalidate the patient's detail page to show the new record
        revalidatePath(`/patients/${input.patientId}`);

        return { success: true, message: 'Registro de evolução salvo com sucesso!' };
    }
    return { success: false, message: 'A IA não conseguiu gerar um resumo. Tente novamente.' };
  } catch (error) {
    console.error("Error in summarizeAndSaveNotes flow:", error);
    return { success: false, message: 'Ocorreu um erro ao salvar o registro.' };
  }
}

const summarizePrompt = ai.definePrompt({
  name: 'summarizeClinicalNotesPrompt',
  input: { schema: AiAssistedNoteInputSchema },
  output: { schema: EvolutionRecordOutputSchema },
  prompt: `Você é um assistente clínico especialista em fisioterapia e terapia ocupacional. Sua tarefa é transformar anotações brutas de uma sessão em um registro de evolução estruturado no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano).
  
  Analise as anotações a seguir e extraia as informações para cada campo do formato de saída. Seja conciso, profissional e use terminologia clínica apropriada.

  Anotações da Sessão:
  {{{sessionNotes}}}
  `,
});

const summarizeNotesFlow = ai.defineFlow(
  {
    name: 'summarizeNotesFlow',
    inputSchema: AiAssistedNoteInputSchema,
    outputSchema: EvolutionRecordOutputSchema,
  },
  async (input) => {
    const { output } = await summarizePrompt(input);
    if (!output) {
      throw new Error('Failed to get a structured response from the model.');
    }
    return output;
  }
);
