import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserNickname } from '@/components/UserNickname';
import { useAuth } from '@/lib/auth';
import { DonorTier, AppRole } from '@/types/database';
import { MessageSquare, Users, Settings2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface OnlineUser {
  user_id: string;
  last_ping: string;
  profile?: {
    username: string;
    profile_primary_color?: string | null;
    profile_accent_color?: string | null;
  };
  role?: AppRole;
  donor_tier?: DonorTier;
  nickname_color?: string | null;
}

interface RecentActivity {
  id: string;
  type: 'comment' | 'project' | 'wall_post';
  user_id: string;
  username: string;
  content: string;
  link?: string;
  created_at: string;
  role?: AppRole;
  donor_tier?: DonorTier;
  nickname_color?: string | null;
  profile_primary_color?: string | null;
  profile_accent_color?: string | null;
}

export function OnlineUsersWidget() {
  const { user } = useAuth();
  const [guestCount, setGuestCount] = useState(0);

  // Track all visitors (including guests) using Realtime Presence
  useEffect(() => {
    const visitorId = user?.id || `guest_${Math.random().toString(36).substring(7)}`;
    
    const channel = supabase.channel('site-visitors', {
      config: {
        presence: {
          key: visitorId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const allVisitors = Object.keys(state);
        const guests = allVisitors.filter(id => id.startsWith('guest_'));
        setGuestCount(guests.length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: visitorId,
            online_at: new Date().toISOString(),
            is_guest: !user,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Update online status every 30 seconds for authenticated users
  useEffect(() => {
    if (!user) return;

    const updateOnlineStatus = async () => {
      await supabase
        .from('online_users')
        .upsert({ user_id: user.id, last_ping: new Date().toISOString() });
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000);

    return () => {
      clearInterval(interval);
      supabase.from('online_users').delete().eq('user_id', user.id);
    };
  }, [user]);

  // Fetch online users
  const { data: onlineUsers = [] } = useQuery({
    queryKey: ['online-users'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: online } = await supabase
        .from('online_users')
        .select('user_id, last_ping')
        .gte('last_ping', fiveMinutesAgo);

      if (!online || online.length === 0) return [];

      const userIds = online.map(u => u.user_id);

      const [profilesRes, rolesRes, donorsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, profile_primary_color, profile_accent_color')
          .in('id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('user_donors').select('user_id, tier, nickname_color').in('user_id', userIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const roleMap = new Map<string, AppRole>();
      (rolesRes.data || []).forEach(r => {
        const current = roleMap.get(r.user_id);
        const priority: Record<string, number> = { admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        if (!current || priority[r.role] > priority[current]) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });
      const donorMap = new Map((donorsRes.data || []).map(d => [d.user_id, d]));

      return online.map(u => ({
        ...u,
        profile: profileMap.get(u.user_id),
        role: roleMap.get(u.user_id) || 'user',
        donor_tier: (donorMap.get(u.user_id)?.tier as DonorTier) || 'none',
        nickname_color: donorMap.get(u.user_id)?.nickname_color || null,
      })) as OnlineUser[];
    },
    refetchInterval: 30000,
  });

  // Fetch recent activity (comments and wall posts)
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const [commentsRes, wallPostsRes] = await Promise.all([
        supabase
          .from('comments')
          .select('id, user_id, content, created_at, project_id')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('profile_wall_posts')
          .select('id, author_id, content, created_at, profile_id')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const allUserIds = new Set<string>();
      (commentsRes.data || []).forEach(c => allUserIds.add(c.user_id));
      (wallPostsRes.data || []).forEach(w => allUserIds.add(w.author_id));

      const userIdsArr = [...allUserIds];
      if (userIdsArr.length === 0) return [];

      const [profilesRes, rolesRes, donorsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, profile_primary_color, profile_accent_color')
          .in('id', userIdsArr),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIdsArr),
        supabase.from('user_donors').select('user_id, tier, nickname_color').in('user_id', userIdsArr),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const roleMap = new Map<string, AppRole>();
      (rolesRes.data || []).forEach(r => {
        const current = roleMap.get(r.user_id);
        const priority: Record<string, number> = { admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        if (!current || priority[r.role] > priority[current]) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });
      const donorMap = new Map((donorsRes.data || []).map(d => [d.user_id, d]));

      const activities: RecentActivity[] = [];

      (commentsRes.data || []).forEach(c => {
        const p = profileMap.get(c.user_id);
        activities.push({
          id: c.id,
          type: 'comment',
          user_id: c.user_id,
          username: p?.username || 'Unknown',
          content: c.content.substring(0, 80) + (c.content.length > 80 ? '...' : ''),
          created_at: c.created_at,
          role: roleMap.get(c.user_id) || 'user',
          donor_tier: (donorMap.get(c.user_id)?.tier as DonorTier) || 'none',
          nickname_color: donorMap.get(c.user_id)?.nickname_color || null,
          profile_primary_color: p?.profile_primary_color || null,
          profile_accent_color: p?.profile_accent_color || null,
        });
      });

      (wallPostsRes.data || []).forEach(w => {
        const p = profileMap.get(w.author_id);
        activities.push({
          id: w.id,
          type: 'wall_post',
          user_id: w.author_id,
          username: p?.username || 'Unknown',
          content: w.content.substring(0, 80) + (w.content.length > 80 ? '...' : ''),
          link: `/user/${w.profile_id}`,
          created_at: w.created_at,
          role: roleMap.get(w.author_id) || 'user',
          donor_tier: (donorMap.get(w.author_id)?.tier as DonorTier) || 'none',
          nickname_color: donorMap.get(w.author_id)?.nickname_color || null,
          profile_primary_color: p?.profile_primary_color || null,
          profile_accent_color: p?.profile_accent_color || null,
        });
      });

      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);
    },
    refetchInterval: 60000,
  });

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-2 sm:pb-3 border-b border-border/50 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            Активность
          </CardTitle>
          <div className="flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="h-60 sm:h-72 md:h-80">
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-xs sm:text-sm">
              Нет активности
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {recentActivity.map((activity) => (
                <div 
                  key={`${activity.type}-${activity.id}`}
                  className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <UserNickname
                          username={activity.username}
                          userId={activity.user_id}
                          role={activity.role}
                          donorTier={activity.donor_tier}
                          customColor={activity.nickname_color}
                          profilePrimaryColor={activity.profile_primary_color}
                          profileAccentColor={activity.profile_accent_color}
                          className="text-xs sm:text-sm font-medium"
                          showBadge
                        />
                        <span className="text-muted-foreground">:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-words line-clamp-2">
                        {activity.content}
                      </p>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: false,
                        locale: ru,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>

      {/* Online users footer */}
      <div className="border-t border-border/50 p-2 sm:p-3 bg-secondary/20">
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="font-medium">
              <span className="hidden xs:inline">Пользователей: </span>{onlineUsers.length}
            </span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              <span className="hidden xs:inline">Гостей: </span>{guestCount}
            </span>
          </div>
        </div>
        {onlineUsers.length > 0 && (
          <div className="flex flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-0.5 sm:gap-y-1 text-[10px] sm:text-xs">
            {onlineUsers.slice(0, 10).map((u, i) => (
              <span key={u.user_id} className="inline-flex items-center">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary rounded-full mr-0.5 sm:mr-1 animate-pulse" />
                <UserNickname
                  username={u.profile?.username || 'Unknown'}
                  userId={u.user_id}
                  role={u.role}
                  donorTier={u.donor_tier}
                  customColor={u.nickname_color}
                  profilePrimaryColor={u.profile?.profile_primary_color}
                  profileAccentColor={u.profile?.profile_accent_color}
                  className="text-[10px] sm:text-xs"
                />
                {i < Math.min(onlineUsers.length, 10) - 1 && (
                  <span className="text-muted-foreground ml-0.5 sm:ml-1">,</span>
                )}
              </span>
            ))}
            {onlineUsers.length > 10 && (
              <span className="text-muted-foreground">
                +{onlineUsers.length - 10}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
