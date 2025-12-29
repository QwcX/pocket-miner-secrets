import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserNickname } from '@/components/UserNickname';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Helmet } from 'react-helmet-async';
import { EmojiPicker } from '@/components/EmojiPicker';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Search,
  User,
  Loader2,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DonorTier, AppRole } from '@/types/database';

interface Conversation {
  partnerId: string;
  partnerUsername: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  partnerRole?: AppRole;
  partnerDonorTier?: DonorTier;
  partnerNicknameColor?: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Anti-spam check
const checkForSpam = async (content: string): Promise<boolean> => {
  const { data: blockedWords } = await supabase
    .from('blocked_words')
    .select('word');
  
  if (!blockedWords) return false;
  
  const lowerContent = content.toLowerCase();
  return blockedWords.some(bw => lowerContent.includes(bw.word.toLowerCase()));
};

// Component to render message content with emoji support
const MessageContent = ({ content }: { content: string }) => {
  // Parse content for [emoji:url] patterns
  const parts = content.split(/(\[emoji:[^\]]+\])/g);
  
  return (
    <p className="break-words">
      {parts.map((part, index) => {
        const emojiMatch = part.match(/\[emoji:([^\]]+)\]/);
        if (emojiMatch) {
          return (
            <img
              key={index}
              src={emojiMatch[1]}
              alt="emoji"
              className="inline-block w-6 h-6 align-middle mx-0.5"
            />
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
};

export default function Messages() {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { playMessageSound } = useNotificationSound();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messages } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages || messages.length === 0) return [];

      // Group by conversation partner
      const convMap = new Map<string, any>();
      messages.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            partnerId,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            unreadCount: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
          });
        } else if (msg.receiver_id === user.id && !msg.is_read) {
          convMap.get(partnerId).unreadCount++;
        }
      });

      // Fetch partner profiles
      const partnerIds = [...convMap.keys()];
      const [profilesRes, rolesRes, donorsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', partnerIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', partnerIds),
        supabase.from('user_donors').select('user_id, tier, nickname_color').in('user_id', partnerIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const roleMap = new Map<string, AppRole>();
      (rolesRes.data || []).forEach(r => {
        const priority: Record<string, number> = { admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        const current = roleMap.get(r.user_id);
        if (!current || priority[r.role] > priority[current]) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });
      const donorMap = new Map((donorsRes.data || []).map(d => [d.user_id, d]));

      return [...convMap.values()].map(conv => ({
        ...conv,
        partnerUsername: profileMap.get(conv.partnerId)?.username || 'Unknown',
        partnerAvatar: profileMap.get(conv.partnerId)?.avatar_url || null,
        partnerRole: roleMap.get(conv.partnerId) || 'user',
        partnerDonorTier: (donorMap.get(conv.partnerId)?.tier as DonorTier) || 'none',
        partnerNicknameColor: donorMap.get(conv.partnerId)?.nickname_color || null,
      })) as Conversation[];
    },
    enabled: !!user,
  });

  // Fetch messages with specific user
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', user?.id, recipientId],
    queryFn: async () => {
      if (!user || !recipientId) return [];

      const { data } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadIds = data
          .filter(m => m.receiver_id === user.id && !m.is_read)
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
          await supabase
            .from('private_messages')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }

      return data as Message[];
    },
    enabled: !!user && !!recipientId,
  });

  // Fetch recipient profile
  const { data: recipientProfile } = useQuery({
    queryKey: ['recipient-profile', recipientId],
    queryFn: async () => {
      if (!recipientId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', recipientId)
        .maybeSingle();
      return data;
    },
    enabled: !!recipientId,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !recipientId) throw new Error('Not authenticated');
      
      // Check for spam
      const isSpam = await checkForSpam(content);
      if (isSpam) {
        throw new Error('Сообщение содержит запрещенный контент');
      }

      const { error } = await supabase.from('private_messages').insert({
        sender_id: user.id,
        receiver_id: recipientId,
        content: content.trim(),
      });
      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'new_message',
        title: 'Новое сообщение',
        message: `У вас новое сообщение от пользователя`,
        link: `/messages/${user.id}`,
      });
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id, recipientId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });

  // Realtime subscription with sound
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('private-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          playMessageSound();
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, playMessageSound]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current > 0) {
      // New message received
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender_id !== user?.id) {
        playMessageSound();
      }
    }
    prevMessagesLengthRef.current = messages.length;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, user?.id, playMessageSound]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const filteredConversations = conversations.filter(c =>
    c.partnerUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Сообщения | TestLeak</title>
      </Helmet>
      <Layout>
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations list */}
            <Card className="glass-card md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Диалоги
                </CardTitle>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <ScrollArea className="h-[calc(100%-8rem)]">
                <CardContent className="space-y-2">
                  {loadingConversations ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Нет диалогов
                    </p>
                  ) : (
                    filteredConversations.map(conv => (
                      <button
                        key={conv.partnerId}
                        onClick={() => navigate(`/messages/${conv.partnerId}`)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-secondary/50 ${
                          recipientId === conv.partnerId ? 'bg-secondary' : ''
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={conv.partnerAvatar || undefined} />
                          <AvatarFallback>
                            {conv.partnerUsername.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <UserNickname
                            username={conv.partnerUsername}
                            userId={conv.partnerId}
                            role={conv.partnerRole}
                            donorTier={conv.partnerDonorTier}
                            customColor={conv.partnerNicknameColor}
                            asLink={false}
                          />
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </CardContent>
              </ScrollArea>
            </Card>

            {/* Messages area */}
            <Card className="glass-card md:col-span-2 flex flex-col">
              {recipientId ? (
                <>
                  {/* Header */}
                  <CardHeader className="border-b border-border/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => navigate('/messages')}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <Avatar>
                        <AvatarImage src={recipientProfile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {recipientProfile?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{recipientProfile?.username || 'Loading...'}</p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {loadingMessages ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Начните диалог
                        </p>
                      ) : (
                        messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                msg.sender_id === user.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary'
                              }`}
                            >
                              <MessageContent content={msg.content} />
                              <p className="text-xs opacity-70 mt-1">
                                {formatDistanceToNow(new Date(msg.created_at), {
                                  addSuffix: true,
                                  locale: ru,
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-border/50 flex-shrink-0">
                    <div className="flex gap-2 items-end">
                      <EmojiPicker 
                        onEmojiSelect={(emoji, isImage, imageUrl) => {
                          if (isImage && imageUrl) {
                            // Insert image emoji as special markup
                            setMessageText(prev => prev + `[emoji:${imageUrl}]`);
                          } else {
                            setMessageText(prev => prev + emoji);
                          }
                        }}
                      />
                      <Textarea
                        placeholder="Введите сообщение..."
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        className="resize-none flex-1"
                        rows={1}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (messageText.trim()) {
                              sendMutation.mutate(messageText);
                            }
                          }
                        }}
                      />
                      <Button
                        onClick={() => sendMutation.mutate(messageText)}
                        disabled={!messageText.trim() || sendMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Выберите диалог или начните новый</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
}
