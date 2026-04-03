-- Tabela de Feedbacks
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  dentist_name VARCHAR(255),
  dentist_rating INTEGER CHECK (dentist_rating >= 1 AND dentist_rating <= 10),
  dentist_comment TEXT,
  dentist_sentiment VARCHAR(10) CHECK (dentist_sentiment IN ('positivo', 'negativo', 'neutro', 'misto')),
  sentiment VARCHAR(10) CHECK (sentiment IN ('positivo', 'negativo', 'neutro', 'misto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  patient_name VARCHAR(255),
  source VARCHAR(50) DEFAULT 'whatsapp',
  device_fingerprint VARCHAR(64),
  CONSTRAINT feedbacks_must_be_anonymous CHECK (is_anonymous = true),
  CONSTRAINT feedbacks_patient_name_must_be_null CHECK (patient_name IS NULL)
);

-- Índices para performance
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX idx_feedbacks_sentiment ON feedbacks(sentiment);
CREATE INDEX idx_feedbacks_rating ON feedbacks(rating);
CREATE INDEX idx_feedbacks_device_fingerprint ON feedbacks(device_fingerprint);
CREATE INDEX idx_feedbacks_device_created_at ON feedbacks(device_fingerprint, created_at);
CREATE INDEX idx_feedbacks_dentist_name ON feedbacks(dentist_name);
CREATE INDEX idx_feedbacks_dentist_rating ON feedbacks(dentist_rating);

-- Eventos de proteção de input
CREATE TABLE security_input_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(64) NOT NULL,
  source_scope VARCHAR(64),
  request_path VARCHAR(160),
  field_name VARCHAR(64),
  client_ip VARCHAR(64),
  user_agent TEXT,
  payload_preview TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_input_events_created_at ON security_input_events(created_at DESC);
CREATE INDEX idx_security_input_events_event_type ON security_input_events(event_type);
CREATE INDEX idx_security_input_events_source_scope ON security_input_events(source_scope);

-- Tabela de Administradores
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  auth_user_id UUID UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  invited_by_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(16) NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin'))
);

-- Índice para email
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_auth_user_id ON admins(auth_user_id);
CREATE UNIQUE INDEX idx_admins_single_owner ON admins(role) WHERE role = 'owner';

-- Row Level Security (RLS)
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_input_events ENABLE ROW LEVEL SECURITY;

-- Policies para feedbacks (acesso público para INSERT)
CREATE POLICY "Allow public to insert feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (is_anonymous = true AND patient_name IS NULL);

CREATE POLICY "Allow authenticated users to read feedbacks" ON feedbacks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies para admins (acesso apenas para admin)
CREATE POLICY "Admins can read their own data" ON admins
  FOR SELECT USING (auth.uid()::text = id::text);
