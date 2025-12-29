import { Badge } from '@/components/ui/badge';
import { Crown, Diamond, Star, Award, Sparkles } from 'lucide-react';
import { DonorTier, DONOR_TIER_LABELS, DONOR_TIER_COLORS } from '@/types/database';
import { cn } from '@/lib/utils';

interface DonorBadgeProps {
  tier: DonorTier;
  className?: string;
  showLabel?: boolean;
}

const TIER_ICONS: Record<DonorTier, typeof Crown | null> = {
  none: null,
  bronze: Award,
  silver: Star,
  gold: Crown,
  diamond: Diamond,
  sponsor: Sparkles,
};

export function DonorBadge({ tier, className, showLabel = true }: DonorBadgeProps) {
  if (tier === 'none') return null;

  const Icon = TIER_ICONS[tier];

  return (
    <Badge className={cn(DONOR_TIER_COLORS[tier], 'gap-1', className)}>
      {Icon && <Icon className="w-3 h-3" />}
      {showLabel && DONOR_TIER_LABELS[tier]}
    </Badge>
  );
}