UPDATE feedbacks
SET patient_name = NULL,
    is_anonymous = TRUE
WHERE patient_name IS NOT NULL
   OR is_anonymous IS DISTINCT FROM TRUE;

ALTER TABLE feedbacks ALTER COLUMN is_anonymous SET DEFAULT TRUE;
ALTER TABLE feedbacks ALTER COLUMN is_anonymous SET NOT NULL;

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_must_be_anonymous;
ALTER TABLE feedbacks ADD CONSTRAINT feedbacks_must_be_anonymous CHECK (is_anonymous = true);

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_patient_name_must_be_null;
ALTER TABLE feedbacks ADD CONSTRAINT feedbacks_patient_name_must_be_null CHECK (patient_name IS NULL);

DROP POLICY IF EXISTS "Allow public to insert feedbacks" ON feedbacks;
CREATE POLICY "Allow public to insert feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (is_anonymous = true AND patient_name IS NULL);