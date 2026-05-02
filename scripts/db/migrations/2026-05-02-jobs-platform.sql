-- ============================================================================
-- Migration: 2026-05-02-jobs-platform.sql
-- Author:    Claude Opus 4.7
-- Purpose:   Open Healthcare Jobs by Zavis — third user-type marketplace.
--            Adds candidate auth, candidate profiles, jobs, applications,
--            interest events, saved jobs, alerts, notifications.
-- Idempotent: every CREATE TABLE uses IF NOT EXISTS; every INSERT uses
--            ON CONFLICT DO NOTHING (none here, but pattern preserved).
-- ============================================================================

CREATE TABLE IF NOT EXISTS candidate_users (
  id text PRIMARY KEY,
  email text NOT NULL,
  name text,
  password_hash text,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_users_email ON candidate_users(email);
CREATE INDEX IF NOT EXISTS idx_candidate_users_created_at ON candidate_users(created_at);

CREATE TABLE IF NOT EXISTS candidate_profiles (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE REFERENCES candidate_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('physician','nurse','allied_health','dental','imaging','pharmacy','support','management','sales','other')),
  discipline_slug text,
  specialty_slug text,
  subspecialty_slug text,
  experience_years integer,
  current_employer_optional text,
  license_status text CHECK (license_status IN ('dha','doh','mohap','dataflow_pending','outside_uae','none')),
  license_number_optional text,
  preferred_city_slugs text[] NOT NULL DEFAULT '{}',
  current_city_slug text,
  willing_to_relocate boolean DEFAULT false,
  visa_status text CHECK (visa_status IN ('citizen','residence','needs_sponsorship')),
  salary_expectation_min_aed integer,
  salary_expectation_max_aed integer,
  employment_type_pref text[] NOT NULL DEFAULT '{}',
  bio_md text,
  cv_url text,
  cv_uploaded_at timestamptz,
  photo_url text,
  languages text[] NOT NULL DEFAULT '{}',
  availability text CHECK (availability IN ('actively_looking','open','not_looking')) DEFAULT 'open',
  visibility text CHECK (visibility IN ('public','limited','private')) NOT NULL DEFAULT 'limited',
  profile_completeness integer NOT NULL DEFAULT 0,
  notify_email boolean NOT NULL DEFAULT true,
  notify_whatsapp boolean NOT NULL DEFAULT false,
  whatsapp_number text,
  consent_terms_at timestamptz NOT NULL,
  consent_terms_version text NOT NULL,
  consent_data_processing_at timestamptz NOT NULL,
  consent_recruiter_visibility_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_specialty_city ON candidate_profiles(specialty_slug, current_city_slug);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_discipline_city ON candidate_profiles(discipline_slug, current_city_slug);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_visibility ON candidate_profiles(visibility, availability);

CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_ar text,
  clinic_id text,
  external_clinic_name text,
  external_clinic_url text,
  city_slug text NOT NULL,
  role text CHECK (role IN ('physician','nurse','allied_health','dental','imaging','pharmacy','support','management','sales','other')),
  discipline_slug text,
  specialty_slug text NOT NULL,
  subspecialty_slug text,
  seniority text CHECK (seniority IN ('intern','junior','mid','senior','consultant','head_of_dept')),
  employment_type text CHECK (employment_type IN ('full_time','part_time','locum','visiting')),
  description_md text NOT NULL,
  requirements_md text,
  benefits_md text,
  license_required text,
  dataflow_required boolean,
  visa_sponsorship boolean,
  salary_min_aed integer,
  salary_max_aed integer,
  salary_disclosed boolean DEFAULT false,
  application_deadline timestamptz,
  posted_at timestamptz NOT NULL DEFAULT now(),
  closing_at timestamptz,
  status text CHECK (status IN ('draft','published','closed','archived')) NOT NULL DEFAULT 'draft',
  source text CHECK (source IN ('zavis_curated','clinic_direct','editorial_aggregated','candidate_referred')) NOT NULL DEFAULT 'zavis_curated',
  posted_by_clinic_user_id text,
  view_count integer NOT NULL DEFAULT 0,
  application_count integer NOT NULL DEFAULT 0,
  saved_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_posted ON jobs(status, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_city_specialty ON jobs(city_slug, specialty_slug, status);
CREATE INDEX IF NOT EXISTS idx_jobs_city_discipline ON jobs(city_slug, discipline_slug, status);
CREATE INDEX IF NOT EXISTS idx_jobs_discipline ON jobs(discipline_slug, status);
CREATE INDEX IF NOT EXISTS idx_jobs_clinic ON jobs(clinic_id);

CREATE TABLE IF NOT EXISTS job_applications (
  id text PRIMARY KEY,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_user_id text NOT NULL REFERENCES candidate_users(id) ON DELETE CASCADE,
  candidate_profile_id text REFERENCES candidate_profiles(id),
  cover_note_md text,
  cv_url_at_apply text,
  status text CHECK (status IN ('submitted','seen_by_clinic','shortlisted','interviewed','offered','hired','rejected','withdrawn')) NOT NULL DEFAULT 'submitted',
  status_updated_at timestamptz,
  status_updated_by_clinic_user_id text,
  candidate_visible_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, candidate_user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON job_applications(candidate_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id, status);

CREATE TABLE IF NOT EXISTS profile_interest_events (
  id text PRIMARY KEY,
  candidate_profile_id text NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  recruiter_clinic_id text,
  recruiter_clinic_user_id text,
  source text NOT NULL CHECK (source IN ('zavis_match','recruiter_view','recruiter_interest')),
  job_id text REFERENCES jobs(id),
  message_md text,
  notified_candidate_at timestamptz,
  candidate_responded_at timestamptz,
  candidate_response text CHECK (candidate_response IN ('accepted','declined','ignored')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_interest_candidate ON profile_interest_events(candidate_profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
  id text PRIMARY KEY,
  candidate_user_id text NOT NULL REFERENCES candidate_users(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(candidate_user_id, job_id)
);

CREATE TABLE IF NOT EXISTS job_alert_subscriptions (
  id text PRIMARY KEY,
  email text NOT NULL,
  candidate_user_id text REFERENCES candidate_users(id),
  city_slugs text[] NOT NULL DEFAULT '{}',
  specialty_slugs text[] NOT NULL DEFAULT '{}',
  seniority text[] NOT NULL DEFAULT '{}',
  frequency text CHECK (frequency IN ('daily','weekly','realtime')) NOT NULL DEFAULT 'weekly',
  consent_pdpl_at timestamptz NOT NULL DEFAULT now(),
  unsubscribe_token text NOT NULL UNIQUE,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidate_notifications (
  id text PRIMARY KEY,
  candidate_user_id text NOT NULL REFERENCES candidate_users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','whatsapp','in_app')),
  type text NOT NULL,
  payload jsonb,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_notifications_user ON candidate_notifications(candidate_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS job_candidate_interests (
  id text PRIMARY KEY,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_profile_id text NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, candidate_profile_id)
);
