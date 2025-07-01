# Visão Geral da Arquitetura e Funcionalidades do Sistema Equidade+

Este documento serve como um guia técnico abrangente para o sistema de gestão de clínicas Equidade+. Ele é destinado a desenvolvedores (humanos ou IA) para entender a arquitetura, os modelos de dados e a lógica de negócios da aplicação.

## 1. Stack de Tecnologia

- **Framework:** Next.js (com App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes de UI:** shadcn/ui
- **Backend & Banco de Dados:** Firebase (Firestore, Authentication, Storage)
- **Infraestrutura de Deploy:** Firebase App Hosting

## 2. Conceitos Fundamentais da Arquitetura

### 2.1. Context Providers (Gerenciamento de Estado)

O estado global da aplicação é gerenciado por um conjunto de Context Providers aninhados em `src/app/(dashboard)/layout.tsx`. Cada contexto tem um propósito específico:

- **`AuthProvider`**: Gerencia a autenticação do usuário, o estado de login e as informações do `currentUser` (perfil do Firestore).
- **`UnitProvider`**: Gerencia a lista de unidades (clínicas) e, crucialmente, o `selectedUnitId`, que controla o escopo de dados para quase toda a aplicação. A seleção é persistida no `localStorage`.
- **`PatientProvider`**: Carrega e disponibiliza a lista de pacientes, filtrada pelo `selectedUnitId`.
- **`ScheduleProvider`**: Carrega e gerencia todos os agendamentos (`appointments`) e bloqueios de tempo (`timeBlocks`) para a unidade selecionada.
- **`UserProvider`**: Carrega a lista de usuários (profissionais) associados à unidade selecionada.
- **Outros**: `TherapyGroupProvider`, `NotificationProvider`, `TemplateProvider`, `AssessmentProvider` seguem o mesmo padrão para seus respectivos domínios.

### 2.2. Server Actions (Mutação de Dados)

Toda a lógica de criação, atualização e exclusão (CUD) é centralizada em **Next.js Server Actions**, localizadas em `src/lib/actions/`. Isso elimina a necessidade de criar endpoints de API tradicionais. Cada ação:
1. Utiliza `zod` para validar os dados do formulário.
2. Interage com o Firebase Admin SDK (`firebase-admin`) para realizar operações no backend.
3. Utiliza a função `revalidatePath` para invalidar o cache do Next.js e atualizar a UI.
4. Registra logs de auditoria através da função `createLog`.

### 2.3. Modelo de Dados (Firestore)

O Firestore é o banco de dados principal. As coleções mais importantes são:

- **`users`**: Perfis de usuários com papéis, permissões e unidades associadas.
- **`units`**: Armazena as informações de cada clínica. Contém subcoleções para `services` e `healthPlans`.
- **`patients`**: Perfis dos pacientes. Contém subcoleções para `evolutionRecords`, `documents` e `familyMembers`.
- **`appointments`**: Todos os agendamentos, individuais ou em grupo.
- **`therapyGroups`**: Define a estrutura dos grupos de terapia (quem participa).
- **`assessments`**: Armazena os resultados das avaliações e anamneses preenchidas.
- **`logs`**: Registros de auditoria de todas as ações importantes no sistema.
- **`notifications`**: Notificações geradas pelo sistema para os usuários.
- **`timeBlocks`**: Bloqueios de tempo na agenda (ex: reuniões, feriados).

## 3. Detalhamento das Funcionalidades

### 3.1. Autenticação e Autorização
- **Login**: `src/app/(auth)/login/page.tsx` utiliza o `AuthContext` para autenticar via Firebase Auth.
- **Controle de Acesso**: O acesso às páginas e funcionalidades é controlado pela `role` do `currentUser` (`Admin`, `Coordinator`, `Therapist`, `Receptionist`). Verificações são feitas tanto no frontend (para mostrar/ocultar UI) quanto no backend (nas Server Actions).
- **Layout de Autenticação**: O `src/app/(auth)/layout.tsx` provê um layout simples para as páginas de login, enquanto o `src/app/(dashboard)/layout.tsx` protege as rotas do painel principal, redirecionando usuários não autenticados.

### 3.2. Multi-Unidade (Tenancy)
- O sistema é projetado para gerenciar múltiplas clínicas (unidades).
- O `UnitSwitcher` no header permite que usuários com acesso a mais de uma unidade troquem o contexto.
- A maioria das consultas ao Firestore é filtrada pelo `selectedUnitId` para garantir o isolamento dos dados.
- Uma `unitId` especial, "central", é usada para recursos globais (como planos de saúde aplicáveis a todas as unidades).

### 3.3. Gestão de Pacientes
- **Listagem**: `/patients` exibe uma tabela de pacientes filtrada por unidade.
- **Criação**: `/patients/new` implementa um fluxo crucial de 2 passos para evitar duplicatas:
    1. Busca global pelo nome ou CPF do paciente.
    2. Se encontrado, permite vincular o paciente existente à unidade atual (`linkPatientToUnitAction`).
    3. Se não encontrado, exibe o formulário de criação.
- **Detalhes do Paciente**: `/patients/[id]` é uma visão detalhada com abas, onde todas as informações clínicas e administrativas do paciente são gerenciadas (evoluções, plano terapêutico, documentos, etc.).
- **Mesclagem**: `/merge-patients` é uma ferramenta poderosa para Admins, que permite combinar dois registros de pacientes duplicados em um só, reassociando todos os agendamentos, documentos e evoluções.

### 3.4. Agenda e Agendamentos
- **Visualizações**: A página `/schedule` oferece visualizações de Dia, Semana e Mês.
- **Lógica de Layout**: Os componentes `DailyView` e `WeeklyView` contêm uma lógica complexa (`calculateAppointmentLayout`) para renderizar agendamentos sobrepostos lado a lado, calculando dinamicamente a largura e a posição de cada evento.
- **Agendamentos em Grupo**: São implementados criando múltiplos documentos de `appointment`, um para cada paciente do grupo, todos compartilhando o mesmo `groupId`. A UI então agrupa esses eventos visualmente.
- **Disponibilidade**: A agenda renderiza os horários de trabalho, planejamento e supervisão definidos em `user.availability`, além de bloqueios gerais da coleção `timeBlocks`.

### 3.5. Documentação Clínica
- **Registros de Evolução**: Armazenados na subcoleção `patients/[id]/evolutionRecords`. Podem ser criados com base em modelos de texto simples ou modelos estruturados.
- **Modelos (Templates)**: A página `/templates` permite que terapeutas criem modelos para evoluções e avaliações. Os modelos são armazenados na coleção `evolutionTemplates` e são específicos de cada usuário (`userId`).
- **Avaliações e Anamnese**: A página `/assessments` permite criar avaliações com base nos modelos estruturados. Os resultados são salvos na coleção `assessments`.
- **Plano Terapêutico Individual (PTI)**: Gerenciado na aba "Plano Terapêutico" do paciente. Os dados são complexos e aninhados, e salvos diretamente no documento do `patient`. Inclui metas e objetivos de curto prazo com critérios de maestria.
- **Progresso de Objetivos**: As evoluções podem ser vinculadas a objetivos específicos do PTI. Os dados de progresso (ex: % de acerto, frequência) são salvos junto com o registro de evolução. O gráfico de progresso na tela do PTI visualiza esses dados.

### 3.6. Relatórios e Análises
- A página `/analysis` é a central de BI do sistema.
- **Hidratação**: Esta página realiza cálculos complexos baseados em datas. Para evitar erros de hidratação do Next.js, toda a lógica de cálculo foi movida para `useEffect`, garantindo que seja executada apenas no lado do cliente.
- **Gráficos**: Utiliza `recharts` e um wrapper customizado (`ChartContainer`) para exibir os dados.

### 3.7. Administração do Sistema
- **Gestão de Usuários e Unidades**: Páginas `/users` e `/units` permitem que Admins gerenciem o sistema.
- **Logs**: A página `/logs` exibe um feed de auditoria de todas as ações importantes, gravadas na coleção `logs` pela função `createLog`.
- **Notificações**: Admins podem enviar notificações para todos os usuários, por função, por unidade ou para usuários específicos. As notificações não lidas são exibidas no header.
