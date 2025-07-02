'use server';
/**
 * @fileOverview An AI flow to assist with clinical note-taking.
 *
 * - summarizeNotes - A function that takes raw clinical notes and returns a structured summary.
 * - AiAssistedNoteInput - The input type for the summarizeNotes function.
 * - SoapNoteOutput - The structured SOAP note output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AiAssistedNoteInputSchema = z.object({
  rawNotes: z.string().describe('The raw, unstructured notes from a therapy session.'),
});
export type AiAssistedNoteInput = z.infer<typeof AiAssistedNoteInputSchema>;

export const SoapNoteOutputSchema = z.object({
  subjective: z.string().describe("A summary of the patient's subjective report, including their feelings, concerns, and direct quotes."),
  objective: z.string().describe('A summary of the objective, observable facts from the session. This includes clinical observations, test results, and measurable data.'),
  assessment: z.string().describe('The therapist\'s clinical assessment and interpretation of the subjective and objective information. Includes diagnosis and progress towards goals.'),
  plan: z.string().describe('The plan for future action, including next steps in therapy, homework for the patient, and any consultations needed.'),
});
export type SoapNoteOutput = z.infer<typeof SoapNoteOutputSchema>;

const noteSummaryPrompt = ai.definePrompt({
    name: 'soapNotePrompt',
    input: { schema: AiAssistedNoteInputSchema },
    output: { schema: SoapNoteOutputSchema },
    prompt: `You are a clinical assistant AI for a therapy practice. Your task is to analyze the following raw notes from a therapy session and summarize them into a structured SOAP note format (Subjective, Objective, Assessment, Plan).

    Extract the relevant information from the raw notes and place it into the appropriate SOAP category. Be concise but thorough.

    Raw Notes:
    {{{rawNotes}}}
    `,
});

const summarizeNotesFlow = ai.defineFlow(
  {
    name: 'summarizeNotesFlow',
    inputSchema: AiAssistedNoteInputSchema,
    outputSchema: SoapNoteOutputSchema,
  },
  async (input) => {
    const { output } = await noteSummaryPrompt(input);
    return output!;
  }
);

export async function summarizeNotes(input: AiAssistedNoteInput): Promise<SoapNoteOutput> {
  return summarizeNotesFlow(input);
}
