import { useState, useEffect, useRef } from 'react';
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
import { EmojiPicker } from '@/components/EmojiPicker';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { Helmet } from 'react-helmet-async';
import { 
  Send, 
  MessageCircle, 
  Users,
  Trash2,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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

// Component to render message content with emoji support
const MessageContent = ({ content }: { content: string }) => {
  const parts = content.split(/(\[emoji:[^\]]+\])/g);
  
  return (
    <span className="break-words whitespace-pre-wrap">
      {parts.map((part, index) => {
        const emojiMatch = part.match(/\[emoji:([^\]]+)\]/);
        if (emojiMatch) {
          return (
            <img
              key={index}
              src={emojiMatch[1]}
              alt="emoji"
              className="inline-block w-5 h-5 align-middle mx-0.5"
            />
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default function GlobalChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check user roles
  const { data: userRoles } = useQuery({
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

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['global-chat-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
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

      return data.reverse().map(msg => ({
        ...msg,
        profile: profileMap.get(msg.user_id) || null,
        user_role: roleMap.get(msg.user_id) || 'user',
        donor_tier: (donorMap.get(msg.user_id)?.tier as DonorTier) || 'none',
        nickname_color: donorMap.get(msg.user_id)?.nickname_color || null,
      })) as ChatMessage[];
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const allowed = await checkRateLimit({
        actionType: 'global_chat',
        maxRequests: 15,
        windowSeconds: 60,
      });
      if (!allowed) throw new Error('Слишком много сообщений');

      const { error } = await supabase.from('public_chat_messages').insert({
        user_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['global-chat-messages'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
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
      queryClient.invalidateQueries({ queryKey: ['global-chat-messages'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('global-chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_chat_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['global-chat-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    sendMutation.mutate(messageText);
  };

  const handleEmojiSelect = (emoji: string, isImage?: boolean, imageUrl?: string) => {
    if (isImage && imageUrl) {
      setMessageText(prev => prev + `[emoji:${imageUrl}]`);
    } else {
      setMessageText(prev => prev + emoji);
    }
  };

  return (
    <>
      <Helmet>
        <title>Общий чат | TestLeak</title>
      </Helmet>
      <Layout>
        <div className="container py-6">
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader className="border-b border-border py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Общий чат</CardTitle>
                    <p className="text-sm text-muted-foreground">Общайтесь с другими игроками</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Онлайн</span>
                </div>
              </div>
            </CardHeader>

            <div className="flex flex-col h-[calc(100%-5rem)]">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Чат пока пуст. Напишите первым!</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 group hover:bg-secondary/30 p-2 rounded-lg transition-colors ${
                          msg.user_id === user?.id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          <AvatarImage src={msg.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {msg.profile?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
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
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ru })}
                            </span>
                            
                            {/* Delete button */}
                            {(msg.user_id === user?.id || isStaff) && (
                              <button 
                                onClick={() => deleteMutation.mutate(msg.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                              >
                                <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
                              </button>
                            )}
                          </div>
                          <div className="text-sm mt-0.5">
                            <MessageContent content={msg.content} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                {user ? (
                  <div className="flex gap-2">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    <Input
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Напишите сообщение..."
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={sendMutation.isPending || !messageText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-muted-foreground text-sm mb-2">
                      Войдите, чтобы писать в чат
                    </p>
                    <Button onClick={() => navigate('/auth')}>
                      Войти
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    </>
  );
}
