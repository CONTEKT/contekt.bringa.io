-- Indexes supporting the server-side paginated item lists (dashboard, my items,
-- borrowed) introduced alongside infinite scroll. Each composite index matches a
-- list's filter columns followed by its ordering columns (name,id for the
-- dashboard; created_at,id for the My Items / Borrowed pages) so that
-- ORDER BY ... LIMIT/OFFSET (.range()) can be served from the index instead of a
-- sort over the full result set.
--
-- Note: these are plain CREATE INDEX statements to match repo convention and run
-- inside the migration transaction. On a large live table prefer running the
-- equivalent CREATE INDEX CONCURRENTLY out-of-band to avoid write locks.

-- Dashboard "all" view: visibility_state = 'visible' ORDER BY name, id
create index if not exists idx_items_visible_name_id
  on public.items (name, id)
  where visibility_state = 'visible';

-- Dashboard "available" view: visibility_state = 'visible' AND status = 'inStock'
-- ORDER BY name, id
create index if not exists idx_items_available_name_id
  on public.items (status, name, id)
  where visibility_state = 'visible';

-- Dashboard "borrowed" view: borrowed_by = <uid> ORDER BY name, id
create index if not exists idx_items_borrowed_by_name_id
  on public.items (borrowed_by, name, id);

-- My Items page: created_by = <uid> ORDER BY created_at DESC, id DESC
create index if not exists idx_items_created_by_created_at_id
  on public.items (created_by, created_at desc, id desc);

-- Borrowed Items page: borrowed_by = <uid> AND status = 'borrowed'
-- ORDER BY created_at DESC, id DESC
create index if not exists idx_items_borrowed_by_status_created_at_id
  on public.items (borrowed_by, status, created_at desc, id desc);

-- Dashboard search uses name ILIKE '%term%' (leading wildcard => no b-tree help).
-- A trigram GIN index makes this index-assisted instead of a sequential scan.
create extension if not exists pg_trgm;

create index if not exists idx_items_name_trgm_visible
  on public.items using gin (name gin_trgm_ops)
  where visibility_state = 'visible';
