const $ = selector => document.querySelector(selector);
const STORAGE_KEY = "coverkeeper.items.v1";
let items = readItems();
let editingId = null;
let toastTimer;

function readItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(isValidItem) : [];
  } catch {
    return [];
  }
}
function isValidItem(item) {
  if (!item || typeof item.id !== "string" || typeof item.name !== "string" ||
      !item.name.trim() || typeof item.purchaseDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.purchaseDate)) return false;
  const parsed = parseDate(item.purchaseDate);
  const months = Number(item.months);
  const validPrice = item.price === "" || item.price == null ||
    (Number.isFinite(Number(item.price)) && Number(item.price) >= 0);
  return !Number.isNaN(parsed.getTime()) && localDate(parsed) === item.purchaseDate &&
    Number.isInteger(months) && months >= 1 && months <= 120 && validPrice;
}
function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    notify("Browser storage is full. Export a backup and remove some records.", true);
  }
}
function localDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
function toISO(date) {
  return localDate(date);
}
function addMonths(date, amount) {
  const year = date.getFullYear();
  const month = date.getMonth() + amount;
  const day = date.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay), 12);
}
function expiryDate(item) {
  return addMonths(parseDate(item.purchaseDate), Number(item.months));
}
function dayDifference(from, to) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}
function warrantyState(item) {
  const today = parseDate(localDate());
  const expiry = expiryDate(item);
  const days = dayDifference(today, expiry);
  if (days < 0) return { key: "expired", label: `Expired ${Math.abs(days)}d ago`, days };
  if (days === 0) return { key: "today", label: "Expires today", days };
  if (days <= 30) return { key: "soon", label: `${days} days left`, days };
  return { key: "active", label: `${days} days left`, days };
}
function formatDate(value) {
  return parseDate(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatMoney(value) {
  if (value === "" || value === null || value === undefined) return "Price not added";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function notify(text, error = false) {
  const toast = $("#toast");
  toast.textContent = text;
  toast.style.borderColor = error ? "#9c5b58" : "#477263";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function iconFor(category) {
  return ({ Electronics: "⌁", Appliances: "⌂", Computers: "▣", "Home & furniture": "⌂", Other: "◇" })[category] || "◇";
}
function renderStats() {
  const states = items.map(warrantyState);
  $("#totalCount").textContent = items.length;
  $("#coveredCount").textContent = states.filter(s => s.days >= 0).length;
  $("#soonCount").textContent = states.filter(s => s.days >= 0 && s.days <= 30).length;
  $("#expiredCount").textContent = states.filter(s => s.days < 0).length;
}
function renderItems() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const filter = $("#statusFilter").value;
  const filtered = items
    .map(item => ({ item, state: warrantyState(item) }))
    .filter(({ item, state }) => {
      const haystack = [item.name, item.category, item.store, item.notes].join(" ").toLowerCase();
      const matchesSearch = haystack.includes(query);
      const matchesFilter = filter === "all" ||
        (filter === "active" && state.days > 30) ||
        (filter === "soon" && state.days >= 0 && state.days <= 30) ||
        (filter === "expired" && state.days < 0);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => expiryDate(a.item) - expiryDate(b.item));

  $("#resultCount").textContent = `${filtered.length} ${filtered.length === 1 ? "ITEM" : "ITEMS"}`;
  const list = $("#itemList");
  if (!filtered.length) {
    const hasItems = items.length > 0;
    list.innerHTML = `<div class="empty"><div><div class="symbol">⌑</div><strong>${hasItems ? "No matching purchases" : "Your vault is ready"}</strong><p>${hasItems ? "Try another search or change the status filter." : "Add your first purchase or load the demo items to explore the tracker."}</p>${hasItems ? "" : '<button class="btn secondary" type="button" id="emptyDemo">Load demo items</button>'}</div></div>`;
    $("#emptyDemo")?.addEventListener("click", loadDemo);
    renderStats();
    return;
  }

  list.innerHTML = filtered.map(({ item, state }) => {
    const expiry = toISO(expiryDate(item));
    const totalDays = Math.max(1, dayDifference(parseDate(item.purchaseDate), expiryDate(item)));
    const remaining = Math.max(0, Math.min(100, Math.round((state.days / totalDays) * 100)));
    const statusClass = state.key === "today" ? "today" : state.key;
    const statusLabel = state.key === "active" ? "ACTIVE" :
      state.key === "soon" ? "EXPIRING SOON" :
      state.key === "today" ? "EXPIRES TODAY" : "EXPIRED";
    const details = [item.store, item.category].filter(Boolean).map(escapeHTML).join(" · ");
    return `<article class="item" data-id="${escapeHTML(item.id)}">
      <div class="item-top"><div style="display:flex;gap:10px;min-width:0"><div class="item-icon">${iconFor(item.category)}</div><div style="min-width:0"><div class="item-name">${escapeHTML(item.name)}</div><div class="item-meta">${details || "Purchase details"}</div></div></div><span class="status ${statusClass}">${statusLabel}</span></div>
      <div class="progress" aria-label="${remaining}% of warranty time remaining"><span style="width:${remaining}%"></span></div>
      <div class="item-bottom"><span>Expires <strong>${formatDate(expiry)}</strong></span><span>${escapeHTML(state.label)}</span></div>
      <div class="item-bottom" style="margin-top:5px"><span>${escapeHTML(formatMoney(item.price))}</span><span>${Number(item.months)} month cover</span></div>
      ${item.notes ? `<p class="item-meta" style="margin-top:9px;overflow-wrap:anywhere">${escapeHTML(item.notes)}</p>` : ""}
      <div class="item-actions"><button type="button" data-action="edit" data-id="${escapeHTML(item.id)}">Edit details</button><button class="delete" type="button" data-action="delete" data-id="${escapeHTML(item.id)}">Remove</button></div>
    </article>`;
  }).join("");
  renderStats();
}
function resetForm() {
  editingId = null;
  $("#itemForm").reset();
  $("#purchaseDate").value = localDate();
  $("#months").value = 12;
  $("#formTitle").textContent = "Add a purchase";
  $("#saveBtn").textContent = "Save purchase ↗";
  $("#cancelEdit").hidden = true;
}
function formData() {
  return {
    name: $("#itemName").value.trim(),
    category: $("#category").value,
    store: $("#store").value.trim(),
    purchaseDate: $("#purchaseDate").value,
    months: Number($("#months").value),
    price: $("#price").value === "" ? "" : Number($("#price").value),
    notes: $("#notes").value.trim()
  };
}
function handleSubmit(event) {
  event.preventDefault();
  const data = formData();
  if (!data.name || !data.purchaseDate || !Number.isInteger(data.months) || data.months < 1 || data.months > 120) {
    notify("Add a product name, purchase date and 1–120 warranty months.", true);
    return;
  }
  if (data.price !== "" && (!Number.isFinite(data.price) || data.price < 0)) {
    notify("Enter a valid non-negative price.", true);
    return;
  }
  if (editingId) {
    items = items.map(item => item.id === editingId ? { ...item, ...data } : item);
    notify("Purchase details updated.");
  } else {
    items.unshift({ id: makeId(), ...data, createdAt: new Date().toISOString() });
    notify("Purchase saved to your vault.");
  }
  saveItems();
  resetForm();
  renderItems();
}
function makeId() {
  return globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function editItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  editingId = id;
  $("#itemName").value = item.name;
  $("#category").value = item.category || "Other";
  $("#store").value = item.store || "";
  $("#purchaseDate").value = item.purchaseDate;
  $("#months").value = item.months;
  $("#price").value = item.price ?? "";
  $("#notes").value = item.notes || "";
  $("#formTitle").textContent = "Edit purchase";
  $("#saveBtn").textContent = "Save changes ↗";
  $("#cancelEdit").hidden = false;
  $("#itemName").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function removeItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item || !confirm(`Remove "${item.name}" from your warranty vault?`)) return;
  items = items.filter(entry => entry.id !== id);
  saveItems();
  renderItems();
  notify("Purchase removed.");
}
function shiftDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
function loadDemo() {
  if (items.length && !confirm("Add four sample purchases to your existing vault?")) return;
  const today = parseDate(localDate());
  const demo = [
    { id: "demo-laptop", name: "Everyday laptop", category: "Computers", store: "Tech Store", purchaseDate: toISO(addMonths(today, -11)), months: 24, price: 58999, notes: "Serial: DEMO-LAP-204" },
    { id: "demo-phone", name: "Android smartphone", category: "Electronics", store: "Mobile Hub", purchaseDate: toISO(shiftDays(addMonths(today, -11), -12)), months: 12, price: 24999, notes: "Expiring soon — check extended cover" },
    { id: "demo-blender", name: "Kitchen blender", category: "Appliances", store: "Home Market", purchaseDate: toISO(addMonths(today, -18)), months: 12, price: 3299, notes: "Demo record — warranty expired" },
    { id: "demo-chair", name: "Ergonomic chair", category: "Home & furniture", store: "Office Living", purchaseDate: toISO(addMonths(today, -5)), months: 12, price: 8999, notes: "Keep invoice number with the receipt" }
  ];
  const existing = new Set(items.map(item => item.id));
  items = [...demo.filter(item => !existing.has(item.id)), ...items];
  saveItems();
  renderItems();
  notify("Four demo purchases added. Edit or remove them any time.");
}
function exportBackup() {
  const payload = { app: "CoverKeeper", version: 1, exportedAt: new Date().toISOString(), items };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `coverkeeper-backup-${localDate()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  notify("Backup exported.");
}
function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const incoming = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(incoming) || !incoming.every(isValidItem)) throw new Error("Invalid backup structure.");
      const normalized = incoming.map(item => ({
        id: makeId(), name: item.name.slice(0, 70), category: item.category || "Other",
        store: String(item.store || "").slice(0, 45), purchaseDate: item.purchaseDate,
        months: Number(item.months), price: item.price === "" ? "" : Number(item.price),
        notes: String(item.notes || "").slice(0, 240)
      }));
      if (!confirm(`Import ${normalized.length} records? Existing purchases will be kept.`)) return;
      items = [...normalized, ...items];
      saveItems();
      renderItems();
      notify(`${normalized.length} purchases imported.`);
    } catch (error) {
      notify(error.message || "Could not read that backup file.", true);
    } finally {
      $("#fileInput").value = "";
    }
  };
  reader.onerror = () => notify("Could not read the selected file.", true);
  reader.readAsText(file);
}

$("#itemForm").addEventListener("submit", handleSubmit);
$("#cancelEdit").addEventListener("click", resetForm);
$("#searchInput").addEventListener("input", renderItems);
$("#statusFilter").addEventListener("change", renderItems);
$("#itemList").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") editItem(button.dataset.id);
  if (button.dataset.action === "delete") removeItem(button.dataset.id);
});
$("#loadDemo").addEventListener("click", loadDemo);
$("#exportBtn").addEventListener("click", exportBackup);
$("#importBtn").addEventListener("click", () => $("#fileInput").click());
$("#fileInput").addEventListener("change", event => importBackup(event.target.files[0]));

$("#purchaseDate").value = localDate();
renderItems();
