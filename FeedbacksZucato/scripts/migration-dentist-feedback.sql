ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS dentist_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS dentist_rating INTEGER,
ADD COLUMN IF NOT EXISTS dentist_comment TEXT,
ADD COLUMN IF NOT EXISTS dentist_sentiment VARCHAR(10);

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_dentist_rating_check;
ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_dentist_sentiment_check;

ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_dentist_rating_check CHECK (dentist_rating IS NULL OR (dentist_rating >= 1 AND dentist_rating <= 10));

ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_dentist_sentiment_check CHECK (dentist_sentiment IS NULL OR dentist_sentiment IN ('positivo', 'negativo', 'neutro'));

CREATE INDEX IF NOT EXISTS idx_feedbacks_dentist_name ON feedbacks(dentist_name);
CREATE INDEX IF NOT EXISTS idx_feedbacks_dentist_rating ON feedbacks(dentist_rating);