import { Link } from 'react-router-dom';
import { DonorTier, DONOR_TIER_NICK_CLASSES } from '@/types/database';
import { cn } from '@/lib/utils';

interface UserNicknameProps {
  username: string;
  userId: string;
  donorTier?: DonorTier;
  customColor?: string | null;
  className?: string;
  asLink?: boolean;
}

export function UserNickname({ 
  username, 
  userId, 
  donorTier = 'none', 
  customColor,
  className,
  asLink = true 
}: UserNicknameProps) {
  const nickClass = DONOR_TIER_NICK_CLASSES[donorTier];
  
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