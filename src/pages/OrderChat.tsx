import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserNickname } from '@/components/UserNickname';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { Helmet } from 'react-helmet-async';
import { EmojiPicker } from '@/components/EmojiPicker';
import { 
  Send, 
  ArrowLeft, 
  ShoppingCart,
  Package,
  User,
  Loader2,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ImageIcon,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DonorTier, AppRole, Profile } from '@/types/database';

interface PurchaseMessage {
  id: string;
  request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  image_url?: string | null;
  sender_profile?: Profile;
  sender_role?: AppRole;
  sender_donor_tier?: DonorTier;
  sender_nickname_color?: string | null;
}

interface PurchaseRequest {
  id: string;
  project_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  message: string | null;
  referral_source: string | null;
  created_at: string;
  updated_at: string;
}

// Component to render message content with emoji support
const MessageContent = ({ content }: { content: string }) => {
  const parts = content.split(/(\[emoji:[^\]]+\])/g);
  
  return (
    <p className="break-words whitespace-pre-wrap">
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

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Ожидает ответа', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  approved: { label: 'Одобрено', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejected: { label: 'Отклонено', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completed: { label: 'Завершено', icon: CheckCircle, color: 'bg-primary/20 text-primary border-primary/30' },
};

export default function OrderChat() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
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

  // Check if user can access this order (buyer, seller, or staff)
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

  // Fetch purchase request
  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ['purchase-request', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();
      if (error) throw error;
      return data as PurchaseRequest | null;
    },
    enabled: !!requestId,
  });

  // Fetch project info
  const { data: project } = useQuery({
    queryKey: ['project-for-order', request?.project_id],
    queryFn: async () => {
      if (!request?.project_id) return null;
      const { data } = await supabase
        .from('projects')
        .select('id, title, slug, thumbnail_url, price')
        .eq('id', request.project_id)
        .maybeSingle();
      return data;
    },
    enabled: !!request?.project_id,
  });

  // Fetch buyer profile
  const { data: buyerProfile } = useQuery({
    queryKey: ['buyer-profile', request?.buyer_id],
    queryFn: async () => {
      if (!request?.buyer_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', request.buyer_id)
        .maybeSingle();
      return data;
    },
    enabled: !!request?.buyer_id,
  });

  // Fetch seller profile
  const { data: sellerProfile } = useQuery({
    queryKey: ['seller-profile', request?.seller_id],
    queryFn: async () => {
      if (!request?.seller_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', request.seller_id)
        .maybeSingle();
      return data;
    },
    enabled: !!request?.seller_id,
  });

  // Fetch messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['order-messages', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const { data, error } = await supabase
        .from('purchase_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch sender info
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      if (senderIds.length === 0) return [];

      const [profilesRes, rolesRes, donorsRes] = await Promise.all([
        supabase.from('profiles').select('*').in('id', senderIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', senderIds),
        supabase.from('user_donors').select('user_id, tier, nickname_color').in('user_id', senderIds),
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

      return (data || []).map(msg => ({
        ...msg,
        sender_profile: profileMap.get(msg.sender_id) || null,
        sender_role: roleMap.get(msg.sender_id) || 'user',
        sender_donor_tier: (donorMap.get(msg.sender_id)?.tier as DonorTier) || 'none',
        sender_nickname_color: donorMap.get(msg.sender_id)?.nickname_color || null,
      })) as PurchaseMessage[];
    },
    enabled: !!requestId,
  });

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ошибка', description: 'Максимальный размер файла: 5MB', variant: 'destructive' });
      return;
    }

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
      if (!user || !requestId) throw new Error('Not authenticated');
      
      const allowed = await checkRateLimit({
        actionType: 'order_message',
        maxRequests: 20,
        windowSeconds: 60,
      });
      if (!allowed) throw new Error('Слишком много сообщений');

      const { error } = await supabase.from('purchase_messages').insert({
        request_id: requestId,
        sender_id: user.id,
        content: content.trim(),
        image_url: imageUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText('');
      clearImage();
      queryClient.invalidateQueries({ queryKey: ['order-messages', requestId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });

  const handleSend = async () => {
    if (!messageText.trim() && !imageFile) return;
    if (!user || !requestId) return;

    let imageUrl: string | undefined;

    if (imageFile) {
      setUploading(true);
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${requestId}/${Date.now()}.${fileExt}`;
        
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

  // Realtime subscription
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`order-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchase_messages',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['order-messages', requestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Check access
  const canAccess = request && (
    request.buyer_id === user.id ||
    request.seller_id === user.id ||
    isStaff
  );

  if (!loadingRequest && request && !canAccess) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Доступ запрещён</h1>
          <p className="text-muted-foreground mb-6">Вы не можете просматривать этот заказ</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </Layout>
    );
  }

  const orderNumber = requestId?.slice(0, 8).toUpperCase();
  const statusInfo = STATUS_CONFIG[request?.status || 'pending'];
  const StatusIcon = statusInfo?.icon || AlertCircle;

  return (
    <>
      <Helmet>
        <title>Заказ #{orderNumber} | TestLeak</title>
      </Helmet>
      <Layout>
        <div className="container py-6">
          {/* Header with order info */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      <h1 className="text-xl font-semibold">Заказ #{orderNumber}</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Создан {request ? format(new Date(request.created_at), 'dd MMM yyyy, HH:mm', { locale: ru }) : '...'}
                    </p>
                  </div>
                </div>
                
                <Badge className={`${statusInfo?.color} border`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {statusInfo?.label}
                </Badge>
              </div>
            </div>

            <CardContent className="pt-4">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Project info */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    Проект
                  </p>
                  {project ? (
                    <Link 
                      to={`/project/${project.slug}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                        {project.thumbnail_url ? (
                          <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">IMG</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{project.title}</p>
                        <p className="text-sm text-minecraft-gold">{project.price} ₽</p>
                      </div>
                      <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                    </Link>
                  ) : (
                    <div className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
                  )}
                </div>

                {/* Referral source */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Откуда узнал
                  </p>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">
                      {request?.referral_source || 'Не указано'}
                    </p>
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Участники
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/30">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={buyerProfile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{buyerProfile?.username?.charAt(0) || 'B'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Покупатель: <span className="font-medium">{buyerProfile?.username || '...'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/30">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={sellerProfile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{sellerProfile?.username?.charAt(0) || 'S'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Продавец: <span className="font-medium">{sellerProfile?.username || '...'}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {isStaff && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-400">
                    👁 Вы просматриваете этот чат как модератор
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card className="flex flex-col h-[calc(100vh-28rem)]">
            <CardHeader className="border-b border-border py-3">
              <CardTitle className="text-lg">Чат заказа</CardTitle>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Начните диалог с продавцом</p>
                    {request?.message && (
                      <p className="mt-2 text-sm bg-secondary/50 p-3 rounded-lg inline-block">
                        Первое сообщение: "{request.message}"
                      </p>
                    )}
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={msg.sender_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {msg.sender_profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <UserNickname
                            username={msg.sender_profile?.username || 'Unknown'}
                            userId={msg.sender_id}
                            role={msg.sender_role}
                            donorTier={msg.sender_donor_tier}
                            customColor={msg.sender_nickname_color}
                          />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ru })}
                          </span>
                        </div>
                        <div className="bg-secondary/50 rounded-lg px-3 py-2">
                          <MessageContent content={msg.content} />
                          {/* Attached image */}
                          {msg.image_url && (
                            <img 
                              src={msg.image_url} 
                              alt="Вложение"
                              className="mt-2 max-w-xs max-h-48 rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setViewImage(msg.image_url!)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              {/* Image preview */}
              {imagePreview && (
                <div className="relative inline-block mb-3">
                  <img 
                    src={imagePreview} 
                    alt="Превью" 
                    className="max-h-20 rounded border border-border"
                  />
                  <button 
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <button 
                  className="p-2 hover:bg-secondary rounded text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <EmojiPicker 
                  onEmojiSelect={(emoji, isImage, imageUrl) => {
                    if (isImage && imageUrl) {
                      setMessageText(prev => prev + `[emoji:${imageUrl}]`);
                    } else {
                      setMessageText(prev => prev + emoji);
                    }
                  }}
                />
                <Textarea
                  placeholder="Напишите сообщение..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 min-h-[40px] max-h-32 resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSend}
                  disabled={(!messageText.trim() && !imageFile) || sendMutation.isPending || uploading}
                >
                  {sendMutation.isPending || uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
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
