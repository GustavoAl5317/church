# Scripts SQL do Banco de Dados

Este diretório contém os scripts SQL para criar e configurar o banco de dados do sistema.

## Arquivos

- `schema.sql` - Script principal para criar todas as tabelas, índices, triggers e funções

## Como Usar

### 1. No Supabase

1. Acesse o painel do Supabase: https://supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone no menu lateral)
4. Clique em **New Query**
5. Abra o arquivo `schema.sql`
6. Copie todo o conteúdo
7. Cole no editor SQL do Supabase
8. Clique em **Run** (ou pressione Ctrl+Enter)
9. Aguarde a confirmação de que todas as tabelas foram criadas

### 2. Verificar se Funcionou

Após executar o script, você deve ver:
- ✅ Todas as tabelas criadas
- ✅ Índices criados
- ✅ Triggers criados
- ✅ Funções criadas

Você pode verificar no menu **Table Editor** do Supabase se todas as tabelas aparecem.

## Estrutura das Tabelas

### users
Usuários do sistema com diferentes níveis de acesso (admin, tesouraria, secretaria, pastor, auditor).

### user_passwords (Opcional)
Armazena hashes de senha dos usuários. Esta tabela é opcional, pois o sistema pode usar armazenamento em memória.

### members
Membros e visitantes da igreja com informações pessoais e status.

### service_templates
Templates de cultos que podem ser recorrentes (ex: Culto de Domingo às 9h).

### services
Cultos individuais agendados, podem ser gerados a partir de templates.

### service_incomes
Entradas financeiras registradas em cada culto (dízimo, oferta, etc).

### events
Eventos especiais da igreja (retiros, conferências, etc).

### cash_boxes
Caixas financeiras (geral ou específica de um evento).

### cash_transactions
Todas as transações financeiras do sistema (entradas, saídas, transferências).

### suppliers
Fornecedores e prestadores de serviço.

### bills_payable
Contas a pagar da igreja.

## Notas Importantes

1. **UUID**: Todas as tabelas usam UUID como chave primária para melhor distribuição e segurança.

2. **Timestamps**: Todas as tabelas têm `created_at` e `updated_at` que são atualizados automaticamente.

3. **Constraints**: O banco tem várias constraints (CHECK) para garantir integridade dos dados.

4. **Índices**: Foram criados índices nas colunas mais consultadas para melhor performance.

5. **Triggers**: Triggers automáticos atualizam o campo `updated_at` quando registros são modificados.

6. **Foreign Keys**: Todas as relações entre tabelas são garantidas por foreign keys com ações apropriadas (CASCADE, SET NULL, RESTRICT).

## Troubleshooting

### Erro: "relation already exists"
Se você já executou o script antes, algumas tabelas podem já existir. O script usa `CREATE TABLE IF NOT EXISTS`, então é seguro executar novamente.

### Erro: "permission denied"
Certifique-se de estar usando uma conta com permissões de administrador no Supabase.

### Erro: "extension uuid-ossp does not exist"
O Supabase já tem essa extensão habilitada por padrão. Se aparecer esse erro, tente remover a linha `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` do script.

## Próximos Passos

Após executar o script:
1. Configure as variáveis de ambiente no arquivo `.env`
2. Reinicie o servidor de desenvolvimento
3. Acesse a aplicação e faça login com o usuário admin padrão
