-- Тип для донат-уровней
CREATE TYPE public.donor_tier AS ENUM ('none', 'bronze', 'silver', 'gold', 'diamond', 'sponsor');

-- Таблица репутации пользователей  
CREATE TABLE public.user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Таблица истории изменений репутации
CREATE TABLE public.reputation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  given_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица донат-статусов пользователей
CREATE TABLE public.user_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier donor_tier NOT NULL DEFAULT 'none',
  nickname_color TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Таблица логов модерации
CREATE TABLE public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  reason TEXT,
  project_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- RLS для user_reputation
CREATE POLICY "Everyone can view reputation"
ON public.user_reputation FOR SELECT USING (true);

CREATE POLICY "Only admins can modify reputation"
ON public.user_reputation FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- RLS для reputation_history
CREATE POLICY "Everyone can view reputation history"
ON public.reputation_history FOR SELECT USING (true);

CREATE POLICY "Admins can insert reputation history"
ON public.reputation_history FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- RLS для user_donors
CREATE POLICY "Everyone can view donor status"
ON public.user_donors FOR SELECT USING (true);

CREATE POLICY "Only admins can modify donor status"
ON public.user_donors FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS для moderation_logs
CREATE POLICY "Admins and moderators can view logs"
ON public.moderation_logs FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'curator'));

CREATE POLICY "Moderators can insert logs"
ON public.moderation_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Функция для получения общей репутации пользователя
CREATE OR REPLACE FUNCTION public.get_user_reputation(user_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(points, 0)
  FROM public.user_reputation
  WHERE user_id = user_uuid
$$;

-- Функция для получения донат-статуса пользователя
CREATE OR REPLACE FUNCTION public.get_user_donor_tier(user_uuid UUID)
RETURNS donor_tier
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.user_donors WHERE user_id = user_uuid AND (expires_at IS NULL OR expires_at > now())),
    'none'::donor_tier
  )
$$;