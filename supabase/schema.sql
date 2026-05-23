-- Supabase Schema for Dozer
-- Workspaces, Files metadata

-- 1. Workspaces table (GitHub repos as formal history)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  repo_url TEXT,
  default_branch TEXT DEFAULT 'main',
  description TEXT,
  owner_id TEXT,
  github_id TEXT,
  opened_files TEXT[] DEFAULT '{}',
  active_tab TEXT,
  editor_state JSONB DEFAULT '{}',
  preview_state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_opened_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT false
);

-- 2. File metadata (NOT content - just tree structure)
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
  size BIGINT DEFAULT 0,
  sha TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, path)
);

-- 3. AI task state (realtime sync target)
CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  prompt TEXT,
  actions JSONB DEFAULT '[]',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 4. Cursor / editor sync state
CREATE TABLE IF NOT EXISTS editor_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT,
  file_path TEXT,
  cursor_position JSONB,
  selection JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_workspace ON file_metadata(workspace_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_path ON file_metadata(workspace_id, path);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_workspace ON ai_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_editor_sync_workspace ON editor_sync(workspace_id);
CREATE INDEX IF NOT EXISTS idx_editor_sync_user ON editor_sync(workspace_id, user_id);

-- Row Level Security (RLS) Policies for workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Allow public access (using anon key) for development
-- In production, these should be restricted to authenticated users
CREATE POLICY "Enable read access for all users" ON workspaces
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON workspaces
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON workspaces
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON workspaces
  FOR DELETE USING (true);

-- Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ai_tasks;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE editor_sync;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. Storage bucket setup
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('git-mirror', 'git-mirror', false, false, null, null)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for git-mirror bucket
-- Allow public access (using anon key) for development
-- In production, these should be restricted to authenticated users

CREATE POLICY "Enable read access for all users on git-mirror"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'git-mirror');

CREATE POLICY "Enable insert for all users on git-mirror"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'git-mirror');

CREATE POLICY "Enable update for all users on git-mirror"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'git-mirror');

CREATE POLICY "Enable delete for all users on git-mirror"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'git-mirror');

-- 6. workspace_files table (tracks file metadata including storage path)
CREATE TABLE IF NOT EXISTS workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
  size BIGINT DEFAULT 0,
  storage_path TEXT,
  is_excluded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, path)
);

CREATE INDEX IF NOT EXISTS idx_workspace_files_workspace ON workspace_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_path ON workspace_files(workspace_id, path);

-- Realtime publication for workspace_files
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE workspace_files;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
