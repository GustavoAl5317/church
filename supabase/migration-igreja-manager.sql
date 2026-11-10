-- ============================================
-- MIGRAÇÃO: Igreja Manager
-- Alinha o banco com o relatório do projeto:
--   - papel "membro" e status ativo/inativo para usuários
--   - senhas persistidas na tabela user_passwords
--   - pedidos de recuperação de senha (aprovados pelo administrador)
--   - membros: batizado e função (membro, líder, voluntário)
--   - eventos: tipo, horário, local, capacidade e presença
--   - dízimos e ofertas por membro
-- Execute este script no SQL Editor do Supabase se já tiver rodado o schema.sql.
-- Ele pode ser executado mais de uma vez sem erro.
-- ============================================

-- USERS --------------------------------------------------------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'tesouraria', 'secretaria', 'pastor', 'auditor', 'membro'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- PASSWORD RESET REQUESTS -------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'recusado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests(status);

-- MEMBERS ------------------------------------------------------
ALTER TABLE members ADD COLUMN IF NOT EXISTS baptized BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_role VARCHAR(20) NOT NULL DEFAULT 'membro';
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_member_role_check;
ALTER TABLE members ADD CONSTRAINT members_member_role_check
    CHECK (member_role IN ('membro', 'lider', 'voluntario'));

-- EVENTS -------------------------------------------------------
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) NOT NULL DEFAULT 'outro';
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE events ADD CONSTRAINT events_event_type_check
    CHECK (event_type IN ('culto', 'reuniao', 'retiro', 'conferencia', 'outro'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time VARCHAR(5);
ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER CHECK (capacity IS NULL OR capacity >= 0);
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance INTEGER NOT NULL DEFAULT 0 CHECK (attendance >= 0);

-- TITHES (Dízimos e Ofertas) ----------------------------------
CREATE TABLE IF NOT EXISTS tithes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    member_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('dizimo', 'oferta')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'outros')),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'pendente')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tithes_date ON tithes(date);
CREATE INDEX IF NOT EXISTS idx_tithes_member_id ON tithes(member_id);
CREATE INDEX IF NOT EXISTS idx_tithes_type ON tithes(type);

DROP TRIGGER IF EXISTS update_tithes_updated_at ON tithes;
CREATE TRIGGER update_tithes_updated_at BEFORE UPDATE ON tithes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE password_reset_requests IS 'Pedidos de recuperação de senha, liberados por um administrador';
COMMENT ON TABLE tithes IS 'Dízimos e ofertas registrados por membro';
