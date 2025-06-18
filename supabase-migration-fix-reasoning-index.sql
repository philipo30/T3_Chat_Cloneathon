-- Migration to fix reasoning column index issue
-- Run this in your Supabase SQL Editor

-- Drop the problematic B-tree index on reasoning column
-- This index causes errors when reasoning text exceeds ~2704 bytes
-- which is common for reasoning tokens that can be thousands of characters long
DROP INDEX IF EXISTS idx_messages_reasoning;

-- Add comment explaining why we don't index reasoning content
COMMENT ON COLUMN public.messages.reasoning IS 'Stores reasoning tokens from AI models that support transparent reasoning processes. Not indexed due to large content size - access via message ID instead.';

-- Optional: If you need to search for messages that have reasoning content,
-- you can create a partial index on a boolean expression instead:
-- CREATE INDEX IF NOT EXISTS idx_messages_has_reasoning ON public.messages((reasoning IS NOT NULL))
-- WHERE reasoning IS NOT NULL;

-- This approach indexes only the presence of reasoning, not the content itself
-- which avoids the size limitation while still allowing efficient queries
-- for "messages with reasoning" vs "messages without reasoning"
