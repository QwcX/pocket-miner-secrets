import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserNickname } from '@/components/UserNickname';
import { useAuth } from '@/lib/auth';
import { DonorTier, AppRole } from '@/types/database';
import { Users } from 'lucide-react';

interface OnlineUser {
  user_id: string;
  last_ping: string;
  profile?: {
    username: string;
    profile_primary_color?: string | null;
    profile_accent_color?: string | null;
    profile_emoji?: string | null;
  };
  role?: AppRole;
  donor_tier?: DonorTier;
  nickname_color?: string | null;
}

export function OnlineUsers() {
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
      // Remove from online users on unmount
      supabase.from('online_users').delete().eq('user_id', user.id);
    };
  }, [user]);

  // Fetch online users (active in last 5 minutes)
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
          .select('id, username, profile_primary_color, profile_accent_color, profile_emoji')
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
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (onlineUsers.length === 0) return null;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Сейчас онлайн
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
          {onlineUsers.map((u, i) => (
            <span key={u.user_id} className="inline-flex items-center">
              <UserNickname
                username={u.profile?.username || 'Unknown'}
                userId={u.user_id}
                role={u.role}
                donorTier={u.donor_tier}
                customColor={u.nickname_color}
                profilePrimaryColor={u.profile?.profile_primary_color}
                profileAccentColor={u.profile?.profile_accent_color}
                profileEmoji={u.profile?.profile_emoji}
              />
              {i < onlineUsers.length - 1 && <span className="text-muted-foreground">,</span>}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Всего: {onlineUsers.length} (пользователей: {onlineUsers.length})
        </p>
      </CardContent>
    </Card>
  );
}
