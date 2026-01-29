import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { 
  Shield, 
  Users, 
  Search, 
  Loader2,
  UserPlus,
  UserMinus,
  Crown,
  ShieldCheck,
  User,
  Code,
  Gamepad2,
  BookMarked,
  AlertTriangle,
  Gem,
  Leaf,
  Coins,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROLE_LABELS, ROLE_COLORS, AppRole, DonorTier, DONOR_TIER_LABELS, DONOR_TIER_COLORS, DONOR_PRIORITY } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

const ROLE_ICONS: Record<AppRole, typeof Crown> = {
  owner: Crown,
  admin: Crown,
  curator: BookMarked,
  moderator: ShieldCheck,
  developer: Code,
  player: Gamepad2,
  user: User,
};

const DONOR_ICONS: Record<DonorTier, typeof Gem> = {
  none: User,
  iron: Shield,
  bronze: Coins,
  silver: Coins,
  gold: Crown,
  diamond: Gem,
  emerald: Leaf,
  sponsor: Crown,
};

interface UserWithRoles {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  last_seen_at: string | null;
  roles: AppRole[];
  donorTier?: DonorTier;
  donorExpires?: string | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [donorDialogOpen, setDonorDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [selectedDonorTier, setSelectedDonorTier] = useState<DonorTier>('iron');

  // Check if current user is admin
  const { data: isAdmin, isLoading: adminCheckLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch all users with their roles and donor status
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at, last_seen_at')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('username', `%${searchQuery}%`);
      }

      const { data: profiles, error } = await query.limit(100);
      if (error) throw error;

      // Get roles and donors for all users
      const userIds = profiles?.map(p => p.id) || [];
      const [rolesRes, donorsRes] = await Promise.all([
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('user_donors').select('user_id, tier, expires_at').in('user_id', userIds),
      ]);

      const donorMap = new Map((donorsRes.data || []).map(d => [d.user_id, d]));

      // Merge roles with profiles
      return profiles?.map(profile => ({
        ...profile,
        roles: rolesRes.data?.filter(r => r.user_id === profile.id).map(r => r.role as AppRole) || [],
        donorTier: (donorMap.get(profile.id)?.tier as DonorTier) || 'none',
        donorExpires: donorMap.get(profile.id)?.expires_at || null,
      })) as UserWithRoles[];
    },
    enabled: isAdmin === true,
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (error) throw error;

      // Send notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'role_changed',
        title: 'Новая роль',
        message: `Вам была выдана роль: ${ROLE_LABELS[role]}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({ title: 'Роль добавлена!' });
      setRoleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message.includes('duplicate') 
          ? 'У пользователя уже есть эта роль' 
          : 'Не удалось добавить роль',
        variant: 'destructive',
      });
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;

      // Send notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'role_changed',
        title: 'Роль удалена',
        message: `У вас была удалена роль: ${ROLE_LABELS[role]}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({ title: 'Роль удалена!' });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить роль',
        variant: 'destructive',
      });
    },
  });

  // Set donor tier mutation
  const setDonorMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: DonorTier }) => {
      // Check if user already has donor record
      const { data: existing } = await supabase
        .from('user_donors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (tier === 'none') {
        // Remove donor status
        if (existing) {
          const { error } = await supabase
            .from('user_donors')
            .delete()
            .eq('user_id', userId);
          if (error) throw error;
        }
      } else {
        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('user_donors')
            .update({ tier })
            .eq('user_id', userId);
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('user_donors')
            .insert({ user_id: userId, tier });
          if (error) throw error;
        }
      }

      // Send notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'donor_changed',
        title: tier === 'none' ? 'Донат-статус удалён' : 'Новый донат-статус!',
        message: tier === 'none' 
          ? 'Ваш донат-статус был удалён' 
          : `Вам был выдан донат-статус: ${DONOR_TIER_LABELS[tier]}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({ title: 'Донат-статус обновлён!' });
      setDonorDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить донат-статус',
        variant: 'destructive',
      });
    },
  });

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  if (adminCheckLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-16">
          <Card className="glass-card max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Доступ запрещён</h2>
              <p className="text-muted-foreground">
                У вас нет прав администратора для доступа к этой странице.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/')}
              >
                На главную
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const openAddRoleDialog = (userItem: UserWithRoles) => {
    setSelectedUser(userItem);
    setSelectedRole('user');
    setRoleDialogOpen(true);
  };

  const openDonorDialog = (userItem: UserWithRoles) => {
    setSelectedUser(userItem);
    setSelectedDonorTier(userItem.donorTier || 'iron');
    setDonorDialogOpen(true);
  };

  // Sort donor tiers by priority
  const sortedDonorTiers = Object.entries(DONOR_PRIORITY)
    .sort((a, b) => a[1] - b[1])
    .map(([tier]) => tier as DonorTier);

  return (
    <>
      <Helmet>
        <title>Админ-панель | NeuroLeak</title>
      </Helmet>

      <Layout>
        <div className="container py-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 glass-card">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display text-foreground">Админ-панель</h1>
              <p className="text-muted-foreground">Управление пользователями, ролями и донатами</p>
            </div>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="glass-card">
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Пользователи
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <ShieldCheck className="w-4 h-4" />
                Статистика
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск пользователей..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-input"
                />
              </div>

              {/* Users table */}
              <Card className="glass-card overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Роли</TableHead>
                        <TableHead>Донат</TableHead>
                        <TableHead>Регистрация</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Пользователи не найдены
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((userItem) => {
                          const DonorIcon = DONOR_ICONS[userItem.donorTier || 'none'];
                          return (
                            <TableRow key={userItem.id} className="border-border/30 hover:bg-secondary/30">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 border-2 border-border">
                                    <AvatarImage src={userItem.avatar_url || undefined} />
                                    <AvatarFallback className="bg-secondary">
                                      {userItem.username?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{userItem.username}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                      {userItem.id}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {userItem.roles.length === 0 ? (
                                    <Badge variant="outline" className="text-muted-foreground">
                                      Нет ролей
                                    </Badge>
                                  ) : (
                                    userItem.roles.map((role) => {
                                      const Icon = ROLE_ICONS[role];
                                      return (
                                        <Badge
                                          key={role}
                                          className={`${ROLE_COLORS[role]} gap-1 group cursor-pointer`}
                                          onClick={() => {
                                            if (role !== 'admin' || userItem.id !== user?.id) {
                                              removeRoleMutation.mutate({ userId: userItem.id, role });
                                            }
                                          }}
                                        >
                                          <Icon className="w-3 h-3" />
                                          {ROLE_LABELS[role]}
                                          {(role !== 'admin' || userItem.id !== user?.id) && (
                                            <UserMinus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          )}
                                        </Badge>
                                      );
                                    })
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {userItem.donorTier && userItem.donorTier !== 'none' ? (
                                  <Badge className={`${DONOR_TIER_COLORS[userItem.donorTier]} gap-1`}>
                                    <DonorIcon className="w-3 h-3" />
                                    {DONOR_TIER_LABELS[userItem.donorTier]}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDistanceToNow(new Date(userItem.created_at), {
                                  addSuffix: true,
                                  locale: ru,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAddRoleDialog(userItem)}
                                    className="glass-button gap-1"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    Роль
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDonorDialog(userItem)}
                                    className="glass-button gap-1"
                                  >
                                    <Gem className="w-4 h-4" />
                                    Донат
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal text-muted-foreground">
                      Всего пользователей
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{users.length}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal text-muted-foreground">
                      Администраторов
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-minecraft-gold">
                      {users.filter(u => u.roles.includes('admin')).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal text-muted-foreground">
                      Модераторов
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">
                      {users.filter(u => u.roles.includes('moderator')).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal text-muted-foreground">
                      Донатеров
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-donor-gold">
                      {users.filter(u => u.donorTier && u.donorTier !== 'none').length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Добавить роль</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-border">
                  <AvatarImage src={selectedUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary">
                    {selectedUser?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.username}</p>
                  <div className="flex gap-1 mt-1">
                    {selectedUser?.roles.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {ROLE_LABELS[role]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  {Object.entries(ROLE_LABELS).map(([role, label]) => {
                    const Icon = ROLE_ICONS[role as AppRole];
                    const hasRole = selectedUser?.roles.includes(role as AppRole);
                    return (
                      <SelectItem 
                        key={role} 
                        value={role}
                        disabled={hasRole}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {label}
                          {hasRole && <span className="text-xs text-muted-foreground">(уже есть)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    addRoleMutation.mutate({ userId: selectedUser.id, role: selectedRole });
                  }
                }}
                disabled={addRoleMutation.isPending || selectedUser?.roles.includes(selectedRole)}
              >
                {addRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Добавить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Donor Tier Dialog */}
        <Dialog open={donorDialogOpen} onOpenChange={setDonorDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Управление донат-статусом</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-border">
                  <AvatarImage src={selectedUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary">
                    {selectedUser?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.username}</p>
                  {selectedUser?.donorTier && selectedUser.donorTier !== 'none' && (
                    <Badge className={`${DONOR_TIER_COLORS[selectedUser.donorTier]} mt-1`}>
                      {DONOR_TIER_LABELS[selectedUser.donorTier]}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Выберите донат-уровень. Пользователь получит все привилегии выбранного уровня и ниже.
                </p>
                <Select value={selectedDonorTier} onValueChange={(v) => setSelectedDonorTier(v as DonorTier)}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {sortedDonorTiers.map((tier) => {
                      const Icon = DONOR_ICONS[tier];
                      const isCurrent = selectedUser?.donorTier === tier;
                      return (
                        <SelectItem key={tier} value={tier}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {DONOR_TIER_LABELS[tier]}
                            {isCurrent && <span className="text-xs text-muted-foreground">(текущий)</span>}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-2">Привилегии уровня {DONOR_TIER_LABELS[selectedDonorTier]}:</p>
                <ul className="space-y-1 text-muted-foreground">
                  {DONOR_PRIORITY[selectedDonorTier] >= DONOR_PRIORITY['iron'] && (
                    <li>✓ Кастомный цвет никнейма</li>
                  )}
                  {DONOR_PRIORITY[selectedDonorTier] >= DONOR_PRIORITY['gold'] && (
                    <li>✓ Эмодзи в профиле</li>
                  )}
                  {DONOR_PRIORITY[selectedDonorTier] >= DONOR_PRIORITY['diamond'] && (
                    <li>✓ Приоритетная поддержка</li>
                  )}
                  {DONOR_PRIORITY[selectedDonorTier] >= DONOR_PRIORITY['sponsor'] && (
                    <li>✓ Особый бейдж спонсора</li>
                  )}
                  {selectedDonorTier === 'none' && (
                    <li className="text-muted-foreground">Без привилегий</li>
                  )}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDonorDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    setDonorMutation.mutate({ userId: selectedUser.id, tier: selectedDonorTier });
                  }
                }}
                disabled={setDonorMutation.isPending}
              >
                {setDonorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedDonorTier === 'none' ? 'Удалить статус' : 'Применить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  );
}
