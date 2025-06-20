
-- Удаляем все вопросы для уровня 1
DELETE FROM questions 
WHERE test_id IN (
  SELECT id FROM tests WHERE level = 1
);

-- Удаляем тест для уровня 1
DELETE FROM tests WHERE level = 1;
