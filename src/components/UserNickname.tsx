import { Link } from 'react-router-dom';
import { DonorTier, AppRole, DONOR_TIER_NICK_CLASSES } from '@/types/database';
import { RoleBadge } from '@/components/RoleBadge';
import { cn } from '@/lib/utils';

interface UserNicknameProps {
  username: string;
  userId: string;
  donorTier?: DonorTier;
  role?: AppRole;
  customColor?: string | null;
  className?: string;
  asLink?: boolean;
  showBadge?: boolean;
}

export function UserNickname({ 
  username, 
  userId, 
  donorTier = 'none', 
  role = 'user',
  customColor,
  className,
  asLink = true,
  showBadge = false
}: UserNicknameProps) {
  // Priority order (highest to lowest):
  // 1. Admin (red) - staff
  // 2. Moderator (blue) - staff
  // 3. Curator (gold) - staff
  // 4. Developer (purple) - staff
  // 5. Player with donor tier
  // 6. Player (green)
  // 7. User with donor tier
  // 8. User (default green)
  
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
  } else if (donorTier !== 'none') {
    // Has donor tier - use donor colors
    nickClass = DONOR_TIER_NICK_CLASSES[donorTier];
  } else if (role === 'player') {
    nickClass = 'role-player';
  } else {
    // Default green for regular users
    nickClass = 'text-primary';
  }
  
  const style = customColor ? { color: customColor, textShadow: `0 0 10px ${customColor}` } : undefined;

  const nicknameElement = (
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

  const content = (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {asLink ? (
        <Link to={`/user/${userId}`}>
          {nicknameElement}
        </Link>
      ) : (
        nicknameElement
      )}
      {showBadge && <RoleBadge role={role} donorTier={donorTier} />}
    </span>
  );

  return content;
}
