-- Migration to add hierarchical organization with workspaces and folders
-- Run this in your Supabase SQL Editor

-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#8B5CF6', -- Default purple color
    icon TEXT DEFAULT 'folder', -- Icon identifier
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#8B5CF6', -- Default purple color
    icon TEXT DEFAULT 'folder', -- Icon identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add workspace_id and folder_id to chats table
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_updated_at ON public.workspaces(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_default ON public.workspaces(user_id, is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_folders_workspace_id ON public.folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_updated_at ON public.folders(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chats_workspace_id ON public.chats(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chats_folder_id ON public.chats(folder_id);
CREATE INDEX IF NOT EXISTS idx_chats_organization ON public.chats(user_id, workspace_id, folder_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspaces table
CREATE POLICY "Users can view their own workspaces" ON public.workspaces
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces" ON public.workspaces
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces" ON public.workspaces
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for folders table
CREATE POLICY "Users can view their own folders" ON public.folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON public.folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON public.folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON public.folders
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to ensure only one default workspace per user
CREATE OR REPLACE FUNCTION ensure_single_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a workspace as default, unset all other defaults for this user
    IF NEW.is_default = TRUE THEN
        UPDATE public.workspaces 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to ensure single default workspace
CREATE TRIGGER ensure_single_default_workspace_trigger
    BEFORE INSERT OR UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_workspace();

-- Create function to update workspace/folder timestamps when chats are modified
CREATE OR REPLACE FUNCTION update_organization_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Update folder timestamp if chat belongs to a folder
    IF COALESCE(NEW.folder_id, OLD.folder_id) IS NOT NULL THEN
        UPDATE public.folders 
        SET updated_at = NOW() 
        WHERE id = COALESCE(NEW.folder_id, OLD.folder_id);
    END IF;
    
    -- Update workspace timestamp if chat belongs to a workspace
    IF COALESCE(NEW.workspace_id, OLD.workspace_id) IS NOT NULL THEN
        UPDATE public.workspaces 
        SET updated_at = NOW() 
        WHERE id = COALESCE(NEW.workspace_id, OLD.workspace_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to update organization timestamps
CREATE TRIGGER update_organization_on_chat_insert
    AFTER INSERT ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_timestamps();

CREATE TRIGGER update_organization_on_chat_update
    AFTER UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_timestamps();

-- Grant necessary permissions
GRANT ALL ON public.workspaces TO authenticated;
GRANT ALL ON public.folders TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create default workspace for existing users
DO $$
DECLARE
    user_record RECORD;
    default_workspace_id UUID;
BEGIN
    -- Loop through all existing users who have chats
    FOR user_record IN 
        SELECT DISTINCT user_id FROM public.chats
    LOOP
        -- Create default workspace for each user
        INSERT INTO public.workspaces (user_id, name, description, is_default)
        VALUES (
            user_record.user_id, 
            'Default Workspace', 
            'Your default workspace for organizing chats',
            TRUE
        )
        RETURNING id INTO default_workspace_id;
        
        -- Move all existing chats to the default workspace
        UPDATE public.chats 
        SET workspace_id = default_workspace_id 
        WHERE user_id = user_record.user_id AND workspace_id IS NULL;
    END LOOP;
END $$;
