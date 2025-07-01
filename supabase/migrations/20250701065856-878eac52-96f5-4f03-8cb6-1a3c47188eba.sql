
-- Добавляем таблицу для хранения комментариев к ответам
CREATE TABLE public.answer_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_result_id UUID REFERENCES public.test_results(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Добавляем индексы для быстрого поиска
CREATE INDEX idx_answer_comments_test_result ON public.answer_comments(test_result_id);
CREATE INDEX idx_answer_comments_question ON public.answer_comments(question_id);
