export type ContentType = 'plugin' | 'mod' | 'map' | 'resourcepack';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  description: string;
  content_type: ContentType;
  minecraft_versions: string[];
  tags: string[];
  thumbnail_url: string | null;
  is_premium: boolean;
  price: number;
  downloads_count: number;
  views_count: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: string;
  changelog: string | null;
  file_url: string;
  file_size: number;
  minecraft_versions: string[];
  downloads_count: number;
  created_at: string;
}

export interface Rating {
  id: string;
  project_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Favorite {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  plugin: 'Плагин',
  mod: 'Мод',
  map: 'Карта',
  resourcepack: 'Ресурспак',
};

export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  plugin: 'bg-minecraft-green text-primary-foreground',
  mod: 'bg-minecraft-purple text-accent-foreground',
  map: 'bg-minecraft-gold text-background',
  resourcepack: 'bg-minecraft-diamond text-background',
};
