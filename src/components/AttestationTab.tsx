
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Users } from 'lucide-react';
import TestManagement from './TestManagement';
import TestExecution from './TestExecution';

const AttestationTab = () => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showManagementDialog, setShowManagementDialog] = useState(false);
  const [managementLevel, setManagementLevel] = useState<number | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [testAccessCode, setTestAccessCode] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const levels = [
    { id: 1, name: 'Уровень 1', description: 'Базовый уровень переаттестации', color: 'bg-green-500' },
    { id: 2, name: 'Уровень 2', description: 'Средний уровень переаттестации', color: 'bg-yellow-500' },
    { id: 3, name: 'Уровень 3', description: 'Продвинутый уровень переаттестации', color: 'bg-red-500' },
  ];

  const branches = [
    { id: 'karaoke', name: 'КАРАОКЕ', description: 'Ветка караоке', icon: '🎤' },
    { id: 'lit_club', name: 'ЛИТ.КЛУБ', description: 'Литературный клуб', icon: '📚' },
    { id: 'kinoshka', name: 'КИНОШКА', description: 'Киноклуб', icon: '🎬' },
  ];

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
    setShowCodeDialog(true);
    setCodeInput('');
  };

  const handleManagementClick = (level: number) => {
    setManagementLevel(level);
    setShowManagementDialog(true);
  };

  const handleCodeSubmit = () => {
    if (codeInput.length < 10) {
      toast({
        title: "Ошибка",
        description: "Код должен содержать минимум 10 цифр",
        variant: "destructive",
      });
      return;
    }

    setTestAccessCode(codeInput);
    setShowCodeDialog(false);
    setShowBranchDialog(true);
  };

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
    setShowBranchDialog(false);
    setIsTestStarted(true);
  };

  const handleTestComplete = () => {
    setIsTestStarted(false);
    setSelectedLevel(null);
    setSelectedBranch('');
    setTestAccessCode('');
    
    toast({
      title: "Тест завершен",
      description: "Результат сохранен в истории",
    });
  };

  if (isTestStarted && selectedLevel && selectedBranch) {
    return (
      <TestExecution
        testId={`level_${selectedLevel}`}
        accessCode={testAccessCode}
        branch={selectedBranch}
        userName={user?.name || 'Неизвестный пользователь'}
        onComplete={handleTestComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Переаттестация</CardTitle>
          <CardDescription>
            Выберите уровень переаттестации для начала тестирования
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {levels.map((level) => (
              <Card 
                key={level.id} 
                className="cursor-pointer hover:shadow-md transition-shadow relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 p-1 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManagementClick(level.id);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <CardContent 
                  className="p-6 text-center"
                  onClick={() => handleLevelSelect(level.id)}
                >
                  <div className={`w-12 h-12 ${level.color} rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg`}>
                    {level.id}
                  </div>
                  <h3 className="font-semibold mb-2">{level.name}</h3>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                  <Badge variant="outline" className="mt-2">
                    Начать тест
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Введите код доступа</DialogTitle>
            <DialogDescription>
              Для начала переаттестации уровня {selectedLevel} введите цифровой код
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Код доступа</Label>
              <Input
                id="access-code"
                type="text"
                placeholder="404182319474147330"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                maxLength={20}
              />
              <p className="text-sm text-muted-foreground">
                Введите только цифры (минимум 10 символов)
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCodeSubmit}
                disabled={codeInput.length < 10}
                className="flex-1"
              >
                Продолжить
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCodeDialog(false)}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выберите ветку</DialogTitle>
            <DialogDescription>
              Выберите направление для прохождения переаттестации
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {branches.map((branch) => (
              <Card 
                key={branch.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleBranchSelect(branch.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{branch.icon}</div>
                  <h3 className="font-semibold mb-1">{branch.name}</h3>
                  <p className="text-sm text-muted-foreground">{branch.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBranchDialog(false);
                setShowCodeDialog(true);
              }}
            >
              Назад
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showManagementDialog} onOpenChange={setShowManagementDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Управление вопросами - Уровень {managementLevel}</DialogTitle>
            <DialogDescription>
              Добавляйте, редактируйте и удаляйте вопросы для уровня {managementLevel}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh] w-full pr-4">
            {managementLevel && (
              <TestManagement level={managementLevel} />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttestationTab;
