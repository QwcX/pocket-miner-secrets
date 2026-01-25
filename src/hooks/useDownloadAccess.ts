import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DonorTier, DONOR_PRIORITY } from '@/types/database';

export type AccessMode = 'tier_or_purchase' | 'purchase_only';

interface DownloadAccessResult {
  canDownload: boolean;
  canInteract: boolean; // Rate, comment, favorite
  reason: string | null;
  userTier: DonorTier;
  requiredTier: DonorTier | null;
  remainingDownloads: number | null;
  hasUnlimitedDownloads: boolean;
  needsPurchase: boolean; // For paid projects without tier access
  hasTierAccess: boolean; // User tier meets required tier
  accessMode: AccessMode;
}

export function useDownloadAccess(
  projectPriceType: string | undefined,
  projectMinTier: string | null | undefined,
  projectAccessMode: string | undefined = 'tier_or_purchase'
) {
  const { user } = useAuth();

  return useQuery<DownloadAccessResult>({
    queryKey: ['download-access', user?.id, projectPriceType, projectMinTier, projectAccessMode],
    queryFn: async () => {
      const accessMode = (projectAccessMode as AccessMode) || 'tier_or_purchase';
      
      // Default: no access
      const noAccess: DownloadAccessResult = {
        canDownload: false,
        canInteract: false,
        reason: null,
        userTier: 'none',
        requiredTier: null,
        remainingDownloads: null,
        hasUnlimitedDownloads: false,
        needsPurchase: false,
        hasTierAccess: false,
        accessMode,
      };

      // Not logged in
      if (!user) {
        return {
          ...noAccess,
          reason: 'Войдите в аккаунт для скачивания',
          canInteract: false,
        };
      }

      // Get user's donor tier
      const { data: donorData } = await supabase
        .from('user_donors')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle();

      const userTier: DonorTier = (donorData?.tier as DonorTier) || 'none';
      const userPriority = DONOR_PRIORITY[userTier];
      const requiredTier = (projectMinTier as DonorTier) || 'none';
      const requiredPriority = DONOR_PRIORITY[requiredTier];
      
      // Check if user tier meets required tier
      const hasTierAccess = userPriority >= requiredPriority;

      // For PAID projects
      if (projectPriceType === 'paid') {
        // PURCHASE_ONLY mode: donor tier doesn't help, must always purchase
        if (accessMode === 'purchase_only') {
          return {
            canDownload: false,
            canInteract: false,
            reason: 'Платный проект — свяжитесь с продавцом для покупки',
            userTier,
            requiredTier,
            remainingDownloads: null,
            hasUnlimitedDownloads: false,
            needsPurchase: true,
            hasTierAccess: false, // In purchase_only mode, tier never gives access
            accessMode,
          };
        }

        // TIER_OR_PURCHASE mode: donor tier can grant free access
        if (projectMinTier && projectMinTier !== 'none' && hasTierAccess) {
          // User has required tier - they can download for FREE
          const { data: canDownloadResult } = await supabase.rpc('check_download_limit', {
            p_user_id: user.id,
          });

          const { data: remainingResult } = await supabase.rpc('get_remaining_downloads', {
            p_user_id: user.id,
          });

          const hasUnlimitedDownloads = userPriority >= DONOR_PRIORITY.gold;

          if (!canDownloadResult && !hasUnlimitedDownloads) {
            return {
              canDownload: false,
              canInteract: true,
              reason: 'Достигнут дневной лимит скачиваний',
              userTier,
              requiredTier,
              remainingDownloads: 0,
              hasUnlimitedDownloads: false,
              needsPurchase: false,
              hasTierAccess: true,
              accessMode,
            };
          }

          return {
            canDownload: true,
            canInteract: true,
            reason: null,
            userTier,
            requiredTier,
            remainingDownloads: hasUnlimitedDownloads ? null : (remainingResult ?? 0),
            hasUnlimitedDownloads,
            needsPurchase: false,
            hasTierAccess: true,
            accessMode,
          };
        }

        // User doesn't have tier access - needs to purchase
        return {
          canDownload: false,
          canInteract: false, // Can't rate/comment without access
          reason: projectMinTier && projectMinTier !== 'none'
            ? `Требуется ${requiredTier} для бесплатного доступа или свяжитесь с продавцом`
            : 'Платный проект — свяжитесь с продавцом',
          userTier,
          requiredTier,
          remainingDownloads: null,
          hasUnlimitedDownloads: false,
          needsPurchase: true,
          hasTierAccess: false,
          accessMode,
        };
      }

      // For LEAK/FREE projects with min_donor_tier requirement
      if (projectMinTier && projectMinTier !== 'none') {
        if (!hasTierAccess) {
          return {
            canDownload: false,
            canInteract: false,
            reason: `Требуется ${requiredTier} или выше для доступа`,
            userTier,
            requiredTier,
            remainingDownloads: null,
            hasUnlimitedDownloads: false,
            needsPurchase: false,
            hasTierAccess: false,
            accessMode,
          };
        }
      }

      // Check daily download limit
      const { data: canDownloadResult } = await supabase.rpc('check_download_limit', {
        p_user_id: user.id,
      });

      const { data: remainingResult } = await supabase.rpc('get_remaining_downloads', {
        p_user_id: user.id,
      });

      // Gold+ has unlimited downloads
      const hasUnlimitedDownloads = userPriority >= DONOR_PRIORITY.gold;

      if (!canDownloadResult && !hasUnlimitedDownloads) {
        return {
          canDownload: false,
          canInteract: true,
          reason: 'Достигнут дневной лимит скачиваний',
          userTier,
          requiredTier,
          remainingDownloads: 0,
          hasUnlimitedDownloads: false,
          needsPurchase: false,
          hasTierAccess: true,
          accessMode,
        };
      }

      return {
        canDownload: true,
        canInteract: true,
        reason: null,
        userTier,
        requiredTier,
        remainingDownloads: hasUnlimitedDownloads ? null : (remainingResult ?? 0),
        hasUnlimitedDownloads,
        needsPurchase: false,
        hasTierAccess: true,
        accessMode,
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
