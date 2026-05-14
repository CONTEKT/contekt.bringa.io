# Browser Testing

Use this runbook for manual or agentic browser checks before release work, large UI changes, PWA changes, local Supabase backend testing, or optional Supabase branch testing. The detailed agent scenario source is `.agents/skills/agentic-browser-testing/SKILL.md`; this page is the maintainer-facing checklist and evidence format.

## Scope

Test against local, mock, staging, or explicitly approved development data. Do not use production user data unless the exact scenario and data category have been approved.

Record:

- date, commit, deployment target, and browser;
- viewport and input mode;
- role: anonymous, uninvited authenticated user, validated user, item creator, or admin;
- route, action, expected result, actual result, and evidence;
- whether data was mock, local development, staging, or production metadata.

## Dev Server Startup

Before starting `pnpm dev`, `pnpm dev:docker`, `pnpm exec next dev`, or a static preview server, check whether a suitable server is already listening. Check the intended port first, for example:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

If the app is already running, reuse it and verify the URL before testing. If the port is occupied by another process, choose a different port and record the actual URL in the evidence. Stop only the server process started for the current task; leave user-owned or pre-existing servers running.

## Repeatable Playwright E2E

Use Playwright for repeatable local Supabase and CI regression coverage. Keep Browser Use for exploratory browser evidence. Browser Use also remains the right tool for design inspection, target-browser spot checks, and ad hoc debugging.

Core commands:

```bash
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:debug
pnpm test:e2e:ci
```

`pnpm test:e2e` starts or reuses the local Supabase Docker stack, seeds deterministic local data, runs the Chromium Playwright suite, and restores generated public config before exit. `pnpm test:e2e:ui` opens Playwright UI/watch mode for local iteration. `pnpm test:e2e:ci` is the deterministic GitHub Actions entrypoint.

The manual E2E workflow installs Chromium with `pnpm exec playwright install --with-deps chromium`, starts local Supabase with `pnpm exec supabase start`, configures fixtures with `pnpm setup:local-supabase --force --seed`, checks the stack with `pnpm doctor:local-supabase`, runs `pnpm test:e2e:ci`, and uploads Playwright reports and test-result artifacts.

## Baseline Routes

- `/login`: terms checkbox gates sign-in actions, setup-required view appears for unfinished public fork config, terms link works, logout returns to logged-out state.
- `/invite`: invalid invite errors are visible and accessible; valid or approved users reach the dashboard.
- `/dashboard`: borrowed-first behavior, search, filters, empty states, long names, fixed bottom actions, and mobile layout.
- `/items/create` and `/items/edit`: image MIME/size errors, immediate preview, replacement behavior, no-image behavior, and form error states.
- `/items/details`: status, owner, visibility actions, borrow/return, moderation links, and reload behavior.
- `/settings`: issue prompt, JSON export, deletion request, repository links, and logout.
- `/admin/dashboard`, `/admin/users`, `/admin/user-items`, `/admin/moderation`, `/admin/item-versions`, `/admin/deletion-requests`, and `/admin/notifications`: dense scanning, keyboard flow, reason fields, self-protection, and privacy-preserving summaries.

## Responsive And Accessibility Pass

Use at least:

- mobile narrow: `375x812`;
- tablet: `768x1024`;
- desktop: `1440x900`;
- keyboard-only navigation;
- light and dark themes;
- long item names, long owner labels, long unbroken words, missing images, and image-heavy lists.

Check that text wraps or truncates intentionally, touch targets remain usable, focus is visible, controls do not overlap content, and empty/error/loading states keep the next action clear.

## PWA Pass

Verify `/manifest.webmanifest` contains configured app name, short name, colors, start URL, SVG icon, `192x192` PNG icon, `512x512` PNG icon, and `512x512` maskable PNG icon. Installability also depends on browser support and a secure context; do not claim offline support unless a service worker or equivalent offline strategy exists and has been tested.

When the browser supports installation, install or simulate installed mode and test:

- app launches at the configured start URL;
- Supabase session persistence after relaunch;
- logout clears the expected local session state;
- app icon and theme colors look correct on the target platform;
- slow-network behavior is understandable.

## Latest Local Evidence

Recent local and static evidence:

- 2026-05-05 local demo pass covered `/login`, `/dashboard`, long item details, generated `/docs`, `/admin/dashboard`, and `/items/create`.
- 2026-05-05 static export preview covered `/login`, generated docs, `/manifest.webmanifest`, and anonymous `/dashboard` redirect behavior.
- 2026-05-06 local quick-start and Next 16 regression checks confirmed `pnpm dev` serves local demo mode and Turbopack starts with the explicit development config.
- 2026-05-12 Browser Use static export setup-readiness check against `out/` served on `127.0.0.1:4328` confirmed local origins stayed in normal static-preview login mode, `fork.localhost` showed **Setup required**, OAuth buttons were hidden, and the **Fork launch guide** link opened the generated runbook.
- 2026-05-13 Browser Use local demo smoke started only after checking the target port, opened `/login`, entered local demo mode, and confirmed the pre-bump generated version `v0.2.1` appeared in the user menu.

Repeatable local Supabase Playwright E2E now covers seeded local login/logout, borrowed-first dashboard behavior, admin route gating, and a real local Storage image upload. Remaining release evidence still needs PWA install behavior, slow-network review, non-Chromium target-browser coverage, and approved live/staging data boundaries.

## Reporting

Use short, factual notes. If a tool is unavailable, record that as a gap rather than marking the scenario complete. Keep screenshots only when they clarify layout, overflow, or state that text evidence cannot capture.
