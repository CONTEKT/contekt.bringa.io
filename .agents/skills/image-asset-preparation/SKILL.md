---
name: image-asset-preparation
description: Use when preparing logos, favicons, app icons, screenshots, or optimized image assets for this repository.
---

# Image Asset Preparation

Use this skill for repository-owned visual assets, not unapproved production user uploads.

## Rules

- Do not process real user images unless the user explicitly approves the exact files and purpose.
- Keep fork-specific logos and icons overrideable through config or documented content paths.
- Prefer source assets that remain editable. Document generated outputs when automation exists.
- Verify dimensions, file size, transparency, and visual quality after conversion.

## Tool Choice

- Prefer existing local tools.
- If ImageMagick is available, use `magick`.
- If a fallback such as `sharp-cli` would require network or package installation, ask first.

## Common Commands

```bash
magick input.png -strip -quality 80 output.webp
magick input.png -resize 1200x output.webp
magick input.png -resize 512x512 public/icon-512.png
```

## Verification

- Check resulting file size and dimensions.
- Open or render important icons/images when visual quality matters.
- Run `pnpm build` when app manifests, icons, or public asset paths changed.
