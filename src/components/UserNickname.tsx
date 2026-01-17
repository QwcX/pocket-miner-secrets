import { Link } from 'react-router-dom';
import { DonorTier, AppRole, DONOR_TIER_NICK_CLASSES } from '@/types/database';
import { RoleBadge } from '@/components/RoleBadge';
import { cn } from '@/lib/utils';
import { hexToHslChannels } from '@/lib/color';

interface UserNicknameProps {
  username: string;
  userId: string;
  donorTier?: DonorTier;
  role?: AppRole;
  customColor?: string | null;
  profilePrimaryColor?: string | null;
  profileAccentColor?: string | null;
  profileEmoji?: string | null;
  className?: string;
  asLink?: boolean;
  showBadge?: boolean;
  showEmoji?: boolean;
}

export function UserNickname({
  username,
  userId,
  donorTier = 'none',
  role = 'user',
  customColor,
  profilePrimaryColor,
  profileAccentColor,
  profileEmoji,
  className,
  asLink = true,
  showBadge = false,
  showEmoji = true,
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

  const isStaff =
    role === 'admin' || role === 'moderator' || role === 'curator' || role === 'developer';

  // Only apply profile palette preview when it's a regular user (no staff/donor override)
  const shouldUseProfilePalette =
    !customColor && !isStaff && donorTier === 'none' && (!!profilePrimaryColor || !!profileAccentColor);

  const donorHsl = hexToHslChannels(customColor);
  const primaryHsl = shouldUseProfilePalette ? hexToHslChannels(profilePrimaryColor) : null;
  const accentHsl = shouldUseProfilePalette ? hexToHslChannels(profileAccentColor) : null;

  const glowHsl = donorHsl || accentHsl || primaryHsl;

  const style = glowHsl
    ? {
        color: `hsl(${donorHsl || primaryHsl || glowHsl})`,
        textShadow: `0 0 10px hsl(${glowHsl} / 0.9), 0 0 20px hsl(${glowHsl} / 0.35)`,
      }
    : undefined;

  // Parse emoji - could be a unicode emoji or an image URL
  const renderEmoji = () => {
    if (!showEmoji || !profileEmoji) return null;
    
    // Check if it's an image URL (custom emoji)
    if (profileEmoji.startsWith('http') || profileEmoji.startsWith('/')) {
      return (
        <img 
          src={profileEmoji} 
          alt="emoji" 
          className="inline-block w-4 h-4 align-middle ml-1"
        />
      );
    }
    
    // It's a unicode emoji
    return <span className="ml-1">{profileEmoji}</span>;
  };

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
      {renderEmoji()}
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
