import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';
import { UserNickname } from '@/components/UserNickname';
import { DonorBadge } from '@/components/DonorBadge';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { 
  User, 
  Loader2, 
  Calendar, 
  Clock, 
  Package, 
  MessageSquare, 
  Star,
  Heart,
  Crown,
  ShieldCheck,
  Code,
  Gamepad2,
  BookMarked,
  ExternalLink,
  UserPlus,
  UserMinus,
  ThumbsUp,
  ThumbsDown,
  Send,
  Trash2,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ROLE_LABELS, ROLE_COLORS, AppRole, DonorTier } from '@/types/database';
import { useState } from 'react';

const ROLE_ICONS: Record<AppRole, typeof Crown> = {
  owner: Crown,
  admin: Crown,
  curator: BookMarked,
  moderator: ShieldCheck,
  developer: Code,
  player: Gamepad2,
  user: User,
};

const DISCORD_ICON = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TELEGRAM_ICON = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [wallPostText, setWallPostText] = useState('');

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch user roles
  const { data: roles = [] } = useQuery({
    queryKey: ['userProfileRoles', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!userId,
  });

  // Fetch donor info
  const { data: donorInfo } = useQuery({
    queryKey: ['userDonor', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('user_donors')
        .select('tier, nickname_color')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch user projects
  const { data: projects = [] } = useQuery({
    queryKey: ['userProfileProjects', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('author_id', userId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch subscription status
  const { data: isSubscribed = false } = useQuery({
    queryKey: ['subscription', user?.id, userId],
    queryFn: async () => {
      if (!user || !userId || user.id === userId) return false;
      const { data } = await supabase
        .from('profile_subscriptions')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!userId,
  });

  // Fetch subscribers count
  const { data: subscribersCount = 0 } = useQuery({
    queryKey: ['subscribers-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count } = await supabase
        .from('profile_subscriptions')
        .select('id', { count: 'exact' })
        .eq('following_id', userId);
      return count || 0;
    },
    enabled: !!userId,
  });

  // Fetch profile ratings
  const { data: profileRating } = useQuery({
    queryKey: ['profile-rating', userId],
    queryFn: async () => {
      if (!userId) return { positive: 0, negative: 0, userRating: null };
      
      const { data: ratings } = await supabase
        .from('profile_ratings')
        .select('is_positive, rater_id')
        .eq('profile_id', userId);
      
      const positive = ratings?.filter(r => r.is_positive).length || 0;
      const negative = ratings?.filter(r => !r.is_positive).length || 0;
      const userRating = user ? ratings?.find(r => r.rater_id === user.id)?.is_positive : null;
      
      return { positive, negative, userRating };
    },
    enabled: !!userId,
  });

  // Fetch wall posts
  const { data: wallPosts = [] } = useQuery({
    queryKey: ['wall-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: posts } = await supabase
        .from('profile_wall_posts')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!posts || posts.length === 0) return [];
      
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const [profilesRes, rolesRes, donorsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', authorIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', authorIds),
        supabase.from('user_donors').select('user_id, tier, nickname_color').in('user_id', authorIds),
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
      
      return posts.map(post => ({
        ...post,
        author: profileMap.get(post.author_id),
        authorRole: roleMap.get(post.author_id) || 'user',
        authorDonorTier: (donorMap.get(post.author_id)?.tier as DonorTier) || 'none',
        authorNicknameColor: donorMap.get(post.author_id)?.nickname_color || null,
      }));
    },
    enabled: !!userId,
  });

  // Stats query
  const { data: stats } = useQuery({
    queryKey: ['userProfileStats', userId],
    queryFn: async () => {
      if (!userId) return { comments: 0, ratings: 0, favorites: 0 };
      
      const [comments, ratings, favorites] = await Promise.all([
        supabase.from('comments').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('ratings').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', userId),
      ]);

      return {
        comments: comments.count || 0,
        ratings: ratings.count || 0,
        favorites: favorites.count || 0,
      };
    },
    enabled: !!userId,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !userId) throw new Error('Not authenticated');
      
      if (isSubscribed) {
        await supabase
          .from('profile_subscriptions')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
      } else {
        await supabase.from('profile_subscriptions').insert({
          follower_id: user.id,
          following_id: userId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ['subscribers-count', userId] });
      toast({ title: isSubscribed ? 'Отписались' : 'Подписались' });
    },
  });

  // Rate profile mutation
  const rateMutation = useMutation({
    mutationFn: async (isPositive: boolean) => {
      if (!user || !userId) throw new Error('Not authenticated');
      
      const { data: existing } = await supabase
        .from('profile_ratings')
        .select('id, is_positive')
        .eq('profile_id', userId)
        .eq('rater_id', user.id)
        .maybeSingle();
      
      if (existing) {
        if (existing.is_positive === isPositive) {
          // Remove rating if clicking same button
          await supabase.from('profile_ratings').delete().eq('id', existing.id);
        } else {
          // Update rating
          await supabase.from('profile_ratings').update({ is_positive: isPositive }).eq('id', existing.id);
        }
      } else {
        await supabase.from('profile_ratings').insert({
          profile_id: userId,
          rater_id: user.id,
          is_positive: isPositive,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-rating', userId] });
    },
  });

  // Wall post mutation
  const wallPostMutation = useMutation({
    mutationFn: async () => {
      if (!user || !userId || !wallPostText.trim()) throw new Error('Invalid');
      
      await supabase.from('profile_wall_posts').insert({
        profile_id: userId,
        author_id: user.id,
        content: wallPostText.trim(),
      });
    },
    onSuccess: () => {
      setWallPostText('');
      queryClient.invalidateQueries({ queryKey: ['wall-posts', userId] });
      toast({ title: 'Сообщение добавлено' });
    },
  });

  // Delete wall post mutation
  const deleteWallPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from('profile_wall_posts').delete().eq('id', postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wall-posts', userId] });
    },
  });

  if (profileLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Пользователь не найден</h2>
          <Button onClick={() => navigate('/')}>На главную</Button>
        </div>
      </Layout>
    );
  }

  const primaryRole = roles.find(r => r === 'admin') || roles.find(r => r === 'moderator') || roles[0] || 'user';
  const donorTier = (donorInfo?.tier as DonorTier) || 'none';

  return (
    <>
      <Helmet>
        <title>{profile.username} | TestLeak</title>
      </Helmet>

      <Layout>
        <div className="container py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar - Profile card */}
            <div className="space-y-4">
              <Card className="glass-card overflow-hidden">
                {/* Avatar section */}
                <div className="p-6 text-center">
                  <Avatar className="w-32 h-32 mx-auto border-4 border-primary/30 shadow-lg shadow-primary/20">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-4xl">
                      {profile.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="mt-4">
                    <UserNickname
                      username={profile.username}
                      userId={userId!}
                      role={primaryRole}
                      donorTier={donorTier}
                      customColor={donorInfo?.nickname_color}
                      asLink={false}
                      className="text-xl"
                      showBadge
                    />
                  </div>
                  
                  {/* Roles - show only staff roles as separate badges */}
                  {roles.filter(r => r !== 'user' && r !== 'player').length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {roles.filter(r => r !== 'user' && r !== 'player').map((role) => {
                        const Icon = ROLE_ICONS[role];
                        return (
                          <Badge key={role} className={`${ROLE_COLORS[role]} gap-1`}>
                            <Icon className="w-3 h-3" />
                            {ROLE_LABELS[role]}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {profile.bio && (
                    <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>
                  )}
                  
                  {/* Profile rating */}
                  <div className="flex justify-center gap-4 mt-4">
                    <button
                      onClick={() => user && rateMutation.mutate(true)}
                      disabled={!user || user.id === userId}
                      className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
                        profileRating?.userRating === true
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{profileRating?.positive || 0}</span>
                    </button>
                    <button
                      onClick={() => user && rateMutation.mutate(false)}
                      disabled={!user || user.id === userId}
                      className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
                        profileRating?.userRating === false
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{profileRating?.negative || 0}</span>
                    </button>
                  </div>
                  
                  {/* Action buttons */}
                  {user && user.id !== userId && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant={isSubscribed ? 'outline' : 'default'}
                        className="flex-1"
                        onClick={() => subscribeMutation.mutate()}
                      >
                        {isSubscribed ? (
                          <><UserMinus className="w-4 h-4 mr-2" />Отписаться</>
                        ) : (
                          <><UserPlus className="w-4 h-4 mr-2" />Подписаться</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/messages/${userId}`)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Social links */}
                {(profile.discord_username || profile.telegram_username) && (
                  <div className="border-t border-border/50 p-4 space-y-2">
                    {profile.discord_username && (
                      <div className="flex items-center gap-3 text-sm">
                        <DISCORD_ICON />
                        <span className="text-muted-foreground">Discord:</span>
                        <span className="text-minecraft-diamond">{profile.discord_username}</span>
                      </div>
                    )}
                    {profile.telegram_username && (
                      <a 
                        href={`https://t.me/${profile.telegram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                      >
                        <TELEGRAM_ICON />
                        <span className="text-muted-foreground">Telegram:</span>
                        <span className="text-minecraft-diamond">@{profile.telegram_username}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="border-t border-border/50 p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Регистрация: {format(new Date(profile.created_at), 'dd.MM.yyyy', { locale: ru })}</span>
                  </div>
                  {profile.last_seen_at && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Был(а) здесь: {formatDistanceToNow(new Date(profile.last_seen_at), { addSuffix: true, locale: ru })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <UserPlus className="w-4 h-4" />
                    <span>Подписчиков: {subscribersCount}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Banner */}
              <Card className="glass-card overflow-hidden">
                <div 
                  className="h-48 bg-gradient-to-br from-primary/30 via-accent/20 to-minecraft-diamond/30"
                  style={profile.banner_url ? {
                    backgroundImage: `url(${profile.banner_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  } : {}}
                >
                  <div className="w-full h-full bg-gradient-to-t from-card/80 to-transparent flex items-end">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <UserNickname
                          username={profile.username}
                          userId={userId!}
                          role={primaryRole}
                          donorTier={donorTier}
                          customColor={donorInfo?.nickname_color}
                          asLink={false}
                        />
                        {donorTier !== 'none' && <DonorBadge tier={donorTier} showLabel={false} />}
                      </h2>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Package className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                    <p className="text-xs text-muted-foreground">Ресурсов</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="w-5 h-5 mx-auto mb-2 text-minecraft-diamond" />
                    <p className="text-2xl font-bold text-foreground">{stats?.comments || 0}</p>
                    <p className="text-xs text-muted-foreground">Сообщений</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Star className="w-5 h-5 mx-auto mb-2 text-minecraft-gold" />
                    <p className="text-2xl font-bold text-foreground">{stats?.ratings || 0}</p>
                    <p className="text-xs text-muted-foreground">Оценок</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 text-center">
                    <Heart className="w-5 h-5 mx-auto mb-2 text-destructive" />
                    <p className="text-2xl font-bold text-foreground">{stats?.favorites || 0}</p>
                    <p className="text-xs text-muted-foreground">Избранного</p>
                  </CardContent>
                </Card>
              </div>

              {/* Content tabs */}
              <Card className="glass-card">
                <Tabs defaultValue="wall" className="w-full">
                  <TabsList className="w-full justify-start border-b border-border/50 rounded-none bg-transparent p-0">
                    <TabsTrigger 
                      value="wall"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6"
                    >
                      Стена
                    </TabsTrigger>
                    <TabsTrigger 
                      value="projects"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6"
                    >
                      Ресурсы ({projects.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="wall" className="p-4 space-y-4">
                    {/* Post form */}
                    {user && (
                      <div className="flex gap-3">
                        <Textarea
                          placeholder="Написать на стене..."
                          value={wallPostText}
                          onChange={e => setWallPostText(e.target.value)}
                          className="resize-none"
                          rows={2}
                        />
                        <Button
                          onClick={() => wallPostMutation.mutate()}
                          disabled={!wallPostText.trim() || wallPostMutation.isPending}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Wall posts */}
                    {wallPosts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Стена пуста
                      </p>
                    ) : (
                      wallPosts.map(post => (
                        <Card key={post.id} className="bg-secondary/30">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={post.author?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <UserNickname
                                    username={post.author?.username || 'Unknown'}
                                    userId={post.author_id}
                                    role={post.authorRole}
                                    donorTier={post.authorDonorTier}
                                    customColor={post.authorNicknameColor}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm">{post.content}</p>
                              </div>
                              {(user?.id === post.author_id || user?.id === userId) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteWallPostMutation.mutate(post.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="projects" className="p-4">
                    {projects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Нет опубликованных ресурсов</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.map((project) => (
                          <ProjectCard key={project.id} project={project as any} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
