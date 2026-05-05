import assert from "node:assert/strict";
import test from "node:test";

import { defaultStorageBuckets, defaultTables } from "./backup-supabase.mjs";
import { checkEnvExampleContent, parseEnvExample } from "./check-env-example.mjs";

test("parses example env assignments without comments", () => {
  const env = parseEnvExample(`
# comment
SUPABASE_URL=https://example.supabase.co
EMPTY=
QUOTED="value"
`);

  assert.equal(env.get("SUPABASE_URL"), "https://example.supabase.co");
  assert.equal(env.get("EMPTY"), "");
  assert.equal(env.get("QUOTED"), "value");
});

test("requires backup defaults to match backup script source of truth", () => {
  const content = `
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_BACKUP_TABLES=${defaultTables.join(",")}
SUPABASE_BACKUP_STORAGE_BUCKETS=${defaultStorageBuckets.join(",")}
SUPABASE_BACKUP_DIR=backups/supabase
SUPABASE_BACKUP_PAGE_SIZE=1000
SUPABASE_BACKUP_STORAGE_PAGE_SIZE=1000
SUPABASE_BACKUP_AUTH_PAGE_SIZE=1000
SUPABASE_BACKUP_AUTH_USERS=0
SUPABASE_BACKUP_RECORD_RUN=1
APP_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_BOT_TOKEN_USER=
TELEGRAM_CHAT_ID_USER=
`;

  assert.doesNotThrow(() => checkEnvExampleContent(content));
});

test("rejects stale backup table lists", () => {
  assert.throws(
    () => checkEnvExampleContent(`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_BACKUP_TABLES=profiles,items
SUPABASE_BACKUP_STORAGE_BUCKETS=${defaultStorageBuckets.join(",")}
SUPABASE_BACKUP_DIR=backups/supabase
SUPABASE_BACKUP_PAGE_SIZE=1000
SUPABASE_BACKUP_STORAGE_PAGE_SIZE=1000
SUPABASE_BACKUP_AUTH_PAGE_SIZE=1000
SUPABASE_BACKUP_AUTH_USERS=0
SUPABASE_BACKUP_RECORD_RUN=1
APP_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_BOT_TOKEN_USER=
TELEGRAM_CHAT_ID_USER=
`),
    /SUPABASE_BACKUP_TABLES/,
  );
});
