-- Supabase Storage Setup for Dozer
-- Run this in the Supabase SQL editor to set up the git-mirror storage bucket
-- and the project_files metadata table.

-- 1. Create the storage bucket (via storage API)
-- Note: In Supabase SQL editor, use:
--   select storage.create_bucket('git-mirror', { public: false });
-- Or create it manually in the Supabase Dashboard under Storage.

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('git-mirror', 'git-mirror', false, false, null, null)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies for the git-mirror bucket

-- Allow users to read their own project files
CREATE POLICY "Users can read their own project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'git-mirror'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE owner_id = auth.uid()::text
  )
);

-- Allow users to upload files to their own projects
CREATE POLICY "Users can upload to their own projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'git-mirror'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE owner_id = auth.uid()::text
  )
);

-- Allow users to update files in their own projects
CREATE POLICY "Users can update their own project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'git-mirror'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE owner_id = auth.uid()::text
  )
);

-- Allow users to delete files from their own projects
CREATE POLICY "Users can delete their own project files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'git-mirror'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE owner_id = auth.uid()::text
  )
);

-- 3. project_files metadata table
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
