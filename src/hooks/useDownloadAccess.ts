import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DonorTier, DONOR_PRIORITY } from '@/types/database';

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
}

export function useDownloadAccess(
  projectPriceType: string | undefined,
  projectMinTier: string | null | undefined
) {
  const { user } = useAuth();

  return useQuery<DownloadAccessResult>({
    queryKey: ['download-access', user?.id, projectPriceType, projectMinTier],
    queryFn: async () => {
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

      // For PAID projects: check if user has tier access OR needs to purchase
      if (projectPriceType === 'paid') {
        // If user has required tier - they can download for FREE
        if (projectMinTier && projectMinTier !== 'none' && hasTierAccess) {
          // Check daily download limit
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
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
