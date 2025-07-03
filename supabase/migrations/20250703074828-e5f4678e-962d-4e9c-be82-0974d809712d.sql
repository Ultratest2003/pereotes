-- Создаем первого администратора (измените email и пароль по своему усмотрению)
INSERT INTO public.site_users (email, name, password, role, is_active)
VALUES ('admin@example.com', 'Администратор', 'admin123', 'admin', true)
ON CONFLICT (email) DO NOTHING;