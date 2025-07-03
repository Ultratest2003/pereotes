
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  lastError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем сохраненного пользователя в localStorage
    try {
      const savedUser = localStorage.getItem('currentUser');
      console.log('Checking saved user:', savedUser);
      if (savedUser && savedUser !== 'null') {
        const parsedUser = JSON.parse(savedUser);
        console.log('Parsed saved user:', parsedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('currentUser');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setLastError(null);
    console.log('Attempting login with:', email);
    
    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Получаем пользователя из базы данных
      const { data: users, error } = await supabase
        .from('site_users')
        .select('*')
        .eq('email', email)
        .eq('password', password);

      if (error) {
        console.error('Database error:', error);
        setLastError('Ошибка подключения к базе данных');
        setIsLoading(false);
        return false;
      }

      console.log('Found users:', users);
      
      if (users && users.length > 0) {
        const foundUser = users[0];
        
        // Проверяем, активен ли пользователь
        if (foundUser.is_active === false) {
          setLastError('Ваш аккаунт заблокирован. Обратитесь к администратору.');
          console.log('User account is blocked:', email);
          setIsLoading(false);
          return false;
        }

        const userData = { 
          id: foundUser.id, 
          email: foundUser.email, 
          name: foundUser.name,
          role: foundUser.role || 'user'
        };
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('Login successful, user saved:', userData);
        setIsLoading(false);
        return true;
      }
      
      // Проверяем, существует ли пользователь с таким email
      const { data: existingUsers } = await supabase
        .from('site_users')
        .select('email')
        .eq('email', email);
      
      if (existingUsers && existingUsers.length > 0) {
        setLastError('Неверный пароль');
        console.log('Wrong password for:', email);
      } else {
        setLastError('Пользователь с таким email не найден');
        console.log('User not found:', email);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLastError('Произошла ошибка при входе в систему');
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    setLastError(null);
    console.log('Attempting registration with:', email, name);
    
    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Проверяем, существует ли пользователь с таким email
      const { data: existingUsers, error: checkError } = await supabase
        .from('site_users')
        .select('email')
        .eq('email', email);

      if (checkError) {
        console.error('Database error:', checkError);
        setLastError('Ошибка подключения к базе данных');
        setIsLoading(false);
        return false;
      }

      if (existingUsers && existingUsers.length > 0) {
        setLastError('Пользователь с таким email уже существует');
        setIsLoading(false);
        console.log('User already exists:', email);
        return false;
      }
      
      // Добавляем нового пользователя в базу данных
      const { data: newUser, error: insertError } = await supabase
        .from('site_users')
        .insert([{
          email,
          password,
          name,
          role: 'user',
          is_active: true
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        setLastError('Ошибка при создании пользователя');
        setIsLoading(false);
        return false;
      }

      console.log('User registered successfully:', email);
      
      const userData = { 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name,
        role: newUser.role
      };
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      console.log('Registration successful, user saved:', userData);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setLastError('Произошла ошибка при регистрации');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setLastError(null);
    localStorage.removeItem('currentUser');
    console.log('User logged out');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    lastError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
