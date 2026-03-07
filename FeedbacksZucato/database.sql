-- Tabela de Feedbacks
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  sentiment VARCHAR(10) CHECK (sentiment IN ('positivo', 'negativo', 'neutro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_anonymous BOOLEAN DEFAULT false,
  patient_name VARCHAR(255),
  source VARCHAR(50) DEFAULT 'whatsapp'
);

-- Índices para performance
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX idx_feedbacks_sentiment ON feedbacks(sentiment);
CREATE INDEX idx_feedbacks_rating ON feedbacks(rating);

-- Tabela de Administradores
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Índice para email
CREATE INDEX idx_admins_email ON admins(email);

-- Row Level Security (RLS)
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policies para feedbacks (acesso público para INSERT)
CREATE POLICY "Allow public to insert feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read feedbacks" ON feedbacks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies para admins (acesso apenas para admin)
CREATE POLICY "Admins can read their own data" ON admins
  FOR SELECT USING (auth.uid()::text = id::text);
