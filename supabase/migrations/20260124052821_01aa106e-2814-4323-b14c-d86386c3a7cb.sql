-- Create public chat table for global player chat
CREATE TABLE public.public_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages
CREATE POLICY "Anyone can view public chat messages"
ON public.public_chat_messages
FOR SELECT
USING (true);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
ON public.public_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages, staff can delete any
CREATE POLICY "Users can delete own messages or staff can delete any"
ON public.public_chat_messages
FOR DELETE
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'moderator') 
  OR public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'owner')
);

-- Enable realtime for public chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_chat_messages;