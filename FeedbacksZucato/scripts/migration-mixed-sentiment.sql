ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_sentiment_check;
ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_dentist_sentiment_check;

ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_sentiment_check CHECK (sentiment IS NULL OR sentiment IN ('positivo', 'negativo', 'neutro', 'misto'));

ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_dentist_sentiment_check CHECK (dentist_sentiment IS NULL OR dentist_sentiment IN ('positivo', 'negativo', 'neutro', 'misto'));