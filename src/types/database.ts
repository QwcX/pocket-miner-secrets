export type ContentType = 'plugin' | 'mod' | 'map' | 'resourcepack' | 'build' | 'config';
export type AppRole = 'owner' | 'admin' | 'curator' | 'moderator' | 'developer' | 'player' | 'user';
export type DonorTier = 'none' | 'iron' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'emerald' | 'sponsor';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  banner_url?: string | null;
  bio?: string | null;
  discord_username?: string | null;
  telegram_username?: string | null;
  profile_primary_color?: string | null;
  profile_accent_color?: string | null;
  profile_emoji?: string | null;
  last_seen_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PriceType = 'leak' | 'free' | 'paid';

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
  price_type: PriceType;
  min_donor_tier: DonorTier | null;
  downloads_count: number;
  views_count: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
}

export interface ForumQuestion {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  is_solved: boolean;
  solution_id: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
  answers_count?: number;
}

export interface ForumAnswer {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  is_solution: boolean;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
  user_vote?: boolean | null;
}

export interface PurchaseRequest {
  id: string;
  project_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  message: string | null;
  referral_source: string | null;
  created_at: string;
  updated_at: string;
  projects?: Project | null;
  buyer_profile?: Profile | null;
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

export interface CustomEmoji {
  id: string;
  shortcode: string;
  image_url: string;
  is_animated: boolean;
  category: string;
  uploaded_by: string | null;
  created_at: string;
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

// Role hierarchy: Owner > Admin > Curator > Moderator > Developer > Player > User
export const ROLE_PRIORITY: Record<AppRole, number> = {
  owner: 100,
  admin: 90,
  curator: 80,
  moderator: 70,
  developer: 60,
  player: 50,
  user: 10,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  curator: 'Куратор',
  moderator: 'Модератор',
  developer: 'Разработчик',
  player: 'Игрок',
  user: 'Пользователь',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  owner: 'bg-gradient-to-r from-red-600 to-orange-500 text-white',
  admin: 'bg-destructive text-destructive-foreground',
  curator: 'bg-minecraft-gold text-background',
  moderator: 'bg-minecraft-purple text-primary-foreground',
  developer: 'bg-minecraft-green text-primary-foreground',
  player: 'bg-minecraft-diamond text-background',
  user: 'bg-muted text-muted-foreground',
};

// Donor tier hierarchy: Sponsor > Emerald > Diamond > Gold > Silver > Iron > Bronze > None
export const DONOR_PRIORITY: Record<DonorTier, number> = {
  sponsor: 70,
  emerald: 60,
  diamond: 50,
  gold: 40,
  silver: 30,
  iron: 20,
  bronze: 15,
  none: 0,
};

export const DONOR_TIER_LABELS: Record<DonorTier, string> = {
  none: 'Обычный',
  iron: 'Iron',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
  emerald: 'Emerald',
  sponsor: 'Sponsor',
};

export const DONOR_TIER_COLORS: Record<DonorTier, string> = {
  none: '',
  iron: 'bg-gray-500 text-white',
  bronze: 'bg-donor-bronze text-background',
  silver: 'bg-donor-silver text-background',
  gold: 'bg-donor-gold text-background',
  diamond: 'bg-donor-diamond text-background',
  emerald: 'bg-donor-emerald text-background',
  sponsor: 'bg-donor-sponsor text-background',
};

export const DONOR_TIER_NICK_CLASSES: Record<DonorTier, string> = {
  none: '',
  iron: 'donor-iron',
  bronze: 'donor-bronze',
  silver: 'donor-silver',
  gold: 'donor-gold',
  diamond: 'donor-diamond',
  emerald: 'donor-emerald',
  sponsor: 'donor-sponsor',
};

// Минимальные тиры для функций
export const MIN_TIER_FOR_NICKNAME_COLOR: DonorTier[] = ['iron', 'bronze', 'silver', 'gold', 'diamond', 'emerald', 'sponsor'];
export const MIN_TIER_FOR_PROFILE_EMOJI: DonorTier[] = ['gold', 'diamond', 'emerald', 'sponsor'];

export function canCustomizeNickname(donorTier: DonorTier): boolean {
  return MIN_TIER_FOR_NICKNAME_COLOR.includes(donorTier);
}

export function canSetProfileEmoji(donorTier: DonorTier): boolean {
  return MIN_TIER_FOR_PROFILE_EMOJI.includes(donorTier);
}

// Role-based nickname classes (takes priority over donor tier for special roles)
export const ROLE_NICK_CLASSES: Record<AppRole, string> = {
  owner: 'role-owner',
  admin: 'role-admin',
  curator: 'role-curator',
  moderator: 'role-moderator',
  developer: 'role-developer',
  player: 'role-player',
  user: '',
};

// Helper function to get highest priority role
export function getHighestRole(roles: AppRole[]): AppRole {
  if (roles.length === 0) return 'user';
  return roles.reduce((highest, current) => 
    ROLE_PRIORITY[current] > ROLE_PRIORITY[highest] ? current : highest
  , roles[0]);
}

// Helper function to check if user can manage another role
export function canManageRole(userRole: AppRole, targetRole: AppRole): boolean {
  return ROLE_PRIORITY[userRole] > ROLE_PRIORITY[targetRole];
}