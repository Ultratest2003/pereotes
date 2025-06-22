
-- Включаем Row Level Security для таблицы tests (если не включен)
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Создаем политику для просмотра всех тестов (публичный доступ)
CREATE POLICY "Anyone can view tests" 
  ON public.tests 
  FOR SELECT 
  USING (true);

-- Создаем политику для создания тестов (публичный доступ)
CREATE POLICY "Anyone can create tests" 
  ON public.tests 
  FOR INSERT 
  WITH CHECK (true);

-- Создаем политику для обновления тестов (публичный доступ)
CREATE POLICY "Anyone can update tests" 
  ON public.tests 
  FOR UPDATE 
  USING (true);

-- Создаем политику для удаления тестов (публичный доступ)
CREATE POLICY "Anyone can delete tests" 
  ON public.tests 
  FOR DELETE 
  USING (true);

-- Также нужно настроить политики для таблицы questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Создаем политики для вопросов
CREATE POLICY "Anyone can view questions" 
  ON public.questions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create questions" 
  ON public.questions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update questions" 
  ON public.questions 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete questions" 
  ON public.questions 
  FOR DELETE 
  USING (true);
