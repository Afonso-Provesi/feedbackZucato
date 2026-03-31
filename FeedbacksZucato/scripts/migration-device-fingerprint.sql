-- Adiciona coluna device_fingerprint para rastreamento de dispositivo
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(64);

-- Índice para buscar feedbacks do mesmo dispositivo rapidamente
CREATE INDEX IF NOT EXISTS idx_feedbacks_device_fingerprint ON feedbacks(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_feedbacks_device_created_at ON feedbacks(device_fingerprint, created_at);
