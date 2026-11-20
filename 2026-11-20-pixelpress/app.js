const state = {
  items: [],
  nextId: 1,
  isProcessing: false
};

const elements = {
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  browseButton: document.querySelector("#browse-button"),
  demoButton: document.querySelector("#demo-button"),
  clearButton: document.querySelector("#clear-button"),
  processButton: document.querySelector("#process-button"),
  imageList: document.querySelector("#image-list"),
  emptyQueue: document.querySelector("#empty-queue"),
  queueCount: document.querySelector("#queue-count"),
  queueSubtitle: document.querySelector("#queue-subtitle"),
  processStatus: document.querySelector("#process-status"),
  formatSelect: document.querySelector("#format-select"),
  qualityRange: document.querySelector("#quality-range"),
  qualityValue: document.querySelector("#quality-value"),
  sizeSelect: document.querySelector("#size-select"),
  resultsStrip: document.querySelector("#results-strip"),
  statCount: document.querySelector("#stat-count"),
  statSaved: document.querySelector("#stat-saved"),
  statPercent: document.querySelector("#stat-percent"),
  toast: document.querySelector("#toast")
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
let toastTimer;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDimensions(width, height) {
  return `${width.toLocaleString()} × ${height.toLocaleString()} px`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function setStatus(message, working = false) {
  elements.processStatus.classList.toggle("working", working);
  elements.processStatus.lastElementChild.textContent = message;
}

function getExtension(mimeType) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[mimeType] || "img";
}

function safeBaseName(filename) {
  return filename.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "-").trim() || "image";
}

function addFiles(fileList) {
  const files = Array.from(fileList || []);
  let added = 0;

  files.forEach((file) => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      showToast(`${file.name}: choose a JPG, PNG or WebP image.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showToast(`${file.name}: files must be 20 MB or smaller.`);
      return;
    }

    const item = {
      id: state.nextId++,
      file,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      outputUrl: null,
      outputBlob: null,
      outputName: null,
      width: 0,
      height: 0,
      outputWidth: 0,
      outputHeight: 0,
      status: "queued",
      error: ""
    };
    state.items.push(item);
    added += 1;
  });

  if (added) {
    renderQueue();
    setStatus(`${added} image${added === 1 ? "" : "s"} added — ready to optimize`);
  }
  elements.fileInput.value = "";
}

function removeItem(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  URL.revokeObjectURL(item.originalUrl);
  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  state.items = state.items.filter((entry) => entry.id !== id);
  renderQueue();
  updateStats();
}

function clearQueue() {
  state.items.forEach((item) => {
    URL.revokeObjectURL(item.originalUrl);
    if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  });
  state.items = [];
  renderQueue();
  updateStats();
  setStatus("Queue cleared");
}

function renderQueue() {
  elements.imageList.innerHTML = "";
  elements.queueCount.textContent = `${state.items.length} image${state.items.length === 1 ? "" : "s"} queued`;
  elements.queueSubtitle.textContent = state.items.length
    ? "Your files are ready for the settings on the right."
    : "Add a few images to get started.";
  elements.clearButton.disabled = !state.items.length || state.isProcessing;
  elements.processButton.disabled = !state.items.length || state.isProcessing;
  elements.processButton.innerHTML = state.isProcessing
    ? 'Optimizing… <span aria-hidden="true">◌</span>'
    : 'Optimize images <span aria-hidden="true">→</span>';

  if (!state.items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-queue";
    empty.innerHTML = '<div class="empty-icon">▧</div><strong>Your queue is looking a little empty</strong><span>Drop in images or load the demo set to see PixelPress in action.</span>';
    elements.imageList.append(empty);
    return;
  }

  state.items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "image-card";
    card.dataset.id = String(item.id);

    const thumb = document.createElement("div");
    thumb.className = "thumb-wrap";
    const image = document.createElement("img");
    image.src = item.outputUrl || item.originalUrl;
    image.alt = item.name;
    thumb.append(image);

    const info = document.createElement("div");
    info.className = "image-info";
    const name = document.createElement("div");
    name.className = "image-name";
    name.title = item.name;
    name.textContent = item.name;
    const meta = document.createElement("div");
    meta.className = "image-meta";
    const size = document.createElement("span");
    size.textContent = formatBytes(item.file.size);
    const dimensions = document.createElement("span");
    dimensions.textContent = item.width ? formatDimensions(item.width, item.height) : "Reading dimensions…";
    meta.append(size, dimensions);
    const result = document.createElement("div");
    result.className = `image-result ${item.status === "done" ? "success" : item.status === "error" ? "error" : ""}`;
    if (item.status === "done") {
      const difference = item.file.size - item.outputBlob.size;
      const label = difference >= 0 ? `${formatBytes(difference)} saved` : `${formatBytes(Math.abs(difference))} larger`;
      result.textContent = `${formatBytes(item.outputBlob.size)} · ${label}`;
    } else if (item.status === "error") {
      result.textContent = item.error || "Could not process this image";
    } else if (item.status === "processing") {
      result.textContent = "Optimizing image…";
    } else {
      result.textContent = "Waiting to be optimized";
    }
    info.append(name, meta, result);

    const actions = document.createElement("div");
    actions.className = "image-actions";
    if (item.status === "done") {
      const download = document.createElement("button");
      download.type = "button";
      download.className = "card-download";
      download.dataset.action = "download";
      download.textContent = "↓ Save";
      actions.append(download);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-button";
    remove.dataset.action = "remove";
    remove.setAttribute("aria-label", `Remove ${item.name}`);
    remove.textContent = "×";
    remove.disabled = state.isProcessing;
    actions.append(remove);

    card.append(thumb, info, actions);
    elements.imageList.append(card);
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The browser could not read this image."));
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("This browser could not create the selected image format."));
    }, type, quality);
  });
}

async function optimizeItem(item, settings) {
  item.status = "processing";
  item.error = "";
  renderQueue();

  const image = await loadImage(item.originalUrl);
  item.width = image.naturalWidth;
  item.height = image.naturalHeight;

  const longestEdge = Math.max(item.width, item.height);
  const scale = settings.maxEdge > 0 && longestEdge > settings.maxEdge
    ? settings.maxEdge / longestEdge
    : 1;
  const outputWidth = Math.max(1, Math.round(item.width * scale));
  const outputHeight = Math.max(1, Math.round(item.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("Canvas is unavailable in this browser.");

  const outputType = settings.format === "keep" ? item.file.type : settings.format;
  if (outputType === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputWidth, outputHeight);
  }
  context.drawImage(image, 0, 0, outputWidth, outputHeight);
  const quality = outputType === "image/png" ? undefined : settings.quality;
  const blob = await canvasToBlob(canvas, outputType, quality);

  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  item.outputBlob = blob;
  item.outputUrl = URL.createObjectURL(blob);
  item.outputWidth = outputWidth;
  item.outputHeight = outputHeight;
  item.outputName = `${safeBaseName(item.name)}-optimized.${getExtension(blob.type)}`;
  item.status = "done";
  renderQueue();
}

async function optimizeAll() {
  if (state.isProcessing || !state.items.length) return;
  state.isProcessing = true;
  const settings = {
    format: elements.formatSelect.value,
    quality: Number(elements.qualityRange.value) / 100,
    maxEdge: Number(elements.sizeSelect.value)
  };
  const pending = state.items.filter((item) => item.status !== "done");
  renderQueue();
  let completed = 0;

  for (const item of pending) {
    if (!state.items.some((entry) => entry.id === item.id)) continue;
    setStatus(`Optimizing ${completed + 1} of ${pending.length}…`, true);
    try {
      await optimizeItem(item, settings);
    } catch (error) {
      item.status = "error";
      item.error = error.message || "Something went wrong";
      renderQueue();
    }
    completed += 1;
  }

  state.isProcessing = false;
  renderQueue();
  updateStats();
  const successes = state.items.filter((item) => item.status === "done").length;
  const errors = state.items.filter((item) => item.status === "error").length;
  setStatus(errors ? `${successes} optimized · ${errors} need attention` : `${successes} image${successes === 1 ? "" : "s"} optimized successfully`);
  if (successes) showToast(`${successes} image${successes === 1 ? "" : "s"} optimized. Ready to save!`);
}

function updateStats() {
  const completed = state.items.filter((item) => item.status === "done");
  if (!completed.length) {
    elements.resultsStrip.hidden = true;
    return;
  }
  const originalTotal = completed.reduce((sum, item) => sum + item.file.size, 0);
  const outputTotal = completed.reduce((sum, item) => sum + item.outputBlob.size, 0);
  const saved = originalTotal - outputTotal;
  const percent = originalTotal ? Math.round((saved / originalTotal) * 100) : 0;
  elements.resultsStrip.hidden = false;
  elements.statCount.textContent = String(completed.length);
  elements.statSaved.textContent = `${saved >= 0 ? "" : "−"}${formatBytes(Math.abs(saved))}`;
  elements.statPercent.textContent = `${percent}%`;
}

function downloadItem(item) {
  if (!item || !item.outputUrl) return;
  const link = document.createElement("a");
  link.href = item.outputUrl;
  link.download = item.outputName;
  document.body.append(link);
  link.click();
  link.remove();
}

async function createDemoFile(title, subtitle, colors, width, height, fileName, type) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.globalAlpha = .23;
  context.fillStyle = colors[2];
  context.beginPath();
  context.arc(width * .72, height * .3, Math.min(width, height) * .22, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = "rgba(255,255,255,.9)";
  context.font = `700 ${Math.max(24, Math.round(width / 15))}px Arial`;
  context.fillText(title, width * .08, height * .58);
  context.font = `400 ${Math.max(14, Math.round(width / 35))}px Arial`;
  context.fillStyle = "rgba(255,255,255,.72)";
  context.fillText(subtitle, width * .08, height * .68);
  const blob = await canvasToBlob(canvas, type, .94);
  return new File([blob], fileName, { type, lastModified: Date.now() });
}

async function loadDemoImages() {
  if (state.isProcessing) return;
  const demoFiles = await Promise.all([
    createDemoFile("MOUNTAIN", "A little room to breathe", ["#294b63", "#82b6a4", "#f3d28b"], 2400, 1600, "mountain-postcard.jpg", "image/jpeg"),
    createDemoFile("STUDIO", "Make space for ideas", ["#7654a1", "#df8ca4", "#f6d18a"], 1800, 1800, "studio-square.png", "image/png"),
    createDemoFile("COASTLINE", "Find your own blue", ["#145c70", "#5db7b0", "#f3e1a0"], 2200, 1400, "coastline-banner.webp", "image/webp")
  ]);
  addFiles(demoFiles);
  showToast("Three sample images added to your queue.");
}

elements.browseButton.addEventListener("click", (event) => {
  event.stopPropagation();
  elements.fileInput.click();
});
elements.dropZone.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  elements.fileInput.click();
});
elements.dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.fileInput.click();
  }
});
elements.fileInput.addEventListener("change", (event) => addFiles(event.target.files));

["dragenter", "dragover"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("drag-over");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("drag-over");
  });
});
elements.dropZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));
document.addEventListener("dragover", (event) => event.preventDefault());
document.addEventListener("drop", (event) => {
  if (!elements.dropZone.contains(event.target)) event.preventDefault();
});
elements.demoButton.addEventListener("click", loadDemoImages);
elements.clearButton.addEventListener("click", clearQueue);
elements.processButton.addEventListener("click", optimizeAll);
elements.qualityRange.addEventListener("input", () => {
  elements.qualityValue.textContent = `${elements.qualityRange.value}%`;
});
elements.imageList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".image-card");
  const id = Number(card?.dataset.id);
  const item = state.items.find((entry) => entry.id === id);
  if (button.dataset.action === "remove") removeItem(id);
  if (button.dataset.action === "download") downloadItem(item);
});

renderQueue();
updateStats();
