-- Migration to add chat sharing functionality
-- Run this in your Supabase SQL Editor

-- Create shared_chats table
CREATE TABLE IF NOT EXISTS public.shared_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_id TEXT UNIQUE NOT NULL, -- Public identifier for the share (shorter, URL-friendly)
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- Cached title for performance
    is_public BOOLEAN DEFAULT TRUE,
    password_hash TEXT, -- Hashed password for protected shares
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
    view_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_chats_share_id ON public.shared_chats(share_id);
CREATE INDEX IF NOT EXISTS idx_shared_chats_chat_id ON public.shared_chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_shared_chats_created_by ON public.shared_chats(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_chats_expires_at ON public.shared_chats(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.shared_chats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shared_chats table

-- Policy for viewing shared chats (public access for valid shares)
CREATE POLICY "Anyone can view valid public shared chats" ON public.shared_chats
    FOR SELECT USING (
        is_public = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Policy for viewing own shared chats (creators can always see their shares)
CREATE POLICY "Users can view their own shared chats" ON public.shared_chats
    FOR SELECT USING (auth.uid() = created_by);

-- Policy for creating shared chats (only chat owners can share their chats)
CREATE POLICY "Users can share their own chats" ON public.shared_chats
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = shared_chats.chat_id 
            AND chats.user_id = auth.uid()
        )
    );

-- Policy for updating shared chats (only creators can update)
CREATE POLICY "Users can update their own shared chats" ON public.shared_chats
    FOR UPDATE USING (auth.uid() = created_by);

-- Policy for deleting shared chats (only creators can delete)
CREATE POLICY "Users can delete their own shared chats" ON public.shared_chats
    FOR DELETE USING (auth.uid() = created_by);

-- Create a view for public shared chat access (without sensitive data)
CREATE OR REPLACE VIEW public.public_shared_chats AS
SELECT 
    sc.share_id,
    sc.title,
    sc.is_public,
    sc.expires_at,
    sc.view_count,
    sc.created_at,
    c.model_id,
    -- Only include non-sensitive chat data
    c.id as chat_id
FROM public.shared_chats sc
JOIN public.chats c ON sc.chat_id = c.id
WHERE 
    sc.is_public = true 
    AND (sc.expires_at IS NULL OR sc.expires_at > NOW());

-- Grant permissions
GRANT SELECT ON public.public_shared_chats TO anon, authenticated;
GRANT ALL ON public.shared_chats TO authenticated;

-- Create function to generate unique share IDs
CREATE OR REPLACE FUNCTION generate_share_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    char_index INTEGER;
BEGIN
    -- Generate 12 character random string
    FOR i IN 1..12 LOOP
        char_index := floor(random() * length(chars) + 1);
        result := result || substr(chars, char_index, 1);
    END LOOP;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.shared_chats WHERE share_id = result) LOOP
        result := '';
        FOR i IN 1..12 LOOP
            char_index := floor(random() * length(chars) + 1);
            result := result || substr(chars, char_index, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to update view count
CREATE OR REPLACE FUNCTION increment_share_view_count(share_id_param TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.shared_chats 
    SET 
        view_count = view_count + 1,
        last_accessed_at = NOW()
    WHERE share_id = share_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get shared chat with messages (bypasses RLS)
CREATE OR REPLACE FUNCTION get_shared_chat_with_messages(share_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    shared_chat_record RECORD;
    messages_json JSON;
    result JSON;
BEGIN
    -- Get the shared chat record
    SELECT * INTO shared_chat_record
    FROM public.shared_chats
    WHERE share_id = share_id_param
    AND is_public = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- If no valid shared chat found, return null
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Get messages for this chat (bypassing RLS)
    SELECT json_agg(
        json_build_object(
            'id', m.id,
            'chat_id', m.chat_id,
            'role', m.role,
            'content', m.content,
            'model', m.model,
            'created_at', m.created_at,
            'is_complete', m.is_complete,
            'generation_id', m.generation_id,
            'reasoning', m.reasoning,
            'annotations', m.annotations,
            'attachments', m.attachments
        ) ORDER BY m.created_at ASC
    ) INTO messages_json
    FROM public.messages m
    WHERE m.chat_id = shared_chat_record.chat_id;
    
    -- Build the result
    SELECT json_build_object(
        'id', shared_chat_record.id,
        'share_id', shared_chat_record.share_id,
        'chat_id', shared_chat_record.chat_id,
        'created_by', shared_chat_record.created_by,
        'title', shared_chat_record.title,
        'is_public', shared_chat_record.is_public,
        'password_hash', shared_chat_record.password_hash,
        'expires_at', shared_chat_record.expires_at,
        'view_count', shared_chat_record.view_count,
        'last_accessed_at', shared_chat_record.last_accessed_at,
        'created_at', shared_chat_record.created_at,
        'updated_at', shared_chat_record.updated_at,
        'messages', COALESCE(messages_json, '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION generate_share_id() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_share_view_count(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_chat_with_messages(TEXT) TO anon, authenticated;

-- Add RLS policy to allow public access to messages from shared chats
CREATE POLICY "Anyone can view messages from valid shared chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shared_chats sc
            WHERE sc.chat_id = messages.chat_id
            AND sc.is_public = true
            AND (sc.expires_at IS NULL OR sc.expires_at > NOW())
        )
    );

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shared_chats_updated_at
    BEFORE UPDATE ON public.shared_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_chats_updated_at();
