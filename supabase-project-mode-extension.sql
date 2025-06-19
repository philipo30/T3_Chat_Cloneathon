-- ChadLLM Project Mode Extension - Database Schema
-- This script extends the existing ChadLLM database with Project Mode functionality
-- Run this script after the main supabase-setup.sql

-- ============================================================================
-- PROJECT MODE TABLES
-- ============================================================================

-- Create projects table (extends workspace concept for project management)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    project_type TEXT DEFAULT 'general' CHECK (project_type IN ('general', 'web', 'python', 'nodejs', 'react', 'vue', 'documentation')),
    template_id TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    total_size_bytes BIGINT DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Enforce user limits
    CONSTRAINT check_project_size CHECK (total_size_bytes <= 524288000), -- 500MB limit
    CONSTRAINT check_file_count CHECK (file_count <= 1000) -- 1000 files limit
);

-- Create project_files table (hierarchical file storage)
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL, -- relative path within project (e.g., 'src/components/Button.tsx')
    content TEXT, -- file content for text files
    file_type TEXT NOT NULL CHECK (file_type IN ('text', 'image', 'binary', 'directory')),
    mime_type TEXT,
    size_bytes INTEGER DEFAULT 0,
    encoding TEXT DEFAULT 'utf-8', -- for text files
    is_directory BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES public.project_files(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique paths within project
    CONSTRAINT unique_project_file_path UNIQUE (project_id, path),
    -- Enforce file size limits
    CONSTRAINT check_text_file_size CHECK (
        (file_type = 'text' AND size_bytes <= 10485760) OR -- 10MB for text files
        (file_type != 'text' AND size_bytes <= 52428800) -- 50MB for binary files
    )
);

-- Create mcp_servers table (Model Context Protocol server configurations)
CREATE TABLE IF NOT EXISTS public.mcp_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    server_type TEXT NOT NULL CHECK (server_type IN ('filesystem', 'git', 'database', 'web', 'custom')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    security_config JSONB DEFAULT '{
        "allowed_commands": [],
        "blocked_commands": ["rm", "del", "format", "fdisk", "mkfs", "dd"],
        "allowed_paths": [],
        "network_restrictions": {
            "allowed_domains": [],
            "block_private_ips": true
        }
    }'::jsonb,
    is_enabled BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique server names per project
    CONSTRAINT unique_project_server_name UNIQUE (project_id, name)
);

-- Create project_memories table (AI memory storage for projects)
CREATE TABLE IF NOT EXISTS public.project_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_text TEXT NOT NULL,
    context_type TEXT DEFAULT 'general' CHECK (context_type IN ('general', 'file', 'conversation', 'insight', 'error', 'solution')),
    relevance_score FLOAT DEFAULT 1.0 CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    related_files TEXT[], -- array of file paths this memory relates to
    tags TEXT[] DEFAULT '{}', -- searchable tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_exports table (track export/import operations)
CREATE TABLE IF NOT EXISTS public.project_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL CHECK (export_type IN ('full', 'files_only', 'settings_only')),
    file_path TEXT, -- path to exported ZIP file (if stored)
    metadata JSONB DEFAULT '{}'::jsonb,
    size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') -- exports expire after 7 days
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_folder_id ON public.projects(folder_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON public.projects(user_id, is_archived);

-- Project files indexes
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON public.project_files(user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_parent_id ON public.project_files(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_files_path ON public.project_files(project_id, path);
CREATE INDEX IF NOT EXISTS idx_project_files_type ON public.project_files(file_type);
CREATE INDEX IF NOT EXISTS idx_project_files_updated_at ON public.project_files(updated_at DESC);

-- MCP servers indexes
CREATE INDEX IF NOT EXISTS idx_mcp_servers_project_id ON public.mcp_servers(project_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_user_id ON public.mcp_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_type ON public.mcp_servers(server_type);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_enabled ON public.mcp_servers(project_id, is_enabled);

-- Project memories indexes
CREATE INDEX IF NOT EXISTS idx_project_memories_project_id ON public.project_memories(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memories_user_id ON public.project_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_project_memories_context_type ON public.project_memories(context_type);
CREATE INDEX IF NOT EXISTS idx_project_memories_relevance ON public.project_memories(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_project_memories_tags ON public.project_memories USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_project_memories_files ON public.project_memories USING GIN (related_files);

-- Project exports indexes
CREATE INDEX IF NOT EXISTS idx_project_exports_project_id ON public.project_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_exports_user_id ON public.project_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_project_exports_expires_at ON public.project_exports(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_exports ENABLE ROW LEVEL SECURITY;

-- Project policies
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Project files policies
CREATE POLICY "Users can view files from their projects" ON public.project_files
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert files to their projects" ON public.project_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update files in their projects" ON public.project_files
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete files from their projects" ON public.project_files
    FOR DELETE USING (auth.uid() = user_id);

-- MCP servers policies
CREATE POLICY "Users can view their project MCP servers" ON public.mcp_servers
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert MCP servers to their projects" ON public.mcp_servers
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their project MCP servers" ON public.mcp_servers
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their project MCP servers" ON public.mcp_servers
    FOR DELETE USING (auth.uid() = user_id);

-- Project memories policies
CREATE POLICY "Users can view memories from their projects" ON public.project_memories
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert memories to their projects" ON public.project_memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update memories in their projects" ON public.project_memories
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete memories from their projects" ON public.project_memories
    FOR DELETE USING (auth.uid() = user_id);

-- Project exports policies
CREATE POLICY "Users can view their project exports" ON public.project_exports
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create project exports" ON public.project_exports
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their project exports" ON public.project_exports
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their project exports" ON public.project_exports
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update project size and file count
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
DECLARE
    project_id_val UUID;
    total_size BIGINT;
    file_count_val INTEGER;
BEGIN
    -- Get project ID from NEW or OLD record
    project_id_val := COALESCE(NEW.project_id, OLD.project_id);

    -- Calculate total size and file count
    SELECT
        COALESCE(SUM(size_bytes), 0),
        COUNT(*)
    INTO total_size, file_count_val
    FROM public.project_files
    WHERE project_id = project_id_val AND is_directory = FALSE;

    -- Update project stats
    UPDATE public.projects
    SET
        total_size_bytes = total_size,
        file_count = file_count_val,
        updated_at = NOW()
    WHERE id = project_id_val;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to enforce user project limits
CREATE OR REPLACE FUNCTION check_user_project_limits()
RETURNS TRIGGER AS $$
DECLARE
    user_project_count INTEGER;
BEGIN
    -- Count user's existing projects
    SELECT COUNT(*) INTO user_project_count
    FROM public.projects
    WHERE user_id = NEW.user_id AND is_archived = FALSE;

    -- Check if user has reached the limit (50 projects)
    IF user_project_count >= 50 THEN
        RAISE EXCEPTION 'User has reached the maximum limit of 50 projects';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate file path and prevent directory traversal
CREATE OR REPLACE FUNCTION validate_file_path()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent directory traversal attacks
    IF NEW.path ~ '\.\.' OR NEW.path ~ '^/' OR NEW.path ~ '//' THEN
        RAISE EXCEPTION 'Invalid file path: directory traversal not allowed';
    END IF;

    -- Ensure path doesn't contain dangerous characters
    IF NEW.path ~ '[<>:"|?*]' THEN
        RAISE EXCEPTION 'Invalid file path: contains forbidden characters';
    END IF;

    -- Normalize path separators to forward slashes
    NEW.path := REPLACE(NEW.path, '\', '/');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.project_exports
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update workspace/folder timestamps when projects are modified
CREATE OR REPLACE FUNCTION update_project_organization_timestamps()
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Triggers for updated_at timestamps
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
    BEFORE UPDATE ON public.project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_servers_updated_at
    BEFORE UPDATE ON public.mcp_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_memories_updated_at
    BEFORE UPDATE ON public.project_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for project statistics
CREATE TRIGGER update_project_stats_on_file_insert
    AFTER INSERT ON public.project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_project_stats();

CREATE TRIGGER update_project_stats_on_file_update
    AFTER UPDATE ON public.project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_project_stats();

CREATE TRIGGER update_project_stats_on_file_delete
    AFTER DELETE ON public.project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_project_stats();

-- Trigger for user project limits
CREATE TRIGGER check_user_project_limits_trigger
    BEFORE INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION check_user_project_limits();

-- Trigger for file path validation
CREATE TRIGGER validate_file_path_trigger
    BEFORE INSERT OR UPDATE ON public.project_files
    FOR EACH ROW
    EXECUTE FUNCTION validate_file_path();

-- Triggers for organization timestamps
CREATE TRIGGER update_project_organization_on_insert
    AFTER INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_project_organization_timestamps();

CREATE TRIGGER update_project_organization_on_update
    AFTER UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_project_organization_timestamps();

-- ============================================================================
-- PERMISSIONS AND GRANTS
-- ============================================================================

-- Grant permissions on new tables
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.project_files TO authenticated;
GRANT ALL ON public.mcp_servers TO authenticated;
GRANT ALL ON public.project_memories TO authenticated;
GRANT ALL ON public.project_exports TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION update_project_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_project_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_file_path() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_exports() TO authenticated;
GRANT EXECUTE ON FUNCTION update_project_organization_timestamps() TO authenticated;

-- ============================================================================
-- HELPFUL COMMENTS
-- ============================================================================

COMMENT ON TABLE public.projects IS 'User projects with file management and MCP integration';
COMMENT ON TABLE public.project_files IS 'Hierarchical file storage for projects';
COMMENT ON TABLE public.mcp_servers IS 'Model Context Protocol server configurations';
COMMENT ON TABLE public.project_memories IS 'AI memory storage for project context';
COMMENT ON TABLE public.project_exports IS 'Project export/import tracking';

COMMENT ON COLUMN public.projects.total_size_bytes IS 'Total size of all files in project (max 500MB)';
COMMENT ON COLUMN public.projects.file_count IS 'Number of files in project (max 1000)';
COMMENT ON COLUMN public.project_files.path IS 'Relative path within project, normalized to forward slashes';
COMMENT ON COLUMN public.mcp_servers.security_config IS 'Security restrictions for MCP server operations';
COMMENT ON COLUMN public.project_memories.relevance_score IS 'AI-determined relevance score (0.0-1.0)';

-- Project Mode database extension complete!
-- Your ChadLLM database now supports full Project Mode functionality.
