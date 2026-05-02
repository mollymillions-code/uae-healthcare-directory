CREATE TABLE IF NOT EXISTS clinic_organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text,
  primary_email text,
  phone text,
  website text,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'claim',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinic_organizations_slug
  ON clinic_organizations (slug);
CREATE INDEX IF NOT EXISTS idx_clinic_organizations_primary_email
  ON clinic_organizations (primary_email);
CREATE INDEX IF NOT EXISTS idx_clinic_organizations_status
  ON clinic_organizations (status);

CREATE TABLE IF NOT EXISTS clinic_users (
  id text PRIMARY KEY,
  email text NOT NULL,
  name text,
  password_hash text,
  phone text,
  status text NOT NULL DEFAULT 'invited',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinic_users_email
  ON clinic_users (email);
CREATE INDEX IF NOT EXISTS idx_clinic_users_status
  ON clinic_users (status);
CREATE INDEX IF NOT EXISTS idx_clinic_users_created_at
  ON clinic_users (created_at);

CREATE TABLE IF NOT EXISTS clinic_memberships (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES clinic_organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES clinic_users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'manager',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinic_memberships_org_user
  ON clinic_memberships (organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_memberships_org
  ON clinic_memberships (organization_id);
CREATE INDEX IF NOT EXISTS idx_clinic_memberships_user
  ON clinic_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_memberships_status
  ON clinic_memberships (status);

CREATE TABLE IF NOT EXISTS provider_ownerships (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  organization_id text NOT NULL REFERENCES clinic_organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'claim_approved',
  claim_request_id text REFERENCES claim_requests(id) ON DELETE SET NULL,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_ownerships_provider_org
  ON provider_ownerships (provider_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_ownerships_provider
  ON provider_ownerships (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_ownerships_org
  ON provider_ownerships (organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_ownerships_status
  ON provider_ownerships (status);
CREATE INDEX IF NOT EXISTS idx_provider_ownerships_claim
  ON provider_ownerships (claim_request_id);

CREATE TABLE IF NOT EXISTS clinic_invites (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES clinic_organizations(id) ON DELETE CASCADE,
  provider_id text REFERENCES providers(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'manager',
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinic_invites_token_hash
  ON clinic_invites (token_hash);
CREATE INDEX IF NOT EXISTS idx_clinic_invites_org
  ON clinic_invites (organization_id);
CREATE INDEX IF NOT EXISTS idx_clinic_invites_provider
  ON clinic_invites (provider_id);
CREATE INDEX IF NOT EXISTS idx_clinic_invites_email
  ON clinic_invites (email);
CREATE INDEX IF NOT EXISTS idx_clinic_invites_expires_at
  ON clinic_invites (expires_at);

CREATE TABLE IF NOT EXISTS provider_edit_requests (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  organization_id text NOT NULL REFERENCES clinic_organizations(id) ON DELETE CASCADE,
  requested_by_user_id text REFERENCES clinic_users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL,
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_edit_requests_provider
  ON provider_edit_requests (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_edit_requests_org
  ON provider_edit_requests (organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_edit_requests_user
  ON provider_edit_requests (requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_provider_edit_requests_status
  ON provider_edit_requests (status);
CREATE INDEX IF NOT EXISTS idx_provider_edit_requests_created_at
  ON provider_edit_requests (created_at);

CREATE TABLE IF NOT EXISTS provider_portal_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES clinic_users(id) ON DELETE CASCADE,
  organization_id text NOT NULL REFERENCES clinic_organizations(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  source text NOT NULL DEFAULT 'portal',
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_portal_sessions_token_hash
  ON provider_portal_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_provider_portal_sessions_user
  ON provider_portal_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_provider_portal_sessions_org
  ON provider_portal_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_portal_sessions_expires_at
  ON provider_portal_sessions (expires_at);

CREATE TABLE IF NOT EXISTS provider_portal_audit_logs (
  id text PRIMARY KEY,
  organization_id text REFERENCES clinic_organizations(id) ON DELETE SET NULL,
  provider_id text REFERENCES providers(id) ON DELETE SET NULL,
  actor_user_id text REFERENCES clinic_users(id) ON DELETE SET NULL,
  actor_type text NOT NULL DEFAULT 'clinic_user',
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_portal_audit_logs_org
  ON provider_portal_audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_portal_audit_logs_provider
  ON provider_portal_audit_logs (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_portal_audit_logs_actor
  ON provider_portal_audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_provider_portal_audit_logs_action
  ON provider_portal_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_provider_portal_audit_logs_created_at
  ON provider_portal_audit_logs (created_at);
