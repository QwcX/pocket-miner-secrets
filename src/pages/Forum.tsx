import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { ForumQuestion, Profile } from '@/types/database';
import { UserNickname } from '@/components/UserNickname';
import { 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  CheckCircle, 
  Eye,
  Clock,
  Search,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';

const FORUM_TAGS = [
  'сборка', 'плагины', 'моды', 'лаунчер', 'сервер', 
  'ошибка', 'настройка', 'производительность', 'другое'
];

export default function Forum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkRateLimit } = useRateLimit();
  
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: [] as string[] });

  // Fetch questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ['forum-questions', searchQuery, selectedTag],
    queryFn: async () => {
      let query = supabase
        .from('forum_questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      
      if (selectedTag) {
        query = query.contains('tags', [selectedTag]);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch profiles for authors
      const authorIds = [...new Set((data || []).map(q => q.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', authorIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      // Fetch answer counts
      const questionIds = (data || []).map(q => q.id);
      const { data: answerCounts } = await supabase
        .from('forum_answers')
        .select('question_id')
        .in('question_id', questionIds);
      
      const countMap = new Map<string, number>();
      (answerCounts || []).forEach(a => {
        countMap.set(a.question_id, (countMap.get(a.question_id) || 0) + 1);
      });
      
      return (data || []).map(q => ({
        ...q,
        profiles: profileMap.get(q.author_id) || null,
        answers_count: countMap.get(q.id) || 0
      })) as ForumQuestion[];
    }
  });

  // Create question mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('forum_questions')
        .insert({
          author_id: user.id,
          title: newQuestion.title,
          content: newQuestion.content,
          tags: newQuestion.tags
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forum-questions'] });
      setNewQuestion({ title: '', content: '', tags: [] });
      setIsCreating(false);
      toast({ title: 'Вопрос создан!' });
      navigate(`/forum/${data.id}`);
    },
    onError: () => {
      toast({ title: 'Ошибка', description: 'Не удалось создать вопрос', variant: 'destructive' });
    }
  });

  const handleCreate = async () => {
    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    
    const ok = await checkRateLimit({ actionType: 'forum_question', maxRequests: 5, windowSeconds: 3600 });
    if (ok) createMutation.mutate();
  };

  const toggleTag = (tag: string) => {
    setNewQuestion(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <>
      <Helmet>
        <title>Форум помощи | TestLeak</title>
        <meta name="description" content="Задавайте вопросы и помогайте другим игрокам с проблемами в Minecraft" />
      </Helmet>
      
      <Layout>
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <HelpCircle className="h-7 w-7 text-primary" />
                Форум помощи
              </h1>
              <p className="text-muted-foreground mt-1">
                Задавайте вопросы и помогайте другим
              </p>
            </div>
            
            {user && (
              <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-2" />
                Задать вопрос
              </Button>
            )}
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск вопросов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {FORUM_TAGS.slice(0, 5).map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Create question form */}
          {isCreating && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Новый вопрос
                  <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Заголовок вопроса"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={150}
                />
                
                <Textarea
                  placeholder="Опишите вашу проблему подробно..."
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Теги:</p>
                  <div className="flex flex-wrap gap-2">
                    {FORUM_TAGS.map(tag => (
                      <Badge
                        key={tag}
                        variant={newQuestion.tags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    Создать вопрос
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : questions?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Вопросов пока нет</p>
                  {user && (
                    <Button className="mt-4" onClick={() => setIsCreating(true)}>
                      Задать первый вопрос
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              questions?.map((question) => (
                <Link key={question.id} to={`/forum/${question.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:flex flex-col items-center gap-1 text-center min-w-[60px]">
                          <div className="text-lg font-semibold">{question.answers_count}</div>
                          <div className="text-xs text-muted-foreground">ответов</div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {question.is_solved && (
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Решено
                              </Badge>
                            )}
                            <h3 className="font-semibold truncate">{question.title}</h3>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {question.content}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {question.tags?.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {question.views_count}
                            </span>
                            
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(question.created_at), 'dd MMM', { locale: ru })}
                            </span>
                            
                            {question.profiles && (
                              <span className="flex items-center gap-1">
                                от <UserNickname userId={question.author_id} username={question.profiles.username} />
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="sm:hidden flex items-center gap-1 text-sm">
                          <MessageSquare className="h-4 w-4" />
                          {question.answers_count}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
