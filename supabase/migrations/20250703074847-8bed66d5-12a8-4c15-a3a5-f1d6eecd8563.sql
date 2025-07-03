-- Обновляем функцию проверки администратора для работы с localStorage
-- Поскольку мы используем localStorage для аутентификации, а не Supabase Auth,
-- временно делаем политики более открытыми для администраторов

DROP POLICY IF EXISTS "Admins can create site users" ON public.site_users;
DROP POLICY IF EXISTS "Admins can update site users" ON public.site_users;
DROP POLICY IF EXISTS "Admins can delete site users" ON public.site_users;
DROP POLICY IF EXISTS "Admins can create users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Временно разрешаем всем операции, проверка роли будет на уровне приложения
CREATE POLICY "Allow site users operations" 
  ON public.site_users 
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow users operations" 
  ON public.users 
  FOR ALL
  USING (true)
  WITH CHECK (true);