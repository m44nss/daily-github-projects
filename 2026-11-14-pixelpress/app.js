import { resizeImage, formatBytes } from "./image-engine.js";

const $ = selector => document.querySelector(selector);
const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"]);
let queue = [];
let busy = false;
let toastTimer;

function id() {
  return globalThis.crypto?.randomUUID?.() || ("img-" + Date.now() + "-" + Math.random());
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2500);
}
function controls() {
  const hasFiles = queue.length > 0;
  $("#processButton").disabled = !hasFiles || busy;
  $("#clearButton").disabled = !hasFiles || busy;
  $("#downloadAllButton").disabled = !queue.some(item => item.blob) || busy;
  ["#fileInput", "#maxWidth", "#maxHeight", "#outputFormat"].forEach(sel => { $(sel).disabled = busy; });
  $("#quality").disabled = busy || $("#outputFormat").value === "image/png";
  $("#processButton").querySelector("span:first-child").textContent = busy ? "Resizing images…" : "Resize all images";
}
function summary() {
  const total = queue.reduce((sum, item) => sum + item.file.size, 0);
  $("#queueCount").textContent = queue.length + (queue.length === 1 ? " IMAGE ADDED" : " IMAGES ADDED");
  $("#queueSize").textContent = formatBytes(total) + " ORIGINAL SIZE";
  $("#emptyQueue").classList.toggle("hidden", queue.length > 0);
  $("#imageList").classList.toggle("hidden", queue.length === 0);
  $("#resultBar").classList.toggle("hidden", queue.length === 0);
  const ready = queue.filter(item => item.blob);
  const failed = queue.filter(item => item.error);
  if (!ready.length) {
    $("#savedSummary").textContent = busy ? "Working through your batch…" : "Ready to resize";
    $("#resultDetails").textContent = queue.length + " image(s) in the queue";
  } else {
    const before = ready.reduce((sum, item) => sum + item.file.size, 0);
    const after = ready.reduce((sum, item) => sum + item.blob.size, 0);
    const pct = before ? Math.round((1 - after / before) * 100) : 0;
    $("#savedSummary").textContent = formatBytes(after) + " · " + (pct >= 0 ? pct + "% smaller" : Math.abs(pct) + "% larger");
    $("#resultDetails").textContent = ready.length + " ready" + (failed.length ? " · " + failed.length + " failed" : "") + " · " + formatBytes(before) + " input";
  }
  controls();
}
function render() {
  const list = $("#imageList");
  list.replaceChildren();
  queue.forEach(item => {
    const card = document.createElement("article");
    card.className = "image-card";
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    const img = document.createElement("img");
    img.src = item.outputUrl || item.originalUrl;
    img.alt = "";
    thumb.append(img);
    const info = document.createElement("div");
    info.className = "image-info";
    const name = document.createElement("div");
    name.className = "image-name";
    name.textContent = item.file.name;
    const meta = document.createElement("div");
    meta.className = "image-meta";
    meta.textContent = formatBytes(item.file.size) + " · " + item.file.type.replace("image/", "").toUpperCase();
    const state = document.createElement("span");
    state.className = "image-state" + (item.error ? " error" : item.blob ? " done" : "");
    state.textContent = item.error || (item.blob ? item.width + " × " + item.height + " · " + formatBytes(item.blob.size) : "Waiting to resize");
    info.append(name, meta, state);
    const actions = document.createElement("div");
    actions.className = "image-actions";
    if (item.blob) {
      const download = document.createElement("button");
      download.className = "mini-button";
      download.type = "button";
      download.dataset.action = "download";
      download.dataset.id = item.id;
      download.textContent = "Download ↓";
      actions.append(download);
    }
    const remove = document.createElement("button");
    remove.className = "mini-button remove";
    remove.type = "button";
    remove.dataset.action = "remove";
    remove.dataset.id = item.id;
    remove.setAttribute("aria-label", "Remove " + item.file.name);
    remove.textContent = "×";
    actions.append(remove);
    card.append(thumb, info, actions);
    list.append(card);
  });
  summary();
}
function addFiles(fileList) {
  let added = 0;
  let skipped = 0;
  Array.from(fileList || []).forEach(file => {
    if (!allowed.has(file.type)) { skipped++; return; }
    const duplicate = queue.some(item => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified);
    if (duplicate) { skipped++; return; }
    queue.push({
      id: id(), file, originalUrl: URL.createObjectURL(file),
      outputUrl: null, blob: null, name: "", width: 0, height: 0, error: ""
    });
    added++;
  });
  render();
  if (added && skipped) toast(added + " added · " + skipped + " unsupported or duplicate files skipped.");
  else if (added) toast(added + " image(s) added to the queue.");
  else if (skipped) toast("No new supported images were added.");
  $("#fileInput").value = "";
}
function settings() {
  const width = Number($("#maxWidth").value);
  const height = Number($("#maxHeight").value);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 12000 || height > 12000) {
    throw new Error("Enter a width and height between 1 and 12,000 pixels.");
  }
  return { maxWidth: width, maxHeight: height, mimeType: $("#outputFormat").value, quality: Number($("#quality").value) };
}
async function processBatch() {
  if (busy || !queue.length) return;
  let options;
  try { options = settings(); } catch (error) { toast(error.message); return; }
  busy = true;
  queue.forEach(item => {
    if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    item.outputUrl = null;
    item.blob = null;
    item.error = "";
  });
  render();
  let done = 0;
  for (const item of queue) {
    try {
      const result = await resizeImage(item.file, options);
      item.blob = result.blob;
      item.name = result.outputName;
      item.width = result.outputWidth;
      item.height = result.outputHeight;
      item.outputUrl = URL.createObjectURL(result.blob);
      done++;
    } catch (error) {
      item.error = error instanceof Error ? error.message : "Could not resize this image.";
    }
    render();
  }
  busy = false;
  render();
  toast(done + " resized · " + (queue.length - done) + " failed.");
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}
function removeItem(itemId) {
  const item = queue.find(entry => entry.id === itemId);
  if (!item) return;
  URL.revokeObjectURL(item.originalUrl);
  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  queue = queue.filter(entry => entry.id !== itemId);
  render();
}
function clearQueue() {
  if (busy) return;
  queue.forEach(item => {
    URL.revokeObjectURL(item.originalUrl);
    if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  });
  queue = [];
  render();
  toast("Image queue cleared.");
}

$("#fileInput").addEventListener("change", event => addFiles(event.target.files));
$("#processButton").addEventListener("click", processBatch);
$("#clearButton").addEventListener("click", clearQueue);
$("#downloadAllButton").addEventListener("click", () => {
  const ready = queue.filter(item => item.blob);
  ready.forEach((item, index) => setTimeout(() => download(item.blob, item.name), index * 180));
  if (ready.length) toast("Started " + ready.length + " individual downloads.");
});
$("#quality").addEventListener("input", event => { $("#qualityValue").value = event.target.value + "%"; });
$("#outputFormat").addEventListener("change", controls);
$("#imageList").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = queue.find(entry => entry.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === "remove") removeItem(item.id);
  if (button.dataset.action === "download" && item.blob) download(item.blob, item.name);
});
const dropzone = $("#dropzone");
dropzone.addEventListener("dragover", event => { event.preventDefault(); dropzone.classList.add("dragover"); });
dropzone.addEventListener("dragleave", event => { if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove("dragover"); });
dropzone.addEventListener("drop", event => {
  event.preventDefault();
  dropzone.classList.remove("dragover");
  addFiles(event.dataTransfer.files);
});
dropzone.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    $("#fileInput").click();
  }
});
window.addEventListener("beforeunload", () => {
  queue.forEach(item => {
    URL.revokeObjectURL(item.originalUrl);
    if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  });
});
render();