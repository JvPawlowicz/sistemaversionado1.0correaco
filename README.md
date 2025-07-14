# Visão Geral da Arquitetura e Funcionalidades do Sistema Synapse+

Este documento serve como um guia técnico abrangente para o sistema de gestão de clínicas Synapse+. Ele é destinado a desenvolvedores (humanos ou IA) para entender a arquitetura, os modelos de dados e a lógica de negócios da aplicação.

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
- **Controle de Acesso**: O acesso às páginas e funcionalidades é controlado pela `role` do `currentUser`. Verificações são feitas tanto no frontend (para mostrar/ocultar UI) quanto no backend (nas Server Actions). A seguir, o detalhamento de cada papel:
    -   **Administrador (`Admin`):**
        -   **Acesso Total:** Possui controle irrestrito sobre todo o sistema.
        -   **Gestão Global:** É o único que pode criar, editar e excluir Unidades, Usuários e Planos de Saúde para todas as clínicas.
        -   **Operações Críticas:** Pode realizar ações de alto impacto como a mesclagem de pacientes duplicados.
        -   **Visibilidade Completa:** Tem acesso a todos os dados de todas as unidades, incluindo dados clínicos e financeiros.
        -   **Configurações:** Pode enviar notificações para todo o sistema e visualizar os logs de auditoria completos.

    -   **Coordenador (`Coordinator`):**
        -   **Gestão da Unidade:** Atua como um gerente para as unidades às quais está associado. Pode configurar os serviços, salas e visualizar os dados de desempenho de toda a equipe da unidade.
        -   **Acesso Clínico:** Possui as mesmas permissões de um terapeuta, podendo gerenciar pacientes, criar evoluções, planos terapêuticos e gerenciar sua própria agenda.
        -   **Visão de Equipe:** Tem acesso à página de "Desempenho da Equipe" e aos relatórios de análise da unidade.

    -   **Terapeuta (`Therapist`):**
        -   **Foco Clínico:** O acesso é centrado na atividade clínica.
        -   **Gestão de Pacientes:** Pode visualizar e gerenciar os detalhes dos seus pacientes, registrar evoluções, criar e gerenciar planos terapêuticos (PTI) e avaliações.
        -   **Agenda Pessoal:** Visualiza e gerencia apenas os seus próprios agendamentos.
        -   **Escopo Limitado:** O acesso é restrito aos pacientes e agendamentos da unidade selecionada.

    -   **Recepcionista (`Receptionist`):**
        -   **Foco Operacional:** Acesso focado na gestão do fluxo da clínica.
        -   **Gestão da Agenda:** Pode visualizar e gerenciar a agenda de **todos os profissionais** da unidade, incluindo criar, editar e cancelar agendamentos.
        -   **Gestão de Pacientes:** Pode criar novos pacientes e editar seus dados cadastrais (mas não tem acesso a dados clínicos como evoluções ou planos terapêuticos).
        -   **Visão da Unidade:** Visualiza o painel com dados gerais da unidade, como total de agendamentos para o dia.
- **Layout de Autenticação**: O `src/app/(auth)/layout.tsx` provê um layout simples para as páginas de login, enquanto o `src/app/(dashboard)/layout.tsx` protege as rotas do painel principal, redirecionando usuários não autenticados.

### 3.2. Dashboard (`/dashboard`)

O Dashboard é a página inicial do sistema e serve como um painel de controle rápido, apresentando os indicadores mais relevantes com base na função do usuário logado.

-   **Visão Geral e KPIs por Função:** A principal característica do Dashboard é a sua capacidade de se adaptar ao usuário.
    -   **Para Terapeutas:** O foco é no desempenho individual. Os cards de estatísticas (KPIs) exibem:
        -   `Meus Agendamentos de Hoje`: Uma contagem de sessões que o terapeuta tem no dia atual.
        -   `Meus Atendimentos no Mês`: Uma contagem de sessões realizadas pelo terapeuta no mês corrente.
        -   `Meus Pacientes Ativos`: O número de pacientes únicos com status "Ativo" que estão sob os cuidados diretos do terapeuta.
    -   **Para Admins, Coordenadores e Recepcionistas:** A visão é macro, focada na operação da unidade selecionada. Os KPIs são:
        -   `Pacientes Ativos`: O número total de pacientes com status "Ativo" na unidade.
        -   `Agendamentos para Hoje`: O número total de agendamentos na unidade para o dia atual.
        -   `Terapeutas na Unidade`: A contagem de usuários com a função "Therapist" associados à unidade selecionada.

-   **Gráfico de Atendimentos por Disciplina:** Este gráfico de barras oferece uma visão geral dos serviços mais utilizados na clínica. Ele processa todos os `appointments` do último mês para a unidade selecionada e os agrupa pelo `serviceName`, exibindo a contagem total de atendimentos para cada serviço.

-   **Lista de Próximos Agendamentos:** Para manter o usuário informado, este componente filtra os `appointments` para exibir os 5 próximos compromissos.
    -   **Para Terapeutas:** Mostra apenas os seus próprios agendamentos futuros.
    -   **Para Outras Funções:** Mostra todos os agendamentos futuros da unidade.
    -   Cada item exibe o avatar e o nome do paciente, o nome do profissional e a data/hora do agendamento, permitindo uma visualização rápida da agenda futura.

### 3.3. Gestão de Pacientes

Este módulo é central para o sistema e foi projetado com um foco rigoroso na integridade dos dados e na prevenção de duplicatas em um ambiente multi-unidade.

-   **Listagem (`/patients`):** A tela principal exibe uma tabela de todos os pacientes associados à unidade selecionada. A tabela é paginada e permite buscas rápidas por nome ou CPF. Também inclui filtros por plano de saúde. Para administradores, a tela exibe uma **sugestão de otimização**, alertando sobre pacientes com nomes idênticos que são candidatos à mesclagem.

-   **Fluxo de Criação Anti-Duplicidade (`/patients/new`):** A criação de um novo paciente é um processo deliberado de duas etapas para garantir a integridade dos dados em toda a rede de clínicas:
    1.  **Busca Global:** O primeiro passo obriga o usuário a realizar uma busca global pelo nome ou CPF do paciente. Esta busca (`searchPatientsGloballyAction`) verifica **todas as unidades** para ver se o paciente já existe no sistema.
    2.  **Vinculação ou Criação:**
        -   **Se o paciente é encontrado:** O sistema exibe o perfil existente e informa em quais unidades ele já está cadastrado. O usuário pode então usar a ação `linkPatientToUnitAction` para simplesmente **vincular** o paciente existente à unidade atual, sem criar um novo registro. Isso mantém um prontuário único para o paciente em toda a organização.
        -   **Se o paciente não é encontrado:** Somente após a busca não retornar resultados, o sistema habilita o formulário para a criação de um novo paciente, garantindo que não haja duplicatas.

-   **Detalhes do Paciente (`/patients/[id]`):** Esta é a visão 360º do paciente, organizada em abas para facilitar o acesso às informações:
    -   **Evolução:** Um feed cronológico de todos os registros de evolução (`evolutionRecords`). Permite a criação de novos registros, que podem ser baseados em modelos (templates) para agilizar o preenchimento.
    -   **Plano Terapêutico:** Visualiza e gerencia o Plano Terapêutico Individual (PTI), incluindo metas de longo prazo e objetivos de curto prazo com critérios de maestria. Cada objetivo pode ter seu progresso rastreado e visualizado através de um gráfico.
    -   **Documentos:** Permite o upload e a visualização de arquivos associados ao paciente (como exames e relatórios), que são armazenados na subcoleção `documents`.
    -   **Familiares:** Gerencia uma lista de contatos e familiares (`familyMembers`), com informações como nome, parentesco e telefone.
    -   **Perfil Completo:** Exibe todos os dados cadastrais do paciente (informações pessoais, de contato, filiação e clínicas) em um só lugar para fácil consulta.

-   **Mesclagem de Pacientes (`/merge-patients`):** Uma ferramenta administrativa poderosa e crítica, projetada para corrigir erros de duplicação.
    -   **Funcionalidade:** Permite que um administrador selecione dois registros de pacientes duplicados (um "principal" a ser mantido e um "secundário" a ser excluído).
    -   **Processo Atômico:** Ao confirmar, a `mergePatientsAction` executa um processo em lote (batch) no Firestore que:
        1.  Transfere todos os registros associados (agendamentos, evoluções, documentos, etc.) do paciente secundário para o principal.
        2.  Atualiza os campos do paciente principal com informações do secundário, caso os campos do principal estejam vazios.
        3.  Remove o paciente secundário da lista de participantes em grupos de terapia.
        4.  Exclui permanentemente o registro do paciente secundário.
    -   **Ação Irreversível:** A interface destaca que esta é uma ação permanente e que deve ser usada com extrema cautela para manter a integridade do histórico do paciente.

### 3.4. Agenda e Agendamentos
- **Visualizações**: A página `/schedule` oferece visualizações de Dia, Semana e Mês através de abas que controlam qual componente de visualização é renderizado.
- **Lógica de Layout (Overlap)**: Esta é uma das partes mais complexas da UI. Os componentes `DailyView` e `WeeklyView` contêm uma função sofisticada (`calculateAppointmentLayout`). Esta função recebe uma lista de agendamentos para um dia específico e, se detectar que dois ou mais eventos se sobrepõem no tempo, calcula dinamicamente a `largura` e a `posição horizontal` de cada evento. Ela os organiza em "colunas virtuais" para que fiquem lado a lado, em vez de um sobre o outro, maximizando o uso do espaço visual e garantindo que todos os agendamentos sejam visíveis e clicáveis.
- **Agendamentos em Grupo**: A funcionalidade de grupo é implementada de forma a permitir rastreamento individual. Em vez de um único documento de agendamento com múltiplos pacientes, o sistema cria vários documentos de `appointment`, um para cada paciente do grupo. A chave é que todos esses documentos compartilham o mesmo `groupId`. Isso permite que o status de cada paciente seja gerenciado individualmente (ex: um paciente compareceu, outro faltou). Na interface, a lógica dos componentes de visualização (`DailyView`, `WeeklyView`) identifica os agendamentos com o mesmo `groupId` e os renderiza como um único bloco visual para clareza, exibindo o nome do grupo e a contagem de participantes.
- **Renderização de Disponibilidade**: A grade da agenda não é apenas um fundo em branco. Ela renderiza dinamicamente os horários de cada profissional. Isso é feito combinando duas fontes de dados:
    1. **`user.availability`**: Um campo no documento de cada usuário que armazena seus horários recorrentes de trabalho (`Free`), planejamento (`Planning`) e supervisão (`Supervision`) para cada dia da semana.
    2. **`timeBlocks`**: Uma coleção separada no Firestore que armazena bloqueios de tempo únicos e não recorrentes, como reuniões de equipe, feriados ou outros eventos que bloqueiam a agenda para toda a unidade ou para usuários específicos.

### 3.5. Documentação Clínica
- **Registros de Evolução**: Armazenados na subcoleção `patients/[id]/evolutionRecords`. Podem ser criados com base em modelos de texto simples ou modelos estruturados.
- **Modelos (Templates)**: A página `/templates` permite que terapeutas criem modelos para evoluções e avaliações. Os modelos são armazenados na coleção `evolutionTemplates` e são específicos de cada usuário (`userId`).
- **Avaliações e Anamnese**: A página `/assessments` permite criar avaliações com base nos modelos estruturados. Os resultados são salvos na coleção `assessments`.
- **Plano Terapêutico Individual (PTI)**: Gerenciado na aba "Plano Terapêutico" do paciente. Os dados são complexos e aninhados, e salvos diretamente no documento do `patient`. Inclui metas e objetivos de curto prazo com critérios de maestria.
- **Progresso de Objetivos**: As evoluções podem ser vinculadas a objetivos específicos do PTI. Os dados de progresso (ex: % de acerto, frequência) são salvos junto com o registro de evolução. O gráfico de progresso na tela do PTI visualiza esses dados.

### 3.6. Análise e Relatórios (`/analysis`)
Este módulo serve como a central de Business Intelligence (BI) da clínica, permitindo que coordenadores e administradores explorem os dados, identifiquem tendências e gerem relatórios detalhados.

-   **Arquitetura e Hidratação:** A página realiza cálculos complexos com base em períodos. Para evitar erros de hidratação do Next.js (diferenças entre o conteúdo gerado no servidor e o renderizado no cliente), toda a lógica de cálculo de dados e manipulação de datas foi movida para um hook `useEffect`. Isso garante que as operações sejam executadas apenas no navegador do cliente, garantindo estabilidade.

-   **Funcionalidades por Aba:**
    -   **Visão Geral e KPIs:** Apresenta indicadores chave de desempenho, como taxa de ocupação e de faltas, e um gráfico de pizza com a distribuição geral dos status dos agendamentos (realizado, faltou, etc.) nos últimos 30 dias.
    -   **Relatório de Agendamentos:** Uma ferramenta poderosa que permite filtrar todos os agendamentos por um intervalo de datas, paciente, profissional, serviço, plano de saúde e status. Os resultados são exibidos em uma tabela e podem ser exportados para um documento **PDF**.
    -   **Relatório de Evoluções:** Similar ao de agendamentos, permite gerar relatórios de todos os registros de evolução com base em período, paciente e profissional. Também oferece exportação para PDF.
    -   **Análise Demográfica:** Fornece uma visão aprofundada do perfil dos pacientes da unidade, com gráficos de barra e de pizza exibindo a distribuição por faixa etária, gênero, estado civil, plano de saúde e uma lista com os 10 diagnósticos mais comuns.

### 3.7. Desempenho da Equipe (`/team-performance`)
Esta página é dedicada a analisar a produtividade e os resultados dos profissionais da clínica, fornecendo aos coordenadores e administradores uma visão clara do desempenho da equipe.

-   **Análise por Período:** Permite filtrar os dados por um intervalo de datas para analisar o desempenho em períodos específicos (ex: último mês, último trimestre).
-   **Métricas por Profissional:** Exibe uma tabela consolidada com as seguintes métricas para cada terapeuta na unidade:
    -   **Atendimentos Realizados:** Contagem total de agendamentos com status "Realizado".
    -   **Taxa de Ocupação:** A porcentagem de agendamentos (não cancelados) que foram efetivamente realizados.
    -   **Taxa de Faltas:** A porcentagem de agendamentos (não cancelados) em que o paciente faltou.
    -   **Evoluções Registradas:** O número total de registros de evolução criados pelo profissional no período, um indicador de documentação clínica em dia.

### 3.8. Planejamento e Disponibilidade (`/planning`)
Este módulo é crucial para a organização da agenda da clínica e é dividido em duas funcionalidades principais, acessíveis a coordenadores e administradores.

-   **Disponibilidade de Profissionais:**
    -   Permite configurar os horários de trabalho **recorrentes** para cada profissional em cada dia da semana.
    -   É possível definir diferentes tipos de horário: `Livre` (para agendamentos de pacientes), `Planejamento` e `Supervisão`.
    -   Esses horários são usados para renderizar o fundo da agenda nas visualizações de Dia e Semana, mostrando claramente os períodos de trabalho de cada um e bloqueando agendamentos em horários de planejamento ou supervisão.

-   **Bloqueios Gerais:**
    -   Permite criar bloqueios de tempo **únicos e não recorrentes** na agenda, como feriados, reuniões de equipe, eventos ou treinamentos.
    -   Um bloqueio pode ser aplicado a **toda a unidade** ou a **profissionais específicos**.
    -   Esses bloqueios têm prioridade sobre a disponibilidade normal e são exibidos de forma destacada na agenda, impedindo a criação de agendamentos nesses horários.

### 3.9. Administração do Sistema
- **Gestão de Usuários e Unidades**: Páginas `/users` e `/units` permitem que Admins gerenciem o sistema.
- **Logs**: A página `/logs` exibe um feed de auditoria de todas as ações importantes, gravadas na coleção `logs` pela função `createLog`.
- **Notificações**: Admins podem enviar notificações para todos os usuários, por função, por unidade ou para usuários específicos. As notificações não lidas são exibidas no header.
- **Multi-Unidade (Tenancy)**: O sistema é projetado para gerenciar múltiplas clínicas (unidades). O `UnitSwitcher` no header permite que usuários com acesso a mais de uma unidade troquem o contexto. A maioria das consultas ao Firestore é filtrada pelo `selectedUnitId` para garantir o isolamento dos dados. Uma `unitId` especial, "central", é usada para recursos globais (como planos de saúde aplicáveis a todas as unidades).

## 4. Práticas e Fluxo de Desenvolvimento

Para garantir a qualidade e a estabilidade do código, adotamos as seguintes práticas de desenvolvimento:

### 4.1. Verificação de Qualidade Local

Antes de enviar qualquer código para o repositório (`git commit`), é crucial validar o código localmente. Para isso, instalamos um **gateway de qualidade** que executa automaticamente verificações de linting.

- **`Husky` e `lint-staged`**: Essas ferramentas garantem que o comando `eslint --fix` seja executado em todos os arquivos modificados. Isso corrige automaticamente problemas de formatação e aponta erros de linting, impedindo que código de baixa qualidade seja commitado.

### 4.2. Comandos Essenciais para o Desenvolvedor

Antes de um `git push`, todo desenvolvedor deve executar os seguintes comandos para garantir que o código está pronto para integração:

1.  **Verificar Linting:**
    ```bash
    npm run lint
    ```
    Este comando verifica se há problemas de estilo ou de código que não seguem as boas práticas definidas.

2.  **Verificar Tipagem (TypeScript):**
    ```bash
    npm run typecheck
    ```
    Este comando executa o compilador TypeScript (`tsc`) sem gerar arquivos (`--noEmit`) para garantir que não há erros de tipo em todo o projeto. É um passo crucial para evitar erros de runtime.

3.  **Realizar Build de Produção Local:**
    ```bash
    npm run build
    ```
    Este comando simula o processo de build que ocorre no ambiente de deploy. É a verificação final e mais importante, pois pode capturar erros de tipagem, de dependências e de configuração que outros comandos podem não detectar. **Um build bem-sucedido localmente aumenta drasticamente a chance de um deploy bem-sucedido.**

Seguir este fluxo de trabalho minimiza a chance de falhas no pipeline de CI/CD e garante uma base de código mais saudável e manutenível.
