import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserNickname } from '@/components/UserNickname';
import { EmojiPicker } from '@/components/EmojiPicker';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { 
  Send, 
  MessageCircle, 
  Trash2,
  Loader2,
  Bold,
  Italic,
  LinkIcon,
  ImageIcon,
  Smile,
  Settings,
  MessagesSquare,
  X,
  ZoomIn,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DonorTier, AppRole, Profile } from '@/types/database';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  image_url?: string | null;
  profile?: Profile;
  user_role?: AppRole;
  donor_tier?: DonorTier;
  nickname_color?: string | null;
}

// Component to render message content with emoji and mention support
const MessageContent = ({ content }: { content: string }) => {
  // Parse @mentions and emojis
  const parts = content.split(/(@\w+|\[emoji:[^\]]+\])/g);
  
  return (
    <span className="break-words whitespace-pre-wrap">
      {parts.map((part, index) => {
        // Check for mention
        if (part.startsWith('@')) {
          return (
            <span 
              key={index} 
              className="text-primary font-medium bg-primary/10 px-1 rounded"
            >
              {part}
            </span>
          );
        }
        // Check for emoji
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

// Format timestamp like reference
const formatMessageTime = (date: Date) => {
  if (isToday(date)) {
    return `Сегодня в ${format(date, 'HH:mm')}`;
  }
  if (isYesterday(date)) {
    return `Вчера в ${format(date, 'HH:mm')}`;
  }
  return format(date, 'd MMM в HH:mm', { locale: ru });
};

// Forum sidebar sections
const forumSections = [
  { name: 'Общий чат', href: '/chat', icon: MessagesSquare },
  { name: 'Форум Q&A', href: '/forum', icon: MessageCircle },
];

export default function GlobalChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    refetchInterval: 5000,
  });

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ошибка', description: 'Максимальный размер файла: 5MB', variant: 'destructive' });
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast({ title: 'Ошибка', description: 'Разрешены только изображения (JPG, PNG, GIF, WebP)', variant: 'destructive' });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string }) => {
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
        image_url: imageUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText('');
      clearImage();
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

  const handleSend = async () => {
    if (!messageText.trim() && !imageFile) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    let imageUrl: string | undefined;

    // Upload image if present
    if (imageFile) {
      setUploading(true);
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      } catch (err: any) {
        toast({ title: 'Ошибка загрузки', description: err.message, variant: 'destructive' });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    sendMutation.mutate({ content: messageText || '', imageUrl });
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
        <title>БлэкЧат | NeuroLeak</title>
      </Helmet>
      <Layout>
        <div className="container py-6">
          {/* Header like reference */}
          <div className="mb-6 border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-foreground">
              NeuroLeak.com — лучшее для сервера Майнкрафт!
            </h1>
          </div>

          {/* Chat container with sidebar navigation */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold">БлэкЧат</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <ScrollArea className="h-[calc(100vh-24rem)]">
              <div className="p-4 space-y-4">
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
                      className="group flex gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <UserNickname
                            username={msg.profile?.username || 'Unknown'}
                            userId={msg.user_id}
                            role={msg.user_role}
                            donorTier={msg.donor_tier}
                            customColor={msg.nickname_color}
                            profilePrimaryColor={msg.profile?.profile_primary_color}
                            profileAccentColor={msg.profile?.profile_accent_color}
                            profileEmoji={msg.profile?.profile_emoji}
                            showBadge
                          />
                          <span className="text-xs">:</span>
                          <span className="text-sm flex-1">
                            <MessageContent content={msg.content} />
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {formatMessageTime(new Date(msg.created_at))}
                          </span>
                        </div>
                        {/* Attached image */}
                        {msg.image_url && (
                          <div className="mt-2">
                            <img 
                              src={msg.image_url} 
                              alt="Вложение"
                              className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-border"
                              onClick={() => setViewImage(msg.image_url!)}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Delete button */}
                      {(msg.user_id === user?.id || isStaff) && (
                        <button 
                          onClick={() => deleteMutation.mutate(msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive hover:text-destructive/80" />
                        </button>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area like reference */}
            <div className="border-t border-border p-4">
              {user ? (
                <div className="space-y-3">
                  {/* Image preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Превью" 
                        className="max-h-24 rounded-lg border border-border"
                      />
                      <button 
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Toolbar */}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <button className="p-1.5 hover:bg-secondary rounded">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-secondary rounded">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-secondary rounded">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-secondary rounded"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  </div>

                  {/* Textarea and send */}
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Напишите сообщение..."
                      className="min-h-[60px] resize-none bg-secondary/50 border-border"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={sendMutation.isPending || uploading || (!messageText.trim() && !imageFile)}
                      className="bg-primary text-primary-foreground gap-2"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Отправить
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">
                    Для доступа, напиши три сообщения на форуме.
                  </p>
                  <Button onClick={() => navigate('/auth')}>
                    Войти
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Forum sections navigation */}
          <div className="mt-6 flex items-center gap-3">
            {forumSections.map(section => (
              <Link
                key={section.href}
                to={section.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                  location.pathname === section.href
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <section.icon className="w-4 h-4" />
                {section.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Image viewer dialog */}
        <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
          <DialogContent className="max-w-4xl p-2 bg-background/95">
            {viewImage && (
              <img 
                src={viewImage} 
                alt="Просмотр изображения" 
                className="w-full h-auto max-h-[80vh] object-contain rounded"
              />
            )}
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  );
}