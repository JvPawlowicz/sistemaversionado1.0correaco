
export type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type InstitutionalDocument = {
  name: string;
  url: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  capacity: number; // 1 para individual, >1 para grupo, 0 para ilimitado
  unitId: string;
  professionalIds: string[];
};

export type HealthPlan = {
  id: string;
  name: string;
  color: string;
  unitId: string;
}

export type HealthPlanWithUnit = HealthPlan & {
    unitName: string;
}

export type Unit = {
  id: string;
  name: string;
  cnpj?: string;
  address?: Address | null;
  phone?: string;
  email?: string;
  responsibleTech?: string;
  photoUrl?: string;
  institutionalDocuments?: InstitutionalDocument[];
  services?: Service[]; // Populado no frontend
  healthPlans?: HealthPlan[]; // Populado no frontend
  rooms?: string[];
  createdAt?: any;
};

export type TreatmentObjective = {
  id: string;
  description: string;
  status: 'Não Iniciado' | 'Em Andamento' | 'Atingido' | 'Pausa';
  masteryCriterion: string;
  dataCollectionType: 'Frequência' | 'Duração' | 'Latência' | 'Tentativas' | 'Outro';
};

export type TreatmentGoal = {
  id: string;
  description: string;
  objectives: TreatmentObjective[];
};

export type TreatmentPlan = {
  goals: TreatmentGoal[];
};


export type Patient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  lastVisit?: string | null;
  status: 'Active' | 'Inactive';
  avatarUrl: string;
  dob?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  unitIds: string[];
  createdAt?: any;

  cpf?: string | null;
  rg?: string | null;
  maritalStatus?: string | null;
  profession?: string | null;
  cns?: string | null;
  healthPlanId?: string | null;
  healthPlanName?: string | null;
  motherName?: string | null;
  fatherName?: string | null;
  additionalInfo?: string | null;

  diagnosis?: string | null;
  referringProfessional?: string | null;
  imageUseConsent?: boolean;
  address?: Address | null;
  treatmentPlan?: TreatmentPlan;
};

export type Availability = {
  type: 'Free' | 'Planning' | 'Supervision';
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Therapist' | 'Receptionist' | 'Coordinator';
  status: 'Active' | 'Inactive';
  avatarUrl: string;
  unitIds: string[];
  availability?: Availability[];
  professionalCouncil?: string | null;
  councilNumber?: string | null;
  specialties?: string[] | null;
  createdAt?: any;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  time: string;
  endTime: string;
  date: string; // ISO String 'YYYY-MM-DD'
  room: string;
  unitId: string;
  status: 'Agendado' | 'Realizado' | 'Faltou' | 'Cancelado';
  color: string;
  groupId?: string | null;
  attendees?: string[]; // Array of patientIds for group sessions
  createdAt?: any;
  healthPlanId?: string;
  healthPlanName?: string;
};

export type ObjectiveProgressData = {
  value: number;
  total?: number; // Only for 'Tentativas'
  type: TreatmentObjective['dataCollectionType'];
};

export type EvolutionRecord = {
  id: string;
  title: string;
  details: string;
  author: string;
  groupId?: string | null; // To link evolution to a group session
  createdAt?: any;
  patientName: string;
  patientId: string;
  linkedObjectiveIds?: string[];
  objectiveProgress?: Record<string, ObjectiveProgressData>;
};

export type PatientDocument = {
  id:string;
  fileName: string;
  url: string;
  fileType: string;
  size: number;
  category: 'Exame' | 'Documento Legal' | 'Foto Terapêutica' | 'Outro';
  description: string;
  uploadedAt: any;
};

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  observations: string;
  createdAt?: any;
};

export type TherapyGroup = {
  id: string;
  name: string;
  serviceId: string;
  unitId: string;
  patientIds: string[];
  professionalIds: string[];
  createdAt?: any;
};

export type TimeBlock = {
    id: string;
    title: string;
    unitId: string; 
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    createdAt?: any;
    userIds?: string[];
};


export type Notification = {
  id: string;
  title: string;
  content: string;
  createdAt?: any;
  targetType?: 'ALL' | 'ROLE' | 'UNIT' | 'SPECIFIC';
  targetValue?: string | string[];
  seenBy?: string[];
};


export type ChatThread = {
  id: string;
  participantIds: string[];
  participantNames: { [key: string]: string };
  participantAvatars: { [key: string]: string };
  lastMessage?: string;
  lastMessageSender?: string;
  lastUpdatedAt: any; // Firestore Timestamp
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: any; // Firestore Timestamp
};

export type TemplateField = {
  id: string;
  type: 'header' | 'text' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  options?: string[];
  placeholder?: string;
};

export type EvolutionTemplate = {
  id: string;
  title: string;
  content: TemplateField[];
  userId: string;
  createdAt?: any;
};

export type Assessment = {
  id: string;
  patientId: string;
  patientName: string;
  unitId: string | null;
  templateId: string;
  templateTitle: string;
  answers: Record<string, any>;
  authorId: string;
  authorName: string;
  createdAt: any;
};

export type Log = {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  entityType?: string;
  entityId?: string;
  unitId?: string;
  createdAt: any; // Firestore Timestamp
};
