import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import { Loader2, Shield, Check, X, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: string;
  moderator_id: string;
  project_id: string | null;
  action: string;
  reason: string | null;
  project_title: string | null;
  created_at: string;
  moderator?: { username: string };
}

export default function ModerationLogs() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin or curator
  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['moderationLogsAccess', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'curator']);
      
      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!user,
  });

  // Fetch moderation logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['moderationLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Get moderator profiles
      const modIds = [...new Set(data?.map(d => d.moderator_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', modIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data?.map(d => ({
        ...d,
        moderator: profileMap.get(d.moderator_id),
      })) as LogEntry[];
    },
    enabled: hasAccess === true,
  });

  if (authLoading || accessLoading) {
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

  if (!hasAccess) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Доступ запрещён</h1>
          <p className="text-muted-foreground">
            Только администраторы и кураторы могут просматривать логи модерации
          </p>
        </div>
      </Layout>
    );
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approve':
        return <Badge className="bg-minecraft-green text-primary-foreground gap-1"><Check className="w-3 h-3" />Одобрено</Badge>;
      case 'reject':
        return <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />Отклонено</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Логи модерации | NeuroLeak</title>
      </Helmet>

      <Layout>
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Логи модерации</h1>
              <p className="text-muted-foreground">История действий модераторов</p>
            </div>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет записей</h3>
                <p className="text-muted-foreground">
                  История модерации пуста
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getActionBadge(log.action)}
                          <span className="text-sm text-muted-foreground">
                            {log.moderator?.username || 'Модератор'}
                          </span>
                        </div>
                        
                        {log.project_title && (
                          <p className="font-medium text-foreground">
                            Проект: {log.project_title}
                          </p>
                        )}
                        
                        {log.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Причина: {log.reason}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
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