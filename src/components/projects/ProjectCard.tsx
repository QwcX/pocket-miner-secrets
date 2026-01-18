import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Star, Eye, Crown } from 'lucide-react';
import { Project, CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS, DonorTier, AppRole } from '@/types/database';
import { cn } from '@/lib/utils';
import { UserNickname } from '@/components/UserNickname';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProjectCardProps {
  project: Project;
  rating?: number;
}

export function ProjectCard({ project, rating = 0 }: ProjectCardProps) {
  // Get author info with role and donor tier
  const { data: authorInfo } = useQuery({
    queryKey: ['author-info', project.author_id],
    queryFn: async () => {
      const [profileResult, roleResult, donorResult] = await Promise.all([
        supabase.from('profiles').select('profile_primary_color, profile_accent_color, profile_emoji').eq('id', project.author_id).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', project.author_id),
        supabase.from('user_donors').select('tier, nickname_color').eq('user_id', project.author_id).maybeSingle(),
      ]);
      
      const highestRole = roleResult.data?.reduce((acc, r) => {
        const priority: Record<string, number> = { admin: 5, moderator: 4, curator: 3, developer: 2, player: 1, user: 0 };
        return priority[r.role] > priority[acc] ? r.role as AppRole : acc;
      }, 'user' as AppRole) || 'user';
      
      return {
        role: highestRole,
        donorTier: (donorResult.data?.tier as DonorTier) || 'none',
        nicknameColor: donorResult.data?.nickname_color || null,
        profilePrimaryColor: profileResult.data?.profile_primary_color || null,
        profileAccentColor: profileResult.data?.profile_accent_color || null,
        profileEmoji: profileResult.data?.profile_emoji || null,
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="group overflow-hidden bg-card border-border card-hover h-full">
      <Link to={`/project/${project.slug}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video bg-secondary overflow-hidden">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <span className="font-display text-lg sm:text-2xl text-muted-foreground opacity-50">
                MC
              </span>
            </div>
          )}
          
          {/* Premium badge */}
          {project.is_premium && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
              <Badge className="bg-minecraft-gold text-background gap-1 text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2">
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden xs:inline">Premium</span>
              </Badge>
            </div>
          )}
          
          {/* Price badge */}
          {project.price > 0 && (
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
              <Badge variant="outline" className="bg-background/80 text-minecraft-gold border-minecraft-gold text-[10px] sm:text-xs">
                {project.price} ₽
              </Badge>
            </div>
          )}
          
          {/* Content type badge */}
          <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2">
            <Badge className={cn('text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2', CONTENT_TYPE_COLORS[project.content_type])}>
              {CONTENT_TYPE_LABELS[project.content_type]}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className="p-2.5 sm:p-3 md:p-4 space-y-1.5 sm:space-y-2 md:space-y-3">
        {/* Title */}
        <Link to={`/project/${project.slug}`}>
          <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
        </Link>

        {/* Author */}
        <div className="flex items-center gap-1 text-xs sm:text-sm" onClick={(e) => e.stopPropagation()}>
          <span className="text-muted-foreground">от</span>
          <UserNickname 
            username={project.profiles?.username || 'Unknown'} 
            userId={project.author_id}
            role={authorInfo?.role}
            donorTier={authorInfo?.donorTier}
            customColor={authorInfo?.nicknameColor}
            profilePrimaryColor={authorInfo?.profilePrimaryColor}
            profileAccentColor={authorInfo?.profileAccentColor}
            profileEmoji={authorInfo?.profileEmoji}
            className="text-xs sm:text-sm"
          />
        </div>

        {/* Description - hide on very small screens */}
        <p className="hidden xs:block text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {formatNumber(project.downloads_count)}
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {formatNumber(project.views_count)}
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-minecraft-gold text-minecraft-gold" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Minecraft versions */}
        {project.minecraft_versions.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1">
            {project.minecraft_versions.slice(0, 3).map((version) => (
              <Badge key={version} variant="outline" className="text-[10px] sm:text-xs">
                {version}
              </Badge>
            ))}
            {project.minecraft_versions.length > 3 && (
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                +{project.minecraft_versions.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
