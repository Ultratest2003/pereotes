import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Calendar, Eye, Trash2, Download, FileImage } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Question = {
  id: string;
  question_text: string;
  max_score: number;
};

type AnswerComment = {
  id: string;
  question_id: string;
  comment: string;
};

type TestResultWithTest = {
  id: string;
  test_id: string;
  user_name: string;
  access_code: string;
  answers: any;
  started_at: string;
  completed_at: string;
  earned_score: number;
  max_possible_score: number;
  percentage_score: number;
  tests?: {
    name: string;
    level: number;
  };
};

const HistoryTab = () => {
  const [searchCode, setSearchCode] = useState('');
  const [selectedResult, setSelectedResult] = useState<TestResultWithTest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Получаем все результаты тестов
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['test_results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          tests (
            name,
            level
          )
        `)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as TestResultWithTest[];
    },
  });

  // Получаем вопросы для выбранного результата теста
  const { data: questions = [] } = useQuery({
    queryKey: ['questions_for_result', selectedResult?.test_id],
    queryFn: async () => {
      if (!selectedResult?.test_id) return [];
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', selectedResult.test_id)
        .order('order_index');
      
      if (error) throw error;
      return (data || []) as Question[];
    },
    enabled: !!selectedResult?.test_id,
  });

  // Получаем комментарии для выбранного результата теста
  const { data: answerComments = [] } = useQuery({
    queryKey: ['answer_comments', selectedResult?.id],
    queryFn: async () => {
      if (!selectedResult?.id) return [];
      
      const { data, error } = await supabase
        .from('answer_comments')
        .select('*')
        .eq('test_result_id', selectedResult.id);
      
      if (error) throw error;
      return (data || []) as AnswerComment[];
    },
    enabled: !!selectedResult?.id,
  });

  // Мутация для удаления результата теста
  const deleteResultMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase
        .from('test_results')
        .delete()
        .eq('id', resultId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test_results'] });
      toast({
        title: "Результат удален",
        description: "Результат тестирования успешно удален",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить результат тестирования",
        variant: "destructive",
      });
      console.error('Ошибка при удалении результата:', error);
    },
  });

  // Фильтруем результаты по коду доступа
  const filteredResults = results.filter(result => 
    searchCode.trim() === '' || result.access_code.includes(searchCode.trim())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getStatusBadge = (result: TestResultWithTest) => {
    const percentage = result.percentage_score || 0;
    if (percentage >= 80) {
      return <Badge variant="default">Отлично ({percentage}%)</Badge>;
    } else if (percentage >= 60) {
      return <Badge variant="secondary">Хорошо ({percentage}%)</Badge>;
    } else {
      return <Badge variant="destructive">Неудовлетворительно ({percentage}%)</Badge>;
    }
  };

  const handleViewDetails = (result: TestResultWithTest) => {
    setSelectedResult(result);
    setShowDetailDialog(true);
  };

  const getScoreText = (score: number, maxScore: number = 1) => {
    if (score === maxScore) return `${score} балл${score === 1 ? '' : score < 5 ? 'а' : 'ов'} (максимум)`;
    if (score === 0.5) return "0.5 балла";
    if (score === 0) return "0 баллов";
    return `${score} балл${score === 1 ? '' : score < 5 ? 'а' : 'ов'}`;
  };

  // Создаем массив ответов с текстами вопросов для отображения
  const getAnswersWithQuestions = () => {
    if (!selectedResult || !questions.length) return [];
    
    return questions.map(question => {
      const comment = answerComments.find(c => c.question_id === question.id);
      return {
        questionText: question.question_text,
        userAnswer: selectedResult.answers[question.id] || 0,
        maxScore: question.max_score,
        comment: comment?.comment
      };
    });
  };

  const handleDeleteResult = (resultId: string) => {
    deleteResultMutation.mutate(resultId);
  };

  const exportToPDF = async () => {
    if (!selectedResult || !exportRef.current) return;
    
    setIsExporting(true);
    try {
      // Dynamic imports to avoid build issues
      const html2canvas = await import('html2canvas');
      const jsPDF = await import('jspdf');
      
      const canvas = await html2canvas.default(exportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF.default('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const filename = `результат_теста_${selectedResult.access_code}_${selectedResult.user_name}.pdf`;
      pdf.save(filename);
      
      toast({
        title: "PDF создан",
        description: "Результат теста успешно сохранен в PDF",
      });
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать PDF файл",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    if (!selectedResult || !exportRef.current) return;
    
    setIsExporting(true);
    try {
      // Dynamic import to avoid build issues
      const html2canvas = await import('html2canvas');
      
      const canvas = await html2canvas.default(exportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `результат_теста_${selectedResult.access_code}_${selectedResult.user_name}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "Изображение создано",
        description: "Результат теста успешно сохранен как изображение",
      });
    } catch (error) {
      console.error('Ошибка при создании изображения:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать изображение",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>История переаттестации</CardTitle>
          <CardDescription>
            Просмотр всех пройденных тестов и поиск по коду доступа
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Label htmlFor="search-code" className="sr-only">Поиск по коду</Label>
              <Input
                id="search-code"
                type="text"
                placeholder="Введите код для поиска..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Результаты тестирования</CardTitle>
          <CardDescription>
            {filteredResults.length > 0 
              ? `Найдено записей: ${filteredResults.length}`
              : 'Записи не найдены'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Загрузка результатов...
            </div>
          ) : filteredResults.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Участник</TableHead>
                  <TableHead>Уровень</TableHead>
                  <TableHead>Код доступа</TableHead>
                  <TableHead>Дата прохождения</TableHead>
                  <TableHead>Баллы</TableHead>
                  <TableHead>Результат</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.user_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Уровень {result.tests?.level || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{result.access_code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(result.completed_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {result.earned_score} / {result.max_possible_score}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(result)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить результат?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы уверены, что хотите удалить результат тестирования пользователя "{result.user_name}" 
                                с кодом доступа "{result.access_code}"? Это действие нельзя отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteResult(result.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchCode ? 'По вашему запросу ничего не найдено' : 'История тестов пуста'}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали прохождения теста</DialogTitle>
            <DialogDescription>
              Код доступа: {selectedResult?.access_code}
            </DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="flex gap-2 justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Создание PDF...' : 'Экспорт PDF'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToImage}
                  disabled={isExporting}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  {isExporting ? 'Создание PNG...' : 'Экспорт PNG'}
                </Button>
              </div>
              
              <div ref={exportRef} className="bg-white p-6 rounded-lg">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">Результат тестирования</h2>
                  <p className="text-sm text-gray-600">Код доступа: {selectedResult.access_code}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label className="text-sm font-medium">Участник</Label>
                    <p className="text-lg">{selectedResult.user_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Уровень</Label>
                    <p className="text-lg">Уровень {selectedResult.tests?.level || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Дата прохождения</Label>
                    <p className="text-lg">{formatDate(selectedResult.completed_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Результат</Label>
                    <p className="text-lg font-semibold">
                      {selectedResult.earned_score} / {selectedResult.max_possible_score} ({selectedResult.percentage_score}%)
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-3 block">Ответы</Label>
                  {questions.length > 0 ? (
                    <div className="space-y-3">
                      {getAnswersWithQuestions().map((item, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="font-medium text-sm mb-2">
                            {index + 1}. {item.questionText}
                          </div>
                          <div className="text-sm text-gray-600">
                            Ответ: <span className="font-medium">{getScoreText(item.userAnswer, item.maxScore)}</span>
                          </div>
                          {item.comment && (
                            <div className="text-sm text-orange-600 mt-2 p-2 bg-orange-50 rounded">
                              <span className="font-medium">Комментарий:</span> {item.comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Загрузка вопросов...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryTab;
