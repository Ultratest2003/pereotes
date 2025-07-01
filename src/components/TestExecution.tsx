
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Question = {
  id: string;
  question_text: string;
  max_score: number;
  order_index: number;
  branch: string;
};

type TestExecutionProps = {
  testId: string;
  accessCode: string;
  branch: string;
  userName: string;
  onComplete: () => void;
};

const TestExecution: React.FC<TestExecutionProps> = ({ testId, accessCode, branch, userName, onComplete }) => {
  console.log('TestExecution component rendering with:', { testId, accessCode, branch, userName });
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState<{
    earnedScore: number;
    maxScore: number;
    percentage: number;
    answersWithQuestions: Array<{
      questionText: string;
      userAnswer: number;
      maxScore: number;
      comment?: string;
    }>;
  } | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get level from testId (e.g., "level_1" -> 1)
  const level = parseInt(testId.replace('level_', ''));
  console.log('Extracted level:', level);

  const branchNames = {
    karaoke: 'КАРАОКЕ',
    lit_club: 'ЛИТ.КЛУБ',
    kinoshka: 'КИНОШКА'
  };

  // First, get the test by level
  const { data: test } = useQuery({
    queryKey: ['test', level],
    queryFn: async () => {
      console.log('Fetching test for level:', level);
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('level', level)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching test:', error);
        throw error;
      }
      console.log('Fetched test:', data);
      return data;
    },
  });

  // Then get questions for that test (general + selected branch)
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', test?.id, branch],
    queryFn: async () => {
      if (!test?.id) return [];
      
      console.log('Fetching questions for test:', test.id, 'and branch:', branch);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', test.id)
        .in('branch', ['general', branch])
        .order('order_index');
      
      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }
      console.log('Fetched questions:', data);
      return data as Question[];
    },
    enabled: !!test?.id,
  });

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (score: number) => {
    if (currentQuestion) {
      console.log('Answer changed for question:', currentQuestion.id, 'score:', score);
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: score
      }));
      
      // Очищаем комментарий если выбран максимальный балл
      if (score === currentQuestion.max_score) {
        setComments(prev => {
          const newComments = { ...prev };
          delete newComments[currentQuestion.id];
          return newComments;
        });
      }
    }
  };

  const handleCommentChange = (comment: string) => {
    if (currentQuestion) {
      setComments(prev => ({
        ...prev,
        [currentQuestion.id]: comment
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleCompleteTest();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCompleteTest = async () => {
    if (!test?.id) {
      toast({
        title: "Ошибка",
        description: "Тест не найден",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Completing test with answers:', answers);
      console.log('Comments:', comments);
      
      // Подсчитываем результаты
      const earnedScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
      const maxScore = questions.reduce((sum, q) => sum + q.max_score, 0);
      const percentage = Math.round((earnedScore / maxScore) * 100);

      // Создаем массив ответов с текстами вопросов и комментариями
      const answersWithQuestions = questions.map(question => ({
        questionText: question.question_text,
        userAnswer: answers[question.id] || 0,
        maxScore: question.max_score,
        comment: comments[question.id] || undefined
      }));

      console.log('Test results:', { earnedScore, maxScore, percentage, answersWithQuestions });

      // Сохраняем результат в базу
      const { data: testResult, error: testResultError } = await supabase
        .from('test_results')
        .insert({
          test_id: test.id,
          user_name: userName,
          access_code: accessCode,
          branch: branch,
          answers: answers,
          earned_score: earnedScore,
          max_possible_score: maxScore,
          percentage_score: percentage,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (testResultError) {
        console.error('Error saving test result:', testResultError);
        throw testResultError;
      }

      // Сохраняем комментарии
      const commentsToInsert = Object.entries(comments)
        .filter(([questionId, comment]) => comment.trim() !== '')
        .map(([questionId, comment]) => ({
          test_result_id: testResult.id,
          question_id: questionId,
          comment: comment.trim()
        }));

      if (commentsToInsert.length > 0) {
        const { error: commentsError } = await supabase
          .from('answer_comments')
          .insert(commentsToInsert);

        if (commentsError) {
          console.error('Error saving comments:', commentsError);
          // Не блокируем завершение теста из-за ошибки комментариев
        }
      }

      // Показываем результаты
      setTestResults({
        earnedScore,
        maxScore,
        percentage,
        answersWithQuestions
      });
      setShowResults(true);

      // Обновляем кеш результатов
      queryClient.invalidateQueries({ queryKey: ['test_results'] });

      toast({
        title: "Тест завершен",
        description: `Результат: ${earnedScore}/${maxScore} баллов (${percentage}%)`,
      });
    } catch (error) {
      console.error('Error saving test result:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить результат теста",
        variant: "destructive",
      });
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    onComplete();
  };

  const getScoreText = (score: number, maxScore: number = 1) => {
    if (score === maxScore) return `${score} балл${score === 1 ? '' : score < 5 ? 'а' : 'ов'} (максимум)`;
    if (score === 0.5) return "0.5 балла";
    if (score === 0) return "0 баллов";
    return `${score} балл${score === 1 ? '' : score < 5 ? 'а' : 'ов'}`;
  };

  if (isLoading || !test) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Загрузка вопросов...</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Для этого теста и выбранной ветки пока нет вопросов
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const selectedScore = answers[currentQuestion.id];
  const currentComment = comments[currentQuestion.id] || '';
  const needsComment = selectedScore !== undefined && selectedScore < currentQuestion.max_score;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </CardTitle>
          <CardDescription className="space-y-1">
            <div>Участник: {userName} | Код: {accessCode}</div>
            <div className="flex items-center gap-2">
              <span>Ветка:</span>
              <Badge variant="secondary">
                {branchNames[branch as keyof typeof branchNames] || branch}
              </Badge>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Label className="text-lg font-medium">
                {currentQuestion.question_text}
              </Label>
              {currentQuestion.branch !== 'general' && (
                <Badge variant="outline" className="text-xs">
                  {branchNames[currentQuestion.branch as keyof typeof branchNames] || currentQuestion.branch}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 border rounded-lg">
                <Label className="block text-sm font-medium mb-2">1 балл</Label>
                <Checkbox
                  checked={selectedScore === 1}
                  onCheckedChange={() => handleAnswerChange(1)}
                />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Label className="block text-sm font-medium mb-2">0.5 балла</Label>
                <Checkbox
                  checked={selectedScore === 0.5}
                  onCheckedChange={() => handleAnswerChange(0.5)}
                />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Label className="block text-sm font-medium mb-2">0 баллов</Label>
                <Checkbox
                  checked={selectedScore === 0}
                  onCheckedChange={() => handleAnswerChange(0)}
                />
              </div>
            </div>

            {needsComment && (
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium text-orange-600">
                  Комментарий (объясните, где была ошибка):
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Опишите, в чем заключалась ошибка или неточность..."
                  value={currentComment}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Назад
            </Button>
            <Button
              onClick={handleNext}
              disabled={selectedScore === undefined || (needsComment && currentComment.trim() === '')}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Завершить тест' : 'Далее'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Результаты теста</DialogTitle>
            <DialogDescription className="space-y-1">
              <div>Участник: {userName} | Код доступа: {accessCode}</div>
              <div className="flex items-center gap-2">
                <span>Ветка:</span>
                <Badge variant="secondary">
                  {branchNames[branch as keyof typeof branchNames] || branch}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          {testResults && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {testResults.earnedScore} / {testResults.maxScore}
                </div>
                <div className="text-xl text-muted-foreground mb-4">
                  {testResults.percentage}%
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Подробные ответы:</h4>
                <ScrollArea className="max-h-64 w-full">
                  <div className="space-y-3 pr-4">
                    {testResults.answersWithQuestions.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm mb-2">
                          {index + 1}. {item.questionText}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Ответ: <span className="font-medium">{getScoreText(item.userAnswer, item.maxScore)}</span>
                        </div>
                        {item.comment && (
                          <div className="text-sm text-orange-600 mt-2">
                            <span className="font-medium">Комментарий:</span> {item.comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <Button onClick={handleCloseResults} className="w-full">
                Закрыть
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TestExecution;
