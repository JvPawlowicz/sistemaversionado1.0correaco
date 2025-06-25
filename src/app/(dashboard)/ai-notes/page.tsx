import { NoteAssistantForm } from '@/components/ai-notes/note-assistant-form';

export default function AiNotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            AI-Assisted Note Taking
          </h1>
          <p className="text-muted-foreground">
            Generate report templates and phrases to speed up your documentation.
          </p>
        </div>
      </div>
      <NoteAssistantForm />
    </div>
  );
}
