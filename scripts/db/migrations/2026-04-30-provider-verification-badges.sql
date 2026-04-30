-- Launch Zavis Verified badge for the two approved clinics.
-- Safe to rerun: records are selected by stable ids first, with slug fallback.

DO $$
BEGIN
  IF to_regclass('public.providers') IS NOT NULL THEN
    UPDATE providers
    SET
      is_verified = true,
      updated_at = now()
    WHERE id IN ('dha_01117', 'dha_03002')
       OR slug IN (
        'bella-rose-medical-center-l-l-c-dubai',
        'kids-neuro-clinic-and-rehab-center-fz-llc-dubai'
      );
  END IF;
END $$;
