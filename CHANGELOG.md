# Changelog — Senn Tools Creative Suite 2.1

- Rebuilt Image Studio rendering so slider interaction updates a capped preview instead of repeatedly processing the original full-resolution image.
- Scheduled preview updates with `requestAnimationFrame` to avoid stacking render work.
- Separated full-resolution export from preview and split pixel adjustment work into animation-frame chunks.
- Added image dimension and file-size safety limits with clearer errors.
- Improved converter/compressor decoding and asynchronous encoding flow, status messages, and actual size reporting.
- Added JPEG white-background handling for transparent inputs.
- Added expandable usage guides to every tool and Image Studio panel.
- Added real YouTube/TikTok embed attempts, a fallback to the official platform, and official download-help links.
- Added QR download action, color preview swatch, and keyboard support for dashboard cards.
- Improved responsive focus states, reduced-motion support, and processing feedback.
