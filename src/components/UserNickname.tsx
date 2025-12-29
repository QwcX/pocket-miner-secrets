import { Link } from 'react-router-dom';
import { DonorTier, AppRole, DONOR_TIER_NICK_CLASSES, ROLE_NICK_CLASSES } from '@/types/database';
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
  // Priority: custom color > role (for admin/mod/dev/curator) > donor tier > default green
  let nickClass = '';
  
  // Special roles always get their colors
  if (role === 'admin') {
    nickClass = 'role-admin';
  } else if (role === 'moderator') {
    nickClass = 'role-moderator';
  } else if (role === 'curator') {
    nickClass = 'role-curator';
  } else if (role === 'developer') {
    nickClass = 'role-developer';
  } else if (donorTier !== 'none') {
    // Donor tiers
    nickClass = DONOR_TIER_NICK_CLASSES[donorTier];
  } else if (role === 'player') {
    nickClass = 'role-player';
  } else {
    // Default for regular users - green color
    nickClass = 'text-primary';
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
