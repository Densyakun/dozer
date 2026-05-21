-- Supabase Storage Setup for Dozer
-- Run this in the Supabase SQL editor to set up the git-mirror storage bucket
-- and the workspace_files metadata table.

-- 1. Create the storage bucket (via storage API)
-- Note: In Supabase SQL editor, use:
--   select storage.create_bucket('git-mirror', { public: false });
-- Or create it manually in the Supabase Dashboard under Storage.

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('git-mirror', 'git-mirror', false, false, null, null)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies for the git-mirror bucket

-- Allow users to read their own workspace files
CREATE POLICY "Users can read their own workspace files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'git-mirror'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM workspaces WHERE owner_id = auth.uid()::text
  )
);

-- Allow users to upload files to their own workspaces
CREATE POLICY "Users can upload to their own workspaces"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'git-mirror'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM workspaces WHERE owner_id = auth.uid()::text
  )
);

-- Allow users to update files in their own workspaces
CREATE POLICY "Users can update their own workspace files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'git-mirror'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM workspaces WHERE owner_id = auth.uid()::text
  )
);

-- Allow users to delete files from their own workspaces
CREATE POLICY "Users can delete their own workspace files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'git-mirror'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM workspaces WHERE owner_id = auth.uid()::text
  )
);

-- 3. workspace_files metadata table
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
