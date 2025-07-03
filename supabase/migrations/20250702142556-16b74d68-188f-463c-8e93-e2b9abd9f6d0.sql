-- Создаем таблицу для пользователей сайта (для входа в систему)
CREATE TABLE public.site_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем Row Level Security
ALTER TABLE public.site_users ENABLE ROW LEVEL SECURITY;

-- Создаем политики для публичного доступа
CREATE POLICY "Anyone can view site users" 
  ON public.site_users 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create site users" 
  ON public.site_users 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update site users" 
  ON public.site_users 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete site users" 
  ON public.site_users 
  FOR DELETE 
  USING (true);

-- Создаем индекс для быстрого поиска по email
CREATE INDEX idx_site_users_email ON public.site_users(email);

-- Создаем триггер для автоматического обновления updated_at
CREATE TRIGGER update_site_users_updated_at 
    BEFORE UPDATE ON public.site_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();