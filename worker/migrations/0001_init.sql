CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  status TEXT NOT NULL,
  mode TEXT NOT NULL,
  config_json TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  stage TEXT NOT NULL,
  error_json TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_campaign
  ON generation_jobs (campaign_id, created_at DESC);

CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT,
  cta TEXT NOT NULL,
  image_r2_key TEXT,
  provider_copy TEXT,
  provider_image TEXT,
  confidence REAL NOT NULL,
  status TEXT NOT NULL,
  ai_generated INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns (id),
  FOREIGN KEY (job_id) REFERENCES generation_jobs (id)
);

CREATE INDEX IF NOT EXISTS idx_variants_campaign_created
  ON variants (campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_variants_campaign_status
  ON variants (campaign_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  config_json TEXT NOT NULL,
  status TEXT NOT NULL,
  artifact_r2_key TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
);

CREATE INDEX IF NOT EXISTS idx_exports_campaign_created
  ON exports (campaign_id, created_at DESC);

CREATE TABLE IF NOT EXISTS session_usage (
  session_id TEXT NOT NULL,
  day TEXT NOT NULL,
  jobs_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, day)
);
