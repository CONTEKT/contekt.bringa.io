---
title: Configuration
---

# Configuration

Public deployment settings live in `config/bringa.config.jsonc`.

Run:

```bash
pnpm generate:config
```

This writes:

- `public/bringa.config.json` for runtime/public inspection.
- `src/config/bringa.config.generated.json` for typed app imports.

Run:

```bash
pnpm check:config
```

This also checks that configured public content and brand asset paths point to files in `public/`.

Use `.env.local` for secrets and deployment-specific values that must not be public. Service role keys never belong in JSONC config.

## Common Fork Fields

- `app.name`, `app.shortName`, `branding.logoText`: visible app identity.
- `branding.logoPath`, `branding.iconPath`, `branding.appleTouchIconPath`: public brand assets used by navigation, metadata, and the PWA manifest.
- `branding.themeColor`, `branding.backgroundColor`: install and browser chrome colors for the generated manifest.
- `operator.defaultOwnerLabel`: default owner label for operator-owned items.
- `repository.url`, `repository.issuesUrl`: GitHub links shown in the app.
- `legal.termsPath`: app route that displays terms.
- `legal.termsContentPath`: public Markdown file fetched by the terms route.
- `legal.publicDomainIntent`: contribution intent flag for UI and docs.
- `media.*`: accepted image types and upload/compression limits.
- `features.*`: public feature switches.
