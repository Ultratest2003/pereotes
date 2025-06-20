
-- Обновляем таблицу вопросов - убираем варианты ответов, оставляем только текст
ALTER TABLE public.questions 
DROP COLUMN option_1,
DROP COLUMN option_2,
DROP COLUMN option_3;

-- Добавляем поле для максимального балла за вопрос (по умолчанию 1)
ALTER TABLE public.questions 
ADD COLUMN max_score DECIMAL DEFAULT 1.0;

-- Обновляем таблицу результатов для новой системы оценок
ALTER TABLE public.test_results 
DROP COLUMN total_score,
DROP COLUMN percentage_score;

-- Добавляем новые поля для баллов и процентов
ALTER TABLE public.test_results 
ADD COLUMN earned_score DECIMAL DEFAULT 0,
ADD COLUMN max_possible_score DECIMAL DEFAULT 0,
ADD COLUMN percentage_score INTEGER DEFAULT 0;

-- Обновляем структуру answers - теперь это будет объект с question_id и выбранным баллом
-- Пример: {"question_1": 1.0, "question_2": 0.5, "question_3": 0}
