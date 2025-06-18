-- ChadLLM (T3 Chat Cloneathon) - Complete Supabase Database Setup
-- This script sets up the complete database schema for ChadLLM
-- Run this entire script in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Create workspaces table (for hierarchical organization)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#8B5CF6',
    icon TEXT DEFAULT 'folder',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table (for organizing chats within workspaces)
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#8B5CF6',
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    model_id TEXT NOT NULL,
    pinned BOOLEAN DEFAULT FALSE,
    pinned_at TIMESTAMP WITH TIME ZONE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    reasoning TEXT,
    annotations JSONB DEFAULT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_complete BOOLEAN DEFAULT TRUE,
    generation_id TEXT
);

-- Create shared_chats table (for public chat sharing)
CREATE TABLE IF NOT EXISTS public.shared_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_id TEXT UNIQUE NOT NULL,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Workspace indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_updated_at ON public.workspaces(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_default ON public.workspaces(user_id, is_default) WHERE is_default = TRUE;

-- Folder indexes
CREATE INDEX IF NOT EXISTS idx_folders_workspace_id ON public.folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_updated_at ON public.folders(updated_at DESC);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_pinned ON public.chats(pinned, pinned_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_workspace_id ON public.chats(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chats_folder_id ON public.chats(folder_id);
CREATE INDEX IF NOT EXISTS idx_chats_organization ON public.chats(user_id, workspace_id, folder_id);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON public.messages USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_messages_annotations ON public.messages USING GIN (annotations) WHERE annotations IS NOT NULL;

-- Shared chat indexes
CREATE INDEX IF NOT EXISTS idx_shared_chats_share_id ON public.shared_chats(share_id);
CREATE INDEX IF NOT EXISTS idx_shared_chats_chat_id ON public.shared_chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_shared_chats_created_by ON public.shared_chats(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_chats_expires_at ON public.shared_chats(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_chats ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view their own workspaces" ON public.workspaces
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workspaces" ON public.workspaces
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workspaces" ON public.workspaces
    FOR DELETE USING (auth.uid() = user_id);

-- Folder policies
CREATE POLICY "Users can view their own folders" ON public.folders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own folders" ON public.folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.folders
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.folders
    FOR DELETE USING (auth.uid() = user_id);

-- Chat policies
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chats" ON public.chats
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chats" ON public.chats
    FOR DELETE USING (auth.uid() = user_id);

-- Message policies
CREATE POLICY "Users can view messages from their chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND chats.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert messages to their chats" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND chats.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update messages in their chats" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND chats.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete messages from their chats" ON public.messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = messages.chat_id 
            AND chats.user_id = auth.uid()
        )
    );

-- Shared chat policies
CREATE POLICY "Anyone can view valid public shared chats" ON public.shared_chats
    FOR SELECT USING (
        is_public = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );
CREATE POLICY "Users can view their own shared chats" ON public.shared_chats
    FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can share their own chats" ON public.shared_chats
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = shared_chats.chat_id 
            AND chats.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own shared chats" ON public.shared_chats
    FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own shared chats" ON public.shared_chats
    FOR DELETE USING (auth.uid() = created_by);

-- Allow public access to messages from shared chats
CREATE POLICY "Anyone can view messages from valid shared chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shared_chats sc
            WHERE sc.chat_id = messages.chat_id
            AND sc.is_public = true
            AND (sc.expires_at IS NULL OR sc.expires_at > NOW())
        )
    );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update chat's updated_at when messages are added/updated
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.chat_id, OLD.chat_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Function to ensure only one default workspace per user
CREATE OR REPLACE FUNCTION ensure_single_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE public.workspaces
        SET is_default = FALSE
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update workspace/folder timestamps when chats are modified
CREATE OR REPLACE FUNCTION update_organization_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF COALESCE(NEW.folder_id, OLD.folder_id) IS NOT NULL THEN
        UPDATE public.folders
        SET updated_at = NOW()
        WHERE id = COALESCE(NEW.folder_id, OLD.folder_id);
    END IF;

    IF COALESCE(NEW.workspace_id, OLD.workspace_id) IS NOT NULL THEN
        UPDATE public.workspaces
        SET updated_at = NOW()
        WHERE id = COALESCE(NEW.workspace_id, OLD.workspace_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Function to generate unique share IDs
CREATE OR REPLACE FUNCTION generate_share_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    char_index INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        char_index := floor(random() * length(chars) + 1);
        result := result || substr(chars, char_index, 1);
    END LOOP;

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

-- Function to increment share view count
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

-- Function to get shared chat with messages (bypasses RLS)
CREATE OR REPLACE FUNCTION get_shared_chat_with_messages(share_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    shared_chat_record RECORD;
    messages_json JSON;
    result JSON;
BEGIN
    SELECT * INTO shared_chat_record
    FROM public.shared_chats
    WHERE share_id = share_id_param
    AND is_public = true
    AND (expires_at IS NULL OR expires_at > NOW());

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Triggers for updated_at timestamps
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_chats_updated_at
    BEFORE UPDATE ON public.shared_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for chat timestamp updates
CREATE TRIGGER update_chat_on_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_timestamp();

CREATE TRIGGER update_chat_on_message_update
    AFTER UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_timestamp();

-- Trigger for single default workspace
CREATE TRIGGER ensure_single_default_workspace_trigger
    BEFORE INSERT OR UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_workspace();

-- Triggers for organization timestamps
CREATE TRIGGER update_organization_on_chat_insert
    AFTER INSERT ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_timestamps();

CREATE TRIGGER update_organization_on_chat_update
    AFTER UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_timestamps();

-- ============================================================================
-- VIEWS AND PERMISSIONS
-- ============================================================================

-- Create view for public shared chat access
CREATE OR REPLACE VIEW public.public_shared_chats AS
SELECT
    sc.share_id,
    sc.title,
    sc.is_public,
    sc.expires_at,
    sc.view_count,
    sc.created_at,
    c.model_id,
    c.id as chat_id
FROM public.shared_chats sc
JOIN public.chats c ON sc.chat_id = c.id
WHERE
    sc.is_public = true
    AND (sc.expires_at IS NULL OR sc.expires_at > NOW());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.workspaces TO authenticated;
GRANT ALL ON public.folders TO authenticated;
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.shared_chats TO authenticated;
GRANT SELECT ON public.public_shared_chats TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_share_id() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_share_view_count(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_chat_with_messages(TEXT) TO anon, authenticated;

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Create default workspace for existing users (if any)
DO $$
DECLARE
    user_record RECORD;
    default_workspace_id UUID;
BEGIN
    FOR user_record IN
        SELECT DISTINCT user_id FROM public.chats
    LOOP
        INSERT INTO public.workspaces (user_id, name, description, is_default)
        VALUES (
            user_record.user_id,
            'Default Workspace',
            'Your default workspace for organizing chats',
            TRUE
        )
        RETURNING id INTO default_workspace_id;

        UPDATE public.chats
        SET workspace_id = default_workspace_id
        WHERE user_id = user_record.user_id AND workspace_id IS NULL;
    END LOOP;
END $$;

-- Add helpful comments
COMMENT ON TABLE public.workspaces IS 'Workspaces for hierarchical chat organization';
COMMENT ON TABLE public.folders IS 'Folders within workspaces for grouping chats';
COMMENT ON TABLE public.chats IS 'User chat conversations with AI models';
COMMENT ON TABLE public.messages IS 'Individual messages within chat conversations';
COMMENT ON TABLE public.shared_chats IS 'Public sharing configuration for chats';

COMMENT ON COLUMN public.messages.reasoning IS 'AI reasoning tokens for transparent thinking models';
COMMENT ON COLUMN public.messages.annotations IS 'Web search annotations from OpenRouter API';
COMMENT ON COLUMN public.messages.attachments IS 'File attachments (images, PDFs) with base64 data';

-- Setup complete!
-- Your ChadLLM database is now ready to use.
