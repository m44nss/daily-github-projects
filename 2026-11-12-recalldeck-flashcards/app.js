import {
  loadCards,
  saveCards,
  createCard,
  normalizeCards
} from "./storage.js";
import { createStudyQueue, calculateProgress } from "./study.js";

const $ = selector => document.querySelector(selector);

let cards = loadCards();
let editingId = null;
let activeView = "library";
let studyQueue = [];
let studyIndex = 0;
let isFlipped = false;
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function persist() {
  if (!saveCards(cards)) {
    showToast("Storage is full. Export your deck to keep a backup.");
  }
  renderStats();
}

function renderStats() {
  const progress = calculateProgress(cards);
  $("#totalCount").textContent = progress.total;
  $("#masteredCount").textContent = progress.mastered;
  $("#reviewCount").textContent = progress.toReview;
  $("#progressPercent").textContent = `${progress.percentage}%`;
  $("#progressBar").style.width = `${progress.percentage}%`;
}

function makeTile(card) {
  const article = document.createElement("article");
  article.className = "flashcard-tile";

  const top = document.createElement("div");
  top.className = "tile-top";

  const category = document.createElement("span");
  category.className = "category-pill";
  category.textContent = card.category;

  const status = document.createElement("span");
  status.className = "status-dot";
  status.textContent = card.mastered ? "● MASTERED" : "○ TO REVIEW";
  top.append(category, status);

  const question = document.createElement("h3");
  question.className = "tile-question";
  question.textContent = card.front;

  const answer = document.createElement("p");
  answer.className = "tile-answer";
  answer.textContent = card.back;

  const bottom = document.createElement("div");
  bottom.className = "tile-bottom";

  const label = document.createElement("span");
  label.className = "tile-status";
  label.textContent = card.mastered ? "READY TO MAINTAIN" : "KEEP PRACTISING";

  const actions = document.createElement("div");
  actions.className = "tile-actions";

  const edit = document.createElement("button");
  edit.className = "icon-button";
  edit.type = "button";
  edit.dataset.action = "edit";
  edit.dataset.id = card.id;
  edit.textContent = "✎";
  edit.setAttribute("aria-label", "Edit card");

  const remove = document.createElement("button");
  remove.className = "icon-button";
  remove.type = "button";
  remove.dataset.action = "delete";
  remove.dataset.id = card.id;
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Delete card");

  actions.append(edit, remove);
  bottom.append(label, actions);
  article.append(top, question, answer, bottom);
  return article;
}

function renderLibrary() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const filter = $("#statusFilter").value;

  const filtered = cards.filter(card => {
    const matchesText = [card.front, card.back, card.category]
      .some(value => value.toLowerCase().includes(query));
    const matchesStatus =
      filter === "all" ||
      (filter === "mastered" && card.mastered) ||
      (filter === "review" && !card.mastered);
    return matchesText && matchesStatus;
  });

  $("#cardList").replaceChildren(...filtered.map(makeTile));
  $("#visibleLabel").textContent =
    `${filtered.length} ${filtered.length === 1 ? "card" : "cards"}`;

  $("#emptyState").classList.toggle("hidden", cards.length > 0);
  $("#cardList").classList.toggle("hidden", cards.length === 0 || filtered.length === 0);
  $("#noResults").classList.toggle("hidden", cards.length === 0 || filtered.length > 0);
  renderStats();
}

function setView(view) {
  activeView = view;
  $("#libraryView").classList.toggle("hidden", view !== "library");
  $("#studyView").classList.toggle("hidden", view !== "study");

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });

  if (view === "study") renderStudy();
}

function openDialog(card = null) {
  editingId = card ? card.id : null;
  $("#dialogTitle").textContent = card ? "Edit your card" : "Create a card";
  $("#frontInput").value = card?.front || "";
  $("#backInput").value = card?.back || "";
  $("#categoryInput").value = card?.category || "";
  $("#cardDialog").showModal();
  $("#frontInput").focus();
}

function closeDialog() {
  $("#cardDialog").close();
  $("#cardForm").reset();
  editingId = null;
}

function saveForm(event) {
  event.preventDefault();

  const fields = {
    front: $("#frontInput").value,
    back: $("#backInput").value,
    category: $("#categoryInput").value
  };

  if (!fields.front.trim() || !fields.back.trim()) {
    showToast("Add both a question and an answer.");
    return;
  }

  if (editingId) {
    cards = cards.map(card =>
      card.id === editingId
        ? { ...card, ...fields, front: fields.front.trim(), back: fields.back.trim(),
            category: fields.category.trim() || "General" }
        : card
    );
    showToast("Card updated.");
  } else {
    cards.unshift(createCard(fields));
    showToast("New card added.");
  }

  persist();
  renderLibrary();
  closeDialog();
}

function startStudy(shuffle = false) {
  if (!cards.length) {
    showToast("Add a few cards before starting a session.");
    setView("library");
    return;
  }

  studyQueue = createStudyQueue(cards, shuffle);
  studyIndex = 0;
  isFlipped = false;
  setView("study");
  renderStudy();
}

function currentStudyCard() {
  const id = studyQueue[studyIndex];
  return cards.find(card => card.id === id);
}

function renderStudy() {
  const hasQueue = studyQueue.length > 0;
  const complete = hasQueue && studyIndex >= studyQueue.length;

  $("#studyWelcome").classList.toggle("hidden", hasQueue);
  $("#studyStage").classList.toggle("hidden", !hasQueue || complete);
  $("#studyComplete").classList.toggle("hidden", !complete);

  if (!hasQueue || complete) return;

  const card = currentStudyCard();
  if (!card) {
    studyIndex += 1;
    renderStudy();
    return;
  }

  $("#studyPosition").textContent =
    `CARD ${studyIndex + 1} OF ${studyQueue.length}`;
  $("#studyCategory").textContent = card.category.toUpperCase();
  $("#studyPrompt").textContent = card.front;
  $("#studyAnswer").textContent = card.back;
  $("#studyProgress").style.width =
    `${(studyIndex / studyQueue.length) * 100}%`;

  isFlipped = false;
  $("#studyCard").classList.remove("flipped");
  $("#studyCard").setAttribute("aria-pressed", "false");
  $("#previousBtn").disabled = studyIndex === 0;
  $("#nextBtn").disabled = studyIndex === studyQueue.length - 1;
}

function flipCard() {
  if (!currentStudyCard() || $("#studyStage").classList.contains("hidden")) return;
  isFlipped = !isFlipped;
  $("#studyCard").classList.toggle("flipped", isFlipped);
  $("#studyCard").setAttribute("aria-pressed", String(isFlipped));
}

function moveStudy(direction) {
  if (!studyQueue.length) return;
  const nextIndex = studyIndex + direction;
  if (nextIndex < 0 || nextIndex >= studyQueue.length) return;
  studyIndex = nextIndex;
  renderStudy();
}

function markCurrent(result) {
  const current = currentStudyCard();
  if (!current) return;

  cards = cards.map(card =>
    card.id === current.id
      ? { ...card, mastered: result === "mastered" }
      : card
  );

  persist();
  studyIndex += 1;
  renderStudy();
}

function exportDeck() {
  if (!cards.length) {
    showToast("Your deck is empty. Add cards first.");
    return;
  }

  const blob = new Blob(
    [JSON.stringify({ app: "RecallDeck", version: 1, cards }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "recalldeck-backup.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Deck backup downloaded.");
}

async function importDeck(file) {
  if (!file) return;

  try {
    const parsed = JSON.parse(await file.text());
    const incoming = normalizeCards(Array.isArray(parsed) ? parsed : parsed.cards);

    if (!incoming.length) {
      showToast("No valid flashcards found in that JSON file.");
      return;
    }

    const imported = incoming.map(card => createCard(card));
    cards = [...cards, ...imported];
    persist();
    renderLibrary();
    showToast(`Imported ${imported.length} cards.`);
  } catch {
    showToast("That file is not valid JSON.");
  } finally {
    $("#importInput").value = "";
  }
}

async function loadSampleDeck() {
  try {
    const response = await fetch("./sample-deck.json");
    if (!response.ok) throw new Error("Sample deck unavailable");
    const sample = normalizeCards(await response.json());
    const additions = sample.map(card => createCard(card));
    cards = [...cards, ...additions];
    persist();
    renderLibrary();
    showToast(`Added ${additions.length} sample cards.`);
  } catch {
    showToast("Could not load the sample deck. Check Live Server is running.");
  }
}

// Navigation and card actions
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

$("#addCardBtn").addEventListener("click", () => openDialog());
$("#emptyAddBtn").addEventListener("click", () => openDialog());
$("#studyNowBtn").addEventListener("click", () => startStudy());
$("#beginStudyBtn").addEventListener("click", () => startStudy());
$("#studyAgainBtn").addEventListener("click", () => startStudy());
$("#shuffleBtn").addEventListener("click", () => startStudy(true));

$("#cardForm").addEventListener("submit", saveForm);
$("#closeDialogBtn").addEventListener("click", closeDialog);
$("#cancelDialogBtn").addEventListener("click", closeDialog);

$("#cardList").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const card = cards.find(item => item.id === button.dataset.id);
  if (!card) return;

  if (button.dataset.action === "edit") {
    openDialog(card);
  } else if (button.dataset.action === "delete") {
    if (!confirm("Delete this flashcard?")) return;
    cards = cards.filter(item => item.id !== card.id);
    studyQueue = studyQueue.filter(id => id !== card.id);
    persist();
    renderLibrary();
    renderStudy();
    showToast("Card deleted.");
  }
});

$("#searchInput").addEventListener("input", renderLibrary);
$("#statusFilter").addEventListener("change", renderLibrary);
$("#studyCard").addEventListener("click", flipCard);
$("#previousBtn").addEventListener("click", () => moveStudy(-1));
$("#nextBtn").addEventListener("click", () => moveStudy(1));

document.querySelectorAll("[data-result]").forEach(button => {
  button.addEventListener("click", () => markCurrent(button.dataset.result));
});

$("#exportBtn").addEventListener("click", exportDeck);
$("#importBtn").addEventListener("click", () => $("#importInput").click());
$("#importInput").addEventListener("change", event => importDeck(event.target.files[0]));
$("#loadSampleBtn").addEventListener("click", loadSampleDeck);

document.addEventListener("keydown", event => {
  if (activeView !== "study" || $("#cardDialog").open) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

  if (event.code === "Space") {
    event.preventDefault();
    flipCard();
  } else if (event.key === "ArrowRight") {
    moveStudy(1);
  } else if (event.key === "ArrowLeft") {
    moveStudy(-1);
  }
});

renderLibrary();
