CREATE TABLE IF NOT EXISTS consumer_users (
  id text PRIMARY KEY,
  email text NOT NULL,
  name text,
  password_hash text NOT NULL,
  phone text,
  preferred_city_slug text,
  preferred_insurance text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_consumer_users_email
  ON consumer_users (email);

CREATE INDEX IF NOT EXISTS idx_consumer_users_created_at
  ON consumer_users (created_at);

CREATE TABLE IF NOT EXISTS consumer_password_reset_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES consumer_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_consumer_reset_tokens_hash
  ON consumer_password_reset_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_consumer_reset_tokens_user
  ON consumer_password_reset_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_consumer_reset_tokens_expires_at
  ON consumer_password_reset_tokens (expires_at);

DO $$
BEGIN
  IF to_regclass('public.providers') IS NOT NULL THEN
    CREATE TABLE IF NOT EXISTS consumer_saved_providers (
      user_id text NOT NULL REFERENCES consumer_users(id) ON DELETE CASCADE,
      provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      source text,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, provider_id)
    );
  ELSE
    CREATE TABLE IF NOT EXISTS consumer_saved_providers (
      user_id text NOT NULL REFERENCES consumer_users(id) ON DELETE CASCADE,
      provider_id text NOT NULL,
      source text,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, provider_id)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consumer_saved_providers_user
  ON consumer_saved_providers (user_id);

CREATE INDEX IF NOT EXISTS idx_consumer_saved_providers_provider
  ON consumer_saved_providers (provider_id);

CREATE INDEX IF NOT EXISTS idx_consumer_saved_providers_created_at
  ON consumer_saved_providers (created_at);

DO $$
BEGIN
  IF to_regclass('public.providers') IS NOT NULL THEN
    CREATE TABLE IF NOT EXISTS consumer_provider_events (
      id text PRIMARY KEY,
      user_id text REFERENCES consumer_users(id) ON DELETE SET NULL,
      provider_id text REFERENCES providers(id) ON DELETE SET NULL,
      entity_type text NOT NULL DEFAULT 'provider',
      entity_slug text,
      entity_name text,
      action text NOT NULL,
      surface text NOT NULL,
      page_url text,
      cta_label text,
      anonymous_id text,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  ELSE
    CREATE TABLE IF NOT EXISTS consumer_provider_events (
      id text PRIMARY KEY,
      user_id text REFERENCES consumer_users(id) ON DELETE SET NULL,
      provider_id text,
      entity_type text NOT NULL DEFAULT 'provider',
      entity_slug text,
      entity_name text,
      action text NOT NULL,
      surface text NOT NULL,
      page_url text,
      cta_label text,
      anonymous_id text,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consumer_provider_events_user
  ON consumer_provider_events (user_id);

CREATE INDEX IF NOT EXISTS idx_consumer_provider_events_provider
  ON consumer_provider_events (provider_id);

CREATE INDEX IF NOT EXISTS idx_consumer_provider_events_action
  ON consumer_provider_events (action);

CREATE INDEX IF NOT EXISTS idx_consumer_provider_events_surface
  ON consumer_provider_events (surface);

CREATE INDEX IF NOT EXISTS idx_consumer_provider_events_created_at
  ON consumer_provider_events (created_at);
