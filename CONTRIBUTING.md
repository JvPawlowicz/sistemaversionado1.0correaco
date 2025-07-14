# Guia de Contribuição - Synapse+

Bem-vindo(a) ao desenvolvimento do Synapse+! Para garantir a qualidade e a consistência do código, por favor, siga estas diretrizes.

## Fluxo de Trabalho de Desenvolvimento

Antes de fazer o `commit` de qualquer alteração, é **obrigatório** executar os seguintes comandos localmente para validar seu código. Um hook de pre-commit foi configurado para executar o linter automaticamente, mas a verificação manual do build é crucial.

### 1. Verificar Linting e Formatação

Este comando verifica se há problemas de estilo e formatação, corrigindo a maioria deles automaticamente.

```bash
npm run lint
```

### 2. Verificar Tipagem (TypeScript)

Este comando executa o compilador TypeScript para garantir que não há erros de tipo em todo o projeto.

```bash
npm run typecheck
```

### 3. Realizar Build de Produção Local (Crucial!)

Este é o passo mais importante. Ele simula o processo de build que ocorre no ambiente de deploy e é a melhor maneira de prever erros de compilação.

```bash
npm run build
```

**Nenhum código deve ser enviado ao repositório se o comando `npm run build` falhar localmente.** A correção desses erros antes do `push` é essencial para manter nosso pipeline de CI/CD limpo e nossos deploys confiáveis.
