-- Add access_mode column to projects for paid content
-- 'tier_or_purchase' = donor tier grants free access, otherwise must purchase
-- 'purchase_only' = must always purchase, donor tier doesn't help
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'tier_or_purchase' 
CHECK (access_mode IN ('tier_or_purchase', 'purchase_only'));

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images', 
  'chat-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for chat images - authenticated users can upload
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid() IS NOT NULL
);

-- Anyone can view chat images (public bucket)
CREATE POLICY "Anyone can view chat images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-images');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own chat images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add image_url column to public_chat_messages for attached images
ALTER TABLE public.public_chat_messages
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to purchase_messages for attached images  
ALTER TABLE public.purchase_messages
ADD COLUMN IF NOT EXISTS image_url TEXT;