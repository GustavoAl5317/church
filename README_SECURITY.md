# Segurança do Sistema

Este documento descreve as medidas de segurança implementadas no sistema de gestão.

## Autenticação e Autorização

### Hash de Senhas
- **Tecnologia**: Web Crypto API (SHA-256 com salt)
- **Armazenamento**: Hashes são armazenados com salt único por usuário
- **Verificação**: Comparação timing-safe para prevenir ataques de timing

### Sessões
- **Duração**: 7 dias
- **Renovação Automática**: Sessões são renovadas automaticamente 1 dia antes de expirar
- **Tokens**: Tokens seguros gerados usando Web Crypto API
- **Atividade**: Última atividade é rastreada e atualizada automaticamente
- **Expiração**: Sessões expiram após 30 dias de inatividade

### Proteção de Rotas
- **Middleware**: Middleware Next.js para proteção de rotas
- **Componente ProtectedRoute**: Componente React para proteção de componentes
- **Verificação de Role**: Suporte para verificação de permissões por role

## Recuperação de Senha

- **Processo**: Usuário informa email e define nova senha
- **Validação**: Senha deve ter no mínimo 6 caracteres
- **Segurança**: Nova senha é hasheada antes de ser armazenada

## Boas Práticas Implementadas

1. **Senhas nunca são armazenadas em texto plano**
2. **Tokens de sessão são únicos e não previsíveis**
3. **Sessões expiram automaticamente**
4. **Atividade do usuário é monitorada**
5. **Redirecionamento seguro após login**

## Melhorias Futuras Recomendadas

1. **Tabela de Senhas no Banco**: Criar tabela `user_passwords` para armazenar hashes de forma persistente
2. **Rate Limiting**: Implementar limite de tentativas de login
3. **2FA**: Adicionar autenticação de dois fatores
4. **Logs de Auditoria**: Registrar todas as tentativas de login
5. **HTTPS Obrigatório**: Garantir que todas as comunicações sejam criptografadas
6. **CSP Headers**: Implementar Content Security Policy
7. **CSRF Protection**: Adicionar proteção contra CSRF

## Configuração de Segurança

### Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública do Supabase

### Banco de Dados
Recomenda-se configurar Row Level Security (RLS) no Supabase para proteção adicional.

## Usuário Admin Padrão

**Credenciais Iniciais:**
- Email: `admin@livresouemcristo.com.br`
- Senha: `admin123`

**⚠️ IMPORTANTE**: Altere a senha do admin padrão após o primeiro login!
