const EXTENSIONS = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
function loadBitmap(file) {
  if ("createImageBitmap" in window) return createImageBitmap(file, { imageOrientation: "from-image" });
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be opened by your browser.")); };
    image.src = url;
  });
}
function fitDimensions(width, height, maxWidth, maxHeight) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error("The browser could not create the resized image."));
      resolve(blob);
    }, mimeType, quality);
  });
}
function outputFilename(originalName, mimeType) {
  const dot = originalName.lastIndexOf(".");
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  return stem + "-resized." + (EXTENSIONS[mimeType] || "png");
}
export async function resizeImage(file, settings) {
  const maxWidth = Number(settings.maxWidth);
  const maxHeight = Number(settings.maxHeight);
  if (!Number.isInteger(maxWidth) || !Number.isInteger(maxHeight) || maxWidth < 1 || maxHeight < 1 || maxWidth > 12000 || maxHeight > 12000) {
    throw new Error("Width and height must be between 1 and 12,000 pixels.");
  }
  let bitmap;
  try {
    bitmap = await loadBitmap(file);
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    if (!sourceWidth || !sourceHeight) throw new Error("The image has invalid dimensions.");
    const output = fitDimensions(sourceWidth, sourceHeight, maxWidth, maxHeight);
    const canvas = document.createElement("canvas");
    canvas.width = output.width;
    canvas.height = output.height;
    const context = canvas.getContext("2d", { alpha: settings.mimeType === "image/png" });
    if (!context) throw new Error("Canvas is not available in this browser.");
    if (settings.mimeType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, output.width, output.height);
    }
    context.drawImage(bitmap, 0, 0, output.width, output.height);
    const quality = settings.mimeType === "image/png" ? undefined : Number(settings.quality) / 100;
    const blob = await canvasToBlob(canvas, settings.mimeType, quality);
    const actualMime = blob.type || settings.mimeType;
    const result = {
      blob,
      outputName: outputFilename(file.name, actualMime),
      sourceWidth,
      sourceHeight,
      outputWidth: output.width,
      outputHeight: output.height
    };
    canvas.width = 0;
    canvas.height = 0;
    return result;
  } finally {
    if (bitmap && typeof bitmap.close === "function") bitmap.close();
  }
}
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1) + " " + units[index];
}