'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { getNoteSuggestions, NoteAssistantState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, ClipboardCopy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Suggestions
        </>
      )}
    </Button>
  );
}

export function NoteAssistantForm() {
  const initialState: NoteAssistantState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(getNoteSuggestions, initialState);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied to clipboard!",
        description: "The suggested phrase has been copied.",
    })
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <form action={dispatch}>
          <CardHeader>
            <CardTitle>Context</CardTitle>
            <CardDescription>Provide details about the patient and session to get tailored suggestions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicalSpecialty">Medical Specialty</Label>
              <Select name="medicalSpecialty" defaultValue="Physiotherapy">
                <SelectTrigger id="medicalSpecialty">
                  <SelectValue placeholder="Select a specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                  <SelectItem value="Psychology">Psychology</SelectItem>
                  <SelectItem value="Nutrition">Nutrition</SelectItem>
                  <SelectItem value="General Practice">General Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientDescription">Patient Description & Context</Label>
              <Textarea
                id="patientDescription"
                name="patientDescription"
                placeholder="e.g., Patient is a 45-year-old male, 2 weeks post-op for ACL reconstruction. Reports mild pain and swelling..."
                className="min-h-[150px]"
              />
              {state?.errors?.patientDescription &&
                state.errors.patientDescription.map((error: string) => (
                  <p className="text-sm font-medium text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Suggestions</CardTitle>
          <CardDescription>AI-powered phrases you can use in your reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state?.suggestions ? (
              state.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between gap-2 rounded-lg border bg-secondary p-3">
                  <p className="text-sm flex-1">{suggestion}</p>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(suggestion)}>
                    <ClipboardCopy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                <Wand2 className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Your suggestions will appear here.</p>
                 {state?.message && <p className="mt-2 text-sm text-destructive">{state.message}</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
