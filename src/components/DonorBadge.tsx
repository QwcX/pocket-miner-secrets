import { Badge } from '@/components/ui/badge';
import { Crown, Diamond, Star, Award, Sparkles } from 'lucide-react';
import { DonorTier, DONOR_TIER_LABELS, DONOR_TIER_COLORS } from '@/types/database';
import { cn } from '@/lib/utils';

interface DonorBadgeProps {
  tier: DonorTier;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const TIER_ICONS: Record<DonorTier, typeof Crown | null> = {
  none: null,
  bronze: Award,
  silver: Star,
  gold: Crown,
  diamond: Diamond,
  sponsor: Sparkles,
};

export function DonorBadge({ tier, className, showLabel = true, size = 'md' }: DonorBadgeProps) {
  if (tier === 'none') return null;

  const Icon = TIER_ICONS[tier];
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <Badge className={cn(
      DONOR_TIER_COLORS[tier], 
      'gap-1', 
      size === 'sm' && 'text-xs py-0 px-1.5',
      className
    )}>
      {Icon && <Icon className={iconSize} />}
      {showLabel && DONOR_TIER_LABELS[tier]}
    </Badge>
  );
}