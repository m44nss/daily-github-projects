# PixelPress — Image Optimizer

PixelPress is a beginner-friendly, browser-based image optimizer. It can resize, compress and convert batches of JPG, PNG and WebP images without uploading them to a server.

## Features

- Drag and drop or browse for multiple images.
- Batch processing with a queue and per-image status.
- Convert between JPG, PNG and WebP, or keep the source format.
- Adjust JPEG/WebP quality from 10% to 100%.
- Resize proportionally using a maximum edge; images are never enlarged.
- Preview optimized output, compare file sizes and download each result.
- Built-in demo images generated locally with Canvas.
- Responsive layout and no build tools or npm packages.

## Run locally (Windows + VS Code)

1. Download and extract the project folder.
2. Open the folder in Visual Studio Code.
3. Install the **Live Server** extension if you do not already have it.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Click **Try demo images**, or add your own JPG, PNG or WebP files.
6. Choose output format, quality and maximum image edge, then click **Optimize images**.
7. Use **Save** on each result to download it.

You can also open `index.html` directly in a modern browser. Live Server is recommended while learning.

## How it works

The app reads selected files with browser object URLs, draws each image to an HTML Canvas at the requested dimensions, then exports a new Blob with `canvas.toBlob()`. All processing is local to the browser tab. PixelPress does not send images to a remote service.

### Important notes

- Supported inputs: JPEG/JPG, PNG and WebP, up to 20 MB each.
- JPEG and WebP use the quality setting. PNG export is lossless, so the quality slider does not affect it.
- When exporting to JPEG, transparent areas are filled with white because JPEG does not support transparency.
- Animated images are not supported; use still images only.
- Browser codecs differ slightly, so output size and quality may vary by browser.
- Large images need memory while they are decoded and processed. If a file fails, try a smaller image or lower maximum edge.

## Suggested test checklist

1. Load the built-in demo set and optimize with the default WebP / 82% / 1600 px settings.
2. Change the format to PNG and confirm the output file ends in `.png`.
3. Change the format to JPEG and confirm the output file ends in `.jpg`.
4. Choose 800 px and verify the longer output edge is no more than 800 px for larger source images.
5. Add an unsupported GIF or SVG and confirm the app rejects it with a helpful message.
6. Remove one queued image, clear the queue, then add a new image.
7. Try a transparent PNG and compare WebP/PNG output with JPEG's white background.

## Project structure

```text
pixelpress/
├── index.html   # Page structure and controls
├── styles.css   # Responsive visual design
├── app.js       # Queue, Canvas processing, downloads and demo generator
└── README.md    # Setup and test instructions
```

## Privacy

PixelPress runs image decoding and Canvas export in your browser. It has no upload endpoint and does not store image data in LocalStorage. If you use a remote font connection, the browser may contact Google Fonts to load the optional typography; image files are not sent there.

## License

Use, modify and learn from this project freely. Add a license of your choice if you publish a modified version.
