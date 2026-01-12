-- Add profile customization columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_primary_color text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS profile_accent_color text DEFAULT NULL;

-- Create emojis table for custom site emojis
CREATE TABLE IF NOT EXISTS public.emojis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcode text NOT NULL UNIQUE,
  image_url text NOT NULL,
  is_animated boolean DEFAULT false,
  category text DEFAULT 'general',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on emojis
ALTER TABLE public.emojis ENABLE ROW LEVEL SECURITY;

-- Everyone can view emojis
CREATE POLICY "Anyone can view emojis"
ON public.emojis FOR SELECT
USING (true);

-- Only admins/owners can manage emojis
CREATE POLICY "Admins can insert emojis"
ON public.emojis FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Admins can update emojis"
ON public.emojis FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Admins can delete emojis"
ON public.emojis FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
);

-- Create function to get role priority for hierarchy checks
CREATE OR REPLACE FUNCTION public.get_role_priority(role_name app_role)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE role_name
    WHEN 'owner' THEN 100
    WHEN 'admin' THEN 90
    WHEN 'curator' THEN 80
    WHEN 'moderator' THEN 70
    WHEN 'developer' THEN 60
    WHEN 'player' THEN 50
    WHEN 'user' THEN 10
    ELSE 0
  END
$$;

-- Create function to get donor tier priority
CREATE OR REPLACE FUNCTION public.get_donor_priority(tier donor_tier)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE tier
    WHEN 'sponsor' THEN 50
    WHEN 'diamond' THEN 40
    WHEN 'gold' THEN 30
    WHEN 'silver' THEN 20
    WHEN 'iron' THEN 15
    WHEN 'bronze' THEN 10
    WHEN 'none' THEN 0
    ELSE 0
  END
$$;

-- Create function to check if user has higher or equal role
CREATE OR REPLACE FUNCTION public.has_higher_role(_user_id uuid, _target_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND public.get_role_priority(ur.role) >= public.get_role_priority(_target_role)
  )
$$;

-- Create storage bucket for profile banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for banners bucket (check if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view banners' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can view banners"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'banners');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload their own banner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload their own banner"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'banners' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own banner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update their own banner"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'banners' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own banner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete their own banner"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'banners' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;