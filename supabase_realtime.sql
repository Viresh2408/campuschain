-- Enable Supabase Realtime on key tables for live balance updates
-- Run this in https://supabase.com/dashboard/project/jcurfdnukfmnviwcjezh/sql/new

BEGIN;
  -- Add tables to supabase_realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE users;
  ALTER PUBLICATION supabase_realtime ADD TABLE ledger;
  ALTER PUBLICATION supabase_realtime ADD TABLE token_requests;
COMMIT;

SELECT 'Realtime enabled on users, ledger, token_requests' AS status;
