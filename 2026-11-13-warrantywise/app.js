const STORAGE_KEY = "warrantywise.items.v1";
const $ = selector => document.querySelector(selector);

const sampleWarranties = [
  { product:"Everyday Laptop", brand:"Lenovo", category:"Electronics", purchaseDate:"2025-12-10", durationMonths:24, price:64999, currency:"INR", serial:"LNV-82XK-2025", notes:"Invoice saved in the laptop documents folder." },
  { product:"Smartphone", brand:"Samsung", category:"Electronics", purchaseDate:"2025-05-22", durationMonths:18, price:32999, currency:"INR", serial:"SM-A556E-DEMO", notes:"Check the service plan before expiry." },
  { product:"Air Purifier", brand:"Philips", category:"Appliances", purchaseDate:"2024-07-08", durationMonths:12, price:11999, currency:"INR", serial:"PH-AC1711-DEMO", notes:"Filter details are in the manual." }
];

let warranties = loadWarranties();
let editingId = null;
let toastTimer;

function createId() {
  return globalThis.crypto?.randomUUID?.() ||
    "warranty-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function normalizeWarranty(item) {
  if (!item || typeof item !== "object") return null;
  const product = String(item.product || "").trim();
  const purchaseDate = String(item.purchaseDate || "");
  const durationMonths = Number(item.durationMonths);
  if (!product || !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) return null;
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 240) return null;
  return {
    id: String(item.id || createId()), product,
    brand: String(item.brand || "").trim(),
    category: String(item.category || "Other"),
    purchaseDate, durationMonths,
    price: item.price === "" || item.price == null ? "" : Number(item.price),
    currency: ["INR","USD","EUR","GBP","CAD"].includes(item.currency) ? item.currency : "INR",
    serial: String(item.serial || "").trim(),
    notes: String(item.notes || "").trim(),
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function loadWarranties() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.map(normalizeWarranty).filter(Boolean) : [];
  } catch { return []; }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(warranties));
    return true;
  } catch {
    showToast("Browser storage is full. Export a backup and remove some data.");
    return false;
  }
}

function todayString() {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateToString(date) {
  return date.getUTCFullYear() + "-" + String(date.getUTCMonth()+1).padStart(2,"0") + "-" + String(date.getUTCDate()).padStart(2,"0");
}

// Calendar-month arithmetic; Jan 31 + one month becomes the last day of February.
function addMonths(dateString, count) {
  const date = parseDate(dateString);
  const wantedDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + count);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth()+1, 0)).getUTCDate();
  date.setUTCDate(Math.min(wantedDay, lastDay));
  return dateToString(date);
}

function daysBetween(fromDate, toDate) {
  return Math.round((parseDate(toDate) - parseDate(fromDate)) / 86400000);
}

function expiryDate(item) {
  return addMonths(item.purchaseDate, item.durationMonths);
}

function getStatus(item) {
  const days = daysBetween(todayString(), expiryDate(item));
  if (days < 0) return { key:"expired", label:"Expired", days };
  if (days <= 30) return { key:"expiring", label:"Expiring soon", days };
  return { key:"active", label:"Active", days };
}

function daysLabel(status) {
  if (status.days < 0) {
    const n = Math.abs(status.days);
    return "Expired " + n + " " + (n === 1 ? "day" : "days") + " ago";
  }
  if (status.days === 0) return "Expires today";
  return status.days + " " + (status.days === 1 ? "day" : "days") + " left";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day:"numeric", month:"short", year:"numeric", timeZone:"UTC"
  }).format(parseDate(value));
}

function formatPrice(item) {
  if (item.price === "" || !Number.isFinite(Number(item.price))) return "";
  try {
    return new Intl.NumberFormat("en-IN", {
      style:"currency", currency:item.currency, maximumFractionDigits:0
    }).format(Number(item.price));
  } catch { return item.currency + " " + item.price; }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function renderStats() {
  const counts = { active:0, expiring:0, expired:0 };
  warranties.forEach(item => counts[getStatus(item).key]++);
  $("#totalCount").textContent = warranties.length;
  $("#activeCount").textContent = counts.active;
  $("#expiringCount").textContent = counts.expiring;
  $("#expiredCount").textContent = counts.expired;
}

function createWarrantyCard(item) {
  const status = getStatus(item);
  const article = document.createElement("article");
  article.className = "w-card";
  const price = formatPrice(item);
  const brand = item.brand ? escapeHTML(item.brand) : "Brand not added";
  const serial = item.serial ? "SERIAL · " + escapeHTML(item.serial) : "NO SERIAL NUMBER";
  article.innerHTML = `
    <div class="card-top"><span class="category">${escapeHTML(item.category)}</span><span class="status ${status.key}">${status.label}</span></div>
    <h3 class="product">${escapeHTML(item.product)}</h3><p class="brand-name">${brand}</p>
    <div class="expiry-row"><div><span class="expiry-label">WARRANTY ENDS</span><strong class="expiry-date">${formatDate(expiryDate(item))}</strong></div><span class="days ${status.key}">${daysLabel(status)}</span></div>
    <div class="meta"><span>${item.durationMonths} months</span>${price ? "<span>" + escapeHTML(price) + "</span>" : ""}<span>Bought ${formatDate(item.purchaseDate)}</span></div>
    <div class="card-bottom"><span class="serial">${serial}</span><div class="card-actions">
      <button class="icon" type="button" data-action="edit" data-id="${escapeHTML(item.id)}" aria-label="Edit ${escapeHTML(item.product)}">✎</button>
      <button class="icon" type="button" data-action="delete" data-id="${escapeHTML(item.id)}" aria-label="Delete ${escapeHTML(item.product)}">×</button>
    </div></div>`;
  if (item.notes) article.title = item.notes;
  return article;
}

function renderWarranties() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const filter = $("#statusFilter").value;
  const filtered = warranties.filter(item => {
    const text = [item.product,item.brand,item.category,item.serial,item.notes].join(" ").toLowerCase();
    return text.includes(query) && (filter === "all" || getStatus(item).key === filter);
  }).sort((a,b) => expiryDate(a).localeCompare(expiryDate(b)));

  $("#warrantyGrid").replaceChildren(...filtered.map(createWarrantyCard));
  $("#resultCount").textContent = filtered.length + (filtered.length === 1 ? " PRODUCT" : " PRODUCTS");
  $("#emptyState").classList.toggle("hidden", warranties.length > 0);
  $("#warrantyGrid").classList.toggle("hidden", warranties.length === 0 || filtered.length === 0);
  $("#noResults").classList.toggle("hidden", warranties.length === 0 || filtered.length > 0);
  renderStats();
}

function openDialog(item = null) {
  editingId = item?.id || null;
  $("#warrantyForm").reset();
  $("#dialogTitle").textContent = item ? "Edit warranty" : "Add a warranty";
  $("#productInput").value = item?.product || "";
  $("#brandInput").value = item?.brand || "";
  $("#categoryInput").value = item?.category || "Electronics";
  $("#purchaseInput").value = item?.purchaseDate || todayString();
  $("#durationInput").value = item?.durationMonths || 12;
  $("#priceInput").value = item?.price ?? "";
  $("#currencyInput").value = item?.currency || "INR";
  $("#serialInput").value = item?.serial || "";
  $("#notesInput").value = item?.notes || "";
  $("#purchaseInput").max = todayString();
  $("#warrantyDialog").showModal();
  $("#productInput").focus();
}

function closeDialog() {
  $("#warrantyDialog").close();
  $("#warrantyForm").reset();
  editingId = null;
}

function handleSave(event) {
  event.preventDefault();
  const data = new FormData($("#warrantyForm"));
  const purchaseDate = String(data.get("purchaseDate") || "");
  const durationMonths = Number(data.get("durationMonths"));
  if (purchaseDate > todayString()) {
    showToast("Purchase date cannot be in the future.");
    return;
  }
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 240) {
    showToast("Enter a warranty length between 1 and 240 months.");
    return;
  }
  const item = normalizeWarranty({
    id: editingId || createId(), product:data.get("product"), brand:data.get("brand"),
    category:data.get("category"), purchaseDate, durationMonths, price:data.get("price"),
    currency:data.get("currency"), serial:data.get("serial"), notes:data.get("notes")
  });
  if (!item) {
    showToast("Check the product name, purchase date and warranty length.");
    return;
  }
  if (editingId) {
    warranties = warranties.map(old => old.id === editingId ? item : old);
    showToast("Warranty details updated.");
  } else {
    warranties.unshift(item);
    showToast("Product added to your register.");
  }
  persist();
  renderWarranties();
  closeDialog();
}

function addSampleData() {
  if (warranties.length && !confirm("Add the three sample products to your existing register?")) return;
  const additions = sampleWarranties.map(item => normalizeWarranty({ ...item, id:createId() })).filter(Boolean);
  warranties = [...warranties, ...additions];
  persist();
  renderWarranties();
  showToast(additions.length + " sample products added.");
}

function exportBackup() {
  if (!warranties.length) {
    showToast("Your register is empty. Add a product first.");
    return;
  }
  const backup = { app:"WarrantyWise", version:1, exportedAt:new Date().toISOString(), warranties };
  const blob = new Blob([JSON.stringify(backup,null,2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "warrantywise-backup.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Your JSON backup is ready.");
}

async function importBackup(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const raw = Array.isArray(parsed) ? parsed : parsed.warranties;
    const incoming = Array.isArray(raw) ? raw.map(normalizeWarranty).filter(Boolean) : [];
    if (!incoming.length) {
      showToast("No valid warranty records were found in that file.");
      return;
    }
    if (!confirm("Replace your current register with " + incoming.length + " imported products? Export a backup first if needed.")) return;
    warranties = incoming;
    persist();
    renderWarranties();
    showToast(incoming.length + " products imported.");
  } catch {
    showToast("That file is not valid JSON.");
  } finally {
    $("#importInput").value = "";
  }
}

$("#addButton").addEventListener("click", () => openDialog());
$("#emptyAddButton").addEventListener("click", () => openDialog());
$("#closeDialog").addEventListener("click", closeDialog);
$("#cancelDialog").addEventListener("click", closeDialog);
$("#warrantyForm").addEventListener("submit", handleSave);
$("#searchInput").addEventListener("input", renderWarranties);
$("#statusFilter").addEventListener("change", renderWarranties);
$("#sampleButton").addEventListener("click", addSampleData);
$("#emptySampleButton").addEventListener("click", addSampleData);
$("#exportButton").addEventListener("click", exportBackup);
$("#importButton").addEventListener("click", () => $("#importInput").click());
$("#importInput").addEventListener("change", event => importBackup(event.target.files[0]));

$("#warrantyGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = warranties.find(entry => entry.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === "edit") {
    openDialog(item);
  } else if (button.dataset.action === "delete") {
    if (!confirm("Delete \"" + item.product + "\" from your register?")) return;
    warranties = warranties.filter(entry => entry.id !== item.id);
    persist();
    renderWarranties();
    showToast("Product removed.");
  }
});

renderWarranties();