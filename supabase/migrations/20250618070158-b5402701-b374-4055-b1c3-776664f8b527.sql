
-- Отключаем Row Level Security для таблицы test_results, 
-- чтобы любой пользователь мог сохранять результаты тестов
ALTER TABLE public.test_results DISABLE ROW LEVEL SECURITY;
