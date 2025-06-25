'use server';

import { z } from 'zod';
import {
  aiAssistedNoteTaking,
  AiAssistedNoteTakingInput,
} from '@/ai/flows/ai-assisted-note-taking';

const FormSchema = z.object({
  patientDescription: z.string().min(10, {
    message: 'Patient description must be at least 10 characters.',
  }),
  medicalSpecialty: z.string(),
});

export type NoteAssistantState = {
  errors?: {
    patientDescription?: string[];
    medicalSpecialty?: string[];
  };
  message?: string | null;
  suggestions?: string[];
};

export async function getNoteSuggestions(
  prevState: NoteAssistantState,
  formData: FormData
): Promise<NoteAssistantState> {
  const validatedFields = FormSchema.safeParse({
    patientDescription: formData.get('patientDescription'),
    medicalSpecialty: formData.get('medicalSpecialty'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Failed to get suggestions.',
    };
  }

  try {
    const result = await aiAssistedNoteTaking(
      validatedFields.data as AiAssistedNoteTakingInput
    );
    if (result.suggestedPhrases && result.suggestedPhrases.length > 0) {
      return { suggestions: result.suggestedPhrases, message: null, errors: {} };
    } else {
      return { message: 'No suggestions found for the given context.', errors: {} };
    }
  } catch (error) {
    return { message: 'An unexpected error occurred. Please try again.', errors: {} };
  }
}
