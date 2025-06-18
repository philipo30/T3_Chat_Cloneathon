-- Migration to add annotations column to messages table for web search results
-- Run this in your Supabase SQL Editor

-- Add annotations column to store web search annotations as JSONB
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.messages.annotations IS 'Web search annotations from OpenRouter API responses, stored as JSONB array';

-- Create a GIN index on annotations for better query performance when filtering by web search results
-- GIN indexes are optimal for JSONB data and support various JSON operators
CREATE INDEX IF NOT EXISTS idx_messages_annotations
ON public.messages USING GIN (annotations)
WHERE annotations IS NOT NULL;

-- Note: The existing triggers will automatically handle updating chat timestamps
-- when annotations are added/modified, so no additional trigger changes needed.
