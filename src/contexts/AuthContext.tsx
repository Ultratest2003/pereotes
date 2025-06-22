
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
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
    
    // Получаем зарегистрированных пользователей
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    console.log('Registered users:', users);
    
    // Ищем пользователя
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    console.log('Found user:', foundUser);
    
    if (foundUser) {
      const userData = { id: foundUser.id, email: foundUser.email, name: foundUser.name };
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      console.log('Login successful, user saved:', userData);
      setIsLoading(false);
      return true;
    }
    
    // Проверяем, существует ли пользователь с таким email
    const userExists = users.find((u: any) => u.email === email);
    if (userExists) {
      setLastError('Неверный пароль');
      console.log('Wrong password for:', email);
    } else {
      setLastError('Пользователь с таким email не найден');
      console.log('User not found:', email);
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
    
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const existingUser = users.find((u: any) => u.email === email);
    
    if (existingUser) {
      setLastError('Пользователь с таким email уже существует');
      setIsLoading(false);
      console.log('User already exists:', email);
      return false;
    }
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name
    };
    
    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    console.log('User registered successfully:', email);
    console.log('Updated users list:', users);
    
    const userData = { id: newUser.id, email: newUser.email, name: newUser.name };
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    console.log('Registration successful, user saved:', userData);
    
    setIsLoading(false);
    return true;
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
