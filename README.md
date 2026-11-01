# SENN TOOLS — Creative Suite 2.1

A responsive browser-based utility suite. Image editing, image conversion, compression, text tools, color tools, and unit conversion run locally in the browser wherever possible.

## Included tools

### Image Studio
- Upload by file picker or drag and drop.
- Before/after preview.
- Brightness, contrast, saturation, exposure, temperature, tint, sharpness, blur, and vignette.
- Presets: Original, Mono, Sepia, Vintage, Cool, Warm.
- Rotate, flip, resize with optional aspect-ratio lock, and coordinate-based crop.
- Export PNG, JPEG, and WebP.
- Preview is capped to a smaller working resolution and scheduled with `requestAnimationFrame`; export renders at full output resolution and yields between pixel-processing chunks.

### Converter
- Convert images to PNG, JPEG, or WebP.
- Shows input/output file sizes and whether the result became smaller or larger.

### Compressor
- Compress images using JPEG or WebP quality settings.
- PNG is available for lossless output but may not reduce file size.
- Reports actual output size; it does not promise a target size that it cannot guarantee.

### Utilities
- QR code generator with download action (requires internet for QR generation).
- Text toolkit: character, word, and line counts; uppercase, lowercase, title case, copy.
- Color picker: live HEX and RGB values.
- Unit converter: length and data units.

### Media Links
- Detects supported YouTube and TikTok URLs.
- Attempts official embed previews where a video ID is available and embedding is permitted.
- Provides Open platform, Copy link, and official download-help links.
- It does not scrape media, remove watermarks, bypass platform restrictions, or download third-party videos.

## Performance and safety notes
- Preview rendering is intentionally capped at 1100 px on the longest edge to keep slider interaction responsive. Export uses the selected output dimensions.
- Full-resolution image export is limited to 16 megapixels. Converter/compressor input is limited to 16 megapixels and 60 MB to reduce browser memory failures.
- Large files and older/mobile devices can still take longer. Browser and device capabilities vary.
- No AI image generation or AI upscaling is claimed. Those features require a real model/backend integration.
- QR generation uses an external QR service. Google Fonts are optional and have system-font fallbacks.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser, or use VS Code Live Server.
3. For best compatibility, use a current version of Chrome, Edge, Firefox, or Safari.

## Publish with GitHub Pages
Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root. Then open **Settings → Pages**, select `Deploy from a branch`, choose `main` and `/(root)`, and save.
