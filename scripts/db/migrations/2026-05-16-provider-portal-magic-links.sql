CREATE TABLE IF NOT EXISTS provider_portal_login_tokens (
  id text PRIMARY KEY,
  email text NOT NULL,
  token_hash text NOT NULL,
  source text NOT NULL DEFAULT 'magic_link',
  redirect_to text NOT NULL DEFAULT '/provider-portal',
  provider_id text REFERENCES providers(id) ON DELETE SET NULL,
  organization_id text REFERENCES clinic_organizations(id) ON DELETE CASCADE,
  invite_id text REFERENCES clinic_invites(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'manager',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_portal_login_tokens_hash
  ON provider_portal_login_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_provider_portal_login_tokens_email
  ON provider_portal_login_tokens (email);
CREATE INDEX IF NOT EXISTS idx_provider_portal_login_tokens_provider
  ON provider_portal_login_tokens (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_portal_login_tokens_org
  ON provider_portal_login_tokens (organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_portal_login_tokens_invite
  ON provider_portal_login_tokens (invite_id);
CREATE INDEX IF NOT EXISTS idx_provider_portal_login_tokens_expires_at
  ON provider_portal_login_tokens (expires_at);
