const form = document.querySelector("#product-form");
const list = document.querySelector("#product-list");
const summary = document.querySelector("#summary");
const clearButton = document.querySelector("#clear-all");
const demoButton = document.querySelector("#load-demo");

let products = [];
const unitGroups = {
  g: { group: "weight", factor: 1, label: "g" },
  kg: { group: "weight", factor: 1000, label: "g" },
  ml: { group: "volume", factor: 1, label: "ml" },
  l: { group: "volume", factor: 1000, label: "ml" },
  pcs: { group: "count", factor: 1, label: "pcs" }
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2
  }).format(value);
}

function normalizedQuantity(product) {
  return product.quantity * unitGroups[product.unit].factor;
}

function pricePerBaseUnit(product) {
  return product.price / normalizedQuantity(product);
}

function addProduct(product) {
  products.push({ ...product, id: crypto.randomUUID() });
  render();
}

function render() {
  if (!products.length) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">＋</span><strong>Your comparison starts here</strong><span>Add products using the form. Try the examples below.</span></div>';
    summary.innerHTML = '<span class="summary-icon">✦</span><span>Add two products to see which offers better value.</span>';
    return;
  }

  const groupCounts = products.reduce((counts, product) => {
    const group = unitGroups[product.unit].group;
    counts[group] = (counts[group] || 0) + 1;
    return counts;
  }, {});
  const comparableGroup = Object.keys(groupCounts).find(group => groupCounts[group] >= 2);
  const comparable = comparableGroup
    ? products.filter(product => unitGroups[product.unit].group === comparableGroup)
    : [];
  const winner = comparable.length > 1
    ? comparable.reduce((best, item) => pricePerBaseUnit(item) < pricePerBaseUnit(best) ? item : best)
    : null;

  const sorted = [...products].sort((a, b) => {
    const sameGroup = unitGroups[a.unit].group === unitGroups[b.unit].group;
    if (sameGroup) return pricePerBaseUnit(a) - pricePerBaseUnit(b);
    if (a === winner) return -1;
    if (b === winner) return 1;
    return 0;
  });

  list.innerHTML = sorted.map(product => {
    const isBest = winner && product.id === winner.id;
    const unitLabel = unitGroups[product.unit].label;
    const normalized = pricePerBaseUnit(product);
    return `
      <article class="product ${isBest ? "best" : ""}">
        <div><div class="product-name">${escapeHtml(product.name)}</div>
        <div class="product-meta">${formatMoney(product.price)} for ${product.quantity} ${product.unit}</div>
        ${isBest ? '<span class="best-tag">BEST VALUE</span>' : ""}</div>
        <div class="product-price">${formatMoney(normalized)}<div class="product-unit">per ${unitLabel}</div></div>
        <button class="remove" type="button" data-remove="${product.id}" aria-label="Remove ${escapeHtml(product.name)}">Remove ×</button>
      </article>`;
  }).join("");

  if (winner) {
    const saving = comparable.length > 1
      ? Math.max(...comparable.map(pricePerBaseUnit)) - pricePerBaseUnit(winner)
      : 0;
    summary.innerHTML = `<span class="summary-icon">✦</span><span><strong>${escapeHtml(winner.name)}</strong> is the best value at ${formatMoney(pricePerBaseUnit(winner))} per ${unitGroups[winner.unit].label}.${saving > 0 ? " It has the lowest unit price in this group." : ""}</span>`;
  } else {
    summary.innerHTML = '<span class="summary-icon">ⓘ</span><span>Add another product from the same category (weight, volume, or pieces) to compare fairly.</span>';
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(form);
  const product = {
    name: String(data.get("name")).trim(),
    price: Number(data.get("price")),
    quantity: Number(data.get("quantity")),
    unit: String(data.get("unit"))
  };
  if (!product.name || !Number.isFinite(product.price) || product.price <= 0 ||
      !Number.isFinite(product.quantity) || product.quantity <= 0) return;
  addProduct(product);
  form.reset();
  document.querySelector("#product-name").focus();
});

list.addEventListener("click", event => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  products = products.filter(product => product.id !== button.dataset.remove);
  render();
});

clearButton.addEventListener("click", () => {
  products = [];
  render();
});

demoButton.addEventListener("click", () => {
  products = [];
  addProduct({ name: "Sunrise oats — 500 g", price: 120, quantity: 500, unit: "g" });
  addProduct({ name: "Harvest oats — 1 kg", price: 210, quantity: 1, unit: "kg" });
  addProduct({ name: "Value oats — 750 g", price: 165, quantity: 750, unit: "g" });
});

render();
