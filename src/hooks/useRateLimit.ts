import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface RateLimitOptions {
  actionType: string;
  maxRequests?: number;
  windowSeconds?: number;
}

export function useRateLimit() {
  const { user } = useAuth();
  const { toast } = useToast();

  const checkRateLimit = async ({
    actionType,
    maxRequests = 10,
    windowSeconds = 60,
  }: RateLimitOptions): Promise<boolean> => {
    // Use user ID if logged in, otherwise use a fingerprint-like identifier
    const identifier = user?.id || 'anon-' + Date.now().toString(36);

    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action_type: actionType,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error to not block legitimate users
    }

    if (!data) {
      toast({
        title: 'Слишком много запросов',
        description: `Подождите перед следующим действием`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  return { checkRateLimit };
}
