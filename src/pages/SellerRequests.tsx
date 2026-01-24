import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserNickname } from '@/components/UserNickname';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ShoppingCart, 
  Check, 
  X, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  Loader2,
  ExternalLink,
  Search,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Profile, DonorTier, AppRole } from '@/types/database';

interface ExtendedRequest {
  id: string;
  project_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  message: string | null;
  referral_source: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    title: string;
    slug: string;
    thumbnail_url: string | null;
    price: number;
  };
  buyer?: Profile;
  buyer_role?: AppRole;
  buyer_donor_tier?: DonorTier;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Ожидает', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  approved: { label: 'Одобрено', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejected: { label: 'Отклонено', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completed: { label: 'Завершено', icon: CheckCircle, color: 'bg-primary/20 text-primary border-primary/30' },
};

export default function SellerRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Check if user can access
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

  // Fetch purchase requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['seller-requests', user?.id, isStaff],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Staff can see all, sellers only their own
      if (!isStaff) {
        query = query.eq('seller_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch related data
      const projectIds = [...new Set(data.map(r => r.project_id))];
      const buyerIds = [...new Set(data.map(r => r.buyer_id))];

      const [projectsRes, profilesRes, rolesRes, donorsRes] = await Promise.all([
        supabase.from('projects').select('id, title, slug, thumbnail_url, price').in('id', projectIds),
        supabase.from('profiles').select('*').in('id', buyerIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', buyerIds),
        supabase.from('user_donors').select('user_id, tier').in('user_id', buyerIds),
      ]);

      const projectMap = new Map((projectsRes.data || []).map(p => [p.id, p]));
      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const roleMap = new Map<string, AppRole>();
      (rolesRes.data || []).forEach(r => {
        const priority: Record<string, number> = { admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        const current = roleMap.get(r.user_id);
        if (!current || priority[r.role] > priority[current]) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });
      const donorMap = new Map((donorsRes.data || []).map(d => [d.user_id, d.tier as DonorTier]));

      return data.map(req => ({
        ...req,
        project: projectMap.get(req.project_id),
        buyer: profileMap.get(req.buyer_id),
        buyer_role: roleMap.get(req.buyer_id) || 'user',
        buyer_donor_tier: donorMap.get(req.buyer_id) || 'none',
      })) as ExtendedRequest[];
    },
    enabled: !!user,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['seller-requests'] });
      toast({ 
        title: status === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Filter by tab, search, and date
  const filteredRequests = requests.filter(r => {
    // Tab filter
    if (activeTab !== 'all' && r.status !== activeTab) return false;
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.project?.title?.toLowerCase().includes(q) && 
          !r.buyer?.username?.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const created = new Date(r.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        if (created.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (created < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (created < monthAgo) return false;
      }
    }
    
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <>
      <Helmet>
        <title>Заявки на покупку | TestLeak</title>
      </Helmet>
      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-primary" />
                Заявки на покупку
              </h1>
              <p className="text-muted-foreground mt-1">
                {isStaff ? 'Все заявки (режим модератора)' : 'Управление заявками на ваши проекты'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по проекту или покупателю..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все время</SelectItem>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Ожидают
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Одобренные
                {approvedCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{approvedCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="w-4 h-4" />
                Отклонённые
              </TabsTrigger>
              <TabsTrigger value="all">Все</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Нет заявок</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map(request => {
                    const statusInfo = STATUS_CONFIG[request.status];
                    const StatusIcon = statusInfo?.icon || Clock;
                    const orderNumber = request.id.slice(0, 8).toUpperCase();

                    return (
                      <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="flex flex-col md:flex-row">
                          {/* Project thumbnail */}
                          <div className="w-full md:w-48 h-32 md:h-auto bg-secondary flex-shrink-0">
                            {request.project?.thumbnail_url ? (
                              <img 
                                src={request.project.thumbnail_url} 
                                alt={request.project.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <CardContent className="flex-1 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm text-muted-foreground">#{orderNumber}</span>
                                  <Badge className={`${statusInfo?.color} border`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusInfo?.label}
                                  </Badge>
                                </div>
                                <h3 className="text-lg font-semibold">
                                  {request.project?.title || 'Проект удалён'}
                                </h3>
                                <p className="text-minecraft-gold font-medium">
                                  {request.project?.price} ₽
                                </p>
                              </div>
                              
                              <div className="text-right text-sm text-muted-foreground">
                                <p>{format(new Date(request.created_at), 'dd MMM yyyy', { locale: ru })}</p>
                                <p>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ru })}</p>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              {/* Buyer info */}
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={request.buyer?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {request.buyer?.username?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Покупатель</p>
                                  <UserNickname
                                    username={request.buyer?.username || 'Unknown'}
                                    userId={request.buyer_id}
                                    role={request.buyer_role}
                                    donorTier={request.buyer_donor_tier}
                                  />
                                </div>
                              </div>

                              {/* Referral source */}
                              <div className="p-3 rounded-lg bg-secondary/30">
                                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Откуда узнал
                                </p>
                                <p className="font-medium text-sm">
                                  {request.referral_source || 'Не указано'}
                                </p>
                              </div>
                            </div>

                            {request.message && (
                              <div className="p-3 rounded-lg bg-secondary/30 mb-4">
                                <p className="text-xs text-muted-foreground mb-1">Сообщение:</p>
                                <p className="text-sm">{request.message}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/order/${request.id}`)}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Открыть чат
                              </Button>

                              {request.project?.slug && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/project/${request.project.slug}`}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    К проекту
                                  </Link>
                                </Button>
                              )}

                              {request.status === 'pending' && (request.seller_id === user?.id || isStaff) && (
                                <>
                                  <div className="flex-1" />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    onClick={() => updateStatusMutation.mutate({ 
                                      requestId: request.id, 
                                      status: 'rejected' 
                                    })}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Отклонить
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => updateStatusMutation.mutate({ 
                                      requestId: request.id, 
                                      status: 'approved' 
                                    })}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Одобрить
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </>
  );
}
