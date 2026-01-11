-- Allow unauthenticated users to look up email by username for login
CREATE POLICY "Allow email lookup by username for login"
ON public.profiles
FOR SELECT
TO anon
USING (true);