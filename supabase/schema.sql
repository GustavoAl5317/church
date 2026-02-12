-- ============================================
-- SCHEMA DO BANCO DE DADOS
-- Sistema de Gestão Financeira para Igrejas
-- ============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: users (Usuários do Sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'tesouraria', 'secretaria', 'pastor', 'auditor')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TABELA: user_passwords (Senhas dos Usuários - Opcional)
-- ============================================
-- Esta tabela armazena os hashes de senha de forma segura
-- Se preferir, pode usar armazenamento em memória (como está implementado)
CREATE TABLE IF NOT EXISTS user_passwords (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: members (Membros da Igreja)
-- ============================================
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    entry_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ativo', 'inativo', 'visitante')),
    ministries TEXT[] DEFAULT '{}',
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para members
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

-- ============================================
-- TABELA: service_templates (Templates de Cultos Recorrentes)
-- ============================================
CREATE TABLE IF NOT EXISTS service_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('culto_familia', 'celebracao', 'oracao', 'jovens', 'mulheres', 'homens', 'especial')),
    time TIME NOT NULL,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 6 = Sábado
    is_recurring BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para service_templates
CREATE INDEX IF NOT EXISTS idx_service_templates_active ON service_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_service_templates_recurring ON service_templates(is_recurring);

-- ============================================
-- TABELA: services (Cultos Individuais)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('culto_familia', 'celebracao', 'oracao', 'jovens', 'mulheres', 'homens', 'especial')),
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'finalizado')),
    observations TEXT,
    total_income DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para services
CREATE INDEX IF NOT EXISTS idx_services_date ON services(date);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_template_id ON services(template_id);

-- ============================================
-- TABELA: service_incomes (Entradas Financeiras dos Cultos)
-- ============================================
CREATE TABLE IF NOT EXISTS service_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('dizimo', 'oferta', 'doacao', 'campanha', 'outros')),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'outros')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para service_incomes
CREATE INDEX IF NOT EXISTS idx_service_incomes_service_id ON service_incomes(service_id);
CREATE INDEX IF NOT EXISTS idx_service_incomes_type ON service_incomes(type);
CREATE INDEX IF NOT EXISTS idx_service_incomes_created_at ON service_incomes(created_at);

-- ============================================
-- TABELA: events (Eventos Especiais)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado', 'em_andamento', 'finalizado', 'cancelado')),
    cash_box_id UUID REFERENCES cash_boxes(id) ON DELETE SET NULL,
    total_income DECIMAL(10, 2) DEFAULT 0,
    total_expense DECIMAL(10, 2) DEFAULT 0,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para events
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_cash_box_id ON events(cash_box_id);

-- ============================================
-- TABELA: cash_boxes (Caixas)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('geral', 'evento')),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    balance DECIMAL(10, 2) DEFAULT 0,
    initial_balance DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cash_boxes
CREATE INDEX IF NOT EXISTS idx_cash_boxes_type ON cash_boxes(type);
CREATE INDEX IF NOT EXISTS idx_cash_boxes_event_id ON cash_boxes(event_id);

-- ============================================
-- TABELA: cash_transactions (Transações Financeiras)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_box_id UUID NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida', 'transferencia')),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'outros')),
    date DATE NOT NULL,
    related_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    related_bill_id UUID REFERENCES bills_payable(id) ON DELETE SET NULL,
    related_transfer_id UUID, -- Auto-referência para transferências
    responsible_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    responsible_name VARCHAR(255) NOT NULL,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cash_transactions
CREATE INDEX IF NOT EXISTS idx_cash_transactions_cash_box_id ON cash_transactions(cash_box_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_responsible_id ON cash_transactions(responsible_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_related_service_id ON cash_transactions(related_service_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_related_bill_id ON cash_transactions(related_bill_id);

-- ============================================
-- TABELA: suppliers (Fornecedores)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);

-- ============================================
-- TABELA: bill_categories (Categorias de Contas a Pagar)
-- ============================================
CREATE TABLE IF NOT EXISTS bill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para bill_categories
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

-- ============================================
-- TABELA: bills_payable (Contas a Pagar)
-- ============================================
CREATE TABLE IF NOT EXISTS bills_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    recurrence VARCHAR(20) CHECK (recurrence IN ('mensal', 'semanal', 'anual', 'unica')),
    category VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES bill_categories(id) ON DELETE SET NULL,
    cost_center VARCHAR(20) DEFAULT 'geral' CHECK (cost_center IN ('geral', 'evento')),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'outros')),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para bills_payable
CREATE INDEX IF NOT EXISTS idx_bills_payable_due_date ON bills_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_payable_status ON bills_payable(status);
CREATE INDEX IF NOT EXISTS idx_bills_payable_supplier_id ON bills_payable(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bills_payable_event_id ON bills_payable(event_id);
CREATE INDEX IF NOT EXISTS idx_bills_payable_category ON bills_payable(category);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover triggers existentes (se houver) antes de criar novos
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
DROP TRIGGER IF EXISTS update_service_templates_updated_at ON service_templates;
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_cash_boxes_updated_at ON cash_boxes;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS update_bills_payable_updated_at ON bills_payable;
DROP TRIGGER IF EXISTS update_user_passwords_updated_at ON user_passwords;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_templates_updated_at BEFORE UPDATE ON service_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_boxes_updated_at BEFORE UPDATE ON cash_boxes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_payable_updated_at BEFORE UPDATE ON bills_payable
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_categories_updated_at BEFORE UPDATE ON bill_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_passwords_updated_at BEFORE UPDATE ON user_passwords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE users IS 'Usuários do sistema com diferentes níveis de acesso';
COMMENT ON TABLE user_passwords IS 'Armazena hashes de senha dos usuários de forma segura';
COMMENT ON TABLE members IS 'Membros e visitantes da igreja';
COMMENT ON TABLE service_templates IS 'Templates de cultos que podem ser recorrentes';
COMMENT ON TABLE services IS 'Cultos individuais agendados';
COMMENT ON TABLE service_incomes IS 'Entradas financeiras registradas em cada culto';
COMMENT ON TABLE events IS 'Eventos especiais da igreja';
COMMENT ON TABLE cash_boxes IS 'Caixas financeiras (geral ou por evento)';
COMMENT ON TABLE cash_transactions IS 'Todas as transações financeiras do sistema';
COMMENT ON TABLE suppliers IS 'Fornecedores e prestadores de serviço';
COMMENT ON TABLE bill_categories IS 'Categorias personalizáveis para contas a pagar';
COMMENT ON TABLE bills_payable IS 'Contas a pagar da igreja';

-- ============================================
-- FIM DO SCHEMA
-- ============================================
