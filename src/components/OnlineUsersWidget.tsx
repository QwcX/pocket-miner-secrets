import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserNickname } from '@/components/UserNickname';
import { useAuth } from '@/lib/auth';
import { DonorTier, AppRole } from '@/types/database';
import { MessageSquare, Users, Settings2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface OnlineUser {
  user_id: string;
  last_ping: string;
  profile?: {
    username: string;
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
}

export function OnlineUsersWidget() {
  const { user } = useAuth();

  // Update online status every 30 seconds
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
        supabase.from('profiles').select('id, username').in('id', userIds),
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
        supabase.from('profiles').select('id, username').in('id', userIdsArr),
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
        activities.push({
          id: c.id,
          type: 'comment',
          user_id: c.user_id,
          username: profileMap.get(c.user_id)?.username || 'Unknown',
          content: c.content.substring(0, 80) + (c.content.length > 80 ? '...' : ''),
          created_at: c.created_at,
          role: roleMap.get(c.user_id) || 'user',
          donor_tier: (donorMap.get(c.user_id)?.tier as DonorTier) || 'none',
          nickname_color: donorMap.get(c.user_id)?.nickname_color || null,
        });
      });

      (wallPostsRes.data || []).forEach(w => {
        activities.push({
          id: w.id,
          type: 'wall_post',
          user_id: w.author_id,
          username: profileMap.get(w.author_id)?.username || 'Unknown',
          content: w.content.substring(0, 80) + (w.content.length > 80 ? '...' : ''),
          link: `/user/${w.profile_id}`,
          created_at: w.created_at,
          role: roleMap.get(w.author_id) || 'user',
          donor_tier: (donorMap.get(w.author_id)?.tier as DonorTier) || 'none',
          nickname_color: donorMap.get(w.author_id)?.nickname_color || null,
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
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Активность
          </CardTitle>
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="h-80">
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Нет активности
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {recentActivity.map((activity) => (
                <div 
                  key={`${activity.type}-${activity.id}`}
                  className="px-4 py-3 hover:bg-secondary/30 transition-colors"
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
                          className="text-sm font-medium"
                        />
                        <span className="text-muted-foreground">:</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 break-words">
                        {activity.content}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
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
      <div className="border-t border-border/50 p-3 bg-secondary/20">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Онлайн: {onlineUsers.length}
          </span>
        </div>
        {onlineUsers.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
            {onlineUsers.slice(0, 10).map((u, i) => (
              <span key={u.user_id} className="inline-flex items-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1 animate-pulse" />
                <UserNickname
                  username={u.profile?.username || 'Unknown'}
                  userId={u.user_id}
                  role={u.role}
                  donorTier={u.donor_tier}
                  customColor={u.nickname_color}
                  className="text-xs"
                />
                {i < Math.min(onlineUsers.length, 10) - 1 && (
                  <span className="text-muted-foreground ml-1">,</span>
                )}
              </span>
            ))}
            {onlineUsers.length > 10 && (
              <span className="text-muted-foreground">
                и ещё {onlineUsers.length - 10}...
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
