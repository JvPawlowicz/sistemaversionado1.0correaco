'use server';

import { configureGenkit } from 'genkit'; // Importe 'configureGenkit' de 'genkit'
import { googleCloud } from '@genkit-ai/googleai'; // Importe 'googleCloud' do novo pacote

// Assumindo que você quer configurar o Genkit aqui,
// e 'ai' não é uma exportação direta de 'genkit', mas sim o resultado de sua configuração.
// O ideal é que configureGenkit seja chamado uma vez na inicialização do servidor.

// A estrutura comum é chamar configureGenkit e exportar a instância, se necessário,
// ou apenas configurar e deixar o Genkit gerenciar suas ações/fluxos.

configureGenkit({
  plugins: [
    googleCloud({
      projectId: process.env.GOOGLE_CLOUD_PROJECT, // Use variáveis de ambiente para o ID do projeto
      location: 'us-central1', // Sua região, ou de uma variável de ambiente
    }),
  ],
  // Outras configurações do Genkit, como:
  // logLevel: 'debug', // ou 'info', 'error'
  // flowRegistry: {}, // Se você tiver fluxos definidos aqui
});

// Se você tinha um 'export const ai = genkit()' isso não é o padrão.
// O Genkit é configurado globalmente e suas ações/fluxos são registrados nele.
// Remova 'export const ai = genkit({...});'
// E certifique-se que seus fluxos/ações estão usando as funções do genkit globalmente.