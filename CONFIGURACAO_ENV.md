# Como Configurar o Arquivo .env

## Passo a Passo

### 1. Obter as Credenciais do Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** (ícone de engrenagem no menu lateral)
4. Clique em **API** no menu lateral
5. Você verá duas informações importantes:
   - **Project URL**: Algo como `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: Uma chave longa que começa com `eyJ...`

### 2. Preencher o Arquivo .env

Abra o arquivo `.env` na raiz do projeto e adicione as seguintes linhas:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Exemplo real:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTE5MjAwMCwiZXhwIjoxOTYwNzY4MDAwfQ.exemplo
```

### 3. Verificar se Está Correto

O arquivo `.env` deve ter exatamente 2 linhas:
- Uma linha com `NEXT_PUBLIC_SUPABASE_URL=`
- Uma linha com `NEXT_PUBLIC_SUPABASE_ANON_KEY=`

**Importante:**
- Não adicione espaços antes ou depois do `=`
- Não use aspas nas variáveis
- Não deixe linhas em branco no início do arquivo
- Cada variável deve estar em uma linha separada

### 4. Reiniciar o Servidor

Após salvar o arquivo `.env`, **reinicie o servidor de desenvolvimento**:

1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente:
   ```bash
   npm run dev
   ```

### 5. Verificar se Funcionou

Se tudo estiver correto, você verá:
- ✅ A aplicação carrega sem erros
- ✅ Não aparece mais a mensagem "Missing Supabase environment variables"
- ✅ As páginas carregam dados do banco (mesmo que vazio inicialmente)

## Problemas Comuns

### Erro: "supabaseUrl is required"
- Verifique se a URL começa com `https://`
- Verifique se não há espaços extras
- Certifique-se de que copiou a URL completa

### Erro: "Invalid API key"
- Verifique se copiou a chave **anon public**, não a **service_role**
- A chave deve começar com `eyJ`
- Verifique se não há quebras de linha na chave

### A aplicação ainda mostra erro
- Certifique-se de ter **reiniciado o servidor** após criar/editar o `.env`
- Verifique se o arquivo está na **raiz do projeto** (mesmo nível que `package.json`)
- Verifique se o nome do arquivo é exatamente `.env` (não `.env.txt` ou `.env.local`)
