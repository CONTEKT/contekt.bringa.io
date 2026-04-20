---
name: convert-images
description: Converts, resizes, and optimizes images using ImageMagick. Use when the user requests image format changes (e.g., to WebP, AVIF), resizing, or web optimization.
---

# Converting Images

This skill provides a standardized way to handle image processing tasks using the ImageMagick CLI (`magick`). It covers format conversion, resizing, and web optimization.

## When to use this skill
- Converting images between formats (PNG, JPEG, WebP, AVIF).
- Resizing or cropping images for UI or performance.
- Optimizing images for web use (reducing file size while maintaining quality).
- Batch processing multiple images.

## Workflow

1.  **Check Environment**: Verify which tool is available.
    ```bash
    # Primary: ImageMagick
    magick --version
    
    # Fallback: sharp-cli (local or npx)
    sharp-cli --version || npx -y sharp-cli --version
    ```
2.  **Identify Requirements**: Determine the target format, dimensions, and quality needs.
3.  **Select Command**: Use the appropriate template from the [Instructions](#instructions) section based on the available tool.
4.  **Execute & Verify**: Run the command and check the output file size and quality.

## Instructions

### 1. Using ImageMagick (Primary)

#### Basic Conversion
```bash
magick input.png output.webp
```

#### Web Optimization
```bash
magick input.png -strip -quality 80 output.webp
```

#### Resizing
```bash
# Resize to 1200px width
magick input.png -resize 1200x output.webp
```

### 2. Using sharp-cli (Fallback)

Use this if `magick` is not installed. Supports modern formats natively. Can be run via `npx` to avoid installation.

#### Basic Conversion
```bash
# Via npx (zero install)
npx -y sharp-cli -i input.png -o output.webp

# Via local install
sharp -i input.png -o output.webp
```

#### Web Optimization
```bash
# Quality 80
npx -y sharp-cli -i input.png -o output.webp -q 80
```

#### Resizing
```bash
# Resize to 1200px width (maintaining aspect ratio)
npx -y sharp-cli -i input.png -o output.webp resize 1200
```

## Resources
- [ImageMagick Documentation](https://imagemagick.org/script/command-line-processing.php)
- [sharp-cli GitHub](https://github.com/vseventer/sharp-cli)
