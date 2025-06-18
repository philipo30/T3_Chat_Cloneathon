-- Migration to add pinned functionality to existing chats table
-- Run this if you already have an existing chats table

-- Add pinned columns to chats table
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

-- Create index for pinned chats
CREATE INDEX IF NOT EXISTS idx_chats_pinned ON public.chats(pinned, pinned_at DESC);

-- Update any existing pinned chats (if you want to set some as pinned by default)
-- Uncomment and modify as needed:
-- UPDATE public.chats SET pinned = TRUE, pinned_at = NOW() WHERE title LIKE '%important%';
