import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserNickname } from '@/components/UserNickname';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { 
  Trash2,
  Shield,
  Search,
  MessageSquare,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DonorTier, AppRole, Profile } from '@/types/database';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
  user_role?: AppRole;
  donor_tier?: DonorTier;
  nickname_color?: string | null;
}

export default function ChatModeration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Check user roles - must be staff
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const isStaff = userRoles?.some(r => 
    ['admin', 'moderator', 'curator', 'owner'].includes(r.role)
  );

  // Fetch all messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-moderation-messages', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('public_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch user info
      const userIds = [...new Set(data.map(m => m.user_id))];
      
      const [profilesRes, rolesRes, donorsRes] = await Promise.all([
        supabase.from('profiles').select('*').in('id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('user_donors').select('user_id, tier, nickname_color').in('user_id', userIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const roleMap = new Map<string, AppRole>();
      (rolesRes.data || []).forEach(r => {
        const priority: Record<string, number> = { owner: 6, admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        const current = roleMap.get(r.user_id);
        if (!current || priority[r.role] > priority[current]) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });
      const donorMap = new Map((donorsRes.data || []).map(d => [d.user_id, d]));

      let enrichedMessages = data.map(msg => ({
        ...msg,
        profile: profileMap.get(msg.user_id) || null,
        user_role: roleMap.get(msg.user_id) || 'user',
        donor_tier: (donorMap.get(msg.user_id)?.tier as DonorTier) || 'none',
        nickname_color: donorMap.get(msg.user_id)?.nickname_color || null,
      })) as ChatMessage[];

      // Filter by search
      if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        enrichedMessages = enrichedMessages.filter(m => 
          m.content.toLowerCase().includes(lowerSearch) ||
          m.profile?.username?.toLowerCase().includes(lowerSearch)
        );
      }

      return enrichedMessages;
    },
    enabled: !!user && isStaff,
    refetchInterval: 10000,
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('public_chat_messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-moderation-messages'] });
      toast({ title: 'Сообщение удалено' });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('public_chat_messages')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-moderation-messages'] });
      toast({ title: 'Все сообщения пользователя удалены' });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (rolesLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!isStaff) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-semibold mb-2">Доступ запрещен</h1>
          <p className="text-muted-foreground">Только для модераторов</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Модерация чата | NeuroLeak</title>
      </Helmet>
      <Layout>
        <div className="container py-6">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Модерация чата</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {messages.length} сообщений
                    </p>
                  </div>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Нет сообщений</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {messages.map(msg => (
                      <div 
                        key={msg.id} 
                        className="flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={msg.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {msg.profile?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <UserNickname
                              username={msg.profile?.username || 'Unknown'}
                              userId={msg.user_id}
                              role={msg.user_role}
                              donorTier={msg.donor_tier}
                              customColor={msg.nickname_color}
                              profilePrimaryColor={msg.profile?.profile_primary_color}
                              profileAccentColor={msg.profile?.profile_accent_color}
                              profileEmoji={msg.profile?.profile_emoji}
                            />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                            </span>
                          </div>
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => bulkDeleteMutation.mutate(msg.user_id)}
                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                            title="Удалить все сообщения пользователя"
                          >
                            Все от user
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(msg.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
}