CREATE INDEX IF NOT EXISTS idx_generation_jobs_created
  ON generation_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_status_created
  ON generation_jobs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_variants_created
  ON variants (created_at DESC);
