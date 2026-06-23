-- Run this in your Supabase SQL editor to enable source tracking,
-- contact info, and follow-up dates on job applications.

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS source         TEXT,
  ADD COLUMN IF NOT EXISTS contact_name   TEXT,
  ADD COLUMN IF NOT EXISTS contact_email  TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Optional: create an index for filtering by source
CREATE INDEX IF NOT EXISTS idx_job_applications_source
  ON job_applications (user_id, source);
