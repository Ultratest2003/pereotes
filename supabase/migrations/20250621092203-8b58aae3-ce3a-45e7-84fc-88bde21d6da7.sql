
-- Добавляем поле branch к таблице questions для указания ветки вопроса
ALTER TABLE public.questions 
ADD COLUMN branch TEXT DEFAULT 'general';

-- Добавляем поле branch к таблице test_results для сохранения выбранной ветки
ALTER TABLE public.test_results 
ADD COLUMN branch TEXT;

-- Добавляем комментарий для понимания возможных значений
COMMENT ON COLUMN public.questions.branch IS 'Ветка вопроса: general, karaoke, lit_club, kinoshka';
COMMENT ON COLUMN public.test_results.branch IS 'Выбранная ветка при прохождении теста: karaoke, lit_club, kinoshka';
