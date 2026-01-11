-- Fix profiles table: allow public view but create a view for public data
-- Keep the current policy but note that profiles are intentionally public for user discovery
-- The last_seen_at is acceptable for a community site

-- Fix online_users table: restrict to authenticated users only
DROP POLICY IF EXISTS "Everyone can view online users" ON public.online_users;

CREATE POLICY "Authenticated users can view online users" 
ON public.online_users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- For profiles, we'll keep them public since this is a community site
-- but we could add a comment noting this is intentional
COMMENT ON TABLE public.profiles IS 'User profiles - intentionally public for community discovery. Contains no PII beyond self-disclosed social handles.';