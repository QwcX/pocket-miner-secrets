import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';
import { Loader2, Trophy, Star, Download, TrendingUp, Crown, Users, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DonorBadge } from '@/components/DonorBadge';
import { UserNickname } from '@/components/UserNickname';
import { ReputationDisplay } from '@/components/ReputationDisplay';
import { DonorTier } from '@/types/database';
import { ProjectCard } from '@/components/projects/ProjectCard';

interface TopUser {
  id: string;
  username: string;
  avatar_url: string | null;
  reputation?: number;
  projectsCount?: number;
  totalDownloads?: number;
  donorTier?: DonorTier;
}

export default function Leaderboards() {
  // Top users by reputation
  const { data: topByReputation = [], isLoading: repLoading } = useQuery({
    queryKey: ['topByReputation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reputation')
        .select(`
          user_id,
          points,
          profiles:user_id(id, username, avatar_url)
        `)
        .order('points', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Get donor info for these users
      const userIds = data?.map(d => d.user_id) || [];
      const { data: donorData } = await supabase
        .from('user_donors')
        .select('user_id, tier')
        .in('user_id', userIds);
      
      const donorMap = new Map(donorData?.map(d => [d.user_id, d.tier as DonorTier]) || []);
      
      return data?.map(d => ({
        id: d.user_id,
        username: (d.profiles as any)?.username || 'Unknown',
        avatar_url: (d.profiles as any)?.avatar_url,
        reputation: d.points,
        donorTier: donorMap.get(d.user_id) || 'none' as DonorTier,
      })) || [];
    },
  });

  // Top users by project count
  const { data: topByProjects = [], isLoading: projLoading } = useQuery({
    queryKey: ['topByProjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('author_id')
        .eq('is_approved', true);
      
      if (error) throw error;
      
      // Count projects per user
      const counts = data?.reduce((acc, p) => {
        acc[p.author_id] = (acc[p.author_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const topUserIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);
      
      if (topUserIds.length === 0) return [];
      
      // Get profile data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', topUserIds);
      
      const { data: donorData } = await supabase
        .from('user_donors')
        .select('user_id, tier')
        .in('user_id', topUserIds);
      
      const donorMap = new Map(donorData?.map(d => [d.user_id, d.tier as DonorTier]) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return topUserIds.map(id => ({
        id,
        username: profileMap.get(id)?.username || 'Unknown',
        avatar_url: profileMap.get(id)?.avatar_url,
        projectsCount: counts[id],
        donorTier: donorMap.get(id) || 'none' as DonorTier,
      }));
    },
  });

  // Top projects by downloads
  const { data: topProjects = [], isLoading: topProjLoading } = useQuery({
    queryKey: ['topProjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_approved', true)
        .order('downloads_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = repLoading || projLoading || topProjLoading;

  const renderUserRow = (user: TopUser, index: number, stat: 'reputation' | 'projects' | 'downloads') => (
    <Link 
      key={user.id} 
      to={`/user/${user.id}`}
      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center justify-center w-8 h-8">
        {index === 0 ? (
          <Trophy className="w-6 h-6 text-minecraft-gold" />
        ) : index === 1 ? (
          <Trophy className="w-5 h-5 text-donor-silver" />
        ) : index === 2 ? (
          <Trophy className="w-5 h-5 text-donor-bronze" />
        ) : (
          <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
        )}
      </div>
      
      <Avatar className="w-10 h-10 border-2 border-border">
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <UserNickname 
            username={user.username} 
            userId={user.id} 
            donorTier={user.donorTier}
            asLink={false}
          />
          {user.donorTier && user.donorTier !== 'none' && (
            <DonorBadge tier={user.donorTier} showLabel={false} />
          )}
        </div>
      </div>
      
      <div className="text-right">
        {stat === 'reputation' && user.reputation !== undefined && (
          <ReputationDisplay points={user.reputation} />
        )}
        {stat === 'projects' && user.projectsCount !== undefined && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span className="font-bold text-foreground">{user.projectsCount}</span>
          </div>
        )}
        {stat === 'downloads' && user.totalDownloads !== undefined && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Download className="w-4 h-4" />
            <span className="font-bold text-foreground">{user.totalDownloads}</span>
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <>
      <Helmet>
        <title>Топы | MCLeak</title>
        <meta name="description" content="Топ игроков и популярных сборок Minecraft" />
      </Helmet>

      <Layout>
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-8 h-8 text-minecraft-gold" />
            <div>
              <h1 className="text-2xl font-bold">Топы</h1>
              <p className="text-muted-foreground">Лучшие игроки и ресурсы</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="reputation" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="reputation" className="gap-2">
                  <Star className="w-4 h-4" />
                  По репутации
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-2">
                  <Package className="w-4 h-4" />
                  По ресурсам
                </TabsTrigger>
                <TabsTrigger value="popular" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Популярные сборки
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reputation">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5" />
                      Топ по репутации
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topByReputation.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        Пока нет данных о репутации
                      </p>
                    ) : (
                      topByReputation.map((user, index) => renderUserRow(user, index, 'reputation'))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="w-5 h-5" />
                      Топ по количеству ресурсов
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topByProjects.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        Пока нет опубликованных ресурсов
                      </p>
                    ) : (
                      topByProjects.map((user, index) => renderUserRow(user, index, 'projects'))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="popular">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5" />
                      Топ популярных сборок
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topProjects.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        Пока нет опубликованных сборок
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topProjects.map((project) => (
                          <ProjectCard key={project.id} project={project as any} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </Layout>
    </>
  );
}