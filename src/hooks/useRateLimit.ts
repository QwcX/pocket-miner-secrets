import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { DonorTier } from '@/types/database';
import { getRateLimitMultiplier } from '@/lib/donorBenefits';

interface RateLimitOptions {
  actionType: string;
  maxRequests?: number;
  windowSeconds?: number;
}

export function useRateLimit() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's donor tier for rate limit calculation
  const { data: donorData } = useQuery({
    queryKey: ['donor-tier-for-rate-limit', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_donors')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const donorTier: DonorTier = (donorData?.tier as DonorTier) || 'none';
  const rateLimitMultiplier = getRateLimitMultiplier(donorTier);

  const checkRateLimit = async ({
    actionType,
    maxRequests = 10,
    windowSeconds = 60,
  }: RateLimitOptions): Promise<boolean> => {
    // Use user ID if logged in, otherwise use a fingerprint-like identifier
    const identifier = user?.id || 'anon-' + Date.now().toString(36);

    // Apply donor tier multiplier - donors get more requests in the same window
    const adjustedMaxRequests = Math.ceil(maxRequests / rateLimitMultiplier);

    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action_type: actionType,
      p_max_requests: adjustedMaxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error to not block legitimate users
    }

    if (!data) {
      const tierMessage = donorTier !== 'none' 
        ? ` (${donorTier}: +${Math.round((1/rateLimitMultiplier - 1) * 100)}% лимит)`
        : ' (получите донат для увеличенных лимитов)';
      toast({
        title: 'Слишком много запросов',
        description: `Подождите перед следующим действием${tierMessage}`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  return { checkRateLimit, donorTier, rateLimitMultiplier };
}
