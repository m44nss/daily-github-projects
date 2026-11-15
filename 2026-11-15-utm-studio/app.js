import { buildCampaignUrl, toCsv, formatDate } from "./utm-core.js";
import { demoCampaigns } from "./demo-data.js";

const $ = selector => document.querySelector(selector);
const fields = ["website", "source", "medium", "campaign", "term", "content"];
const STORAGE_KEY = "utm-studio.saved-campaigns.v1";
let saved = loadSaved();
let previewUrl = "";
let toastTimer;

function loadSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(item => item && item.id && item.taggedUrl) : [];
  } catch { return []; }
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }
  catch { message("Browser storage is full. Export your links and remove older entries.", true); }
}
function values() { return Object.fromEntries(fields.map(field => [field, $(`#${field}`).value])); }
function message(text, error = false) {
  $("#formMessage").textContent = text;
  $("#formMessage").classList.toggle("error", error);
}
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2400);
}
function updatePreview() {
  try {
    const result = buildCampaignUrl(values());
    previewUrl = result.url;
    $("#urlPreview").textContent = result.url;
    $("#parameterCount").textContent = `${result.parameterCount} PARAMETERS`;
    $("#urlLength").textContent = `${result.url.length} CHARACTERS`;
    $("#copyButton").disabled = false;
  } catch {
    previewUrl = "";
    $("#urlPreview").textContent = "Add a valid destination, source, medium and campaign to preview your tagged URL.";
    $("#parameterCount").textContent = "0 PARAMETERS";
    $("#urlLength").textContent = "0 CHARACTERS";
    $("#copyButton").disabled = true;
  }
}
function renderLibrary() {
  const body = $("#savedLinks");
  body.replaceChildren();
  $("#savedCount").textContent = saved.length;
  $("#exportButton").disabled = saved.length === 0;
  $("#clearLibraryButton").disabled = saved.length === 0;
  if (!saved.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No saved links yet. Build your first campaign above.";
    row.append(cell); body.append(row); return;
  }
  saved.forEach(item => {
    const row = document.createElement("tr");
    const campaign = document.createElement("td");
    const title = document.createElement("div");
    title.className = "campaign-name"; title.textContent = item.campaign;
    const sub = document.createElement("div");
    sub.className = "sub-cell"; sub.textContent = item.content || "No content label";
    campaign.append(title, sub);
    const source = document.createElement("td");
    source.textContent = `${item.source} / ${item.medium}`;
    const destination = document.createElement("td");
    const dest = document.createElement("span");
    dest.className = "destination"; dest.textContent = item.destination; dest.title = item.destination;
    destination.append(dest);
    const date = document.createElement("td"); date.textContent = formatDate(item.createdAt);
    const action = document.createElement("td");
    const wrap = document.createElement("div"); wrap.className = "row-actions";
    [["copy", "Copy"], ["delete", "Delete"]].forEach(([kind, label]) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = `small-action${kind === "delete" ? " delete" : ""}`;
      button.dataset.action = kind; button.dataset.id = item.id; button.textContent = label;
      wrap.append(button);
    });
    action.append(wrap); row.append(campaign, source, destination, date, action); body.append(row);
  });
}
function save(event) {
  event.preventDefault();
  try {
    const form = values();
    const result = buildCampaignUrl(form);
    const destination = new URL(form.website.trim());
    saved.unshift({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      destination: destination.origin + destination.pathname,
      website: form.website.trim(), source: form.source.trim(), medium: form.medium.trim(),
      campaign: form.campaign.trim(), term: form.term.trim(), content: form.content.trim(),
      taggedUrl: result.url, createdAt: new Date().toISOString()
    });
    persist(); renderLibrary(); message("Campaign link saved to this browser."); toast("Campaign link saved.");
  } catch (error) { message(error.message || "Check your campaign details.", true); }
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("URL copied to clipboard."); }
  catch {
    const helper = document.createElement("textarea");
    helper.value = text; helper.style.position = "fixed"; helper.style.opacity = "0";
    document.body.append(helper); helper.select();
    const ok = document.execCommand("copy"); helper.remove();
    toast(ok ? "URL copied to clipboard." : "Copy blocked. Select the preview URL manually.");
  }
}
function exportCsv() {
  if (!saved.length) return;
  const blob = new Blob(["\uFEFF", toCsv(saved)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "utm-studio-campaigns.csv";
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Campaign library exported as CSV.");
}
function loadDemo(example) {
  fields.forEach(field => { $(`#${field}`).value = example[field] || ""; });
  updatePreview(); message(`Loaded example: ${example.label}`);
}

$("#utmForm").addEventListener("submit", save);
fields.forEach(field => $(`#${field}`).addEventListener("input", updatePreview));
$("#copyButton").addEventListener("click", () => { if (previewUrl) copy(previewUrl); });
$("#resetButton").addEventListener("click", () => {
  $("#utmForm").reset(); message(""); updatePreview();
});
$("#exportButton").addEventListener("click", exportCsv);
$("#clearLibraryButton").addEventListener("click", () => {
  if (!saved.length || !confirm("Delete every saved campaign link from this browser?")) return;
  saved = []; persist(); renderLibrary(); toast("Campaign library cleared.");
});
$("#savedLinks").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = saved.find(entry => entry.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === "copy") copy(item.taggedUrl);
  if (button.dataset.action === "delete") {
    saved = saved.filter(entry => entry.id !== item.id);
    persist(); renderLibrary(); toast("Saved campaign removed.");
  }
});

const demoBar = document.createElement("div");
demoBar.className = "demo-bar";
const label = document.createElement("span"); label.textContent = "TRY AN EXAMPLE"; demoBar.append(label);
demoCampaigns.forEach(example => {
  const button = document.createElement("button");
  button.type = "button"; button.className = "demo-button"; button.textContent = example.label;
  button.addEventListener("click", () => loadDemo(example)); demoBar.append(button);
});
$("#utmForm").append(demoBar);
updatePreview(); renderLibrary();
