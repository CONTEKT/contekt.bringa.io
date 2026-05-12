-- Remove the legacy broad upload policy left by old schema dumps.
-- The active upload contract is the validated WebP user-folder policy.

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
