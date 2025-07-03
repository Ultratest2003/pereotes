
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SiteUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
}

const AdminTab = () => {
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSiteUser, setNewSiteUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Проверяем права администратора
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Доступ запрещен</h3>
          <p className="text-muted-foreground">
            У вас нет прав для доступа к этой странице. Только администраторы могут управлять пользователями сайта.
          </p>
        </div>
      </div>
    );
  }

  // Загружаем пользователей сайта из базы данных
  useEffect(() => {
    loadSiteUsers();
  }, []);

  const loadSiteUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching site users:', error);
        // Если нет доступа, значит пользователь не администратор
        if (error.code === 'PGRST116') {
          toast({
            title: "Доступ запрещен",
            description: "У вас нет прав для просмотра пользователей",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить пользователей сайта",
            variant: "destructive",
          });
        }
        return;
      }

      const formattedUsers: SiteUser[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'admin' | 'user',
        isActive: user.is_active,
        createdAt: user.created_at
      }));

      setSiteUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading site users:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке данных",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSiteUser = async () => {
    if (!newSiteUser.email || !newSiteUser.name || !newSiteUser.password) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('site_users')
        .insert([{
          email: newSiteUser.email,
          name: newSiteUser.name,
          password: newSiteUser.password,
          role: newSiteUser.role
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding site user:', error);
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Ошибка",
            description: "Пользователь с таким email уже существует",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ошибка",
            description: "Не удалось добавить пользователя",
            variant: "destructive",
          });
        }
        return;
      }
      
      loadSiteUsers();
      setNewSiteUser({ email: '', name: '', password: '', role: 'user' });
      setShowAddDialog(false);
      
      toast({
        title: "Успех",
        description: "Пользователь добавлен успешно",
      });
    } catch (error) {
      console.error('Error adding site user:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при добавлении пользователя",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSiteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('site_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting site user:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить пользователя",
          variant: "destructive",
        });
        return;
      }
      
      loadSiteUsers();
      toast({
        title: "Успех",
        description: "Пользователь удален",
      });
    } catch (error) {
      console.error('Error deleting site user:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении пользователя",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = siteUsers.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('site_users')
        .update({ is_active: !user.isActive })
        .eq('id', userId);

      if (error) {
        console.error('Error toggling user status:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось изменить статус пользователя",
          variant: "destructive",
        });
        return;
      }
        
      loadSiteUsers();
      toast({
        title: "Успех",
        description: "Статус пользователя изменен",
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при изменении статуса",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка пользователей сайта...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Администрирование сайта
              </CardTitle>
              <CardDescription>
                Управление пользователями, которые могут заходить на сайт
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить пользователя
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Email</th>
                  <th className="text-left p-2 font-medium">Имя</th>
                  <th className="text-left p-2 font-medium">Роль</th>
                  <th className="text-left p-2 font-medium">Статус</th>
                  <th className="text-left p-2 font-medium">Дата создания</th>
                  <th className="text-left p-2 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {siteUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Активен' : 'Заблокирован'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id)}
                        >
                          {user.isActive ? 'Заблокировать' : 'Разблокировать'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSiteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {siteUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      Пользователи сайта не найдены. Добавьте первого пользователя.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить нового пользователя сайта</DialogTitle>
            <DialogDescription>
              Создайте учетную запись для доступа к сайту
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={newSiteUser.email}
                onChange={(e) => setNewSiteUser({...newSiteUser, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-name">Имя</Label>
              <Input
                id="user-name"
                type="text"
                placeholder="Имя пользователя"
                value={newSiteUser.name}
                onChange={(e) => setNewSiteUser({...newSiteUser, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-password">Пароль</Label>
              <Input
                id="user-password"
                type="password"
                placeholder="Пароль"
                value={newSiteUser.password}
                onChange={(e) => setNewSiteUser({...newSiteUser, password: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-role">Роль</Label>
              <select
                id="user-role"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSiteUser.role}
                onChange={(e) => setNewSiteUser({...newSiteUser, role: e.target.value as 'admin' | 'user'})}
              >
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddSiteUser} className="flex-1">
                Добавить
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTab;
