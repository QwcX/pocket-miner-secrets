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
  // Priority: custom color > role (for admin/mod) > donor tier
  const roleClass = ROLE_NICK_CLASSES[role];
  const donorClass = DONOR_TIER_NICK_CLASSES[donorTier];
  
  // Admin/moderator roles take priority, otherwise use donor tier
  const nickClass = (role === 'admin' || role === 'moderator' || role === 'curator' || role === 'developer') 
    ? roleClass 
    : (donorTier !== 'none' ? donorClass : roleClass);
  
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
