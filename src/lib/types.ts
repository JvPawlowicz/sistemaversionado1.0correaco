
/**
 * Represents a physical address.
 */
export type Address = {
  /** The street name and number. */
  street: string;
  /** The city. */
  city: string;
  /** The state or province (e.g., "SP"). */
  state: string;
  /** The postal or ZIP code. */
  zip: string;
};

/**
 * Represents an institutional document, such as a license or permit.
 */
export type InstitutionalDocument = {
  /** The display name of the document. */
  name: string;
  /** The public URL to access the document. */
  url: string;
};

/**
 * Represents a service offered by a clinic unit.
 */
export type Service = {
  /** The unique identifier for the service. */
  id: string;
  /** The name of the service (e.g., "Fisioterapia Motora"). */
  name: string;
  /** A detailed description of the service. */
  description: string;
  /** The maximum number of patients per session. Use 1 for individual, 0 for unlimited. */
  capacity: number;
  /** The ID of the unit offering the service. */
  unitId: string;
  /** An array of professional IDs qualified to provide the service. */
  professionalIds: string[];
};

/**
 * Represents a health insurance plan accepted by a unit.
 */
export type HealthPlan = {
  /** The unique identifier for the health plan. */
  id: string;
  /** The name of the health plan (e.g., "Unimed", "SulAmérica"). */
  name: string;
  /** A color code for UI identification. */
  color: string;
  /** The ID of the unit this plan is associated with. */
  unitId: string;
}

/**
 * Represents a HealthPlan with its associated unit's name, for display purposes.
 */
export type HealthPlanWithUnit = HealthPlan & {
    /** The name of the unit associated with the health plan. */
    unitName: string;
}

/**
 * Represents a clinic branch or location.
 */
export type Unit = {
  /** The unique identifier for the unit. */
  id: string;
  /** The name of the unit (e.g., "Unidade Principal"). */
  name: string;
  /** The unit's CNPJ (Brazilian company registration number). */
  cnpj?: string;
  /** The physical address of the unit. */
  address?: Address | null;
  /** The primary phone number for the unit. */
  phone?: string;
  /** The primary email address for the unit. */
  email?: string;
  /** The name of the technically responsible person for the unit. */
  responsibleTech?: string;
  /** The URL of a photo representing the unit. */
  photoUrl?: string;
  /** A list of institutional documents for the unit. */
  institutionalDocuments?: InstitutionalDocument[];
  /** A list of services offered by the unit. Populated on the frontend. */
  services?: Service[];
  /** A list of health plans accepted by the unit. Populated on the frontend. */
  healthPlans?: HealthPlan[];
  /** A list of available rooms or physical spaces in the unit. */
  rooms?: string[];
  /** The Firestore timestamp of when the unit was created. */
  createdAt?: any;
};

/**
 * A specific, measurable, short-term objective within a long-term treatment goal.
 */
export type TreatmentObjective = {
  /** A unique identifier for the objective. */
  id: string;
  /** The description of the objective (e.g., "Apontar para 3 objetos desejados"). */
  description: string;
  /** The current status of the objective. */
  status: 'Não Iniciado' | 'Em Andamento' | 'Atingido' | 'Pausa';
  /** The criteria for considering the objective as met (e.g., "90% de acerto em 3 dias consecutivos"). */
  masteryCriterion: string;
  /** The method used for collecting data on the objective's progress. */
  dataCollectionType: 'Frequência' | 'Duração' | 'Latência' | 'Tentativas' | 'Outro';
};

/**
 * A long-term goal in a patient's treatment plan.
 */
export type TreatmentGoal = {
  /** A unique identifier for the goal. */
  id: string;
  /** The description of the long-term goal (e.g., "Melhorar a comunicação funcional"). */
  description: string;
  /** An array of short-term objectives related to this goal. */
  objectives: TreatmentObjective[];
};

/**
 * The comprehensive Individual Treatment Plan (PTI) for a patient.
 */
export type TreatmentPlan = {
  /** An array of long-term goals that make up the plan. */
  goals: TreatmentGoal[];
};

/**
 * Represents the core patient profile, containing demographic, clinical, and administrative data.
 */
export type Patient = {
  /** The unique identifier for the patient. */
  id: string;
  /** The full name of the patient. */
  name: string;
  /** The patient's email address. */
  email?: string | null;
  /** The patient's primary phone number. */
  phone?: string | null;
  /** The date of the patient's last visit in 'YYYY-MM-DD' format. */
  lastVisit?: string | null;
  /** The current status of the patient in the clinic. */
  status: 'Active' | 'Inactive';
  /** The URL for the patient's avatar image. */
  avatarUrl: string;
  /** The patient's date of birth in 'YYYY-MM-DD' format. */
  dob?: string | null;
  /** The patient's gender. */
  gender?: 'Male' | 'Female' | 'Other' | null;
  /** An array of unit IDs the patient is associated with. */
  unitIds: string[];
  /** The Firestore timestamp of when the patient was registered. */
  createdAt?: any;

  /** The patient's CPF (Brazilian individual taxpayer registry). */
  cpf?: string | null;
  /** The patient's RG (Brazilian identity card number). */
  rg?: string | null;
  /** The patient's marital status. */
  maritalStatus?: string | null;
  /** The patient's profession or occupation. */
  profession?: string | null;
  /** The patient's CNS (Brazilian National Health Card number). */
  cns?: string | null;
  /** The ID of the patient's health plan. */
  healthPlanId?: string | null;
  /** The name of the patient's health plan (denormalized for display). */
  healthPlanName?: string | null;
  /** The name of the patient's mother. */
  motherName?: string | null;
  /** The name of the patient's father. */
  fatherName?: string | null;
  /** Any additional relevant information about the patient. */
  additionalInfo?: string | null;

  /** A brief description of the patient's diagnosis or primary complaint. */
  diagnosis?: string | null;
  /** The name of the professional who referred the patient. */
  referringProfessional?: string | null;
  /** Indicates whether the patient has given consent for image use. */
  imageUseConsent?: boolean;
  /** The patient's address. */
  address?: Address | null;
  /** The patient's Individual Treatment Plan (PTI). */
  treatmentPlan?: TreatmentPlan;
};

/**
 * Defines a professional's working hours for a specific day of the week.
 */
export type Availability = {
  /** The type of activity scheduled for this time slot. 'Free' is for patient appointments. */
  type: 'Free' | 'Planning' | 'Supervision';
  /** The day of the week, where 0 is Sunday and 6 is Saturday. */
  dayOfWeek: number;
  /** The start time of the slot in "HH:mm" format. */
  startTime: string;
  /** The end time of the slot in "HH:mm" format. */
  endTime: string;
};

/**
 * Represents a system user, with roles, permissions, and associated units.
 */
export type User = {
  /** The unique identifier for the user (matches Firebase Auth UID). */
  id: string;
  /** The full name of the user. */
  name: string;
  /** The user's email address. */
  email: string;
  /** The role of the user, which determines their permissions. */
  role: 'Admin' | 'Therapist' | 'Receptionist' | 'Coordinator';
  /** The current status of the user's account. */
  status: 'Active' | 'Inactive';
  /** The URL for the user's avatar image. */
  avatarUrl: string;
  /** An array of unit IDs the user has access to. */
  unitIds: string[];
  /** The user's weekly work availability schedule. */
  availability?: Availability[];
  /** The user's professional council (e.g., "CREFITO", "CRP"). */
  professionalCouncil?: string | null;
  /** The user's registration number in their professional council. */
  councilNumber?: string | null;
  /** A list of the user's professional specialties. */
  specialties?: string[] | null;
  /** The Firestore timestamp of when the user was created. */
  createdAt?: any;
};

/**
 * Represents a scheduled session for a patient or a group.
 */
export type Appointment = {
  /** The unique identifier for the appointment. */
  id: string;
  /** The ID of the patient. */
  patientId: string;
  /** The name of the patient (denormalized for display). */
  patientName: string;
  /** The name of the professional responsible for the appointment. */
  professionalName: string;
  /** The ID of the service being provided. */
  serviceId: string;
  /** The name of the service (denormalized for display). */
  serviceName: string;
  /** The discipline associated with the service (e.g., "Fisioterapia"). Optional. */
  discipline?: string;
  /** The start time of the appointment in "HH:mm" format. */
  time: string;
  /** The end time of the appointment in "HH:mm" format. */
  endTime: string;
  /** The date of the appointment in "YYYY-MM-DD" format. */
  date: string;
  /** The name or number of the room where the appointment will take place. */
  room: string;
  /** The ID of the unit where the appointment is scheduled. */
  unitId: string;
  /** The current status of the appointment. */
  status: 'Agendado' | 'Realizado' | 'Faltou' | 'Cancelado';
  /** A color code for UI display. */
  color: string;
  /** An identifier for group appointments, linking multiple appointments together. */
  groupId?: string | null;
  /** An array of patient IDs for group sessions. */
  attendees?: string[];
  /** The Firestore timestamp of when the appointment was created. */
  createdAt?: any;
  /** The ID of the patient's health plan for this appointment. */
  healthPlanId?: string;
  /** The name of the health plan (denormalized for display). */
  healthPlanName?: string;
};

/**
 * Stores data collected for a specific objective during a session.
 */
export type ObjectiveProgressData = {
  /** The value recorded (e.g., count of correct responses, duration in minutes). */
  value: number;
  /** The total number of trials, used when dataCollectionType is 'Tentativas'. */
  total?: number;
  /** The type of data collected, mirroring the objective's setting. */
  type: TreatmentObjective['dataCollectionType'];
};

/**
 * A clinical note detailing a patient's progress during a session.
 */
export type EvolutionRecord = {
  /** The unique identifier for the evolution record. */
  id: string;
  /** The title of the record. */
  title: string;
  /** The detailed content of the clinical note. */
  details: string;
  /** The name of the author who wrote the record. */
  author: string;
  /** The ID of the therapy group if the session was a group session. */
  groupId?: string | null;
  /** The Firestore timestamp of when the record was created. */
  createdAt?: any;
  /** The name of the patient (denormalized for display). */
  patientName: string;
  /** The ID of the patient this record belongs to. */
  patientId: string;
  /** An array of objective IDs from the PTI that were addressed in this session. */
  linkedObjectiveIds?: string[];
  /** A map of objective IDs to the progress data collected during the session. */
  objectiveProgress?: Record<string, ObjectiveProgressData>;
};

/**
 * Represents a file uploaded for a patient (e.g., exam, report).
 */
export type PatientDocument = {
  /** The unique identifier for the document. */
  id:string;
  /** The original name of the uploaded file. */
  fileName: string;
  /** The public URL to access the file in storage. */
  url: string;
  /** The MIME type of the file. */
  fileType: string;
  /** The size of the file in bytes. */
  size: number;
  /** The category of the document. */
  category: 'Exame' | 'Documento Legal' | 'Foto Terapêutica' | 'Outro';
  /** A description of the document. */
  description: string;
  /** The Firestore timestamp of when the document was uploaded. */
  uploadedAt: any;
};

/**
 * A family member or emergency contact for a patient.
 */
export type FamilyMember = {
  /** The unique identifier for the family member entry. */
  id: string;
  /** The full name of the family member. */
  name: string;
  /** The relationship to the patient (e.g., "Mãe", "Pai"). */
  relationship: string;
  /** The contact phone number. */
  phone: string;
  /** Any relevant observations. */
  observations: string;
  /** The Firestore timestamp of when the entry was created. */
  createdAt?: any;
};

/**
 * Defines a therapy group, linking patients, professionals, and a service.
 */
export type TherapyGroup = {
  /** The unique identifier for the therapy group. */
  id: string;
  /** The name of the group. */
  name: string;
  /** The ID of the service associated with this group. */
  serviceId: string;
  /** The ID of the unit where the group meets. */
  unitId: string;
  /** An array of patient IDs participating in the group. */
  patientIds: string[];
  /** An array of professional IDs responsible for the group. */
  professionalIds: string[];
  /** The Firestore timestamp of when the group was created. */
  createdAt?: any;
};

/**
 * A general block of time on the schedule, such as a meeting or holiday.
 */
export type TimeBlock = {
    /** The unique identifier for the time block. */
    id: string;
    /** The reason for the block (e.g., "Reunião de Equipe"). */
    title: string;
    /** The ID of the unit affected by the block. */
    unitId: string; 
    /** The date of the block in "YYYY-MM-DD" format. */
    date: string;
    /** The start time of the block in "HH:mm" format. */
    startTime: string;
    /** The end time of the block in "HH:mm" format. */
    endTime: string;
    /** The Firestore timestamp of when the block was created. */
    createdAt?: any;
    /** An array of specific user IDs affected by the block. If empty, affects the whole unit. */
    userIds?: string[];
};

/**
 * A system notification intended for one or more users.
 */
export type Notification = {
  /** The unique identifier for the notification. */
  id: string;
  /** The title of the notification. */
  title: string;
  /** The content or message of the notification. */
  content: string;
  /** The Firestore timestamp of when the notification was created. */
  createdAt?: any;
  /** The type of targeting used for the notification. */
  targetType?: 'ALL' | 'ROLE' | 'UNIT' | 'SPECIFIC';
  /** The value used for targeting (e.g., a role name, a unit ID, or an array of user IDs). */
  targetValue?: string | string[];
  /** An array of user IDs who have seen the notification. */
  seenBy?: string[];
};

/**
 * A single field within a structured evolution template.
 */
export type TemplateField = {
  /** A unique identifier for the field within the template. */
  id: string;
  /** The type of form element to render for this field. */
  type: 'header' | 'text' | 'textarea' | 'checkbox' | 'radio';
  /** The visible label for the field. */
  label: string;
  /** An array of options for 'checkbox' or 'radio' types. */
  options?: string[];
  /** Placeholder text for 'text' or 'textarea' fields. */
  placeholder?: string;
};

/**
 * A reusable template for creating structured clinical notes or assessments.
 */
export type EvolutionTemplate = {
  /** The unique identifier for the template. */
  id: string;
  /** The title of the template (e.g., "Anamnese Infantil"). */
  title: string;
  /** An array of TemplateField objects that define the structure of the template. */
  content: TemplateField[];
  /** The ID of the user who created the template. */
  userId: string;
  /** The Firestore timestamp of when the template was created. */
  createdAt?: any;
};

/**
 * A completed assessment or anamnesis based on a structured template.
 */
export type Assessment = {
  /** The unique identifier for the completed assessment. */
  id: string;
  /** The ID of the patient the assessment is for. */
  patientId: string;
  /** The name of the patient (denormalized for display). */
  patientName: string;
  /** The ID of the unit where the assessment was conducted. */
  unitId: string | null;
  /** The ID of the template used for the assessment. */
  templateId: string;
  /** The title of the template used (denormalized for display). */
  templateTitle: string;
  /** A map of field IDs to the answers provided by the user. */
  answers: Record<string, any>;
  /** The ID of the user who created the assessment. */
  authorId: string;
  /** The name of the user who created the assessment. */
  authorName: string;
  /** The Firestore timestamp of when the assessment was created. */
  createdAt: any;
};

/**
 * An audit log entry for a significant action performed in the system.
 */
export type Log = {
  /** The unique identifier for the log entry. */
  id: string;
  /** The ID of the user who performed the action. */
  actorId: string;
  /** The name of the user who performed the action. */
  actorName: string;
  /** A string identifying the action performed (e.g., "CREATE_PATIENT"). */
  action: string;
  /** A detailed description of the action. */
  details: string;
  /** The type of the entity that was affected (e.g., "patient", "appointment"). */
  entityType?: string;
  /** The ID of the entity that was affected. */
  entityId?: string;
  /** The ID of the unit where the action took place. */
  unitId?: string;
  /** The Firestore timestamp of when the action occurred. */
  createdAt: any;
};
