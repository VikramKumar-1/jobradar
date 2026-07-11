-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For fuzzy text matching
CREATE EXTENSION IF NOT EXISTS "vector";     -- For AI Resume Matching (Phase 2)

-- 1. USERS TABLE (Candidates & Recruiters)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
  full_name TEXT,
  company_name TEXT,              -- For recruiters
  resume_url TEXT,                -- For candidates
  skills TEXT[],                  -- Array of skills for candidates
  resume_embedding vector(1536),  -- AI embedding of resume for Smart Matching
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JOBS TABLE
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT,               -- ID from third-party API (Adzuna, etc.)
  source TEXT NOT NULL,           -- 'adzuna', 'remotive', 'recruiter_post'
  recruiter_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if API fetched
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  city TEXT,
  description TEXT,
  is_remote BOOLEAN DEFAULT FALSE,
  job_type TEXT,
  experience TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  skills_required TEXT[],         -- Skills needed for this job
  job_embedding vector(1536),     -- AI embedding for Smart Matching
  apply_url TEXT,                 -- External link or internal apply
  auto_apply_limit INTEGER DEFAULT 6, -- System minimum limit as per requirement
  is_active BOOLEAN DEFAULT TRUE,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Deduplication strategy
  fingerprint TEXT GENERATED ALWAYS AS (
    lower(company) || '::' || lower(title) || '::' || lower(coalesce(city, ''))
  ) STORED,
  
  UNIQUE(source, external_id)     -- Prevent exact duplicate fetches
);

-- Indexes for blazing fast searches
CREATE INDEX idx_jobs_fingerprint ON jobs(fingerprint);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_source ON jobs(source);

-- 3. APPLICATIONS TABLE (Auto-Apply & Manual Apply)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'rejected')),
  is_auto_applied BOOLEAN DEFAULT FALSE,
  match_score FLOAT,              -- Smart matching score (e.g. 0.95 = 95% match)
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(job_id, candidate_id)    -- Prevent double applying
);

-- 4. FETCH LOGS (For tracking API syncs)
CREATE TABLE fetch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  jobs_added INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  error_msg TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update 'updated_at' on users
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
