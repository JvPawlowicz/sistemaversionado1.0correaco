'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';

export const NoteInputSchema = z.object({
  note: z.string().describe('The clinical note text to be processed.'),
  action: z.enum(['summarize', 'keywords', 'plan']).describe('The action to perform on the note.'),
});
export type NoteInput = z.infer<typeof NoteInputSchema>;

export const NoteOutputSchema = z.object({
  result: z.string().describe('The processed result based on the action.'),
});
export type NoteOutput = z.infer<typeof NoteOutputSchema>;


const prompts = {
    summarize: `Você é um assistente de clínica e sua tarefa é resumir anotações clínicas.
    Seja conciso e foque nos pontos principais, como queixas, observações e progresso.
    A anotação a ser resumida é:
    ---
    {{{note}}}
    ---
    Forneça o resumo como um parágrafo de texto simples.`,

    keywords: `Você é um assistente de clínica e sua tarefa é extrair palavras-chave de anotações clínicas.
    Identifique os termos mais relevantes, como diagnósticos, sintomas, tratamentos e partes do corpo mencionadas.
    A anotação é:
    ---
    {{{note}}}
    ---
    Liste as palavras-chave separadas por vírgula.`,

    plan: `Você é um terapeuta experiente e sua tarefa é criar um plano de ação com base em uma anotação clínica.
    Sugira os próximos passos, exercícios ou recomendações para o paciente.
    A anotação é:
    ---
    {{{note}}}
    ---
    Apresente o plano de ação em uma lista com marcadores (bullet points).`
}

const noteTakerPrompt = ai.definePrompt({
  name: 'noteTakerPrompt',
  input: { schema: NoteInputSchema },
  output: { schema: NoteOutputSchema },
  prompt: (input) => {
    return prompts[input.action];
  },
});

export const processNoteFlow = ai.defineFlow(
  {
    name: 'processNoteFlow',
    inputSchema: NoteInputSchema,
    outputSchema: NoteOutputSchema,
  },
  async (input) => {
    const llmResponse = await noteTakerPrompt(input);
    return llmResponse.output ?? { result: 'Não foi possível processar a anotação.' };
  }
);

export async function processNote(input: NoteInput): Promise<NoteOutput> {
  return processNoteFlow(input);
}
