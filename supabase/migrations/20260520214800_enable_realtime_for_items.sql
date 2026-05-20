-- Enable Realtime for the items table
-- This allows clients to subscribe to postgres_changes for live-reloading the dashboard

BEGIN;
  -- Add the items table to the supabase_realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE items;
COMMIT;
