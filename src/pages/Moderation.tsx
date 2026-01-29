import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Check, 
  X, 
  Eye, 
  Shield,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Project, CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from '@/types/database';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function Moderation() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Check if user is moderator or admin
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator', 'curator']);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasModeratorAccess = userRole && userRole.length > 0;

  // Fetch pending projects
  const { data: pendingProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['pendingProjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: hasModeratorAccess,
  });

  // Fetch approved projects
  const { data: approvedProjects, isLoading: approvedLoading } = useQuery({
    queryKey: ['approvedProjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: hasModeratorAccess,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (project: Project) => {
      const { error } = await supabase
        .from('projects')
        .update({ is_approved: true })
        .eq('id', project.id);
      
      if (error) throw error;

      // Log the action
      await supabase.from('moderation_logs').insert({
        moderator_id: user!.id,
        project_id: project.id,
        action: 'approve',
        project_title: project.title,
      });

      // Send notification to project author
      await supabase.from('notifications').insert({
        user_id: project.author_id,
        type: 'project_approved',
        title: 'Проект одобрен! ✅',
        message: `Ваш проект "${project.title}" был одобрен модератором и теперь доступен для всех пользователей.`,
        link: `/project/${project.slug}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingProjects'] });
      queryClient.invalidateQueries({ queryKey: ['approvedProjects'] });
      toast({
        title: 'Проект одобрен',
        description: 'Проект теперь доступен для всех пользователей',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject mutation (delete project)
  const rejectMutation = useMutation({
    mutationFn: async ({ project, reason }: { project: Project; reason: string }) => {
      // Log the action first
      await supabase.from('moderation_logs').insert({
        moderator_id: user!.id,
        project_id: project.id,
        action: 'reject',
        reason: reason || null,
        project_title: project.title,
      });

      // Send notification before deleting
      await supabase.from('notifications').insert({
        user_id: project.author_id,
        type: 'project_rejected',
        title: 'Проект отклонён ❌',
        message: reason 
          ? `Ваш проект "${project.title}" был отклонён. Причина: ${reason}`
          : `Ваш проект "${project.title}" был отклонён модератором.`,
      });

      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingProjects'] });
      setShowRejectDialog(false);
      setSelectedProject(null);
      setRejectReason('');
      toast({
        title: 'Проект отклонён',
        description: 'Уведомление отправлено автору',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (authLoading || roleLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!hasModeratorAccess) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Доступ запрещён</h1>
          <p className="text-muted-foreground">
            У вас нет прав для просмотра этой страницы
          </p>
        </div>
      </Layout>
    );
  }

  const ProjectCard = ({ project, showActions = true }: { project: Project; showActions?: boolean }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="w-24 h-24 rounded-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{project.title}</h3>
                <Badge className={CONTENT_TYPE_COLORS[project.content_type]}>
                  {CONTENT_TYPE_LABELS[project.content_type]}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {project.description}
            </p>
            
            {project.download_url && (
              <a
                href={project.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                Ссылка на скачивание
              </a>
            )}
            
            <div className="flex gap-2 mt-3">
              <Link to={`/project/${project.slug}`} target="_blank">
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4 mr-1" />
                  Просмотр
                </Button>
              </Link>
              
              {showActions && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => approveMutation.mutate(project)}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Одобрить
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedProject(project);
                      setShowRejectDialog(true);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Отклонить
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Модерация | NeuroLeak</title>
      </Helmet>

      <Layout>
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Панель модерации</h1>
              <p className="text-muted-foreground">Проверка и одобрение проектов</p>
            </div>
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="gap-2">
                На проверке
                {pendingProjects && pendingProjects.length > 0 && (
                  <Badge variant="destructive">{pendingProjects.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Одобренные</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {projectsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : pendingProjects && pendingProjects.length > 0 ? (
                <div className="space-y-4">
                  {pendingProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <Check className="w-12 h-12 mx-auto text-minecraft-green mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Всё проверено!</h3>
                    <p className="text-muted-foreground">
                      Нет проектов, ожидающих проверки
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : approvedProjects && approvedProjects.length > 0 ? (
                <div className="space-y-4">
                  {approvedProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} showActions={false} />
                  ))}
                </div>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Нет одобренных проектов
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Отклонить проект</DialogTitle>
              <DialogDescription>
                Проект "{selectedProject?.title}" будет удалён. Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Причина отклонения (необязательно)</Label>
                <Textarea
                  placeholder="Укажите причину отклонения..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedProject && rejectMutation.mutate({ project: selectedProject, reason: rejectReason })}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Отклонить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  );
}
