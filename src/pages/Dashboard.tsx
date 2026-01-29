import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, Download, Eye, Star, MessageSquare, 
  TrendingUp, Package, Clock, ExternalLink, Copy,
  Users
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { CONTENT_TYPE_LABELS } from '@/types/database';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not logged in
  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Требуется авторизация</h1>
          <Button onClick={() => navigate('/auth')}>Войти</Button>
        </div>
      </Layout>
    );
  }

  // Get user's projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['author-projects', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get total stats
  const totalDownloads = projects.reduce((sum, p) => sum + (p.downloads_count || 0), 0);
  const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);

  // Get average rating for all projects
  const { data: avgRating = 0 } = useQuery({
    queryKey: ['author-avg-rating', user.id],
    queryFn: async () => {
      if (projects.length === 0) return 0;
      const projectIds = projects.map(p => p.id);
      const { data } = await supabase
        .from('ratings')
        .select('rating')
        .in('project_id', projectIds);
      if (!data || data.length === 0) return 0;
      return data.reduce((sum, r) => sum + r.rating, 0) / data.length;
    },
    enabled: projects.length > 0,
  });

  // Get total comments
  const { data: totalComments = 0 } = useQuery({
    queryKey: ['author-comments-count', user.id],
    queryFn: async () => {
      if (projects.length === 0) return 0;
      const projectIds = projects.map(p => p.id);
      const { count } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projectIds);
      return count || 0;
    },
    enabled: projects.length > 0,
  });

  // Get followers count
  const { data: followersCount = 0 } = useQuery({
    queryKey: ['author-followers', user.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('profile_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', user.id);
      return count || 0;
    },
  });

  // Get recent comments
  const { data: recentComments = [] } = useQuery({
    queryKey: ['author-recent-comments', user.id],
    queryFn: async () => {
      if (projects.length === 0) return [];
      const projectIds = projects.map(p => p.id);
      const { data } = await supabase
        .from('comments')
        .select('*, profiles:user_id(username)')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: projects.length > 0,
  });

  // Generate chart data (mock data for last 30 days - would need actual tracking table for real data)
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'dd MMM', { locale: ru }),
      downloads: Math.floor(Math.random() * 50) + 10,
      views: Math.floor(Math.random() * 200) + 50,
    };
  });

  const copyProjectLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/project/${slug}`);
    toast({ title: 'Ссылка скопирована!' });
  };

  return (
    <>
      <Helmet>
        <title>Дашборд автора | NeuroLeak</title>
      </Helmet>
      
      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-7 w-7 text-primary" />
                Дашборд автора
              </h1>
              <p className="text-muted-foreground mt-1">
                Статистика ваших проектов
              </p>
            </div>
            
            <Button asChild>
              <Link to="/upload">
                <Package className="h-4 w-4 mr-2" />
                Загрузить проект
              </Link>
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs">Проекты</span>
                </div>
                <p className="text-2xl font-bold">{projects.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Download className="h-4 w-4" />
                  <span className="text-xs">Скачивания</span>
                </div>
                <p className="text-2xl font-bold">{totalDownloads.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">Просмотры</span>
                </div>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Star className="h-4 w-4" />
                  <span className="text-xs">Рейтинг</span>
                </div>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">Комментарии</span>
                </div>
                <p className="text-2xl font-bold">{totalComments}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Подписчики</span>
                </div>
                <p className="text-2xl font-bold">{followersCount}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="projects">Проекты</TabsTrigger>
              <TabsTrigger value="comments">Комментарии</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Downloads chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Скачивания за 30 дней
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="downloads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Views chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Просмотры за 30 дней
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>Ваши проекты</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>У вас пока нет проектов</p>
                      <Button className="mt-4" asChild>
                        <Link to="/upload">Загрузить первый проект</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map(project => (
                        <div key={project.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                            {project.thumbnail_url ? (
                              <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link to={`/project/${project.slug}`} className="font-semibold hover:text-primary truncate">
                                {project.title}
                              </Link>
                              <Badge variant="outline" className="text-xs">
                                {CONTENT_TYPE_LABELS[project.content_type]}
                              </Badge>
                              {!project.is_approved && (
                                <Badge variant="secondary" className="text-xs">На модерации</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {project.downloads_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {project.views_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(project.created_at), 'dd MMM yyyy', { locale: ru })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => copyProjectLink(project.slug)}
                              title="Копировать ссылку"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              asChild
                            >
                              <Link to={`/project/${project.slug}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Последние комментарии</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentComments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Комментариев пока нет</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentComments.map((comment: any) => (
                        <div key={comment.id} className="p-4 rounded-lg bg-secondary/30">
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <span className="font-medium">{comment.profiles?.username || 'Пользователь'}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {format(new Date(comment.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </>
  );
}
