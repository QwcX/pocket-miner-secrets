-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  priority INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_tier donor_tier NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create support ticket messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_bot_response BOOLEAN NOT NULL DEFAULT false,
  is_system_message BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can create their own tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderators can update tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages of their tickets" 
ON public.support_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t 
    WHERE t.id = ticket_id 
    AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  )
);

CREATE POLICY "Users can send messages to their tickets" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets t 
    WHERE t.id = ticket_id 
    AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- Create trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get ticket priority based on donor tier
CREATE OR REPLACE FUNCTION public.get_ticket_priority(tier donor_tier)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE tier
    WHEN 'sponsor' THEN 100
    WHEN 'emerald' THEN 80
    WHEN 'diamond' THEN 60
    WHEN 'gold' THEN 40
    WHEN 'silver' THEN 20
    WHEN 'bronze' THEN 15
    WHEN 'iron' THEN 10
    WHEN 'none' THEN 0
    ELSE 0
  END
$$;