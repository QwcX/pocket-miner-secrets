export type ContentType = 'plugin' | 'mod' | 'map' | 'resourcepack' | 'build' | 'config';
export type AppRole = 'admin' | 'moderator' | 'user' | 'developer' | 'player' | 'curator';
export type DonorTier = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'sponsor';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  discord_username: string | null;
  telegram_username: string | null;
  last_seen_at: string | null;
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
  download_url: string | null;
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

export interface UserReputation {
  id: string;
  user_id: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface UserDonor {
  id: string;
  user_id: string;
  tier: DonorTier;
  nickname_color: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ModerationLog {
  id: string;
  moderator_id: string;
  project_id: string | null;
  action: string;
  reason: string | null;
  project_title: string | null;
  created_at: string;
  profiles?: Profile;
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  plugin: 'Плагин',
  mod: 'Мод',
  map: 'Карта',
  resourcepack: 'Ресурспак',
  build: 'Сборка',
  config: 'Конфиг',
};

export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  plugin: 'bg-minecraft-green text-primary-foreground',
  mod: 'bg-minecraft-purple text-accent-foreground',
  map: 'bg-minecraft-gold text-background',
  resourcepack: 'bg-minecraft-diamond text-background',
  build: 'bg-minecraft-red text-primary-foreground',
  config: 'bg-minecraft-gray text-primary-foreground',
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Администратор',
  moderator: 'Модератор',
  user: 'Пользователь',
  developer: 'Разработчик',
  player: 'Игрок',
  curator: 'Куратор',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-destructive text-destructive-foreground',
  moderator: 'bg-minecraft-purple text-primary-foreground',
  user: 'bg-muted text-muted-foreground',
  developer: 'bg-minecraft-green text-primary-foreground',
  player: 'bg-minecraft-diamond text-background',
  curator: 'bg-minecraft-gold text-background',
};

export const DONOR_TIER_LABELS: Record<DonorTier, string> = {
  none: 'Обычный',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
  sponsor: 'Sponsor',
};

export const DONOR_TIER_COLORS: Record<DonorTier, string> = {
  none: '',
  bronze: 'bg-donor-bronze text-background',
  silver: 'bg-donor-silver text-background',
  gold: 'bg-donor-gold text-background',
  diamond: 'bg-donor-diamond text-background',
  sponsor: 'bg-donor-sponsor text-background',
};

export const DONOR_TIER_NICK_CLASSES: Record<DonorTier, string> = {
  none: '',
  bronze: 'donor-bronze',
  silver: 'donor-silver',
  gold: 'donor-gold',
  diamond: 'donor-diamond',
  sponsor: 'donor-sponsor',
};