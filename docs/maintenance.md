---
title: Maintenance
---

# Maintenance

## Regular Tasks

- Run `pnpm backup:supabase` before production database work when `SUPABASE_SERVICE_ROLE_KEY` is configured.
- Keep Supabase free-tier projects active, or document the paid/self-hosted plan for deployments that must not pause.
- Run `pnpm check:config`, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` before releases.
- Review dependencies and security advisories regularly.
- Run `pnpm outdated` before dependency upgrade work and record major-version deferrals in `docs/dependency-audit.md`.
- Verify Auth providers, redirect URLs, Edge Function secrets, Telegram chat IDs, and Storage bucket policies after deployment changes.
- Update `.agents/` and `docs/optimization-options.md` when repeated maintenance friction appears.

## Supabase Backup Scope

`pnpm backup:supabase` exports configured Postgres tables and configured Storage buckets to `backups/supabase/<timestamp>/`. By default it backs up the public tables listed in `scripts/backup-supabase.mjs` and the `items` Storage bucket. Use `SUPABASE_BACKUP_TABLES`, `SUPABASE_BACKUP_STORAGE_BUCKETS`, `SUPABASE_BACKUP_PAGE_SIZE`, and `SUPABASE_BACKUP_STORAGE_PAGE_SIZE` for deployment-specific scope; set a list variable to `none` to skip that surface deliberately.

Set `SUPABASE_BACKUP_AUTH_USERS=1` to export Supabase Auth user metadata through the Admin API to `auth-users.json`. This does not export passwords, provider secrets, or a complete Auth restore package; treat it as operator metadata for reconciliation. Keep backup directories encrypted at rest and test restore procedures before relying on them operationally.

User-facing data export is separate from operator backups. It is provided through `export_my_data` and covers the authenticated user's profile, created items, borrowed items, borrow history, deletion request history, item suggestions, and item flags. Account deletion requests are operator-reviewed and do not remove Auth users or Storage objects by themselves.

## Local Verification Notes

- `pnpm lint` is expected to pass without warnings.
- In Codex Desktop, `pnpm build` can fail inside the sandbox when Turbopack attempts to bind a local helper port. Rerun with approved escalation before treating that as an application build failure.

## Current Known Gaps

- Supabase MCP/service-role review is pending.
- Restore drills, encrypted backup retention policy, and backup freshness UI are pending.
- Maskable PNG icons and complete homescreen testing are pending.
