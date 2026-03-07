-- Migração: Alterar escala de avaliação de 1-5 para 0-10
-- Data: 2026-03-07
-- Descrição: Muda a escala de rating de 1-5 para 0-10

-- 1. Remover a constraint existente (Verificar o nome exato da constraint no seu banco)
ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_rating_check;

-- 2. Adicionar nova constraint para 0-10
ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_rating_check CHECK (rating >= 0 AND rating <= 10);

-- Nota: Os dados existentes com valores 1-5 continuarão válidos na nova escala.