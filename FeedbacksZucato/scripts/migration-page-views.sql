-- Tabela para rastrear visitas/page views
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page VARCHAR(255) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_page_views_page ON page_views(page);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);

-- Row Level Security
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Policy para permitir INSERT público
CREATE POLICY "Allow public to insert page views" ON page_views
  FOR INSERT WITH CHECK (true);

-- Policy para permitir SELECT apenas para admins autenticados
CREATE POLICY "Admins can read page views" ON page_views
  FOR SELECT USING (auth.role() = 'authenticated');