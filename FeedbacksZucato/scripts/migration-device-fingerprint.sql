-- Adiciona coluna device_fingerprint para rastreamento de dispositivo
ALTER TABLE feedbacks ADD COLUMN device_fingerprint VARCHAR(64);

-- Índice para buscar feedbacks do mesmo dispositivo rapidamente
CREATE INDEX idx_feedbacks_device_fingerprint ON feedbacks(device_fingerprint);
CREATE INDEX idx_feedbacks_device_date ON feedbacks(device_fingerprint, DATE(created_at));
