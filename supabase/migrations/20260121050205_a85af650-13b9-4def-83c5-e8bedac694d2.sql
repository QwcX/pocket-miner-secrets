-- Forum questions table
CREATE TABLE public.forum_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_solved BOOLEAN NOT NULL DEFAULT false,
  solution_id UUID,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forum answers table
CREATE TABLE public.forum_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Answer votes table (for reputation)
CREATE TABLE public.forum_answer_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES public.forum_answers(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(answer_id, voter_id)
);

-- Add foreign key for solution
ALTER TABLE public.forum_questions 
ADD CONSTRAINT forum_questions_solution_id_fkey 
FOREIGN KEY (solution_id) REFERENCES public.forum_answers(id) ON DELETE SET NULL;

-- Daily download tracking
CREATE TABLE public.user_daily_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  download_date DATE NOT NULL DEFAULT CURRENT_DATE,
  download_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, download_date)
);

-- Add price_type to projects (leak/free/paid + min_donor_tier)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'free' CHECK (price_type IN ('leak', 'free', 'paid')),
ADD COLUMN IF NOT EXISTS min_donor_tier TEXT DEFAULT 'none';

-- Purchase requests for paid projects
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  message TEXT,
  referral_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answer_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Forum questions policies
CREATE POLICY "Everyone can view questions" ON public.forum_questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create questions" ON public.forum_questions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own questions" ON public.forum_questions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors and mods can delete questions" ON public.forum_questions FOR DELETE USING (auth.uid() = author_id OR has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Forum answers policies  
CREATE POLICY "Everyone can view answers" ON public.forum_answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create answers" ON public.forum_answers FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own answers" ON public.forum_answers FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors and mods can delete answers" ON public.forum_answers FOR DELETE USING (auth.uid() = author_id OR has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Forum votes policies
CREATE POLICY "Everyone can view votes" ON public.forum_answer_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.forum_answer_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Users can change own votes" ON public.forum_answer_votes FOR UPDATE USING (auth.uid() = voter_id);
CREATE POLICY "Users can remove own votes" ON public.forum_answer_votes FOR DELETE USING (auth.uid() = voter_id);

-- Daily downloads policies
CREATE POLICY "Users can view own downloads" ON public.user_daily_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can track downloads" ON public.user_daily_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update downloads" ON public.user_daily_downloads FOR UPDATE USING (auth.uid() = user_id);

-- Purchase requests policies
CREATE POLICY "Buyers and sellers can view requests" ON public.purchase_requests FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Authenticated users can create requests" ON public.purchase_requests FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update request status" ON public.purchase_requests FOR UPDATE USING (auth.uid() = seller_id);

-- Triggers for updated_at
CREATE TRIGGER update_forum_questions_updated_at BEFORE UPDATE ON public.forum_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_answers_updated_at BEFORE UPDATE ON public.forum_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check download limit
CREATE OR REPLACE FUNCTION public.check_download_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier donor_tier;
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  -- Get user's donor tier
  SELECT COALESCE(
    (SELECT tier FROM user_donors WHERE user_id = p_user_id AND (expires_at IS NULL OR expires_at > now())),
    'none'::donor_tier
  ) INTO v_tier;
  
  -- Set limits based on tier
  v_limit := CASE 
    WHEN v_tier IN ('gold', 'diamond', 'emerald', 'sponsor') THEN -1 -- unlimited
    WHEN v_tier IN ('bronze', 'silver') THEN 25
    WHEN v_tier = 'iron' THEN 15
    ELSE 10
  END;
  
  -- If unlimited, allow
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get today's download count
  SELECT COALESCE(download_count, 0) INTO v_count
  FROM user_daily_downloads
  WHERE user_id = p_user_id AND download_date = CURRENT_DATE;
  
  RETURN COALESCE(v_count, 0) < v_limit;
END;
$$;

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_daily_downloads (user_id, download_date, download_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, download_date)
  DO UPDATE SET download_count = user_daily_downloads.download_count + 1;
END;
$$;

-- Function to get remaining downloads
CREATE OR REPLACE FUNCTION public.get_remaining_downloads(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_tier donor_tier;
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  SELECT COALESCE(
    (SELECT tier FROM user_donors WHERE user_id = p_user_id AND (expires_at IS NULL OR expires_at > now())),
    'none'::donor_tier
  ) INTO v_tier;
  
  v_limit := CASE 
    WHEN v_tier IN ('gold', 'diamond', 'emerald', 'sponsor') THEN -1
    WHEN v_tier IN ('bronze', 'silver') THEN 25
    WHEN v_tier = 'iron' THEN 15
    ELSE 10
  END;
  
  IF v_limit = -1 THEN
    RETURN -1;
  END IF;
  
  SELECT COALESCE(download_count, 0) INTO v_count
  FROM user_daily_downloads
  WHERE user_id = p_user_id AND download_date = CURRENT_DATE;
  
  RETURN v_limit - COALESCE(v_count, 0);
END;
$$;

-- Enable realtime for forum
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_answers;