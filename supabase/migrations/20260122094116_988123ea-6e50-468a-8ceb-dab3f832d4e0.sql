-- Order (purchase) chat messages tied to purchase_requests
CREATE TABLE IF NOT EXISTS public.purchase_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_messages_request_id_created_at
  ON public.purchase_messages(request_id, created_at);

ALTER TABLE public.purchase_messages ENABLE ROW LEVEL SECURITY;

-- Allow staff (admin/mod/curator/owner) to view purchase requests too
DROP POLICY IF EXISTS "Buyers and sellers can view requests" ON public.purchase_requests;
CREATE POLICY "Requests viewable by participants and staff"
ON public.purchase_requests
FOR SELECT
USING (
  auth.uid() = buyer_id
  OR auth.uid() = seller_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR has_role(auth.uid(), 'curator'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Order chat: participants + staff can read messages
CREATE POLICY "Order messages viewable by participants and staff"
ON public.purchase_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.purchase_requests pr
    WHERE pr.id = purchase_messages.request_id
      AND (
        auth.uid() = pr.buyer_id
        OR auth.uid() = pr.seller_id
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'moderator'::app_role)
        OR has_role(auth.uid(), 'curator'::app_role)
        OR has_role(auth.uid(), 'owner'::app_role)
      )
  )
);

-- Order chat: participants + staff can send messages (sender must be auth user)
CREATE POLICY "Order messages sendable by participants and staff"
ON public.purchase_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.purchase_requests pr
    WHERE pr.id = purchase_messages.request_id
      AND (
        auth.uid() = pr.buyer_id
        OR auth.uid() = pr.seller_id
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'moderator'::app_role)
        OR has_role(auth.uid(), 'curator'::app_role)
        OR has_role(auth.uid(), 'owner'::app_role)
      )
  )
);

-- Realtime for order chat
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;