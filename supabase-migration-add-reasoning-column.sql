-- Migration to add reasoning column to messages table
-- Run this in your Supabase SQL Editor

-- Add reasoning column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reasoning TEXT;

-- Note: We don't create a B-tree index on reasoning content because reasoning text
-- can be very large (thousands of characters) and would exceed PostgreSQL's
-- B-tree index size limit (~2704 bytes), causing insertion errors.
-- Access reasoning content via message ID instead.

-- Optional: Create index for checking if messages have reasoning content
-- CREATE INDEX IF NOT EXISTS idx_messages_has_reasoning ON public.messages((reasoning IS NOT NULL))
-- WHERE reasoning IS NOT NULL;

-- Add comment to document the reasoning column
COMMENT ON COLUMN public.messages.reasoning IS 'Stores reasoning tokens from AI models that support transparent reasoning processes. Not indexed due to large content size - access via message ID instead.';
