-- Private messages table
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_pm_sender ON public.private_messages(sender_id);
CREATE INDEX idx_pm_receiver ON public.private_messages(receiver_id);
CREATE INDEX idx_pm_created ON public.private_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages (sent or received)
CREATE POLICY "Users can view own messages"
ON public.private_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Moderators can view all messages
CREATE POLICY "Moderators can view all messages"
ON public.private_messages FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.private_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can delete own messages
CREATE POLICY "Users can delete own messages"
ON public.private_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Profile subscriptions (followers)
CREATE TABLE public.profile_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.profile_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view subscriptions"
ON public.profile_subscriptions FOR SELECT
USING (true);

CREATE POLICY "Users can subscribe"
ON public.profile_subscriptions FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unsubscribe"
ON public.profile_subscriptions FOR DELETE
USING (auth.uid() = follower_id);

-- Profile wall posts
CREATE TABLE public.profile_wall_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_wall_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view wall posts"
ON public.profile_wall_posts FOR SELECT
USING (true);

CREATE POLICY "Users can write on walls"
ON public.profile_wall_posts FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts or from own wall"
ON public.profile_wall_posts FOR DELETE
USING (auth.uid() = author_id OR auth.uid() = profile_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Profile ratings (reputation)
CREATE TABLE public.profile_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  is_positive BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, rater_id)
);

ALTER TABLE public.profile_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view ratings"
ON public.profile_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can rate profiles"
ON public.profile_ratings FOR INSERT
WITH CHECK (auth.uid() = rater_id AND auth.uid() != profile_id);

CREATE POLICY "Users can change own ratings"
ON public.profile_ratings FOR UPDATE
USING (auth.uid() = rater_id);

CREATE POLICY "Users can delete own ratings"
ON public.profile_ratings FOR DELETE
USING (auth.uid() = rater_id);

-- Online users tracking
CREATE TABLE public.online_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  last_ping TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view online users"
ON public.online_users FOR SELECT
USING (true);

CREATE POLICY "Users can update own status"
ON public.online_users FOR ALL
USING (auth.uid() = user_id);

-- Blocked words for anti-spam
CREATE TABLE public.blocked_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view blocked words"
ON public.blocked_words FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage blocked words"
ON public.blocked_words FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert some common spam words
INSERT INTO public.blocked_words (word) VALUES 
  ('discord.gg'),
  ('t.me/joinchat'),
  ('bit.ly'),
  ('tinyurl.com');

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_users;