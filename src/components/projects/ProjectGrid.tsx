import { Project } from '@/types/database';
import { ProjectCard } from './ProjectCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectGridProps {
  projects: Project[];
  loading?: boolean;
  ratings?: Record<string, number>;
}

export function ProjectGrid({ projects, loading = false, ratings = {} }: ProjectGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2 sm:space-y-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-muted-foreground text-sm sm:text-base">Проекты не найдены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          rating={ratings[project.id]}
        />
      ))}
    </div>
  );
}
