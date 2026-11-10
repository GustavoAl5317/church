# Igreja Manager

Sistema de gestão da Igreja Livre Sou em Cristo: membros, eventos, agenda, dízimos e finanças, com banco de dados no Supabase.

## Funcionalidades

- **Autenticação**: login com email e senha, sessão persistente, recuperação de senha liberada pelo administrador e troca de senha em "Meu Perfil"
- **Permissões por papel**: cada papel vê apenas o que pode acessar (regras em `lib/permissions.ts`)
- **Dashboard**: boas-vindas, números do mês e, para quem tem acesso, o resumo financeiro
- **Membros**: cadastro completo (inclui batismo e função), busca, filtro por status (ativo, inativo, visitante) e importação por CSV
- **Eventos**: tipo, local, horário, capacidade, registro de presença e taxa de ocupação
- **Agenda**: calendário mensal com cultos e eventos e lista de próximos eventos
- **Dízimos e Ofertas**: registro por membro, totais por tipo e período (só pastores e administradores)
- **Cultos**: cultos recorrentes semanais e fechamento com entradas por tipo
- **Caixa**: caixa geral e por evento, com transferências
- **Despesas**: contas a pagar, fornecedores, categorias e calendário
- **Relatório**: página com o relatório do projeto, exportável em PDF
- **Configurações**: usuários, papéis, matriz de permissões e pedidos de recuperação de senha

## Papéis

| Papel | Acesso |
|---|---|
| Administrador | Tudo, inclusive Configurações |
| Pastor | Membros, eventos, agenda, dízimos e financeiro |
| Secretaria | Membros, eventos, agenda e cultos |
| Tesouraria | Cultos, caixa e despesas; consulta eventos e agenda |
| Auditor/Conselho | Consulta do financeiro, eventos e agenda |
| Membro | Consulta de eventos e agenda |

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
   - **Banco que já existia?** Execute também `supabase/migration-igreja-manager.sql`. Ele adiciona o papel "membro", as senhas persistentes, a recuperação de senha, os campos novos de membros e eventos e a tabela de dízimos. Pode ser executado mais de uma vez.
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

### 4. Primeiro acesso

Na primeira vez que a tela de login abre, o sistema cria o administrador padrão:

- Email: `admin@livresouemcristo.com.br`
- Senha: `admin123`

**Troque essa senha em "Meu Perfil" logo após entrar** e cadastre os demais usuários em Configurações.

### Recuperação de senha

Na tela de login, "Esqueceu sua senha?" registra um pedido. O administrador vê os pedidos em
Configurações → Recuperação de senha, confirma a identidade da pessoa e gera uma senha provisória,
que a pessoa troca em "Meu Perfil".

## Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- `users`: Usuários do sistema
- `user_passwords`: Hashes das senhas (PBKDF2)
- `password_reset_requests`: Pedidos de recuperação de senha
- `members`: Membros da igreja
- `tithes`: Dízimos e ofertas por membro
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

- `app/`: Páginas do Next.js (`dashboard`, `membros`, `eventos`, `agenda`, `dizimos`, `cultos`, `caixa`, `contas-a-pagar`, `relatorio`, `configuracoes`, `perfil`)
- `components/`: Componentes reutilizáveis
  - `auth/`: Login, contexto de autenticação e proteção de rotas
- `hooks/use-auth.ts`: Usuário logado e permissões (`useAuth`)
- `lib/`: Utilitários e serviços
  - `permissions.ts`: Regras de acesso por papel
  - `services/`: Funções de acesso ao Supabase
  - `constants.ts`: Constantes do sistema
  - `types.ts`: Definições de tipos TypeScript
  - `supabase.ts`: Cliente Supabase
- `supabase/`: Scripts SQL

## Próximos Passos

- [x] Autenticação de usuários
- [x] Permissões por papel
- [ ] Mover a autenticação para o servidor (Supabase Auth + Row Level Security)
- [ ] Envio de email na recuperação de senha
- [ ] Upload de anexos
- [ ] Notificações em tempo real
