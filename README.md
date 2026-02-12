# Sistema de Gestão Financeira para Igrejas

Sistema completo de gestão financeira desenvolvido para igrejas, com integração ao Supabase.

## Funcionalidades

- **Cultos**: Gerenciamento de cultos com suporte a cultos recorrentes semanais
- **Caixa**: Controle de caixa geral e por eventos
- **Contas a Pagar**: Gestão de fornecedores e contas
- **Eventos**: Organização de eventos especiais
- **Membros**: Cadastro e gestão de membros
- **Dashboard**: Visão geral das finanças

## Configuração

### 1. Instalar dependências

```bash
npm install
# ou
pnpm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL em `supabase/schema.sql` no SQL Editor do Supabase
3. Copie o arquivo de exemplo de variáveis de ambiente:

```bash
# Windows
copy env.example.txt .env

# Linux/Mac
cp env.example.txt .env
```

4. Preencha as variáveis no arquivo `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase (encontre em Settings > API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase (encontre em Settings > API)

**Importante**: Reinicie o servidor após criar/editar o arquivo `.env`

### 3. Executar o projeto

```bash
npm run dev
# ou
pnpm dev
```

## Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- `users`: Usuários do sistema
- `members`: Membros da igreja
- `service_templates`: Templates de cultos recorrentes
- `services`: Cultos individuais
- `service_incomes`: Entradas financeiras dos cultos
- `events`: Eventos especiais
- `cash_boxes`: Caixas (geral e por evento)
- `cash_transactions`: Transações financeiras
- `suppliers`: Fornecedores
- `bills_payable`: Contas a pagar

## Cultos Recorrentes

O sistema suporta criação de cultos recorrentes que são gerados automaticamente toda semana:

1. Ao criar um novo culto, ative a opção "Culto Recorrente"
2. Selecione o dia da semana e horário
3. O sistema gerará automaticamente os cultos para as próximas semanas
4. Use o botão "Gerar Cultos Semanais" na página de cultos para gerar mais cultos

## Desenvolvimento

### Estrutura de Pastas

- `app/`: Páginas do Next.js
- `components/`: Componentes reutilizáveis
- `lib/`: Utilitários e serviços
  - `services/`: Funções de acesso ao Supabase
  - `constants.ts`: Constantes do sistema
  - `types.ts`: Definições de tipos TypeScript
  - `supabase.ts`: Cliente Supabase
- `supabase/`: Scripts SQL

## Próximos Passos

- [ ] Implementar autenticação de usuários
- [ ] Adicionar permissões por role
- [ ] Implementar upload de anexos
- [ ] Adicionar relatórios e exportação
- [ ] Implementar notificações em tempo real
