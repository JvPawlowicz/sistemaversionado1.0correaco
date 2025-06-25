import { NoteAssistantForm } from '@/components/ai-notes/note-assistant-form';

export default function AiNotesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Assistente de Anotações com IA
        </h1>
        <p className="text-muted-foreground">
          Otimize suas anotações clínicas. Cole o texto de sua sessão e use a IA para resumir, extrair termos-chave ou criar um plano de ação.
        </p>
      </div>

      <NoteAssistantForm />
    </div>
  );
}
