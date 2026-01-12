import { Badge } from '@/components/ui/badge';
import { AppRole, DonorTier, ROLE_LABELS, DONOR_TIER_LABELS } from '@/types/database';
import { Shield, Crown, Star, Code, Gamepad2, Eye, Sparkles, Gem, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role?: AppRole;
  donorTier?: DonorTier;
  showDonorBadge?: boolean;
  className?: string;
}

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  owner: <Flame className="w-3 h-3" />,
  admin: <Crown className="w-3 h-3" />,
  curator: <Eye className="w-3 h-3" />,
  moderator: <Shield className="w-3 h-3" />,
  developer: <Code className="w-3 h-3" />,
  player: <Gamepad2 className="w-3 h-3" />,
  user: null,
};

const ROLE_BADGE_STYLES: Record<AppRole, string> = {
  owner: 'bg-gradient-to-r from-red-600/30 to-orange-500/30 text-orange-400 border-orange-500/50',
  admin: 'bg-destructive/20 text-destructive border-destructive/30',
  curator: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  moderator: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  developer: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  player: 'bg-primary/20 text-primary border-primary/30',
  user: '',
};

const DONOR_ICONS: Record<DonorTier, React.ReactNode> = {
  none: null,
  iron: <Gem className="w-3 h-3" />,
  bronze: <Star className="w-3 h-3" />,
  silver: <Star className="w-3 h-3" />,
  gold: <Star className="w-3 h-3" />,
  diamond: <Sparkles className="w-3 h-3" />,
  sponsor: <Sparkles className="w-3 h-3" />,
};

const DONOR_BADGE_STYLES: Record<DonorTier, string> = {
  none: '',
  iron: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  bronze: 'bg-orange-700/20 text-orange-400 border-orange-700/30',
  silver: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  diamond: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  sponsor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function RoleBadge({ role = 'user', donorTier = 'none', showDonorBadge = true, className }: RoleBadgeProps) {
  const badges = [];

  // Staff role badges (always show if not 'user')
  if (role !== 'user' && ROLE_ICONS[role]) {
    badges.push(
      <Badge
        key="role"
        variant="outline"
        className={cn(
          'text-[10px] px-1.5 py-0 h-5 gap-1 font-medium',
          ROLE_BADGE_STYLES[role],
          className
        )}
      >
        {ROLE_ICONS[role]}
        {ROLE_LABELS[role]}
      </Badge>
    );
  }

  // Donor badge (show only if has donor tier and showDonorBadge is true)
  if (showDonorBadge && donorTier !== 'none' && DONOR_ICONS[donorTier]) {
    badges.push(
      <Badge
        key="donor"
        variant="outline"
        className={cn(
          'text-[10px] px-1.5 py-0 h-5 gap-1 font-medium',
          DONOR_BADGE_STYLES[donorTier],
          className
        )}
      >
        {DONOR_ICONS[donorTier]}
        {DONOR_TIER_LABELS[donorTier]}
      </Badge>
    );
  }

  if (badges.length === 0) return null;

  return <>{badges}</>;
}
