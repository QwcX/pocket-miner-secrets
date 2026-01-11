-- Security fix: remove public email storage from profiles (PII)
DO $$
BEGIN
  -- Drop policy created earlier if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles'
      AND policyname = 'Allow email lookup by username for login'
  ) THEN
    EXECUTE 'DROP POLICY "Allow email lookup by username for login" ON public.profiles';
  END IF;
END $$;

-- Drop index if it exists
DROP INDEX IF EXISTS public.idx_profiles_email;

-- Remove email column if it exists
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update handle_new_user to not store email in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;