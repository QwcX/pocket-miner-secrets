import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { useMyProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Edit, 
  Eye, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from '@/types/database';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

export default function MyProjects() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: projects = [], isLoading } = useMyProjects(user?.id);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Мои проекты | TestLeak</title>
      </Helmet>

      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Мои проекты</h1>
              <p className="text-muted-foreground mt-1">
                Управляйте вашими загруженными проектами
              </p>
            </div>
            <Button onClick={() => navigate('/upload')} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Загрузить
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-4">
                  У вас пока нет загруженных проектов
                </p>
                <Button onClick={() => navigate('/upload')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Загрузить первый проект
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Thumbnail */}
                      <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                            <span className="font-display text-xl text-muted-foreground opacity-50">
                              MC
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={cn(CONTENT_TYPE_COLORS[project.content_type])}>
                            {CONTENT_TYPE_LABELS[project.content_type]}
                          </Badge>
                          {project.is_approved ? (
                            <Badge variant="outline" className="text-green-500 border-green-500/50">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Одобрен
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                              <Clock className="w-3 h-3 mr-1" />
                              На модерации
                            </Badge>
                          )}
                        </div>

                        <Link 
                          to={`/project/${project.slug}`}
                          className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {project.title}
                        </Link>

                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {project.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            {formatNumber(project.downloads_count)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(project.views_count)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(project.updated_at)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/project/${project.slug}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Просмотр
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/edit/${project.slug}`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
