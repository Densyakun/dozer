-- Supabase Schema for Dozer
-- Projects, Workspaces, Files metadata

-- 1. Projects table (GitHub repos as formal history)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  repo_url TEXT,
  default_branch TEXT DEFAULT 'main',
  description TEXT,
  owner_id TEXT,
  github_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT false
);

-- 2. Workspaces (opened project state)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  opened_files TEXT[] DEFAULT '{}',
  active_tab TEXT,
  editor_state JSONB DEFAULT '{}',
  preview_state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_opened_at TIMESTAMPTZ DEFAULT now()
);

-- 3. File metadata (NOT content - just tree structure)
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
  size BIGINT DEFAULT 0,
  sha TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, path)
);

-- 4. AI task state (realtime sync target)
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

-- 5. Cursor / editor sync state
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
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_project ON workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_project ON file_metadata(project_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_path ON file_metadata(project_id, path);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_workspace ON ai_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_editor_sync_workspace ON editor_sync(workspace_id);
CREATE INDEX IF NOT EXISTS idx_editor_sync_user ON editor_sync(workspace_id, user_id);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE editor_sync;

-- 6. Storage bucket setup
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('git-mirror', 'git-mirror', false, false, null, null)
ON CONFLICT (id) DO NOTHING;

-- 7. project_files table (tracks file metadata including storage path)
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
  size BIGINT DEFAULT 0,
  storage_path TEXT,
  is_excluded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, path)
);

CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_path ON project_files(project_id, path);
