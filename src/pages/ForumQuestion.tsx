import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { ForumQuestion, ForumAnswer, Profile } from '@/types/database';
import { UserNickname } from '@/components/UserNickname';
import { EmojiText } from '@/components/EmojiText';
import { 
  ArrowLeft,
  CheckCircle, 
  ThumbsUp,
  ThumbsDown,
  Clock,
  Eye,
  Send,
  Crown
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';

export default function ForumQuestionPage() {
  const { questionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkRateLimit } = useRateLimit();
  
  const [newAnswer, setNewAnswer] = useState('');

  // Fetch question
  const { data: question, isLoading: questionLoading } = useQuery({
    queryKey: ['forum-question', questionId],
    queryFn: async () => {
      if (!questionId) return null;
      
      const { data, error } = await supabase
        .from('forum_questions')
        .select('*')
        .eq('id', questionId)
        .single();
      
      if (error) throw error;
      
      // Fetch author profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', data.author_id)
        .single();
      
      // Increment views
      await supabase
        .from('forum_questions')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', questionId);
      
      return { ...data, profiles: profile } as ForumQuestion;
    },
    enabled: !!questionId
  });

  // Fetch answers
  const { data: answers } = useQuery({
    queryKey: ['forum-answers', questionId],
    queryFn: async () => {
      if (!questionId) return [];
      
      const { data, error } = await supabase
        .from('forum_answers')
        .select('*')
        .eq('question_id', questionId)
        .order('is_solution', { ascending: false })
        .order('helpful_count', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch profiles
      const authorIds = [...new Set((data || []).map(a => a.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', authorIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      // Fetch user votes if logged in
      let userVotes: Record<string, boolean> = {};
      if (user) {
        const { data: votes } = await supabase
          .from('forum_answer_votes')
          .select('answer_id, is_helpful')
          .eq('voter_id', user.id)
          .in('answer_id', (data || []).map(a => a.id));
        
        (votes || []).forEach(v => {
          userVotes[v.answer_id] = v.is_helpful;
        });
      }
      
      return (data || []).map(a => ({
        ...a,
        profiles: profileMap.get(a.author_id) || null,
        user_vote: userVotes[a.id] ?? null
      })) as ForumAnswer[];
    },
    enabled: !!questionId
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!user || !questionId) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('forum_answers')
        .insert({
          question_id: questionId,
          author_id: user.id,
          content: newAnswer
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-answers'] });
      setNewAnswer('');
      toast({ title: 'Ответ добавлен!' });
    }
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ answerId, isHelpful }: { answerId: string; isHelpful: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check existing vote
      const { data: existing } = await supabase
        .from('forum_answer_votes')
        .select('id, is_helpful')
        .eq('answer_id', answerId)
        .eq('voter_id', user.id)
        .maybeSingle();
      
      if (existing) {
        if (existing.is_helpful === isHelpful) {
          // Remove vote
          await supabase.from('forum_answer_votes').delete().eq('id', existing.id);
        } else {
          // Update vote
          await supabase.from('forum_answer_votes').update({ is_helpful: isHelpful }).eq('id', existing.id);
        }
      } else {
        // Create vote
        await supabase.from('forum_answer_votes').insert({
          answer_id: answerId,
          voter_id: user.id,
          is_helpful: isHelpful
        });
      }
      
      // Update counts
      const { data: voteCounts } = await supabase
        .from('forum_answer_votes')
        .select('is_helpful')
        .eq('answer_id', answerId);
      
      const helpful = (voteCounts || []).filter(v => v.is_helpful).length;
      const notHelpful = (voteCounts || []).filter(v => !v.is_helpful).length;
      
      await supabase
        .from('forum_answers')
        .update({ helpful_count: helpful, not_helpful_count: notHelpful })
        .eq('id', answerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-answers'] });
    }
  });

  // Mark as solution mutation
  const markSolutionMutation = useMutation({
    mutationFn: async (answerId: string) => {
      if (!user || !questionId) throw new Error('Not authenticated');
      
      // Clear previous solution
      await supabase
        .from('forum_answers')
        .update({ is_solution: false })
        .eq('question_id', questionId);
      
      // Set new solution
      await supabase
        .from('forum_answers')
        .update({ is_solution: true })
        .eq('id', answerId);
      
      // Update question
      await supabase
        .from('forum_questions')
        .update({ is_solved: true, solution_id: answerId })
        .eq('id', questionId);
      
      // Add reputation to answer author
      const { data: answer } = await supabase
        .from('forum_answers')
        .select('author_id')
        .eq('id', answerId)
        .single();
      
      if (answer) {
        // Increment reputation
        const { data: existing } = await supabase
          .from('user_reputation')
          .select('points')
          .eq('user_id', answer.author_id)
          .maybeSingle();
        
        if (existing) {
          await supabase
            .from('user_reputation')
            .update({ points: existing.points + 10 })
            .eq('user_id', answer.author_id);
        } else {
          await supabase
            .from('user_reputation')
            .insert({ user_id: answer.author_id, points: 10 });
        }
        
        // Log reputation change
        await supabase
          .from('reputation_history')
          .insert({
            user_id: answer.author_id,
            points_change: 10,
            reason: 'Ответ отмечен как решение',
            given_by: user.id
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-question'] });
      queryClient.invalidateQueries({ queryKey: ['forum-answers'] });
      toast({ title: 'Ответ отмечен как решение!' });
    }
  });

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) return;
    
    const ok = await checkRateLimit({ actionType: 'forum_answer', maxRequests: 20, windowSeconds: 3600 });
    if (ok) submitAnswerMutation.mutate();
  };

  if (questionLoading) {
    return (
      <Layout>
        <div className="container py-8 text-center text-muted-foreground">
          Загрузка...
        </div>
      </Layout>
    );
  }

  if (!question) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground mb-4">Вопрос не найден</p>
          <Button onClick={() => navigate('/forum')}>Вернуться к форуму</Button>
        </div>
      </Layout>
    );
  }

  const isAuthor = user?.id === question.author_id;

  return (
    <>
      <Helmet>
        <title>{question.title} | Форум помощи | TestLeak</title>
      </Helmet>
      
      <Layout>
        <div className="container py-8 max-w-4xl">
          {/* Back button */}
          <Button variant="ghost" className="mb-4" onClick={() => navigate('/forum')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к форуму
          </Button>

          {/* Question */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {question.is_solved && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Решено
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{question.title}</CardTitle>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {question.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="prose dark:prose-invert max-w-none mb-4">
                <EmojiText text={question.content} />
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-2">
                  {question.profiles && (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={question.profiles.avatar_url || undefined} />
                        <AvatarFallback>{question.profiles.username[0]}</AvatarFallback>
                      </Avatar>
                      <UserNickname userId={question.author_id} username={question.profiles.username} />
                    </>
                  )}
                </div>
                
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(question.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                </span>
                
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {question.views_count} просмотров
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Answers */}
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold">
              Ответы ({answers?.length || 0})
            </h2>
            
            {answers?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Пока нет ответов. Будьте первым!
                </CardContent>
              </Card>
            ) : (
              answers?.map((answer) => (
                <Card 
                  key={answer.id} 
                  className={answer.is_solution ? 'border-green-500 bg-green-500/5' : ''}
                >
                  <CardContent className="py-4">
                    <div className="flex gap-4">
                      {/* Vote buttons */}
                      <div className="flex flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={answer.user_vote === true ? 'text-green-500' : ''}
                          onClick={() => voteMutation.mutate({ answerId: answer.id, isHelpful: true })}
                          disabled={!user}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                          {answer.helpful_count - answer.not_helpful_count}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={answer.user_vote === false ? 'text-red-500' : ''}
                          onClick={() => voteMutation.mutate({ answerId: answer.id, isHelpful: false })}
                          disabled={!user}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex-1">
                        {answer.is_solution && (
                          <Badge className="bg-green-500 text-white mb-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Решение
                          </Badge>
                        )}
                        
                        <div className="prose dark:prose-invert max-w-none mb-4">
                          <EmojiText text={answer.content} />
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {answer.profiles && (
                              <>
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={answer.profiles.avatar_url || undefined} />
                                  <AvatarFallback>{answer.profiles.username[0]}</AvatarFallback>
                                </Avatar>
                                <UserNickname userId={answer.author_id} username={answer.profiles.username} />
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(answer.created_at), 'dd MMM, HH:mm', { locale: ru })}
                            </span>
                          </div>
                          
                          {isAuthor && !question.is_solved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markSolutionMutation.mutate(answer.id)}
                              disabled={markSolutionMutation.isPending}
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              Отметить как решение
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add answer form */}
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ваш ответ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Напишите свой ответ..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={submitAnswerMutation.isPending || !newAnswer.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Отправить ответ
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground mb-4">Войдите, чтобы ответить на вопрос</p>
                <Button onClick={() => navigate('/auth')}>Войти</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </>
  );
}
