
-- Создаем таблицу для пользователей
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  level INTEGER NOT NULL,
  deadline DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Создаем политики для публичного доступа (поскольку это система управления пользователями)
CREATE POLICY "Anyone can view users" 
  ON public.users 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create users" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update users" 
  ON public.users 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete users" 
  ON public.users 
  FOR DELETE 
  USING (true);

-- Создаем индекс для быстрого поиска по user_id
CREATE INDEX idx_users_user_id ON public.users(user_id);

-- Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггер для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
