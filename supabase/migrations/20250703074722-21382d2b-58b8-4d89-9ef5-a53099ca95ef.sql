-- Обновляем политики для таблицы site_users - только администраторы могут создавать пользователей
DROP POLICY IF EXISTS "Anyone can create site users" ON public.site_users;
DROP POLICY IF EXISTS "Anyone can update site users" ON public.site_users;
DROP POLICY IF EXISTS "Anyone can delete site users" ON public.site_users;

-- Функция для проверки роли администратора
CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.site_users 
    WHERE email = user_email 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

-- Новые политики для site_users
CREATE POLICY "Admins can create site users" 
  ON public.site_users 
  FOR INSERT 
  WITH CHECK (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update site users" 
  ON public.site_users 
  FOR UPDATE 
  USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete site users" 
  ON public.site_users 
  FOR DELETE 
  USING (public.is_admin(auth.jwt() ->> 'email'));

-- Обновляем политики для таблицы users - только администраторы могут управлять
DROP POLICY IF EXISTS "Anyone can create users" ON public.users;
DROP POLICY IF EXISTS "Anyone can update users" ON public.users;
DROP POLICY IF EXISTS "Anyone can delete users" ON public.users;

CREATE POLICY "Admins can create users" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update users" 
  ON public.users 
  FOR UPDATE 
  USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete users" 
  ON public.users 
  FOR DELETE 
  USING (public.is_admin(auth.jwt() ->> 'email'));