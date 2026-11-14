# PixelPress — Batch Image Resizer

PixelPress is a private image resizing tool built with HTML, CSS and vanilla JavaScript. Add multiple images, set maximum dimensions, choose an output format, preview the results and download the resized files.

## Features

- Add multiple images using the file picker or drag and drop.
- Supports PNG, JPG/JPEG, WebP, GIF and BMP input.
- Resize a batch to maximum width and height while preserving aspect ratio.
- Never enlarges an image beyond its original dimensions.
- Export as WebP, JPEG or PNG; adjust quality for WebP and JPEG.
- See output dimensions and file size for every image.
- Download a single result or start downloads for the whole batch.
- Remove individual files or clear the queue.
- Skips unsupported files and duplicate selections.
- All processing happens locally with the browser Canvas API. No upload, account or backend.

## Project structure

- index.html — accessible app structure
- styles.css — responsive visual design
- image-engine.js — image loading, resizing and formatting helpers
- app.js — queue, settings, previews and downloads
- README.md — setup and test guide

## Run on Windows with VS Code

1. Extract the ZIP.
2. Open the pixelpress folder in VS Code.
3. Right-click index.html and choose Open with Live Server.
4. Drop a few images into the upload area or use browse files.
5. Set maximum width and height, choose the output format and press Resize all images.
6. Download one result or use Download ready files.

The app uses JavaScript ES modules, so run it with Live Server rather than opening the HTML file directly.

## Suggested test images

Use any local images you already have. Try a landscape photo at 4000 × 3000, a portrait at 1200 × 1800, a small image at 320 × 240, and a transparent PNG logo. Set a maximum size of 800 × 800.

Expected dimensions:
- landscape: 800 × 600
- portrait: about 533 × 800
- small image: remains 320 × 240 because PixelPress does not upscale
- transparent PNG: keeps transparency when PNG is selected; JPEG fills transparent areas with white

Actual file sizes depend on image content and browser encoding.

## How resizing works

PixelPress calculates one scale factor for both dimensions: scale = min(1, maxWidth / sourceWidth, maxHeight / sourceHeight). Multiplying both original dimensions by the same scale preserves the aspect ratio. The 1 prevents upscaling.

## Quick test checklist

1. Add several images at once and drag another onto the drop area.
2. Set maximum dimensions to 800 × 800 and resize.
3. Confirm output dimensions fit within the limits and a small image is not enlarged.
4. Switch between WebP, JPEG and PNG.
5. Test quality at 40% and 95% for WebP or JPEG.
6. Download one image, then use the batch download button.
7. Remove a single image and clear the remaining queue.
8. Try a text file; it should be skipped as unsupported.

## Privacy and limitations

Original image files are not changed. Temporary browser object URLs are released when files are removed or the page is closed. GIF input is resized as a still image; animation is not preserved. Metadata such as EXIF location and camera details is not copied. Batch download starts one download per image, and your browser may ask permission for multiple downloads. Very large images may use significant memory, so process a smaller batch on low-memory devices.

## Exactly 3 meaningful Git commit groups

For a standalone repository named pixelpress:

1. Interface: git add index.html styles.css
   Commit: git commit -m "feat: build responsive PixelPress workspace"
2. Image engine: git add image-engine.js
   Commit: git commit -m "feat: add browser-based image resizing engine"
3. Integration and docs: git add app.js README.md
   Commit: git commit -m "feat: wire batch queue and document usage"

Three commits are useful practice, but they do not guarantee three contribution squares on GitHub.