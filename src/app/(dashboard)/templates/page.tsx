
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Loader2, Edit, Trash2, NotebookText, DatabaseZap } from 'lucide-react';
import { useTemplate } from '@/contexts/TemplateContext';
import { TemplateDialog } from '@/components/templates/template-dialog';
import type { EvolutionTemplate } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteEvolutionTemplateAction, seedDefaultTemplatesAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function TemplatesPage() {
  const { templates, loading, fetchTemplates } = useTemplate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<EvolutionTemplate | null>(null);
  const [isSeeding, setIsSeeding] = React.useState(false);
  
  const handleEdit = (template: EvolutionTemplate) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedTemplate(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    const result = await deleteEvolutionTemplateAction(templateId);
    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      fetchTemplates();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };
  
  const handleSeedTemplates = async () => {
    if (!currentUser) return;
    setIsSeeding(true);
    const result = await seedDefaultTemplatesAction(currentUser.id);
    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      fetchTemplates();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
    setIsSeeding(false);
  };

  return (
    <>
      <TemplateDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        template={selectedTemplate}
      />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Gerenciador de Modelos
            </h1>
            <p className="text-muted-foreground">
              Crie, edite e gerencie seus modelos para agilizar a documentação clínica, avaliações e anamneses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSeedTemplates} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
              Cadastrar Modelos Padrão
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Modelo
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{template.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                     {Array.isArray(template.content)
                      ? `Campos: ${template.content.map(f => f.label).join(', ')}`
                      : template.content
                    }
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover o modelo "{template.title}"?
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Não</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(template.id)} className="bg-destructive hover:bg-destructive/90">Sim, remover</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" size="icon" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <NotebookText className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Nenhum modelo encontrado.</h3>
            <p className="mb-4">Comece criando seu primeiro modelo ou cadastre os modelos padrão.</p>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Modelo
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
