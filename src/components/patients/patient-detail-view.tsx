
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Loader2, ChevronDown, MoreHorizontal, Trash2, Edit, Users2 } from 'lucide-react';
import type { Patient, EvolutionRecord, PatientDocument, FamilyMember, TherapyGroup, Assessment } from '@/lib/types';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { NewEvolutionRecordDialog } from './new-evolution-record-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { usePatient } from '@/contexts/PatientContext';
import { useToast } from '@/hooks/use-toast';
import { updatePatientStatusAction } from '@/lib/actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DocumentUploader } from './document-uploader';
import { DeletePatientDialog } from './delete-patient-dialog';
import { EditPatientDialog } from './edit-patient-dialog';
import { FamilyMemberManager } from './family-member-manager';

export function PatientDetailView({
  patient,
  records,
  recordsLoading,
  onRecordAdded,
  documents,
  documentsLoading,
  onDocumentAdded,
  familyMembers,
  familyMembersLoading,
  onFamilyMemberChange,
  therapyGroups,
  groupsLoading,
  onPatientDeleted,
  onPatientUpdated,
  assessments,
  assessmentsLoading,
}: {
  patient: Patient;
  records: EvolutionRecord[];
  recordsLoading: boolean;
  onRecordAdded: () => void;
  documents: PatientDocument[];
  documentsLoading: boolean;
  onDocumentAdded: () => void;
  familyMembers: FamilyMember[];
  familyMembersLoading: boolean;
  onFamilyMemberChange: () => void;
  therapyGroups: TherapyGroup[];
  groupsLoading: boolean;
  onPatientDeleted: () => void;
  onPatientUpdated: () => void;
  assessments: Assessment[];
  assessmentsLoading: boolean;
}) {
  const [isNewRecordDialogOpen, setIsNewRecordDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const { currentUser } = useAuth();
  const { fetchPatients } = usePatient();
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Coordinator';

  const patientGroups = React.useMemo(() => {
    return therapyGroups.filter(g => g.patientIds.includes(patient.id));
  }, [therapyGroups, patient.id]);

  const handleStatusChange = async (newStatus: 'Active' | 'Inactive') => {
      if (patient.status === newStatus || isUpdatingStatus) return;
      setIsUpdatingStatus(true);
      const result = await updatePatientStatusAction(patient.id, newStatus);
      if (result.success) {
          toast({ title: 'Sucesso!', description: result.message });
          await fetchPatients();
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.message });
      }
      setIsUpdatingStatus(false);
  };


  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const formattedDob = patient.dob ? format(new Date(patient.dob + 'T00:00:00'), 'dd/MM/yyyy') : 'Não informado';

  const genderMap = {
    Male: 'Masculino',
    Female: 'Feminino',
    Other: 'Outro',
  };

  const getAddressString = (address: Patient['address']) => {
    if (!address) return 'Não informado';
    const parts = [address.street, address.city, address.state, address.zip].filter(Boolean);
    return parts.join(', ');
  }

  return (
    <>
      <NewEvolutionRecordDialog
        isOpen={isNewRecordDialogOpen}
        onOpenChange={setIsNewRecordDialogOpen}
        patientId={patient.id}
        onRecordAdded={onRecordAdded}
      />
      <DeletePatientDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        patient={patient}
        onPatientDeleted={onPatientDeleted}
      />
      <EditPatientDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        patient={patient}
        onPatientUpdated={onPatientUpdated}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col items-start gap-4 sm:flex-row">
            <Avatar className="h-24 w-24">
              <AvatarImage src={patient.avatarUrl} alt={patient.name} />
              <AvatarFallback className="text-3xl">{getInitials(patient.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl">{patient.name}</CardTitle>
              <CardDescription className="mt-2 text-base">
                ID do Paciente: {patient.id}
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Nasc: {formattedDob}</span>
                <span>Gênero: {patient.gender ? genderMap[patient.gender] : 'Não informado'}</span>
                <span>Telefone: {patient.phone || 'Não informado'}</span>
                <span>Email: {patient.email || 'Não informado'}</span>
              </div>
            </div>
             <div className="flex items-center gap-2">
              {canEdit ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[120px]" disabled={isUpdatingStatus}>
                      {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : (patient.status === 'Active' ? 'Ativo' : 'Inativo')}
                      {!isUpdatingStatus && <ChevronDown className="ml-auto h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange('Active')} disabled={patient.status === 'Active'}>
                      Ativo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('Inactive')} disabled={patient.status === 'Inactive'}>
                      Inativo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
                  {patient.status === 'Active' ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
               {canEdit && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                       <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Paciente
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Paciente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
               )}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="evolution">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="evolution">Evolução</TabsTrigger>
            <TabsTrigger value="assessments">Avaliações</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="family">Familiares</TabsTrigger>
            <TabsTrigger value="profile">Perfil Completo</TabsTrigger>
          </TabsList>
          <TabsContent value="evolution">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Registros de Evolução</CardTitle>
                    <CardDescription>Registro cronológico do progresso e sessões do paciente.</CardDescription>
                  </div>
                  <Button onClick={() => setIsNewRecordDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Registro
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {recordsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : records.length > 0 ? (
                    records.map(record => (
                      <div key={record.id} className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{record.title}</h3>
                            <span className="text-sm text-muted-foreground">{record.date}</span>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-wrap">{record.details}</p>
                        <p className="mt-4 text-xs text-muted-foreground text-right">Por: {record.author}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum registro de evolução encontrado.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações e Anamneses</CardTitle>
                <CardDescription>Visualizar todas as avaliações estruturadas do paciente.</CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : assessments.length > 0 ? (
                  <div className="space-y-3">
                    {assessments.map(assessment => (
                      <Card key={assessment.id} className="bg-secondary/50">
                        <CardHeader className="p-4 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{assessment.templateTitle}</CardTitle>
                            <CardDescription>
                              Preenchido por {assessment.authorName} em {assessment.createdAt ? format(assessment.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" disabled>Visualizar</Button>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Nenhuma avaliação encontrada para este paciente.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="groups">
            <Card>
                <CardHeader>
                    <CardTitle>Grupos de Terapia</CardTitle>
                    <CardDescription>Grupos de terapia em que o paciente está incluído.</CardDescription>
                </CardHeader>
                <CardContent>
                    {groupsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : patientGroups.length > 0 ? (
                        <div className="space-y-3">
                            {patientGroups.map(group => (
                                <Card key={group.id} className="bg-secondary/50">
                                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Users2 className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-lg">{group.name}</CardTitle>
                                        </div>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/groups`}>Ver Grupo</Link>
                                        </Button>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>O paciente não está participando de nenhum grupo de terapia.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Imagens e Arquivos</CardTitle>
                <CardDescription>Faça upload e gerencie os documentos, exames e fotos do paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <DocumentUploader patientId={patient.id} onDocumentAdded={onDocumentAdded} />
                  <div className="space-y-2 pt-4">
                    {documentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : documents.length > 0 ? (
                      <ul className="space-y-2">
                          {documents.map(doc => (
                              <li key={doc.id} className="flex items-center justify-between rounded-lg border p-3 gap-2">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <FileText className="h-5 w-5 text-primary"/>
                                      <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate" title={doc.fileName}>{doc.fileName}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {doc.category} - Enviado em {format(doc.uploadedAt, 'dd/MM/yyyy')} - {(doc.size / 1024).toFixed(2)} KB
                                          </p>
                                      </div>
                                  </div>
                                  <Button asChild variant="outline" size="sm">
                                      <Link href={doc.url} target="_blank" rel="noopener noreferrer">Baixar</Link>
                                  </Button>
                              </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhum documento encontrado.</p>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle>Familiares e Contatos</CardTitle>
                <CardDescription>Gerencie as informações dos familiares e contatos do paciente.</CardDescription>
              </CardHeader>
              <CardContent>
                <FamilyMemberManager
                  patientId={patient.id}
                  familyMembers={familyMembers}
                  isLoading={familyMembersLoading}
                  onFamilyMemberChange={onFamilyMemberChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Perfil Completo do Paciente</CardTitle>
                <CardDescription>Todas as informações detalhadas do paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Nome Completo</p>
                        <p>{patient.name}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Data de Nascimento</p>
                        <p>{formattedDob}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Gênero</p>
                        <p>{patient.gender ? genderMap[patient.gender] : 'Não informado'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Status</p>
                        <p>{patient.status === 'Active' ? 'Ativo' : 'Inativo'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">E-mail</p>
                        <p>{patient.email || 'Não informado'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Telefone</p>
                        <p>{patient.phone || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Última visita</p>
                        <p>{patient.lastVisit ? format(new Date(patient.lastVisit + 'T00:00:00'), 'dd/MM/yyyy') : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Data de Cadastro</p>
                        <p>{patient.createdAt?.toDate ? format(patient.createdAt.toDate(), 'PPP', { locale: ptBR }) : 'Não disponível'}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="font-medium text-muted-foreground">Endereço</p>
                      <p>{getAddressString(patient.address)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Diagnóstico</p>
                      <p>{patient.diagnosis || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Profissional Indicador</p>
                      <p>{patient.referringProfessional || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1 flex items-center gap-2">
                        <p className="font-medium text-muted-foreground">Permissão de Uso de Imagem:</p>
                        <Badge variant={patient.imageUseConsent ? 'default' : 'secondary'}>
                            {patient.imageUseConsent ? 'Concedida' : 'Não Concedida'}
                        </Badge>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
