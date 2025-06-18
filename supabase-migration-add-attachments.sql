-- Migration: Add attachments column to messages table
-- This allows storing file attachments (images, PDFs) as JSONB array

-- Add attachments column to messages table
ALTER TABLE public.messages 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.messages.attachments IS 'Array of file attachments (images, PDFs) stored as JSONB with metadata and base64 data';

-- Create index for better query performance on attachments
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON public.messages USING GIN (attachments);

-- Update RLS policies if needed (attachments should follow same rules as messages)
-- No additional RLS changes needed as attachments are part of messages
