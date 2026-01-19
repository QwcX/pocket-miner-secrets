import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { getDonorBenefits, DONOR_BENEFITS } from '@/lib/donorBenefits';
import { DonorTier, DONOR_TIER_LABELS } from '@/types/database';
import { MessageSquare, Plus, Send, CheckCircle, Bot, User, Shield, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: number;
  assigned_to: string | null;
  donor_tier: DonorTier;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  content: string;
  is_bot_response: boolean;
  is_system_message: boolean;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Открыт', in_progress: 'В работе', waiting_user: 'Ожидает ответа', resolved: 'Решён', closed: 'Закрыт'
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-500', in_progress: 'bg-yellow-500', waiting_user: 'bg-orange-500', resolved: 'bg-green-500', closed: 'bg-gray-500'
};

const getBotResponse = (message: string): string | null => {
  const lower = message.toLowerCase();
  if (lower.includes('привет')) return 'Привет! Опишите проблему, модератор скоро поможет.';
  if (lower.includes('донат')) return 'Информация о донатах на /donate';
  if (lower.includes('ошибка') || lower.includes('не работает')) return 'Опишите подробнее, модератор рассмотрит заявку.';
  return null;
};

export default function Support() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkRateLimit, donorTier } = useRateLimit();
  
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      return data?.map(r => r.role) || [];
    },
    enabled: !!user
  });

  const isModerator = userRoles?.some(r => ['moderator', 'admin', 'owner'].includes(r)) || false;

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets', user?.id, isModerator],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('support_tickets').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false });
      if (!isModerator) query = query.eq('user_id', user.id);
      const { data, error } = await query;
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!user
  });

  const { data: messages } = useQuery({
    queryKey: ['ticket-messages', selectedTicket],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data, error } = await supabase.from('support_messages').select('*').eq('ticket_id', selectedTicket).order('created_at', { ascending: true });
      if (error) throw error;
      return data as TicketMessage[];
    },
    enabled: !!selectedTicket
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const priority = DONOR_BENEFITS[donorTier]?.supportPriority || 0;
      const { data: ticket, error } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: newSubject, donor_tier: donorTier, priority }).select().single();
      if (error) throw error;
      await supabase.from('support_messages').insert({ ticket_id: ticket.id, sender_id: user.id, content: newMessage });
      const botResponse = getBotResponse(newMessage);
      if (botResponse) await supabase.from('support_messages').insert({ ticket_id: ticket.id, sender_id: null, content: botResponse, is_bot_response: true });
      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setNewSubject(''); setNewMessage(''); setIsCreating(false); setSelectedTicket(ticket.id);
      toast({ title: 'Заявка создана!' });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedTicket) throw new Error('Not authenticated');
      await supabase.from('support_messages').insert({ ticket_id: selectedTicket, sender_id: user.id, content: replyMessage });
      if (!isModerator) {
        const botResponse = getBotResponse(replyMessage);
        if (botResponse) await supabase.from('support_messages').insert({ ticket_id: selectedTicket, sender_id: null, content: botResponse, is_bot_response: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages'] });
      setReplyMessage('');
    }
  });

  const takeTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      if (!user) throw new Error('Not authenticated');
      await supabase.from('support_tickets').update({ assigned_to: user.id, status: 'in_progress' }).eq('id', ticketId);
      await supabase.from('support_messages').insert({ ticket_id: ticketId, sender_id: null, content: 'Модератор взял заявку', is_system_message: true });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['support-tickets'] }); queryClient.invalidateQueries({ queryKey: ['ticket-messages'] }); }
  });

  const resolveTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      await supabase.from('support_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', ticketId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['support-tickets'] }); }
  });

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    const ok = await checkRateLimit({ actionType: 'support_ticket', maxRequests: 5, windowSeconds: 3600 });
    if (ok) createTicketMutation.mutate();
  };

  const handleSendMessage = async () => {
    if (!replyMessage.trim()) return;
    const ok = await checkRateLimit({ actionType: 'support_message', maxRequests: 30, windowSeconds: 60 });
    if (ok) sendMessageMutation.mutate();
  };

  const selectedTicketData = tickets?.find(t => t.id === selectedTicket);
  const donorBenefits = getDonorBenefits(donorTier);

  if (!user) return <Layout><div className="container py-8 text-center"><p>Войдите для доступа</p><Button onClick={() => navigate('/auth')} className="mt-4">Войти</Button></div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><MessageSquare className="h-8 w-8" />Техподдержка</h1>
            {donorBenefits.supportPriority > 0 && <p className="text-muted-foreground mt-1">Приоритет: <Badge variant="outline"><Crown className="h-3 w-3 mr-1" />{DONOR_TIER_LABELS[donorTier]}</Badge></p>}
          </div>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}><Plus className="h-4 w-4 mr-2" />Новая заявка</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">{isModerator ? 'Все заявки' : 'Мои заявки'}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {ticketsLoading ? <div className="p-4 text-center text-muted-foreground">Загрузка...</div> : tickets?.length === 0 ? <div className="p-4 text-center text-muted-foreground">Нет заявок</div> : (
                  <div className="divide-y">
                    {tickets?.map((ticket) => (
                      <button key={ticket.id} onClick={() => setSelectedTicket(ticket.id)} className={`w-full p-4 text-left hover:bg-muted/50 ${selectedTicket === ticket.id ? 'bg-muted' : ''}`}>
                        <p className="font-medium truncate">{ticket.subject}</p>
                        <Badge className={`${STATUS_COLORS[ticket.status]} text-white text-xs mt-1`}>{STATUS_LABELS[ticket.status]}</Badge>
                        <p className="text-xs text-muted-foreground mt-2">{format(new Date(ticket.created_at), 'dd MMM, HH:mm', { locale: ru })}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            {isCreating ? (
              <Card>
                <CardHeader><CardTitle>Новая заявка</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Тема" maxLength={100} />
                  <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Опишите проблему..." rows={5} />
                  <div className="flex gap-2">
                    <Button onClick={handleCreateTicket} disabled={createTicketMutation.isPending}>Создать</Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)}>Отмена</Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedTicketData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedTicketData.subject}</CardTitle>
                      <Badge className={`${STATUS_COLORS[selectedTicketData.status]} text-white mt-1`}>{STATUS_LABELS[selectedTicketData.status]}</Badge>
                    </div>
                    {isModerator && !selectedTicketData.assigned_to && <Button size="sm" onClick={() => takeTicketMutation.mutate(selectedTicketData.id)}><Shield className="h-4 w-4 mr-1" />Взять</Button>}
                    {isModerator && selectedTicketData.status !== 'resolved' && <Button size="sm" variant="outline" onClick={() => resolveTicketMutation.mutate(selectedTicketData.id)}><CheckCircle className="h-4 w-4 mr-1" />Решено</Button>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {messages?.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.is_system_message ? 'justify-center' : msg.sender_id === user.id ? 'flex-row-reverse' : ''}`}>
                          {msg.is_system_message ? <div className="bg-muted px-3 py-1 rounded-full text-xs">{msg.content}</div> : (
                            <>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.is_bot_response ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {msg.is_bot_response ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </div>
                              <div className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs opacity-50 mt-1">{format(new Date(msg.created_at), 'HH:mm')}</p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedTicketData.status !== 'resolved' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Input value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Сообщение..." onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                      <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}><Send className="h-4 w-4" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : <Card><CardContent className="flex flex-col items-center justify-center h-[400px] text-muted-foreground"><MessageSquare className="h-12 w-12 mb-4 opacity-50" /><p>Выберите заявку</p></CardContent></Card>}
          </div>
        </div>
      </div>
    </Layout>
  );
}