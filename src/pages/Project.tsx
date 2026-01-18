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
import { UserNickname } from '@/components/UserNickname';
import { YouTubeEmbed, findYouTubeLinks } from '@/components/YouTubeEmbed';
import { DonorBadge } from '@/components/DonorBadge';
import { useRateLimit } from '@/hooks/useRateLimit';
import { 
  Download, Star, Eye, Calendar, User, Heart, HeartOff, Crown,
  MessageSquare, History, ArrowLeft, Send, Trash2, LogIn,
} from 'lucide-react';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS, ProjectVersion, Comment, Profile, DonorTier, AppRole } from '@/types/database';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ExtendedComment extends Comment {
  profiles: Profile | null;
  user_role?: AppRole;
  donor_tier?: DonorTier;
  nickname_color?: string | null;
}

export default function Project() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkRateLimit } = useRateLimit();

  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState('');

  const { data: project, isLoading } = useProject(slug || '');

  // Check if current user can moderate
  const { data: userRoles } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      return data;
    },
    enabled: !!user,
  });

  const canModerate = userRoles?.some(r => 
    r.role === 'admin' || r.role === 'moderator' || r.role === 'curator'
  );

  // Get author info with role and donor tier
  const { data: authorInfo } = useQuery({
    queryKey: ['author-info', project?.author_id],
    queryFn: async () => {
      if (!project?.author_id) return null;
      
      const [profileResult, roleResult, donorResult] = await Promise.all([
        supabase.from('profiles').select('profile_primary_color, profile_accent_color, profile_emoji').eq('id', project.author_id).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', project.author_id),
        supabase.from('user_donors').select('tier, nickname_color').eq('user_id', project.author_id).maybeSingle(),
      ]);
      
      const highestRole = roleResult.data?.reduce((acc, r) => {
        const priority: Record<string, number> = { admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        return priority[r.role] > priority[acc] ? r.role as AppRole : acc;
      }, 'user' as AppRole) || 'user';
      
      return {
        role: highestRole,
        donorTier: (donorResult.data?.tier as DonorTier) || 'none',
        nicknameColor: donorResult.data?.nickname_color || null,
        profilePrimaryColor: profileResult.data?.profile_primary_color || null,
        profileAccentColor: profileResult.data?.profile_accent_color || null,
        profileEmoji: profileResult.data?.profile_emoji || null,
      };
    },
    enabled: !!project?.author_id,
  });

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
      
      const [profilesRes, rolesRes, donorsRes] = await Promise.all([
        supabase.from('profiles').select('*').in('id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('user_donors').select('user_id, tier, nickname_color').in('user_id', userIds),
      ]);
      
      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const roleMap = new Map<string, AppRole>();
      (rolesRes.data || []).forEach(r => {
        const current = roleMap.get(r.user_id);
        const priority: Record<string, number> = { admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        if (!current || priority[r.role] > priority[current]) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });
      const donorMap = new Map((donorsRes.data || []).map(d => [d.user_id, d]));
      
      return (data || []).map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null,
        user_role: roleMap.get(comment.user_id) || 'user',
        donor_tier: (donorMap.get(comment.user_id)?.tier as DonorTier) || 'none',
        nickname_color: donorMap.get(comment.user_id)?.nickname_color || null,
      })) as ExtendedComment[];
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

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', project?.id] });
      toast({ title: 'Комментарий удален' });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error('No project');
      
      // Log moderation action
      await supabase.from('moderation_logs').insert({
        moderator_id: user!.id,
        project_id: project.id,
        action: 'delete',
        project_title: project.title,
        reason: 'Удален модератором',
      });
      
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Проект удален' });
      navigate('/browse');
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

  const handleDownload = async (url: string) => {
    if (!requireAuth('скачать проект')) return;
    
    // Increment download count
    if (project?.id) {
      await supabase.from('projects').update({ downloads_count: (project.downloads_count || 0) + 1 }).eq('id', project.id);
      queryClient.invalidateQueries({ queryKey: ['project', slug] });
    }
    
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

  const handleComment = async () => {
    if (!requireAuth('оставить комментарий')) return;
    if (!commentText.trim()) return;
    
    // Rate limit comments
    const allowed = await checkRateLimit({
      actionType: 'comment',
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!allowed) return;
    
    commentMutation.mutate();
  };

  if (isLoading) return <Layout><div className="container py-8"><Skeleton className="h-64 w-full" /></div></Layout>;
  if (!project) return <Layout><div className="container py-16 text-center"><h1 className="text-2xl font-semibold mb-4">Проект не найден</h1><Button onClick={() => navigate('/browse')}><ArrowLeft className="w-4 h-4 mr-2" />Вернуться</Button></div></Layout>;

  const latestVersion = versions[0];
  const youtubeLinks = findYouTubeLinks(project.description);

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
                    {project.price > 0 && <Badge variant="outline" className="text-minecraft-gold border-minecraft-gold">{project.price} ₽</Badge>}
                  </div>
                  <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <UserNickname 
                        username={project.profiles?.username || 'Unknown'} 
                        userId={project.author_id}
                        role={authorInfo?.role}
                        donorTier={authorInfo?.donorTier}
                        customColor={authorInfo?.nicknameColor}
                        profilePrimaryColor={authorInfo?.profilePrimaryColor}
                        profileAccentColor={authorInfo?.profileAccentColor}
                        profileEmoji={authorInfo?.profileEmoji}
                      />
                      {authorInfo?.donorTier && authorInfo.donorTier !== 'none' && (
                        <DonorBadge tier={authorInfo.donorTier} size="sm" />
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-4 h-4" />{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span><Download className="w-4 h-4 inline mr-1" />{formatNumber(project.downloads_count)}</span>
                    <span><Eye className="w-4 h-4 inline mr-1" />{formatNumber(project.views_count)}</span>
                    <span><Star className="w-4 h-4 inline mr-1 fill-minecraft-gold text-minecraft-gold" />{rating.toFixed(1)}</span>
                  </div>
                  
                  {canModerate && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить проект
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Проект будет удален навсегда.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProjectMutation.mutate()}>
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              <Tabs defaultValue="description">
                <TabsList className="w-full justify-start bg-card border border-border">
                  <TabsTrigger value="description">Описание</TabsTrigger>
                  <TabsTrigger value="versions"><History className="w-4 h-4 mr-1" />Версии</TabsTrigger>
                  <TabsTrigger value="comments"><MessageSquare className="w-4 h-4 mr-1" />Комментарии</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4 space-y-4">
                  <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                      <p className="whitespace-pre-wrap">{project.description}</p>
                    </CardContent>
                  </Card>
                  
                  {/* YouTube embeds */}
                  {youtubeLinks.length > 0 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-lg">Видео</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {youtubeLinks.map((link, i) => (
                          <YouTubeEmbed key={i} url={link} />
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
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
                  {comments.map(c => (
                    <Card key={c.id} className="bg-card border-border">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <UserNickname 
                                username={c.profiles?.username || 'Unknown'} 
                                userId={c.user_id}
                                role={c.user_role}
                                donorTier={c.donor_tier}
                                customColor={c.nickname_color}
                                profilePrimaryColor={c.profiles?.profile_primary_color}
                                profileAccentColor={c.profiles?.profile_accent_color}
                                profileEmoji={c.profiles?.profile_emoji}
                              />
                              {c.donor_tier && c.donor_tier !== 'none' && (
                                <DonorBadge tier={c.donor_tier} size="sm" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(c.created_at)}
                              </span>
                            </div>
                            <p className="mt-1">{c.content}</p>
                          </div>
                          {(canModerate || c.user_id === user?.id) && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteCommentMutation.mutate(c.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
