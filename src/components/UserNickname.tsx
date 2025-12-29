import { Link } from 'react-router-dom';
import { DonorTier, AppRole, DONOR_TIER_NICK_CLASSES } from '@/types/database';
import { cn } from '@/lib/utils';

interface UserNicknameProps {
  username: string;
  userId: string;
  donorTier?: DonorTier;
  role?: AppRole;
  customColor?: string | null;
  className?: string;
  asLink?: boolean;
}

export function UserNickname({ 
  username, 
  userId, 
  donorTier = 'none', 
  role = 'user',
  customColor,
  className,
  asLink = true 
}: UserNicknameProps) {
  // Priority order (highest to lowest):
  // 1. Admin (red)
  // 2. Moderator (blue/diamond)
  // 3. Curator (gold)
  // 4. Developer (purple)
  // 5. Player (green with glow)
  // 6. Donor tiers (sponsor, diamond, gold, silver, bronze) - only if no special role
  // 7. User (default green)
  
  let nickClass = '';
  
  // Staff roles ALWAYS take priority over donor tiers
  if (role === 'admin') {
    nickClass = 'role-admin';
  } else if (role === 'moderator') {
    nickClass = 'role-moderator';
  } else if (role === 'curator') {
    nickClass = 'role-curator';
  } else if (role === 'developer') {
    nickClass = 'role-developer';
  } else if (role === 'player') {
    // Player role with donor tier overlay
    if (donorTier !== 'none') {
      nickClass = DONOR_TIER_NICK_CLASSES[donorTier];
    } else {
      nickClass = 'role-player';
    }
  } else {
    // Regular user - check for donor tier
    if (donorTier !== 'none') {
      nickClass = DONOR_TIER_NICK_CLASSES[donorTier];
    } else {
      // Default green for regular users
      nickClass = 'text-primary';
    }
  }
  
  const style = customColor ? { color: customColor, textShadow: `0 0 10px ${customColor}` } : undefined;

  const content = (
    <span 
      className={cn(
        'font-semibold transition-colors',
        nickClass,
        asLink && 'hover:underline cursor-pointer',
        className
      )}
      style={style}
    >
      {username}
    </span>
  );

  if (!asLink) return content;

  return (
    <Link to={`/user/${userId}`}>
      {content}
    </Link>
  );
}
