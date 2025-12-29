import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Star, Eye, Crown } from 'lucide-react';
import { Project, CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from '@/types/database';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  rating?: number;
}

export function ProjectCard({ project, rating = 0 }: ProjectCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Link to={`/project/${project.slug}`}>
      <Card className="group overflow-hidden bg-card border-border card-hover h-full">
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
              <span className="font-display text-2xl text-muted-foreground opacity-50">
                MC
              </span>
            </div>
          )}
          
          {/* Premium badge */}
          {project.is_premium && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-minecraft-gold text-background gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </Badge>
            </div>
          )}
          
          {/* Content type badge */}
          <div className="absolute bottom-2 left-2">
            <Badge className={cn(CONTENT_TYPE_COLORS[project.content_type])}>
              {CONTENT_TYPE_LABELS[project.content_type]}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              {formatNumber(project.downloads_count)}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatNumber(project.views_count)}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-minecraft-gold text-minecraft-gold" />
                {rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Minecraft versions */}
          {project.minecraft_versions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.minecraft_versions.slice(0, 3).map((version) => (
                <Badge key={version} variant="outline" className="text-xs">
                  {version}
                </Badge>
              ))}
              {project.minecraft_versions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.minecraft_versions.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
