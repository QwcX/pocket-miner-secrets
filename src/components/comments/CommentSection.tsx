import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentItem } from './CommentItem';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare } from 'lucide-react';
import { Profile, AppRole, DonorTier } from '@/types/database';

interface CommentSectionProps {
  projectId: string;
  canInteract: boolean;
}

interface ExtendedComment {
  id: string;
  project_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: Profile | null;
  user_role?: AppRole;
  donor_tier?: DonorTier;
  nickname_color?: string | null;
  helpful_count: number;
  not_helpful_count: number;
  user_vote?: boolean | null;
  replies?: ExtendedComment[];
}

export function CommentSection({ projectId, canInteract }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  // Get user's comment count in last hour for rate limiting
  const { data: recentCommentCount = 0 } = useQuery({
    queryKey: ['comment-rate-limit', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id) return 0;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch comments with votes
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', projectId)
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
        const priority: Record<string, number> = { owner: 6, admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        if (!current || priority[r.role] > priority[current]) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });
      const donorMap = new Map((donorsRes.data || []).map(d => [d.user_id, d]));

      // Build comment tree
      const commentMap = new Map<string, ExtendedComment>();
      const rootComments: ExtendedComment[] = [];

      (data || []).forEach(comment => {
        const extended: ExtendedComment = {
          ...comment,
          profiles: profileMap.get(comment.user_id) || null,
          user_role: roleMap.get(comment.user_id) || 'user',
          donor_tier: (donorMap.get(comment.user_id)?.tier as DonorTier) || 'none',
          nickname_color: donorMap.get(comment.user_id)?.nickname_color || null,
          helpful_count: 0,
          not_helpful_count: 0,
          replies: [],
        };
        commentMap.set(comment.id, extended);
      });

      commentMap.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      return rootComments;
    },
    enabled: !!projectId,
  });

  // Check user roles for moderation
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
    r.role === 'owner' || r.role === 'admin' || r.role === 'moderator'
  );

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check rate limit (5 comments per hour)
      if (recentCommentCount >= 5) {
        throw new Error('Слишком много комментариев. Подождите немного.');
      }
      
      const { error } = await supabase.from('comments').insert({
        project_id: projectId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['comment-rate-limit'] });
      setCommentText('');
      toast({ title: 'Комментарий добавлен!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ parentId, content }: { parentId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (recentCommentCount >= 5) {
        throw new Error('Слишком много комментариев. Подождите немного.');
      }
      
      const { error } = await supabase.from('comments').insert({
        project_id: projectId,
        user_id: user.id,
        parent_id: parentId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['comment-rate-limit'] });
      toast({ title: 'Ответ добавлен!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { error } = await supabase
        .from('comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] });
      toast({ title: 'Комментарий обновлен' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] });
      toast({ title: 'Комментарий удален' });
    },
  });

  // Vote mutation (placeholder - would need comment_votes table)
  const voteMutation = useMutation({
    mutationFn: async ({ commentId, isHelpful }: { commentId: string; isHelpful: boolean }) => {
      // TODO: Implement vote system with comment_votes table
      console.log('Vote:', commentId, isHelpful);
    },
  });

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    if (!canInteract) {
      toast({ title: 'Нет доступа', description: 'У вас нет доступа для комментирования', variant: 'destructive' });
      return;
    }
    addCommentMutation.mutate(commentText.trim());
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment form */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {comments.length} {comments.length === 1 ? 'комментарий' : 'комментариев'}
            </span>
            {user && recentCommentCount >= 5 && (
              <span className="text-xs text-destructive ml-auto">
                Лимит комментариев достигнут
              </span>
            )}
          </div>
          <Textarea 
            placeholder={user ? "Напишите комментарий..." : "Войдите чтобы оставить комментарий"} 
            value={commentText} 
            onChange={e => setCommentText(e.target.value)} 
            className="mb-3 min-h-[80px]" 
            disabled={!user || !canInteract}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {user && `Осталось: ${Math.max(0, 5 - recentCommentCount)} комментариев в этот час`}
            </span>
            <Button 
              onClick={handleSubmit} 
              disabled={!commentText.trim() || !user || !canInteract || addCommentMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Отправить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      {comments.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Пока нет комментариев</p>
            <p className="text-sm mt-1">Будьте первым, кто оставит отзыв!</p>
          </CardContent>
        </Card>
      ) : (
        comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={user?.id}
            canModerate={canModerate || false}
            onDelete={(id) => deleteMutation.mutate(id)}
            onEdit={(id, content) => editMutation.mutate({ commentId: id, content })}
            onReply={(parentId, content) => replyMutation.mutate({ parentId, content })}
            onReport={(id) => toast({ title: 'Жалоба отправлена', description: 'Модераторы рассмотрят ваше обращение' })}
            onVote={(id, isHelpful) => voteMutation.mutate({ commentId: id, isHelpful })}
          />
        ))
      )}
    </div>
  );
}
