// 'use server';

/**
 * @fileOverview This file defines a Genkit flow for AI-assisted note taking in a medical setting.
 *
 * The flow suggests common phrases or templates for patient records to help medical professionals
 * generate logs quickly and efficiently.
 *
 * @exports aiAssistedNoteTaking - The main function to trigger the AI-assisted note taking flow.
 * @exports AiAssistedNoteTakingInput - The input type for the aiAssistedNoteTaking function.
 * @exports AiAssistedNoteTakingOutput - The output type for the aiAssistedNoteTaking function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistedNoteTakingInputSchema = z.object({
  patientDescription: z
    .string()
    .describe('A detailed description of the patient and the context of the medical record.'),
  medicalSpecialty: z
    .string()
    .describe('The medical specialty of the professional generating the note.'),
  examplePhrases: z
    .string()
    .optional()
    .describe('Optional example phrases to guide the note generation.'),
});

export type AiAssistedNoteTakingInput = z.infer<typeof AiAssistedNoteTakingInputSchema>;

const AiAssistedNoteTakingOutputSchema = z.object({
  suggestedPhrases: z
    .array(z.string())
    .describe('An array of suggested phrases or templates for the patient record.'),
});

export type AiAssistedNoteTakingOutput = z.infer<typeof AiAssistedNoteTakingOutputSchema>;

export async function aiAssistedNoteTaking(input: AiAssistedNoteTakingInput): Promise<AiAssistedNoteTakingOutput> {
  return aiAssistedNoteTakingFlow(input);
}

const generateReportSuggestionsTool = ai.defineTool({
  name: 'generateReportSuggestions',
  description: 'Generates suggestions for common phrases or templates to assist the user in generating logs more quickly.',
  inputSchema: z.object({
    patientDescription: z
      .string()
      .describe('A detailed description of the patient and the context of the medical record.'),
    medicalSpecialty: z
      .string()
      .describe('The medical specialty of the professional generating the note.'),
    examplePhrases: z
      .string()
      .optional()
      .describe('Optional example phrases to guide the note generation.'),
  }),
  outputSchema: z.array(z.string()).describe('An array of suggested phrases for the patient record.'),
},
async (input) => {
    const { suggestedPhrases } = await reportTemplatePrompt(input);
    return suggestedPhrases;
  }
);

const reportTemplatePrompt = ai.definePrompt({
  name: 'reportTemplatePrompt',
  input: {schema: AiAssistedNoteTakingInputSchema},
  output: {schema: z.object({suggestedPhrases: z.array(z.string())})},
  tools: [generateReportSuggestionsTool],
  prompt: `You are an AI assistant designed to help medical professionals generate patient records quickly and efficiently.

You will receive a description of the patient, the medical specialty of the professional, and optionally example phrases.
Based on this information, you will suggest common phrases or templates that the professional can use in the patient record.

Patient Description: {{{patientDescription}}}
Medical Specialty: {{{medicalSpecialty}}}
{% if examplePhrases %}
Example Phrases: {{{examplePhrases}}}
{% endif %}

Suggested Phrases:
`,
});

const aiAssistedNoteTakingFlow = ai.defineFlow(
  {
    name: 'aiAssistedNoteTakingFlow',
    inputSchema: AiAssistedNoteTakingInputSchema,
    outputSchema: AiAssistedNoteTakingOutputSchema,
  },
  async input => {
    const {output} = await reportTemplatePrompt(input);
    return {suggestedPhrases: output?.suggestedPhrases ?? []};
  }
);
