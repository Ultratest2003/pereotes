
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { Trash2, Edit, Plus } from 'lucide-react';
import QuestionForm from './QuestionForm';

type Question = Tables<'questions'>;
type Test = Tables<'tests'>;

interface TestManagementProps {
  level: number;
}

const TestManagement: React.FC<TestManagementProps> = ({ level }) => {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const branchNames = {
    general: 'Общий',
    karaoke: 'КАРАОКЕ',
    lit_club: 'ЛИТ.КЛУБ',
    kinoshka: 'КИНОШКА'
  };

  // Получаем тест для данного уровня
  const { data: test } = useQuery({
    queryKey: ['test', level],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('level', level)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Получаем вопросы для теста
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', test?.id],
    queryFn: async () => {
      if (!test?.id) return [];
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', test.id)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!test?.id,
  });

  // Создание теста если его нет
  const createTestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .insert({
          name: `Тест уровня ${level}`,
          level: level,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Инвалидируем запросы для обновления интерфейса
      queryClient.invalidateQueries({ queryKey: ['test', level] });
      queryClient.invalidateQueries({ queryKey: ['questions', data.id] });
      toast({
        title: "Успех",
        description: "Тест создан успешно",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать тест: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Удаление вопроса
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', test?.id] });
      toast({
        title: "Успех",
        description: "Вопрос удален успешно",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить вопрос: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const handleAddQuestion = () => {
    if (!test) {
      createTestMutation.mutate();
      return;
    }
    setEditingQuestion(null);
    setShowQuestionForm(true);
  };

  const handleQuestionSaved = () => {
    setShowQuestionForm(false);
    setEditingQuestion(null);
    queryClient.invalidateQueries({ queryKey: ['questions', test?.id] });
  };

  // Группируем вопросы по веткам
  const questionsByBranch = questions.reduce((acc, question) => {
    const branch = question.branch || 'general';
    if (!acc[branch]) {
      acc[branch] = [];
    }
    acc[branch].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  if (!test) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Тест не найден</CardTitle>
            <CardDescription>
              Для уровня {level} еще не создан тест
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAddQuestion} disabled={createTestMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {createTestMutation.isPending ? 'Создание...' : 'Создать тест'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{test.name}</h3>
          <p className="text-sm text-muted-foreground">
            Общее количество вопросов: {questions.length}
          </p>
        </div>
        <Button onClick={handleAddQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить вопрос
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center">
          <p>Загрузка вопросов...</p>
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Вопросы для этого уровня еще не добавлены
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(questionsByBranch).map(([branch, branchQuestions]) => (
            <div key={branch} className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-lg">
                  {branchNames[branch as keyof typeof branchNames] || branch}
                </h4>
                <Badge variant="outline">
                  {branchQuestions.length} вопрос{branchQuestions.length === 1 ? '' : branchQuestions.length < 5 ? 'а' : 'ов'}
                </Badge>
              </div>
              
              <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                {branchQuestions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium mb-2">
                            {index + 1}. {question.question_text}
                          </h5>
                          <div className="text-sm text-muted-foreground">
                            <p>Максимальный балл: {question.max_score}</p>
                            <p className="mt-1 text-xs">
                              При тестировании будут доступны варианты: 1 балл, 0.5 балла, 0 баллов
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteQuestionMutation.mutate(question.id)}
                            disabled={deleteQuestionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showQuestionForm && (
        <QuestionForm
          testId={test.id}
          question={editingQuestion}
          onSave={handleQuestionSaved}
          onCancel={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
};

export default TestManagement;
