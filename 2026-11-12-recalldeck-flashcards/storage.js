const STORAGE_KEY = "recalldeck.cards.v1";

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadCards() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return normalizeCards(saved);
  } catch {
    return [];
  }
}

export function saveCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    return true;
  } catch {
    return false;
  }
}

export function createCard({ front, back, category = "General" }) {
  return {
    id: makeId(),
    front: String(front).trim(),
    back: String(back).trim(),
    category: String(category).trim() || "General",
    mastered: false,
    createdAt: new Date().toISOString()
  };
}

export function normalizeCards(items) {
  if (!Array.isArray(items)) return [];

  return items
    .filter(item =>
      item &&
      typeof item.front === "string" &&
      typeof item.back === "string" &&
      item.front.trim() &&
      item.back.trim()
    )
    .map(item => ({
      id: typeof item.id === "string" && item.id ? item.id : makeId(),
      front: item.front.trim(),
      back: item.back.trim(),
      category: typeof item.category === "string" && item.category.trim()
        ? item.category.trim()
        : "General",
      mastered: item.mastered === true,
      createdAt: item.createdAt || new Date().toISOString()
    }));
}
