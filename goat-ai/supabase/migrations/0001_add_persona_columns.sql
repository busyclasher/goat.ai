-- Add style_bullets and sources columns to personas table
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS style_bullets JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]';
