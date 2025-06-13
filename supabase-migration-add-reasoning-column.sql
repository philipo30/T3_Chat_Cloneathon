-- Migration to add reasoning column to messages table
-- Run this in your Supabase SQL Editor

-- Add reasoning column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reasoning TEXT;

-- Create index for better performance when querying messages with reasoning
CREATE INDEX IF NOT EXISTS idx_messages_reasoning ON public.messages(reasoning) 
WHERE reasoning IS NOT NULL;

-- Add comment to document the reasoning column
COMMENT ON COLUMN public.messages.reasoning IS 'Stores reasoning tokens from AI models that support transparent reasoning processes';
