CREATE TABLE IF NOT EXISTS security_input_events (
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

CREATE INDEX IF NOT EXISTS idx_security_input_events_created_at ON security_input_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_input_events_event_type ON security_input_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_input_events_source_scope ON security_input_events(source_scope);

ALTER TABLE security_input_events ENABLE ROW LEVEL SECURITY;