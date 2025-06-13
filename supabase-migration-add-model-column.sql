-- Migration to add model column to messages table
-- Run this in your Supabase SQL Editor

-- Add model column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS model TEXT;

-- Create index for better performance when querying by model
CREATE INDEX IF NOT EXISTS idx_messages_model ON public.messages(model);

-- Update existing messages to use the chat's model_id as default
UPDATE public.messages 
SET model = (
  SELECT chats.model_id 
  FROM public.chats 
  WHERE chats.id = messages.chat_id
)
WHERE model IS NULL;
