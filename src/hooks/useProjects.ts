import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, ContentType } from '@/types/database';

interface UseProjectsParams {
  type?: ContentType;
  search?: string;
  limit?: number;
  featured?: boolean;
}

export function useProjects({ type, search, limit = 20, featured }: UseProjectsParams = {}) {
  return useQuery({
    queryKey: ['projects', { type, search, limit, featured }],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('content_type', type);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (featured) {
        query = query.order('downloads_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Project[];
    },
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Fetch author profile separately
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.author_id)
          .maybeSingle();
        
        return { ...data, profiles: profile } as Project;
      }
      
      return null;
    },
    enabled: !!slug,
  });
}

export function useMyProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-projects', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: !!userId,
  });
}

export function useProjectRatings(projectIds: string[]) {
  return useQuery({
    queryKey: ['project-ratings', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return {};
      
      const ratings: Record<string, number> = {};
      
      for (const projectId of projectIds) {
        const { data } = await supabase
          .rpc('get_project_rating', { project_uuid: projectId });
        
        if (data !== null) {
          ratings[projectId] = Number(data);
        }
      }
      
      return ratings;
    },
    enabled: projectIds.length > 0,
  });
}
