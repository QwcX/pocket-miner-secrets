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

      // Check tier access for paid/leak projects with min_donor_tier
      if (projectMinTier && projectMinTier !== 'none') {
        if (userPriority < requiredPriority) {
          return {
            canDownload: false,
            canInteract: false, // Can't interact if no access
            reason: `Требуется ${requiredTier} или выше для доступа`,
            userTier,
            requiredTier,
            remainingDownloads: null,
            hasUnlimitedDownloads: false,
          };
        }
      }

      // For paid projects, check if user has purchased
      if (projectPriceType === 'paid') {
        // User can see and interact, but download is through purchase flow
        return {
          canDownload: false, // Needs to buy
          canInteract: true, // Can rate/comment after viewing
          reason: 'Платный проект — свяжитесь с продавцом',
          userTier,
          requiredTier,
          remainingDownloads: null,
          hasUnlimitedDownloads: false,
        };
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
          canInteract: true, // Can still rate/comment
          reason: 'Достигнут дневной лимит скачиваний',
          userTier,
          requiredTier,
          remainingDownloads: 0,
          hasUnlimitedDownloads: false,
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
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
