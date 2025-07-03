import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type UserStatus = 'active' | 'inactive' | 'pending';

interface User {
  id: string;
  user_id: string;
  nickname: string;
  level: number;
  deadline: string;
  status: UserStatus;
}

const UsersTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    user_id: '',
    nickname: '',
    level: 1,
    deadline: '',
    status: 'active' as UserStatus
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Проверяем права администратора
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Доступ запрещен</h3>
          <p className="text-muted-foreground">
            У вас нет прав для доступа к этой странице. Только администраторы могут управлять пользователями переаттестации.
          </p>
        </div>
      </div>
    );
  }

  // Загружаем пользователей при монтировании компонента
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить пользователей",
          variant: "destructive",
        });
        return;
      }

      // Приводим данные к правильному типу
      const typedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        user_id: user.user_id,
        nickname: user.nickname,
        level: user.level,
        deadline: user.deadline,
        status: user.status as UserStatus
      }));

      setUsers(typedUsers);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке данных",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    // Проверяем, что ID состоит только из цифр
    if (!/^\d+$/.test(newUser.user_id)) {
      toast({
        title: "Ошибка",
        description: "ID должен состоять только из цифр",
        variant: "destructive",
      });
      return;
    }

    // Проверяем уникальность ID
    if (users.some(user => user.user_id === newUser.user_id)) {
      toast({
        title: "Ошибка",
        description: "Пользователь с таким ID уже существует",
        variant: "destructive",
      });
      return;
    }

    if (!newUser.nickname || !newUser.deadline) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('Error adding user:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось добавить пользователя",
          variant: "destructive",
        });
        return;
      }

      // Приводим новый пользователь к правильному типу
      const typedUser: User = {
        id: data.id,
        user_id: data.user_id,
        nickname: data.nickname,
        level: data.level,
        deadline: data.deadline,
        status: data.status as UserStatus
      };

      setUsers([typedUser, ...users]);
      setNewUser({
        user_id: '',
        nickname: '',
        level: 1,
        deadline: '',
        status: 'active'
      });
      setShowAddDialog(false);
      
      toast({
        title: "Успех",
        description: "Пользователь добавлен успешно",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при добавлении пользователя",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить пользователя",
          variant: "destructive",
        });
        return;
      }

      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: "Успех",
        description: "Пользователь удален",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении пользователя",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'inactive':
        return 'Неактивный';
      case 'pending':
        return 'Ожидает';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка пользователей...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Управление пользователями</CardTitle>
              <CardDescription>
                Добавляйте и управляйте пользователями системы
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
                  <th className="text-left p-2 font-medium">ID</th>
                  <th className="text-left p-2 font-medium">Ник</th>
                  <th className="text-left p-2 font-medium">Уровень</th>
                  <th className="text-left p-2 font-medium">Срок</th>
                  <th className="text-left p-2 font-medium">Статус</th>
                  <th className="text-left p-2 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2 font-mono">{user.user_id}</td>
                    <td className="p-2">{user.nickname}</td>
                    <td className="p-2">Уровень {user.level}</td>
                    <td className="p-2">{user.deadline}</td>
                    <td className="p-2">
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {getStatusLabel(user.status)}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      Пользователи не найдены. Добавьте первого пользователя.
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
            <DialogTitle>Добавить пользователя</DialogTitle>
            <DialogDescription>
              Заполните информацию о новом пользователе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">ID пользователя</Label>
              <Input
                id="user-id"
                type="text"
                placeholder="12345"
                value={newUser.user_id}
                onChange={(e) => setNewUser({...newUser, user_id: e.target.value.replace(/\D/g, '')})}
              />
              <p className="text-sm text-muted-foreground">
                Только цифры (например: 12345)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nickname">Ник</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="username"
                value={newUser.nickname}
                onChange={(e) => setNewUser({...newUser, nickname: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level">Уровень</Label>
              <Select 
                value={newUser.level.toString()} 
                onValueChange={(value) => setNewUser({...newUser, level: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Уровень 1</SelectItem>
                  <SelectItem value="2">Уровень 2</SelectItem>
                  <SelectItem value="3">Уровень 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Срок</Label>
              <Input
                id="deadline"
                type="date"
                value={newUser.deadline}
                onChange={(e) => setNewUser({...newUser, deadline: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select 
                value={newUser.status} 
                onValueChange={(value: UserStatus) => setNewUser({...newUser, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активный</SelectItem>
                  <SelectItem value="inactive">Неактивный</SelectItem>
                  <SelectItem value="pending">Ожидает</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddUser} className="flex-1">
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

export default UsersTab;
