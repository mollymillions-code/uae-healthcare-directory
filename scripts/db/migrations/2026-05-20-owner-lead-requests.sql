CREATE TABLE IF NOT EXISTS owner_lead_requests (
  id TEXT PRIMARY KEY,
  consumer_event_id TEXT REFERENCES consumer_provider_events(id) ON DELETE SET NULL,
  provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  surface TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'provider',
  entity_slug TEXT,
  entity_name TEXT,
  page_url TEXT,
  cta_label TEXT,
  owner_role TEXT,
  anonymous_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_lead_requests_consumer_event
  ON owner_lead_requests(consumer_event_id);

CREATE INDEX IF NOT EXISTS idx_owner_lead_requests_provider
  ON owner_lead_requests(provider_id);

CREATE INDEX IF NOT EXISTS idx_owner_lead_requests_action
  ON owner_lead_requests(action);

CREATE INDEX IF NOT EXISTS idx_owner_lead_requests_status
  ON owner_lead_requests(status);

CREATE INDEX IF NOT EXISTS idx_owner_lead_requests_created_at
  ON owner_lead_requests(created_at);

INSERT INTO owner_lead_requests (
  id,
  consumer_event_id,
  provider_id,
  action,
  surface,
  entity_type,
  entity_slug,
  entity_name,
  page_url,
  cta_label,
  owner_role,
  anonymous_id,
  metadata,
  status,
  created_at,
  updated_at
)
SELECT
  'olr_' || md5(e.id),
  e.id,
  e.provider_id,
  CASE
    WHEN e.action = 'owner_claim_cta_confirmed' THEN 'claim'
    WHEN e.action = 'owner_edit_cta_confirmed' THEN 'edit'
    ELSE 'get_listed'
  END,
  e.surface,
  e.entity_type,
  e.entity_slug,
  e.entity_name,
  e.page_url,
  e.cta_label,
  CASE
    WHEN jsonb_typeof(e.metadata -> 'ownerRole') = 'string' THEN e.metadata ->> 'ownerRole'
    ELSE NULL
  END,
  e.anonymous_id,
  jsonb_build_object('backfilled', true, 'sourceEventAction', e.action) || e.metadata,
  'pending',
  e.created_at,
  now()
FROM consumer_provider_events e
WHERE e.action IN (
  'owner_get_listed_cta_confirmed',
  'owner_claim_cta_confirmed',
  'owner_edit_cta_confirmed'
)
AND NOT EXISTS (
  SELECT 1
  FROM owner_lead_requests existing
  WHERE existing.consumer_event_id = e.id
)
ON CONFLICT (id) DO NOTHING;
