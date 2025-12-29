import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useProject } from '@/hooks/useProjects';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, Star, Eye, Calendar, User, Heart, HeartOff, Crown,
  MessageSquare, History, ArrowLeft, Send, Loader2, LogIn,
} from 'lucide-react';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS, ProjectVersion, Comment, Profile } from '@/types/database';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Project() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState('');

  const { data: project, isLoading } = useProject(slug || '');

  const { data: versions = [] } = useQuery({
    queryKey: ['project-versions', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectVersion[];
    },
    enabled: !!project?.id,
  });

  const { data: rating = 0 } = useQuery({
    queryKey: ['project-rating', project?.id],
    queryFn: async () => {
      if (!project?.id) return 0;
      const { data } = await supabase.rpc('get_project_rating', { project_uuid: project.id });
      return Number(data) || 0;
    },
    enabled: !!project?.id,
  });

  const { data: userRating } = useQuery({
    queryKey: ['user-rating', project?.id, user?.id],
    queryFn: async () => {
      if (!project?.id || !user?.id) return null;
      const { data } = await supabase
        .from('ratings')
        .select('rating')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.rating || null;
    },
    enabled: !!project?.id && !!user?.id,
  });

  const { data: isFavorite = false } = useQuery({
    queryKey: ['favorite', project?.id, user?.id],
    queryFn: async () => {
      if (!project?.id || !user?.id) return false;
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!project?.id && !!user?.id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', project.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      return (data || []).map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null,
      })) as (Comment & { profiles: Profile | null })[];
    },
    enabled: !!project?.id,
  });

  const requireAuth = (action: string) => {
    if (!user) {
      setAuthAction(action);
      setShowAuthDialog(true);
      return false;
    }
    return true;
  };

  const rateMutation = useMutation({
    mutationFn: async (ratingValue: number) => {
      if (!project?.id || !user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('ratings').upsert({
        project_id: project.id,
        user_id: user.id,
        rating: ratingValue,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-rating', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-rating', project?.id, user?.id] });
      toast({ title: 'Оценка сохранена!' });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id || !user?.id) throw new Error('Not authenticated');
      if (isFavorite) {
        await supabase.from('favorites').delete().eq('project_id', project.id).eq('user_id', user.id);
      } else {
        await supabase.from('favorites').insert({ project_id: project.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', project?.id, user?.id] });
      toast({ title: isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное' });
    },
  });

  const [commentText, setCommentText] = useState('');
  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id || !user?.id || !commentText.trim()) throw new Error('Invalid');
      const { error } = await supabase.from('comments').insert({
        project_id: project.id,
        user_id: user.id,
        content: commentText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', project?.id] });
      setCommentText('');
      toast({ title: 'Комментарий добавлен!' });
    },
  });

  useEffect(() => {
    if (project?.id) {
      supabase.from('projects').update({ views_count: (project.views_count || 0) + 1 }).eq('id', project.id);
    }
  }, [project?.id]);

  const formatNumber = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString();
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleDownload = (url: string) => {
    if (!requireAuth('скачать проект')) return;
    window.open(url, '_blank');
  };

  const handleRate = (value: number) => {
    if (!requireAuth('оценить проект')) return;
    rateMutation.mutate(value);
  };

  const handleFavorite = () => {
    if (!requireAuth('добавить в избранное')) return;
    favoriteMutation.mutate();
  };

  const handleComment = () => {
    if (!requireAuth('оставить комментарий')) return;
    if (commentText.trim()) {
      commentMutation.mutate();
    }
  };

  if (isLoading) return <Layout><div className="container py-8"><Skeleton className="h-64 w-full" /></div></Layout>;
  if (!project) return <Layout><div className="container py-16 text-center"><h1 className="text-2xl font-semibold mb-4">Проект не найден</h1><Button onClick={() => navigate('/browse')}><ArrowLeft className="w-4 h-4 mr-2" />Вернуться</Button></div></Layout>;

  const latestVersion = versions[0];

  return (
    <>
      <Helmet><title>{project.title} | TestLeak</title></Helmet>
      <Layout>
        <div className="container py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/browse" className="hover:text-foreground">Каталог</Link>
            <span>/</span>
            <span className="text-foreground">{project.title}</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-secondary">
                  {project.thumbnail_url ? <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="font-display text-3xl text-muted-foreground opacity-50">TL</span></div>}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn(CONTENT_TYPE_COLORS[project.content_type])}>{CONTENT_TYPE_LABELS[project.content_type]}</Badge>
                    {project.is_premium && <Badge className="bg-minecraft-gold text-background gap-1"><Crown className="w-3 h-3" />Premium</Badge>}
                  </div>
                  <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" />{project.profiles?.username || 'Unknown'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span><Download className="w-4 h-4 inline mr-1" />{formatNumber(project.downloads_count)}</span>
                    <span><Eye className="w-4 h-4 inline mr-1" />{formatNumber(project.views_count)}</span>
                    <span><Star className="w-4 h-4 inline mr-1 fill-minecraft-gold text-minecraft-gold" />{rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="description">
                <TabsList className="w-full justify-start bg-card border border-border">
                  <TabsTrigger value="description">Описание</TabsTrigger>
                  <TabsTrigger value="versions"><History className="w-4 h-4 mr-1" />Версии</TabsTrigger>
                  <TabsTrigger value="comments"><MessageSquare className="w-4 h-4 mr-1" />Комментарии</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4"><Card className="bg-card border-border"><CardContent className="pt-6"><p className="whitespace-pre-wrap">{project.description}</p></CardContent></Card></TabsContent>
                <TabsContent value="versions" className="mt-4 space-y-4">
                  {versions.map(v => (
                    <Card key={v.id} className="bg-card border-border"><CardContent className="pt-6 flex justify-between items-start">
                      <div><h3 className="font-semibold">v{v.version_number}</h3><p className="text-sm text-muted-foreground">{formatDate(v.created_at)}</p></div>
                      <Button size="sm" onClick={() => handleDownload(v.file_url)}><Download className="w-4 h-4 mr-1" />Скачать</Button>
                    </CardContent></Card>
                  ))}
                </TabsContent>
                <TabsContent value="comments" className="mt-4 space-y-4">
                  <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                      <Textarea 
                        placeholder={user ? "Комментарий..." : "Войдите чтобы оставить комментарий"} 
                        value={commentText} 
                        onChange={e => setCommentText(e.target.value)} 
                        className="mb-3" 
                        disabled={!user}
                      />
                      <Button onClick={handleComment} disabled={!commentText.trim()}>
                        <Send className="w-4 h-4 mr-1" />Отправить
                      </Button>
                    </CardContent>
                  </Card>
                  {comments.map(c => <Card key={c.id} className="bg-card border-border"><CardContent className="pt-6"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><User className="w-5 h-5" /></div><div><span className="font-medium">{c.profiles?.username}</span><p className="mt-1">{c.content}</p></div></div></CardContent></Card>)}
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Card className="bg-card border-border sticky top-24">
                <CardHeader><CardTitle className="text-lg">Скачать</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {latestVersion ? (
                    <Button className="w-full bg-primary" size="lg" onClick={() => handleDownload(latestVersion.file_url)}>
                      <Download className="w-4 h-4 mr-2" />Скачать v{latestVersion.version_number}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">Нет файлов</p>
                  )}
                  
                  <div className="pt-4 border-t border-border space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Оценка</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(v => (
                          <button key={v} onClick={() => handleRate(v)}>
                            <Star className={cn("w-6 h-6", (userRating||0) >= v ? "fill-minecraft-gold text-minecraft-gold" : "text-muted-foreground")} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleFavorite}>
                      {isFavorite ? <><HeartOff className="w-4 h-4 mr-2" />Убрать</> : <><Heart className="w-4 h-4 mr-2" />В избранное</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Auth Dialog */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Требуется авторизация</DialogTitle>
              <DialogDescription>
                Чтобы {authAction}, необходимо войти в аккаунт или зарегистрироваться
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button className="flex-1" onClick={() => navigate('/auth')}>
                <LogIn className="w-4 h-4 mr-2" />
                Войти
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate('/auth?mode=signup')}>
                Регистрация
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  );
}