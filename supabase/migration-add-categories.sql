-- ============================================
-- MIGRAÇÃO: Adicionar sistema de categorias dinâmicas
-- Execute este script se já tiver executado o schema.sql anteriormente
-- ============================================

-- Criar tabela de categorias se não existir
CREATE TABLE IF NOT EXISTS bill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bill_categories_name ON bill_categories(name);
CREATE INDEX IF NOT EXISTS idx_bill_categories_active ON bill_categories(is_active);

-- Inserir categorias padrão
INSERT INTO bill_categories (name, description) VALUES
    ('Aluguel', 'Despesas com aluguel do imóvel'),
    ('Água', 'Conta de água'),
    ('Luz', 'Conta de energia elétrica'),
    ('Internet', 'Serviços de internet'),
    ('Som/Equipamentos', 'Equipamentos de som e áudio'),
    ('Manutenção', 'Manutenção e reparos'),
    ('Ação Social', 'Despesas com ações sociais'),
    ('Salários', 'Pagamento de salários'),
    ('Outros', 'Outras despesas')
ON CONFLICT (name) DO NOTHING;

-- Remover constraint CHECK da coluna category em bills_payable (se existir)
DO $$ 
BEGIN
    -- Tenta remover a constraint se ela existir
    ALTER TABLE bills_payable DROP CONSTRAINT IF EXISTS bills_payable_category_check;
EXCEPTION
    WHEN OTHERS THEN
        -- Se der erro, ignora (constraint pode não existir)
        NULL;
END $$;

-- Alterar coluna category para VARCHAR(100) se necessário
ALTER TABLE bills_payable 
    ALTER COLUMN category TYPE VARCHAR(100);

-- Adicionar coluna category_id se não existir
DO $$ 
BEGIN
    ALTER TABLE bills_payable ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES bill_categories(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN
        NULL;
END $$;

-- Criar índice para category_id
CREATE INDEX IF NOT EXISTS idx_bills_payable_category_id ON bills_payable(category_id);

-- Criar trigger para atualizar updated_at em bill_categories
DROP TRIGGER IF EXISTS update_bill_categories_updated_at ON bill_categories;
CREATE TRIGGER update_bill_categories_updated_at BEFORE UPDATE ON bill_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE bill_categories IS 'Categorias personalizáveis para contas a pagar';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
