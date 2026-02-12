# Guia de Configuração - Sistema de Gestão Financeira para Igrejas

## Passo a Passo para Configurar o Supabase

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha:
   - **Name**: Nome do seu projeto (ex: "church-management")
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima
5. Clique em "Create new project" e aguarde a criação (pode levar alguns minutos)

### 2. Executar o Schema SQL

1. No painel do Supabase, vá em **SQL Editor** (ícone no menu lateral)
2. Clique em **New Query**
3. Abra o arquivo `supabase/schema.sql` deste projeto
4. Copie todo o conteúdo do arquivo
5. Cole no editor SQL do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a confirmação de que todas as tabelas foram criadas

### 3. Obter as Credenciais

1. No painel do Supabase, vá em **Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral
3. Você verá:
   - **Project URL**: Copie este valor
   - **anon public** key: Copie este valor (não a service_role key!)

### 4. Configurar Variáveis de Ambiente

1. No projeto, copie o arquivo `env.example.txt` para `.env`:
   ```bash
   # Windows
   copy env.example.txt .env
   
   # Linux/Mac
   cp env.example.txt .env
   ```

2. Abra o arquivo `.env` e preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

   Substitua pelos valores que você copiou no passo 3.

   **Importante**: Reinicie o servidor de desenvolvimento após criar ou editar o arquivo `.env`

### 5. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

Isso instalará o `@supabase/supabase-js` que foi adicionado ao `package.json`.

### 6. Testar a Conexão

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   pnpm dev
   ```

2. Acesse [http://localhost:3000](http://localhost:3000)
3. Tente criar um novo culto para testar a conexão

## Funcionalidades Implementadas

### ✅ Cultos Recorrentes

- Criação de templates de cultos que se repetem semanalmente
- Geração automática de cultos para as próximas semanas
- Botão "Gerar Cultos Semanais" na página de cultos

### ✅ Integração com Supabase

- Todas as operações de cultos estão integradas
- Dados são salvos e carregados do banco de dados
- Sem dados de teste/mock para cultos

## Próximos Passos (Ainda não implementados)

Os seguintes módulos ainda usam dados mock e precisam ser integrados:

- Membros
- Contas a Pagar
- Fornecedores
- Caixa
- Eventos
- Dashboard

## Troubleshooting

### Erro: "Missing Supabase environment variables"

- Verifique se o arquivo `.env` existe na raiz do projeto
- Confirme que as variáveis começam com `NEXT_PUBLIC_`
- Reinicie o servidor após alterar o `.env`

### Erro ao executar SQL

- Certifique-se de copiar todo o conteúdo do `schema.sql`
- Verifique se não há erros de sintaxe
- Tente executar as tabelas uma por uma se necessário

### Cultos não aparecem

- Verifique se as tabelas foram criadas corretamente
- Confirme que as credenciais estão corretas no `.env`
- Verifique o console do navegador para erros
