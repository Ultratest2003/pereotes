
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';

type Question = Tables<'questions'>;

interface QuestionFormProps {
  testId: string;
  question?: Question | null;
  onSave: () => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ testId, question, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    max_score: 1.0,
    order_index: 1,
    branch: 'general' as string,
  });

  const { toast } = useToast();

  const branches = [
    { id: 'general', name: 'Общий вопрос', description: 'Для всех веток' },
    { id: 'karaoke', name: 'КАРАОКЕ', description: 'Только для ветки караоке' },
    { id: 'lit_club', name: 'ЛИТ.КЛУБ', description: 'Только для литературного клуба' },
    { id: 'kinoshka', name: 'КИНОШКА', description: 'Только для киноклуба' },
  ];

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text,
        max_score: question.max_score || 1.0,
        order_index: question.order_index,
        branch: question.branch || 'general',
      });
    }
  }, [question]);

  const saveQuestionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (question) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update(data)
          .eq('id', question.id);
        
        if (error) throw error;
      } else {
        // Create new question
        const { error } = await supabase
          .from('questions')
          .insert({
            ...data,
            test_id: testId,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: question ? "Вопрос обновлен" : "Вопрос создан",
      });
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить вопрос: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question_text.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст вопроса",
        variant: "destructive",
      });
      return;
    }

    saveQuestionMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {question ? 'Редактировать вопрос' : 'Добавить вопрос'}
        </CardTitle>
        <CardDescription>
          Введите текст вопроса и выберите ветку. Во время тестирования будут доступны чекбоксы с баллами: 1, 0.5, 0
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-96 w-full">
          <form onSubmit={handleSubmit} className="space-y-4 pr-4">
            <div className="space-y-2">
              <Label htmlFor="question_text">Текст вопроса</Label>
              <Textarea
                id="question_text"
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                placeholder="Введите текст вопроса"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Ветка</Label>
              <Select
                value={formData.branch}
                onValueChange={(value) => setFormData({ ...formData, branch: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ветку" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div>
                        <div className="font-medium">{branch.name}</div>
                        <div className="text-sm text-muted-foreground">{branch.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_score">Максимальный балл</Label>
              <Input
                id="max_score"
                type="number"
                step="0.1"
                min="0"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseFloat(e.target.value) || 1.0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Порядковый номер</Label>
              <Input
                id="order_index"
                type="number"
                min="1"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={saveQuestionMutation.isPending}
                className="flex-1"
              >
                {saveQuestionMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
