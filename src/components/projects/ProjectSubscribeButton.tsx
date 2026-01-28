import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SubscribeButtonProps {
  projectId: string;
  variant?: 'default' | 'small';
  className?: string;
}

export function ProjectSubscribeButton({ projectId, variant = 'default', className }: SubscribeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isSubscribed = false } = useQuery({
    queryKey: ['project-subscription', projectId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('project_subscriptions')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!projectId,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      if (isSubscribed) {
        const { error } = await supabase
          .from('project_subscriptions')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_subscriptions')
          .insert({ project_id: projectId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-subscription', projectId, user?.id] });
      toast({
        title: isSubscribed ? 'Отписка оформлена' : 'Подписка оформлена',
        description: isSubscribed 
          ? 'Вы больше не будете получать уведомления об обновлениях' 
          : 'Вы получите уведомление при выходе новой версии',
      });
    },
    onError: () => {
      toast({ title: 'Ошибка', variant: 'destructive' });
    },
  });

  if (!user) return null;

  if (variant === 'small') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        className={cn("h-8 w-8", className)}
        title={isSubscribed ? 'Отписаться от обновлений' : 'Подписаться на обновления'}
      >
        {isSubscribed ? (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isSubscribed ? 'outline' : 'secondary'}
      size="sm"
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
      className={cn("gap-2", className)}
    >
      {isSubscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          Отписаться
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Подписаться
        </>
      )}
    </Button>
  );
}
