-- Add new content types: build, config
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'build';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'config';

-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'player';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'curator';

-- Add download_url column to projects for external links
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS download_url TEXT;