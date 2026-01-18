import { DonorTier, DONOR_PRIORITY } from '@/types/database';

// Define all donor benefits with the minimum tier required
export interface DonorBenefit {
  id: string;
  name: string;
  description: string;
  minTier: DonorTier;
  icon?: string;
}

export const DONOR_BENEFITS: DonorBenefit[] = [
  // Iron benefits
  { id: 'nickname_color', name: 'Кастомный цвет ника', description: 'Установите свой цвет никнейма', minTier: 'iron' },
  { id: 'reduced_rate_limit_10', name: 'Сниженные лимиты -10%', description: 'Меньше ожидания между действиями', minTier: 'iron' },
  { id: 'profile_colors', name: 'Цвета профиля', description: 'Настройте primary и accent цвета', minTier: 'iron' },
  
  // Bronze benefits
  { id: 'reduced_rate_limit_20', name: 'Сниженные лимиты -20%', description: 'Ещё меньше ожидания', minTier: 'bronze' },
  { id: 'bronze_badge', name: 'Bronze бейдж', description: 'Специальный значок донатера', minTier: 'bronze' },
  
  // Silver benefits
  { id: 'reduced_rate_limit_30', name: 'Сниженные лимиты -30%', description: 'Значительно меньше ожидания', minTier: 'silver' },
  { id: 'silver_glow', name: 'Свечение ника', description: 'Красивое свечение вокруг ника', minTier: 'silver' },
  
  // Gold benefits
  { id: 'profile_emoji', name: 'Эмодзи профиля', description: 'Добавьте эмодзи рядом с ником', minTier: 'gold' },
  { id: 'custom_emoji_upload', name: 'Загрузка своего эмодзи', description: 'Загрузите своё изображение как эмодзи', minTier: 'gold' },
  { id: 'reduced_rate_limit_40', name: 'Сниженные лимиты -40%', description: 'Очень быстрые действия', minTier: 'gold' },
  
  // Diamond benefits
  { id: 'reduced_rate_limit_50', name: 'Сниженные лимиты -50%', description: 'Половина обычного ожидания', minTier: 'diamond' },
  { id: 'diamond_effects', name: 'Алмазные эффекты', description: 'Специальные визуальные эффекты', minTier: 'diamond' },
  { id: 'priority_support', name: 'Приоритетная поддержка', description: 'Быстрые ответы от модерации', minTier: 'diamond' },
  
  // Emerald benefits
  { id: 'reduced_rate_limit_60', name: 'Сниженные лимиты -60%', description: 'Минимальное ожидание', minTier: 'emerald' },
  { id: 'emerald_aura', name: 'Изумрудная аура', description: 'Уникальное свечение профиля', minTier: 'emerald' },
  { id: 'early_access', name: 'Ранний доступ', description: 'Первыми видите новые функции', minTier: 'emerald' },
  
  // Sponsor benefits
  { id: 'reduced_rate_limit_75', name: 'Сниженные лимиты -75%', description: 'Практически без ожидания', minTier: 'sponsor' },
  { id: 'sponsor_crown', name: 'Корона спонсора', description: 'Уникальная корона в профиле', minTier: 'sponsor' },
  { id: 'custom_badge', name: 'Персональный бейдж', description: 'Создайте свой уникальный бейдж', minTier: 'sponsor' },
  { id: 'vip_channel', name: 'VIP канал', description: 'Доступ к закрытому чату спонсоров', minTier: 'sponsor' },
];

// Check if a tier has access to a benefit (higher tiers get all lower tier benefits)
export function hasBenefit(userTier: DonorTier, benefitMinTier: DonorTier): boolean {
  return DONOR_PRIORITY[userTier] >= DONOR_PRIORITY[benefitMinTier];
}

// Get all benefits available for a tier
export function getBenefitsForTier(tier: DonorTier): DonorBenefit[] {
  return DONOR_BENEFITS.filter(benefit => hasBenefit(tier, benefit.minTier));
}

// Get rate limit multiplier for a tier (lower = faster)
export function getRateLimitMultiplier(tier: DonorTier): number {
  switch (tier) {
    case 'sponsor': return 0.25; // 75% reduction
    case 'emerald': return 0.40; // 60% reduction
    case 'diamond': return 0.50; // 50% reduction
    case 'gold': return 0.60; // 40% reduction
    case 'silver': return 0.70; // 30% reduction
    case 'bronze': return 0.80; // 20% reduction
    case 'iron': return 0.90; // 10% reduction
    default: return 1.0; // No reduction
  }
}

// Get benefits grouped by tier for display
export function getBenefitsByTier(): Record<DonorTier, DonorBenefit[]> {
  const result: Record<DonorTier, DonorBenefit[]> = {
    none: [],
    iron: [],
    bronze: [],
    silver: [],
    gold: [],
    diamond: [],
    emerald: [],
    sponsor: [],
  };
  
  DONOR_BENEFITS.forEach(benefit => {
    result[benefit.minTier].push(benefit);
  });
  
  return result;
}

// Check if user can upload custom emoji
export function canUploadCustomEmoji(tier: DonorTier): boolean {
  return hasBenefit(tier, 'gold');
}
