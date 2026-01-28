import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AuthorSubscribeButtonProps {
  authorId: string;
  authorName?: string;
  variant?: 'default' | 'small';
  className?: string;
}

export function AuthorSubscribeButton({ authorId, authorName, variant = 'default', className }: AuthorSubscribeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Don't show if it's the same user
  if (user?.id === authorId) return null;

  const { data: isFollowing = false } = useQuery({
    queryKey: ['author-subscription', authorId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('profile_subscriptions')
        .select('id')
        .eq('following_id', authorId)
        .eq('follower_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!authorId,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      if (isFollowing) {
        const { error } = await supabase
          .from('profile_subscriptions')
          .delete()
          .eq('following_id', authorId)
          .eq('follower_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profile_subscriptions')
          .insert({ following_id: authorId, follower_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-subscription', authorId, user?.id] });
      toast({
        title: isFollowing ? 'Вы отписались' : 'Вы подписались',
        description: isFollowing 
          ? `Вы больше не следите за ${authorName || 'этим автором'}` 
          : `Вы будете получать уведомления о новых проектах ${authorName || 'этого автора'}`,
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
        title={isFollowing ? 'Отписаться от автора' : 'Подписаться на автора'}
      >
        {isFollowing ? (
          <UserMinus className="h-4 w-4 text-muted-foreground" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
      className={cn("gap-2", className)}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Отписаться
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Подписаться
        </>
      )}
    </Button>
  );
}
