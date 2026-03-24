const SUPABASE_URL = "https://sjqmojnweiabqryoawgd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcW1vam53ZWlhYnFyeW9hd2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzY1MDQsImV4cCI6MjA4OTg1MjUwNH0.RtJpd_S9vfU5Pe3z2LgivGKSTlOjfm0uRWDy-qNBA9w";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PRESET_COLORS = [
   { name: "Weiß", hex: "#ffffff" },
  { name: "Schwarz", hex: "#111111" },
  { name: "Grau", hex: "#999999" },
  { name: "Dunkelgrau", hex: "#555555" },
   { name: "Pink", hex: "#e200d7" },
   { name: "Blau", hex: "#2b4afa" },
    { name: "Hellblau", hex: "#39b0ff" },
  { name: "Grün", hex: "#27f520" },
  { name: "Gelb", hex: "#fffb00" },
  { name: "Lila", hex: "#824efc" },
  { name: "Orange", hex: "#fd8726" },
  { name: "Rot", hex: "#d31111" },
  { name: "Grün/Gelb", hex: "#bbfd04" },
    { name: "Beige", hex: "#ddc7a0" },
     { name: "Rosa", hex: "#ff8da1" },
      { name: "Gold", hex: "#ffd700" },
       { name: "Knochen", hex: "#d6d4cf" },
];

const PRODUCT_LABELS = {
  rabbit: "Hase",
  lumi: "Lumi",
  text: "Schriftzug",
  other: "Weitere Produkte"
};

const RABBIT_PRICES = {
  "11 cm": 6,
  "15 cm": 9,
  "20 cm": 12
};

const LUMI_PRICE = 8.5;

const state = {
  draft: loadDraft(),
  currentMode: loadDraft().mode || "order",
  currentProduct: "rabbit",
  orders: [],
  colorModalTarget: null,
  selectedColorSourceBtn: null,
  selectedFavoriteId: null,
  confirmAction: null,
  undoStack: loadUndoStack(),
  priceDialogMode: null,
  priceDialogValue: "",
  editingOrderId: null
};

const els = {
  productSpecificArea: document.getElementById("productSpecificArea"),
  draftSummary: document.getElementById("draftSummary"),
  draftItems: document.getElementById("draftItems"),
  draftModeLabel: document.getElementById("draftModeLabel"),
  draftItemCount: document.getElementById("draftItemCount"),
  draftTotalPrice: document.getElementById("draftTotalPrice"),
  primaryActionBtn: document.getElementById("primaryActionBtn"),
  saveCollectionBtn: document.getElementById("saveCollectionBtn"),
  orderFields: document.getElementById("orderFields"),
  customerName: document.getElementById("customerName"),
  description: document.getElementById("description"),
  priorityChoices: document.getElementById("priorityChoices"),
  openOrderTotal: document.getElementById("openOrderTotal"),
  archiveTotal: document.getElementById("archiveTotal"),
  ordersList: document.getElementById("ordersList"),
  stockList: document.getElementById("stockList"),
  archiveList: document.getElementById("archiveList"),
  orderSearch: document.getElementById("orderSearch"),
  stockSearch: document.getElementById("stockSearch"),
  orderPriorityFilter: document.getElementById("orderPriorityFilter"),
  orderStatusFilter: document.getElementById("orderStatusFilter"),
  colorDialog: document.getElementById("colorDialog"),
  colorNameInput: document.getElementById("colorNameInput"),
  favoriteColorNameInput: document.getElementById("favoriteColorNameInput"),
  customColorPicker: document.getElementById("customColorPicker"),
  liveColorPreview: document.getElementById("liveColorPreview"),
  presetColors: document.getElementById("presetColors"),
  favoriteColors: document.getElementById("favoriteColors"),
  applyColorBtn: document.getElementById("applyColorBtn"),
  toggleFavoriteColorBtn: document.getElementById("toggleFavoriteColorBtn"),
  closeColorDialog: document.getElementById("closeColorDialog"),
  priceDialog: document.getElementById("priceDialog"),
  priceDialogTitle: document.getElementById("priceDialogTitle"),
  priceDialogValue: document.getElementById("priceDialogValue"),
  closePriceDialog: document.getElementById("closePriceDialog"),
  applyPriceBtn: document.getElementById("applyPriceBtn"),
  clearPriceBtn: document.getElementById("clearPriceBtn"),
  confirmDialog: document.getElementById("confirmDialog"),
  confirmText: document.getElementById("confirmText"),
  confirmOkBtn: document.getElementById("confirmOkBtn"),
  confirmCancelBtn: document.getElementById("confirmCancelBtn"),
  closeConfirmDialog: document.getElementById("closeConfirmDialog"),
  undoBtn: document.getElementById("undoBtn")
};

function loadDraft() {
  const raw = localStorage.getItem("print_draft_v5");
  if (!raw) return { mode: "order", items: [] };
  try {
    return JSON.parse(raw);
  } catch {
    return { mode: "order", items: [] };
  }
}

function saveDraft() {
  localStorage.setItem("print_draft_v5", JSON.stringify(state.draft));
}

function loadUndoStack() {
  const raw = localStorage.getItem("print_undo_stack_v5");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUndoStack() {
  localStorage.setItem("print_undo_stack_v5", JSON.stringify(state.undoStack.slice(-25)));
}

function pushUndo(entry) {
  state.undoStack.push(entry);
  saveUndoStack();
}

function euro(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value || 0));
}

function parseEuroInputString(str) {
  if (!str) return 0;
  const normalized = str.replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function formatDisplayValueFromRaw(raw) {
  return euro(parseEuroInputString(raw));
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeHex(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return "#d4af37";
  return hex;
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
}

function showError(fieldName, message) {
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (errorEl) errorEl.textContent = message;
  const input = document.getElementById(fieldName);
  if (input) input.classList.add("input-error");
}

function getActivePriority() {
  const active = document.querySelector("#priorityChoices .choice-btn.active");
  return active ? active.dataset.value : "";
}

function setActiveChoice(container, value) {
  container.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });
}

function clearActiveColorChoice() {
  document.querySelectorAll(".preset-color-btn").forEach((btn) => {
    btn.classList.remove("active-color-choice");
  });
}

function setActiveColorChoice(buttonEl) {
  clearActiveColorChoice();
  if (buttonEl) {
    buttonEl.classList.add("active-color-choice");
    state.selectedColorSourceBtn = buttonEl;
  } else {
    state.selectedColorSourceBtn = null;
  }
}

function lockPageScroll() {
  document.body.classList.add("modal-open");
  document.documentElement.classList.add("modal-open");
}

function unlockPageScroll() {
  document.body.classList.remove("modal-open");
  document.documentElement.classList.remove("modal-open");
}

function closeAllModals() {
  [els.colorDialog, els.priceDialog, els.confirmDialog].forEach((dialog) => {
    if (dialog && dialog.open) dialog.close();
  });
  unlockPageScroll();
}

function openSingleModal(dialogEl) {
  closeAllModals();
  lockPageScroll();
  dialogEl.showModal();

  const scrollArea = dialogEl.querySelector(".modal-body-scroll");
  if (scrollArea) {
    requestAnimationFrame(() => {
      scrollArea.scrollTop = 0;
    });
  }
}

async function loadFavoriteColorsFromDb() {
  const { data, error } = await supabaseClient
    .from("favorite_colors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function saveFavoriteColorToDb(name, hex) {
  const cleanName = name.trim();
  if (!cleanName) {
    alert("Bitte gib zuerst einen Namen für den Favoriten ein.");
    return false;
  }

  const { error } = await supabaseClient
    .from("favorite_colors")
    .insert({ name: cleanName, hex });

  if (error) {
    console.error(error);
    alert("Favorit konnte nicht gespeichert werden.");
    return false;
  }

  await renderColorButtons();
  return true;
}

async function deleteFavoriteColorFromDb(id) {
  const { error } = await supabaseClient
    .from("favorite_colors")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Favorit konnte nicht gelöscht werden.");
    return false;
  }

  await renderColorButtons();
  return true;
}

function getCurrentProductConfig() {
  const mode = state.currentMode;
  const product = state.currentProduct;

if (product === "rabbit") {
  return {
    sizeRequired: true,
    sizeOptions: ["11 cm", "15 cm", "20 cm"],
    rabbitColorModeEnabled: true,
    colorsMulti: [
      { key: "ears", label: "Ohren" },
      { key: "body", label: "Körper" },
      { key: "tail", label: "Popo" }
    ],
    colorsSingle: [
      { key: "main", label: "Farbe" }
    ],
    verticalColors: true,
    showPricePicker: false
  };
}

  if (product === "lumi") {
    return {
      sizeRequired: false,
      colors: [{ key: "body", label: "Farbe" }],
      verticalColors: false,
      showPricePicker: false
    };
  }

  if (product === "text") {
    return {
      productNameRequired: true,
      manualSize: true,
      sizeLabel: "Größe",
      colors: [
        { key: "c1", label: "Erste Farbe" },
        { key: "c2", label: "Zweite Farbe" }
      ],
      extraColorAllowed: true,
      verticalColors: false,
      showPricePicker: mode === "order"
    };
  }

  return {
    productNameRequired: true,
    manualSize: true,
    sizeLabel: "Größe",
    colors: [
      { key: "c1", label: "Erste Farbe" },
      { key: "c2", label: "Zweite Farbe" }
    ],
    extraColorAllowed: true,
    verticalColors: false,
    showPricePicker: mode === "order"
  };
}

function renderProductForm() {
  const config = getCurrentProductConfig();
  const isOrder = state.currentMode === "order";

  els.orderFields.classList.toggle("hidden", !isOrder);
  els.draftSummary.classList.toggle("hidden", !isOrder);
  els.primaryActionBtn.textContent = isOrder ? "+ Position hinzufügen" : "Eintrag speichern";

  let html = "";

  if (config.productNameRequired) {
    html += `
      <div class="field">
        <label for="productName">Produktname *</label>
        <input id="productName" type="text" placeholder="z. B. Schild, Name, Deko..." />
        <small class="error" data-error-for="productName"></small>
      </div>
    `;
  }

  if (config.sizeRequired) {
    html += `
      <div class="field">
        <label>Größe *</label>
        <div class="choice-row" id="sizeChoices">
          ${config.sizeOptions.map((size, idx) => `
            <button type="button" class="size-btn ${idx === 0 ? "active" : ""}" data-value="${size}">
              ${size}
            </button>
          `).join("")}
        </div>
        <small class="error" data-error-for="size"></small>
      </div>
    `;
  }

  if (config.manualSize) {
    html += `
      <div class="field">
        <label for="manualSizeInput">${config.sizeLabel || "Größe"} *</label>
        <input id="manualSizeInput" type="text" placeholder="z. B. 20 cm, 30x10 cm, klein..." />
        <small class="error" data-error-for="manualSize"></small>
      </div>
    `;
  }

if (config.rabbitColorModeEnabled) {
  html += `
    <div class="field">
      <label>Farbmodus *</label>
      <div class="choice-row" id="rabbitColorModeChoices">
        <button type="button" class="choice-btn active" data-value="multi">Mehrfarbig</button>
        <button type="button" class="choice-btn" data-value="single">Einfarbig</button>
      </div>
      <small class="error" data-error-for="rabbitColorMode"></small>
    </div>
  `;
}

html += `
  <div class="section-box">
    <label>Farben *</label>
    <div id="colorFields" class="${config.verticalColors ? "color-row-vertical" : "color-row"}"></div>
    <small class="error" data-error-for="colors"></small>
    ${config.extraColorAllowed ? `
      <div class="form-actions">
        <button type="button" id="addExtraColorBtn" class="btn btn-outline">Weitere Farbe hinzufügen</button>
      </div>
    ` : ""}
  </div>
`;

  if (isOrder && config.showPricePicker) {
    html += `
      <div class="field">
        <label>Preis *</label>
        <button type="button" id="manualPriceBtn" class="price-picker-btn">Preis eingeben</button>
        <input id="manualPriceRaw" type="hidden" value="" />
        <small class="error" data-error-for="price"></small>
      </div>
    `;
  }

  html += `
    <div class="section-box">
      <label>Menge *</label>
      <div class="quantity-grid" id="quantityChoices">
        ${[1,2,3,4,5,6,7,8,9].map((n) => `
          <button type="button" class="quantity-btn ${n === 1 ? "active" : ""}" data-value="${n}">${n}</button>
        `).join("")}
      </div>

      <div class="field" style="margin-top:12px;">
        <label for="customQuantity">Eigene Menge (optional)</label>
        <input id="customQuantity" type="text" inputmode="numeric" placeholder="Nur benutzen wenn mehr als 9" />
      </div>
      <small class="error" data-error-for="quantity"></small>
    </div>
  `;

  els.productSpecificArea.innerHTML = html;
let initialColors = config.colors || [];

if (config.rabbitColorModeEnabled) {
  initialColors = config.colorsMulti;
} else if (config.colors) {
  initialColors = config.colors;
}

renderColorFields(initialColors);

  const sizeChoices = document.getElementById("sizeChoices");
  if (sizeChoices) {
    sizeChoices.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => setActiveChoice(sizeChoices, btn.dataset.value));
    });
  }

  const quantityChoices = document.getElementById("quantityChoices");
  quantityChoices.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => setActiveChoice(quantityChoices, btn.dataset.value));
  });

const rabbitColorModeChoices = document.getElementById("rabbitColorModeChoices");
if (rabbitColorModeChoices) {
  rabbitColorModeChoices.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveChoice(rabbitColorModeChoices, btn.dataset.value);

      const selectedMode = btn.dataset.value;
      const colorsToRender = selectedMode === "single"
        ? config.colorsSingle
        : config.colorsMulti;

      renderColorFields(colorsToRender);
    });
  });
}

  const manualPriceBtn = document.getElementById("manualPriceBtn");
  if (manualPriceBtn) {
    manualPriceBtn.addEventListener("click", () => {
      const raw = document.getElementById("manualPriceRaw")?.value || "";
      openPriceDialog("form-item", raw, "Preis eingeben");
    });
  }
}

function renderColorFields(colors) {
  const wrap = document.getElementById("colorFields");
  if (!wrap) return;

  wrap.innerHTML = colors.map((color) => {
    const slotLabel = color.slotLabel || color.label || "Farbe";
    const colorName = color.colorName || "";
    const hex = color.hex || "#d4af37";

    return `
      <button
        type="button"
        class="color-chip-btn"
        data-color-key="${color.key}"
        data-slot-label="${escapeHtml(slotLabel)}"
        data-color-name="${escapeHtml(colorName)}"
        data-color-hex="${hex}"
      >
        <span class="color-chip-label">
          <span class="color-dot" style="background:${hex};"></span>
          <span class="color-text">${escapeHtml(slotLabel)}</span>
        </span>
        <span>Ändern</span>
      </button>
    `;
  }).join("");

  wrap.querySelectorAll(".color-chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => openColorModal(btn));
  });
}

function handleAddExtraColor() {
  const wrap = document.getElementById("colorFields");
  const currentCount = wrap.querySelectorAll(".color-chip-btn").length;
  if (currentCount >= 4) return;

  const newIndex = currentCount + 1;
  const key = `c${newIndex}`;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "color-chip-btn";
  btn.dataset.colorKey = key;
  btn.dataset.colorLabel = `Farbe ${newIndex}`;
  btn.dataset.colorHex = "#d4af37";
  btn.innerHTML = `
    <span class="color-chip-label">
      <span class="color-dot" style="background:#d4af37;"></span>
      <span class="color-text">Farbe ${newIndex}</span>
    </span>
    <span>Ändern</span>
  `;
  btn.addEventListener("click", () => openColorModal(btn));
  wrap.appendChild(btn);
}

function openColorModal(targetBtn) {
  state.colorModalTarget = targetBtn;
  state.selectedFavoriteId = null;
  state.selectedColorSourceBtn = null;

  const slotLabel = targetBtn.dataset.slotLabel || targetBtn.dataset.colorLabel || "";
  const colorName = targetBtn.dataset.colorName || "";
  const hex = targetBtn.dataset.colorHex || "#d4af37";

  els.colorNameInput.value = slotLabel;
  els.favoriteColorNameInput.value = colorName;
  els.customColorPicker.value = normalizeHex(hex);
  els.liveColorPreview.style.background = normalizeHex(hex);
  els.toggleFavoriteColorBtn.textContent = "Als Favorit speichern";
  clearActiveColorChoice();

  openSingleModal(els.colorDialog);
}

async function renderColorButtons() {
  els.presetColors.innerHTML = PRESET_COLORS.map(
    (c) => `
      <button
        type="button"
        class="preset-color-btn"
        data-name="${escapeHtml(c.name)}"
        data-hex="${c.hex}"
        data-kind="preset"
      >
        <span class="color-dot" style="background:${c.hex}"></span>
        <span>${escapeHtml(c.name)}</span>
      </button>
    `
  ).join("");

  const favorites = await loadFavoriteColorsFromDb();

  els.favoriteColors.innerHTML = favorites.length
    ? favorites.map(
        (c) => `
          <button
            type="button"
            class="preset-color-btn"
            data-id="${c.id}"
            data-name="${escapeHtml(c.name)}"
            data-hex="${c.hex}"
            data-kind="favorite"
          >
            <span class="color-dot" style="background:${c.hex}"></span>
            <span>${escapeHtml(c.name)}</span>
          </button>
        `
      ).join("")
    : `<span class="muted">Noch keine Favoriten gespeichert.</span>`;

  [...els.presetColors.querySelectorAll("button"), ...els.favoriteColors.querySelectorAll("button")].forEach((btn) => {
    btn.addEventListener("click", () => {
      const hex = btn.dataset.hex;
      const name = btn.dataset.name;
      const kind = btn.dataset.kind;
      const favoriteId = btn.dataset.id || null;

      els.customColorPicker.value = hex;
      els.liveColorPreview.style.background = hex;

      if (kind === "favorite") {
        state.selectedFavoriteId = favoriteId;
        els.favoriteColorNameInput.value = name;
        els.toggleFavoriteColorBtn.textContent = "Favorit entfernen";
      } else {
        state.selectedFavoriteId = null;
        els.favoriteColorNameInput.value = name;
        els.toggleFavoriteColorBtn.textContent = "Als Favorit speichern";
      }

      setActiveColorChoice(btn);
    });
  });
}

function openPriceDialog(mode, currentRaw = "", title = "Preis eingeben", orderId = null) {
  state.priceDialogMode = mode;
  state.priceDialogValue = currentRaw || "";
  state.editingOrderId = orderId;
  els.priceDialogTitle.textContent = title;
  renderPriceDialogValue();
  openSingleModal(els.priceDialog);
}

function renderPriceDialogValue() {
  els.priceDialogValue.textContent = state.priceDialogValue ? formatDisplayValueFromRaw(state.priceDialogValue) : "0,00 €";
}

function appendPriceKey(key) {
  if (key === "back") {
    state.priceDialogValue = state.priceDialogValue.slice(0, -1);
    renderPriceDialogValue();
    return;
  }

  if (key === ",") {
    if (state.priceDialogValue.includes(",")) return;
    if (state.priceDialogValue === "") state.priceDialogValue = "0";
    state.priceDialogValue += ",";
    renderPriceDialogValue();
    return;
  }

  if (/^\d$/.test(key)) {
    const parts = state.priceDialogValue.split(",");
    if (parts[1] && parts[1].length >= 2) return;
    state.priceDialogValue += key;
    renderPriceDialogValue();
  }
}

function applyPriceDialog() {
  const raw = state.priceDialogValue;
  const value = parseEuroInputString(raw);

  if (!value || value <= 0) {
    alert("Bitte gib einen gültigen Preis ein.");
    return;
  }

  if (state.priceDialogMode === "form-item") {
    const hidden = document.getElementById("manualPriceRaw");
    const btn = document.getElementById("manualPriceBtn");
    if (hidden) hidden.value = raw;
    if (btn) btn.textContent = euro(value);
  }

  if (state.priceDialogMode === "edit-order-total" && state.editingOrderId) {
    updateOrderTotal(state.editingOrderId, value);
  }

  els.priceDialog.close();
  unlockPageScroll();
}

function getSelectedQuantity() {
  const active = document.querySelector("#quantityChoices .quantity-btn.active");
  const customRaw = document.getElementById("customQuantity")?.value.trim() || "";
  const custom = Number(customRaw);

  if (customRaw && Number.isInteger(custom) && custom > 0) return custom;
  return Number(active?.dataset.value || 1);
}

function collectColorData() {
  const buttons = [...document.querySelectorAll("#colorFields .color-chip-btn")];
  return buttons.map((btn) => ({
    key: btn.dataset.colorKey,
    slotLabel: btn.dataset.slotLabel || btn.dataset.colorLabel || "Farbe",
    colorName: btn.dataset.colorName || "",
    hex: btn.dataset.colorHex
  }));
}

function calculateRabbitBasePrice(size, quantity) {
  return (RABBIT_PRICES[size] || 0) * quantity;
}

function calculateCollectionTotal(items) {
  const rabbits = items.filter((item) => item.productType === "rabbit");
  const nonRabbitTotal = items
    .filter((item) => item.productType !== "rabbit")
    .reduce((sum, item) => sum + Number(item.basePrice || 0), 0);

  const counts = { "11 cm": 0, "15 cm": 0, "20 cm": 0 };
  rabbits.forEach((item) => {
    counts[item.size] += item.quantity;
  });

  const bundleCount = Math.min(counts["11 cm"], counts["15 cm"], counts["20 cm"]);
  const normalRabbitTotal =
    counts["11 cm"] * RABBIT_PRICES["11 cm"] +
    counts["15 cm"] * RABBIT_PRICES["15 cm"] +
    counts["20 cm"] * RABBIT_PRICES["20 cm"];

  const rabbitTotal = normalRabbitTotal - bundleCount * 27 + bundleCount * 22.5;
  return rabbitTotal + nonRabbitTotal;
}

function collectFormValues(applyValidation = true) {
  clearErrors();

  const isOrder = state.currentMode === "order";
  const config = getCurrentProductConfig();

  const customerName = els.customerName.value.trim();
  const description = els.description.value.trim();
  const priority = getActivePriority();
  const productName = document.getElementById("productName")?.value.trim() || "";
  const manualSize = document.getElementById("manualSizeInput")?.value.trim() || "";
const size = document.querySelector("#sizeChoices .size-btn.active")?.dataset.value || "";
const rabbitColorMode = document.querySelector("#rabbitColorModeChoices .choice-btn.active")?.dataset.value || "multi";
const quantity = getSelectedQuantity();
const manualPriceRaw = document.getElementById("manualPriceRaw")?.value || "";
const colors = collectColorData();

  let valid = true;

  if (isOrder && !customerName) {
    if (applyValidation) showError("customerName", "Kundenname ist Pflicht.");
    valid = false;
  }

  if (isOrder && !priority) {
    if (applyValidation) showError("priority", "Priorität ist Pflicht.");
    valid = false;
  }

  if (config.productNameRequired && !productName) {
    if (applyValidation) showError("productName", "Produktname ist Pflicht.");
    valid = false;
  }

  if (config.sizeRequired && !size) {
    if (applyValidation) showError("size", "Größe ist Pflicht.");
    valid = false;
  }

  if (config.manualSize && !manualSize) {
    if (applyValidation) showError("manualSize", "Größe ist Pflicht.");
    valid = false;
  }

  if (!colors.length || colors.some((c) => !c.label?.trim())) {
    if (applyValidation) showError("colors", "Bitte alle Farben festlegen.");
    valid = false;
  }

  if (!quantity || quantity < 1) {
    if (applyValidation) showError("quantity", "Menge ist Pflicht.");
    valid = false;
  }

  let basePrice = 0;

  if (isOrder) {
    if (state.currentProduct === "rabbit") {
      basePrice = calculateRabbitBasePrice(size, quantity);
    } else if (state.currentProduct === "lumi") {
      basePrice = LUMI_PRICE * quantity;
    } else {
      const parsed = parseEuroInputString(manualPriceRaw);
      if (!parsed || parsed <= 0) {
        if (applyValidation) showError("price", "Preis ist Pflicht.");
        valid = false;
      }
      basePrice = parsed;
    }
  }

  if (applyValidation && !valid) {
    throw new Error("VALIDATION_FAILED");
  }

  return {
    id: crypto.randomUUID(),
    mode: state.currentMode,
    productType: state.currentProduct,
    productLabel: PRODUCT_LABELS[state.currentProduct],
    customerName: isOrder ? customerName : null,
    description: isOrder ? description : "",
    priority: isOrder ? priority : null,
    productName: productName || null,
    size: config.sizeRequired ? size : (config.manualSize ? manualSize : null),
rabbitColorMode: state.currentProduct === "rabbit" ? rabbitColorMode : null,
colors,
quantity,
basePrice
  };
}

function renderDraft() {
  if (state.currentMode !== "order") return;

  const items = state.draft.items || [];
  const total = calculateCollectionTotal(items);

  els.draftModeLabel.textContent = "Bestellung";
  els.draftItemCount.textContent = `${items.length} Position${items.length === 1 ? "" : "en"}`;
  els.draftTotalPrice.textContent = euro(total);

  if (!items.length) {
    els.draftItems.className = "draft-items empty-state";
    els.draftItems.textContent = "Noch keine Positionen hinzugefügt.";
    return;
  }

  els.draftItems.className = "draft-items";
  els.draftItems.innerHTML = items.map((item) => {
    const colors = item.colors.map((c) => {
  const slotLabel = c.slotLabel || c.label || "Farbe";
  const colorName = c.colorName || slotLabel;
  return `${slotLabel}: ${colorName}`;
}).join(", ");
    return `
      <div class="draft-card">
        <h4>${escapeHtml(item.customerName)} – ${escapeHtml(item.productLabel)}${item.productName ? " – " + escapeHtml(item.productName) : ""}</h4>
        <div class="item-meta">
          Menge: ${item.quantity}<br>
          ${item.size ? `Größe: ${escapeHtml(item.size)}<br>` : ""}
          Farben: ${escapeHtml(colors)}<br>
          ${item.description ? `Beschreibung: ${escapeHtml(item.description)}` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function resetForm() {
  document.getElementById("itemForm").reset();
  setActiveChoice(els.priorityChoices, "Wichtig");
  renderProductForm();
}

function switchMode(mode) {
  state.currentMode = mode;

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  if (mode === "stock") {
    state.draft = { mode: "order", items: [] };
    saveDraft();
  } else {
    state.draft.mode = "order";
    saveDraft();
  }

  renderProductForm();
  renderDraft();
}

function switchProduct(product) {
  state.currentProduct = product;
  document.querySelectorAll(".product-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.product === product);
  });
  renderProductForm();
}

async function addItemToDraft() {
  try {
    const item = collectFormValues(true);
    if (!state.draft.items) state.draft.items = [];
    state.draft.mode = "order";
    state.draft.items.push(item);
    saveDraft();
    renderDraft();
    resetForm();
  } catch (error) {
    if (error.message !== "VALIDATION_FAILED") {
      console.error(error);
      alert("Beim Hinzufügen der Position ist ein Fehler aufgetreten.");
    }
  }
}

function highestPriority(items) {
  const values = items.map((item) => item.priority);
  if (values.includes("Sehr wichtig")) return "Sehr wichtig";
  if (values.includes("Wichtig")) return "Wichtig";
  return "Nicht wichtig";
}

async function saveOrderCollection() {
  if (!state.draft.items?.length) {
    alert("Bitte zuerst mindestens eine Position hinzufügen.");
    return;
  }

  const items = structuredClone(state.draft.items);
  const totalPrice = calculateCollectionTotal(items);
  const customerName = items[0].customerName;
  const priority = highestPriority(items);

  const { data: orderRow, error: orderError } = await supabaseClient
    .from("orders")
    .insert({
      type: "order",
      customer_name: customerName,
      priority,
      status: "Offen",
      total_price: totalPrice
    })
    .select()
    .single();

  if (orderError) {
    console.error(orderError);
    alert("Fehler beim Speichern der Bestellung.");
    return;
  }

  const orderItems = items.map((item) => ({
    order_id: orderRow.id,
    product_type: item.productType,
    product_label: item.productLabel,
    product_name: item.productName,
    description: item.description || null,
    priority: item.priority,
    size_text: item.size,
    quantity: item.quantity,
    unit_or_position_price: item.basePrice,
    colors: item.colors,
    is_done: false
  }));

  const { error: itemsError } = await supabaseClient.from("order_items").insert(orderItems);

  if (itemsError) {
    console.error(itemsError);
    alert("Bestellung gespeichert, aber Positionen konnten nicht gespeichert werden.");
    return;
  }

  pushUndo({
    type: "delete_created_order",
    label: "Erstellte Bestellung löschen",
    orderId: orderRow.id
  });

  state.draft = { mode: "order", items: [] };
  saveDraft();
  renderDraft();
  resetForm();
  await loadOrders();
}

async function saveStockEntry() {
  try {
    const item = collectFormValues(true);

    const { data: orderRow, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        type: "stock",
        customer_name: null,
        priority: null,
        status: "Offen",
        total_price: 0
      })
      .select()
      .single();

    if (orderError) {
      console.error(orderError);
      alert("Fehler beim Speichern des Bestand-Eintrags.");
      return;
    }

    const { error: itemError } = await supabaseClient
      .from("order_items")
      .insert({
        order_id: orderRow.id,
        product_type: item.productType,
        product_label: item.productLabel,
        product_name: item.productName,
        description: null,
        priority: null,
        size_text: item.size,
        quantity: item.quantity,
        unit_or_position_price: null,
        colors: item.colors,
        is_done: false
      });

    if (itemError) {
      console.error(itemError);
      alert("Bestandseintrag angelegt, aber Position konnte nicht gespeichert werden.");
      return;
    }

    pushUndo({
      type: "delete_created_stock",
      label: "Erstellten Bestandseintrag löschen",
      orderId: orderRow.id
    });

    resetForm();
    await loadOrders();
  } catch (error) {
    if (error.message !== "VALIDATION_FAILED") {
      console.error(error);
      alert("Beim Speichern ist ein Fehler aufgetreten.");
    }
  }
}

async function handlePrimaryAction() {
  if (state.currentMode === "order") {
    await addItemToDraft();
  } else {
    await saveStockEntry();
  }
}

async function loadOrders() {
  const { data: orders, error } = await supabaseClient
    .from("orders")
    .select(`
      *,
      order_items (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Fehler beim Laden der Daten.");
    return;
  }

  state.orders = orders || [];
  renderLists();
}

function getComputedStatus(order) {
  if (order.status === "Archiv") return "Archiv";
  const items = order.order_items || [];
  const doneCount = items.filter((item) => item.is_done).length;

  if (!items.length || doneCount === 0) return "Offen";
  if (doneCount < items.length) return "In Produktion";
  return "Fertig";
}

function statusClass(status) {
  if (status === "Offen") return "status-offen";
  if (status === "In Produktion") return "status-produktion";
  return "status-fertig";
}

function renderColorListText(colors) {
  if (!Array.isArray(colors)) return "-";

  return colors.map((c) => {
    const slotLabel = c.slotLabel || c.label || "Farbe";
    const colorName = c.colorName || slotLabel;
    return `${escapeHtml(slotLabel)}: ${escapeHtml(colorName)}`;
  }).join(", ");
}

function renderOrderCard(order, archived = false) {
  const items = order.order_items || [];
  const doneCount = items.filter((item) => item.is_done).length;
  const progress = `${doneCount} von ${items.length} Positionen erledigt`;
  const computedStatus = archived ? "Archiv" : getComputedStatus(order);

  return `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-card-top">
        <div class="order-title-block">
          <h4>${escapeHtml(order.customer_name || "Ohne Namen")}</h4>
          <div>
            <span class="badge">${escapeHtml(order.priority || "-")}</span>
            <span class="badge clickable order-total-badge" data-order-id="${order.id}" ${archived ? "" : 'title="Preis ändern"'}>
              ${euro(order.total_price || 0)}
            </span>
          </div>
          <div class="progress-text">${progress}</div>
          <div class="status-badge ${statusClass(computedStatus)}">${computedStatus}</div>
        </div>

        ${!archived ? `
          <div class="order-actions">
            <button class="small-btn success archive-btn" data-order-id="${order.id}">Archivieren</button>
            <button class="small-btn danger delete-order-btn" data-order-id="${order.id}">Löschen</button>
          </div>
        ` : `
          <div class="order-actions">
            <button class="small-btn danger delete-order-btn" data-order-id="${order.id}">Löschen</button>
          </div>
        `}
      </div>

      <div class="order-items">
        ${items.map((item) => `
          <div class="order-item">
            <div class="order-item-row">
              <div>
                <strong>${escapeHtml(item.product_label)}${item.product_name ? " – " + escapeHtml(item.product_name) : ""}</strong><br>
                Menge: ${item.quantity}<br>
                ${item.size_text ? `Größe: ${escapeHtml(item.size_text)}<br>` : ""}
                Farben: ${renderColorListText(item.colors)}<br>
                ${item.description ? `Beschreibung: ${escapeHtml(item.description)}` : ""}
              </div>

              ${!archived ? `
                <label class="order-item-done">
                  <input type="checkbox" class="item-done-checkbox" data-item-id="${item.id}" ${item.is_done ? "checked" : ""} />
                  <span>Erledigt</span>
                </label>
              ` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderStockEntry(order) {
  const item = order.order_items?.[0];
  if (!item) return "";

  return `
    <div class="stock-entry" data-order-id="${order.id}">
      <div class="stock-entry-main">
        <div class="stock-title">${escapeHtml(item.product_label)}${item.product_name ? " – " + escapeHtml(item.product_name) : ""}</div>
        Menge: ${item.quantity}<br>
        ${item.size_text ? `Größe: ${escapeHtml(item.size_text)}<br>` : ""}
        Farben: ${renderColorListText(item.colors)}
      </div>

      <div>
        <button class="small-btn danger delete-stock-btn" data-order-id="${order.id}">Löschen</button>
      </div>
    </div>
  `;
}

function renderArchiveGrouped(archiveOrders) {
  if (!archiveOrders.length) return `<div class="muted">Archiv ist leer.</div>`;

  const groups = archiveOrders.reduce((acc, order) => {
    const date = new Date(order.updated_at || order.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, orders]) => {
      const [year, month] = monthKey.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric"
      });

      return `
        <div class="archive-month">
          <h4>${label}</h4>
          <div class="archive-month-list">
            ${orders.map((order) => renderOrderCard(order, true)).join("")}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderLists() {
  const orderEntries = state.orders.filter((o) => o.type === "order" && o.status !== "Archiv");
  const stockEntries = state.orders.filter((o) => o.type === "stock");
  const archiveEntries = state.orders.filter((o) => o.status === "Archiv");

  const orderSearch = els.orderSearch.value.trim().toLowerCase();
  const stockSearch = els.stockSearch.value.trim().toLowerCase();
  const orderPriority = els.orderPriorityFilter.value;
  const orderStatus = els.orderStatusFilter.value;

  const filteredOrders = orderEntries.filter((order) => {
    const computedStatus = getComputedStatus(order);

    const searchHit =
      !orderSearch ||
      (order.customer_name || "").toLowerCase().includes(orderSearch) ||
      (order.order_items || []).some(
        (item) =>
          (item.product_label || "").toLowerCase().includes(orderSearch) ||
          (item.product_name || "").toLowerCase().includes(orderSearch)
      );

    const priorityHit = !orderPriority || order.priority === orderPriority;
    const statusHit = !orderStatus || computedStatus === orderStatus;

    return searchHit && priorityHit && statusHit;
  });

  const filteredStock = stockEntries.filter((order) => {
    const item = order.order_items?.[0];
    if (!item) return false;

    return (
      !stockSearch ||
      (item.product_label || "").toLowerCase().includes(stockSearch) ||
      (item.product_name || "").toLowerCase().includes(stockSearch)
    );
  });

  els.ordersList.innerHTML = filteredOrders.length
    ? filteredOrders.map((order) => renderOrderCard(order)).join("")
    : `<div class="muted">Keine Bestellungen gefunden.</div>`;

  els.stockList.innerHTML = filteredStock.length
    ? filteredStock.map((order) => renderStockEntry(order)).join("")
    : `<div class="muted">Keine Bestandseinträge gefunden.</div>`;

  els.archiveList.innerHTML = renderArchiveGrouped(archiveEntries);
  attachCardEvents();

  const openTotal = orderEntries.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const archiveTotal = archiveEntries.reduce((sum, order) => sum + Number(order.total_price || 0), 0);

  els.openOrderTotal.textContent = euro(openTotal);
  els.archiveTotal.textContent = euro(archiveTotal);
}

async function recalcOrderStatus(orderId) {
  const { data: items, error } = await supabaseClient
    .from("order_items")
    .select("is_done")
    .eq("order_id", orderId);

  if (error) {
    console.error(error);
    return;
  }

  const doneCount = items.filter((item) => item.is_done).length;
  let newStatus = "Offen";

  if (doneCount === 0) newStatus = "Offen";
  else if (doneCount < items.length) newStatus = "In Produktion";
  else newStatus = "Fertig";

  const { error: updateError } = await supabaseClient
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (updateError) {
    console.error(updateError);
  }
}

function showConfirm(text, callback) {
  els.confirmText.textContent = text;
  state.confirmAction = callback;
  openSingleModal(els.confirmDialog);
}

async function restoreDeletedOrder(orderSnapshot, itemsSnapshot) {
  const { error: orderError } = await supabaseClient
    .from("orders")
    .insert({
      id: orderSnapshot.id,
      type: orderSnapshot.type,
      customer_name: orderSnapshot.customer_name,
      priority: orderSnapshot.priority,
      status: orderSnapshot.status,
      total_price: orderSnapshot.total_price,
      created_at: orderSnapshot.created_at,
      updated_at: orderSnapshot.updated_at
    });

  if (orderError) {
    console.error(orderError);
    alert("Rückgängig konnte die Bestellung nicht wiederherstellen.");
    return;
  }

  if (itemsSnapshot?.length) {
    const payload = itemsSnapshot.map((item) => ({
      id: item.id,
      order_id: item.order_id,
      product_type: item.product_type,
      product_label: item.product_label,
      product_name: item.product_name,
      description: item.description,
      priority: item.priority,
      size_text: item.size_text,
      quantity: item.quantity,
      unit_or_position_price: item.unit_or_position_price,
      colors: item.colors,
      is_done: item.is_done,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    const { error: itemsError } = await supabaseClient.from("order_items").insert(payload);
    if (itemsError) {
      console.error(itemsError);
      alert("Die Bestellung wurde wiederhergestellt, aber Positionen nicht vollständig.");
    }
  }
}

async function handleUndo() {
  const last = state.undoStack[state.undoStack.length - 1];
  if (!last) {
    alert("Es gibt nichts zum Rückgängig machen.");
    return;
  }

  showConfirm(`Wirklich rückgängig machen: ${last.label}?`, async () => {
    const action = state.undoStack.pop();
    saveUndoStack();

    if (action.type === "delete_created_order" || action.type === "delete_created_stock") {
      await supabaseClient.from("order_items").delete().eq("order_id", action.orderId);
      await supabaseClient.from("orders").delete().eq("id", action.orderId);
    }

    if (action.type === "restore_order_status") {
      await supabaseClient.from("orders").update({ status: action.previousStatus }).eq("id", action.orderId);
    }

    if (action.type === "toggle_item_done") {
      await supabaseClient.from("order_items").update({ is_done: action.previousValue }).eq("id", action.itemId);
      await recalcOrderStatus(action.orderId);
    }

    if (action.type === "restore_deleted_order") {
      await restoreDeletedOrder(action.orderSnapshot, action.itemsSnapshot);
    }

    if (action.type === "restore_total_price") {
      await supabaseClient.from("orders").update({ total_price: action.previousTotal }).eq("id", action.orderId);
    }

    await loadOrders();
  });
}

async function updateOrderTotal(orderId, newTotal) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;

  pushUndo({
    type: "restore_total_price",
    label: "Preisänderung rückgängig machen",
    orderId,
    previousTotal: Number(order.total_price || 0)
  });

  const { error } = await supabaseClient
    .from("orders")
    .update({ total_price: Number(newTotal) })
    .eq("id", orderId);

  if (error) {
    console.error(error);
    alert("Preis konnte nicht geändert werden.");
    return;
  }

  await loadOrders();
}

function attachCardEvents() {
  document.querySelectorAll(".item-done-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", async () => {
      const itemId = checkbox.dataset.itemId;
      const newValue = checkbox.checked;
      const orderCard = checkbox.closest(".order-card");
      const orderId = orderCard?.dataset.orderId;

      pushUndo({
        type: "toggle_item_done",
        label: `Position ${newValue ? "als offen markieren" : "als erledigt markieren"}`,
        itemId,
        orderId,
        previousValue: !newValue
      });

      const { error } = await supabaseClient
        .from("order_items")
        .update({ is_done: newValue })
        .eq("id", itemId);

      if (error) {
        console.error(error);
        alert("Fehler beim Aktualisieren der Position.");
        return;
      }

      await recalcOrderStatus(orderId);
      await loadOrders();
    });
  });

  document.querySelectorAll(".archive-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const orderId = btn.dataset.orderId;
      const order = state.orders.find((o) => o.id === orderId);
      const computed = getComputedStatus(order);

      if (computed !== "Fertig") {
        alert("Archivieren ist nur möglich, wenn alle Positionen erledigt sind.");
        return;
      }

      showConfirm("Diese Bestellung wirklich ins Archiv verschieben?", async () => {
        pushUndo({
          type: "restore_order_status",
          label: "Archivierung rückgängig machen",
          orderId,
          previousStatus: "Fertig"
        });

        const { error } = await supabaseClient
          .from("orders")
          .update({ status: "Archiv" })
          .eq("id", orderId);

        if (error) {
          console.error(error);
          alert("Fehler beim Archivieren.");
          return;
        }

        await loadOrders();
      });
    });
  });

  document.querySelectorAll(".delete-order-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const orderId = btn.dataset.orderId;
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return;

      showConfirm("Diese Bestellung wirklich löschen?", async () => {
        pushUndo({
          type: "restore_deleted_order",
          label: "Gelöschte Bestellung wiederherstellen",
          orderSnapshot: structuredClone(order),
          itemsSnapshot: structuredClone(order.order_items || [])
        });

        await supabaseClient.from("order_items").delete().eq("order_id", orderId);
        await supabaseClient.from("orders").delete().eq("id", orderId);
        await loadOrders();
      });
    });
  });

  document.querySelectorAll(".delete-stock-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const orderId = btn.dataset.orderId;
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return;

      showConfirm("Diesen Bestandseintrag wirklich löschen?", async () => {
        pushUndo({
          type: "restore_deleted_order",
          label: "Gelöschten Bestandseintrag wiederherstellen",
          orderSnapshot: structuredClone(order),
          itemsSnapshot: structuredClone(order.order_items || [])
        });

        await supabaseClient.from("order_items").delete().eq("order_id", orderId);
        await supabaseClient.from("orders").delete().eq("id", orderId);
        await loadOrders();
      });
    });
  });

  document.querySelectorAll(".order-total-badge").forEach((badge) => {
    badge.addEventListener("click", () => {
      const orderId = badge.dataset.orderId;
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || order.status === "Archiv") return;

      const raw = String(Number(order.total_price || 0)).replace(".", ",");
      openPriceDialog("edit-order-total", raw, "Gesamtpreis ändern", orderId);
    });
  });
}

function bindEvents() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchMode(btn.dataset.mode));
  });

  document.querySelectorAll(".product-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchProduct(btn.dataset.product));
  });

  els.priorityChoices.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => setActiveChoice(els.priorityChoices, btn.dataset.value));
  });

  els.primaryActionBtn.addEventListener("click", handlePrimaryAction);
  els.saveCollectionBtn.addEventListener("click", saveOrderCollection);
  els.undoBtn.addEventListener("click", handleUndo);

  els.customColorPicker.addEventListener("input", (e) => {
    els.liveColorPreview.style.background = e.target.value;
    state.selectedFavoriteId = null;
    els.toggleFavoriteColorBtn.textContent = "Als Favorit speichern";
    clearActiveColorChoice();
  });

  els.favoriteColorNameInput.addEventListener("input", () => {
    state.selectedFavoriteId = null;
    els.toggleFavoriteColorBtn.textContent = "Als Favorit speichern";
  });

els.applyColorBtn.addEventListener("click", () => {
  if (!state.colorModalTarget) return;

  const slotLabel = els.colorNameInput.value.trim() || "Farbe";
  const colorName = els.favoriteColorNameInput.value.trim() || "Eigene Farbe";
  const hex = els.customColorPicker.value;

  state.colorModalTarget.dataset.slotLabel = slotLabel;
  state.colorModalTarget.dataset.colorName = colorName;
  state.colorModalTarget.dataset.colorHex = hex;

  state.colorModalTarget.innerHTML = `
    <span class="color-chip-label">
      <span class="color-dot" style="background:${hex};"></span>
      <span class="color-text">${escapeHtml(slotLabel)}</span>
    </span>
    <span>Ändern</span>
  `;
  state.colorModalTarget.addEventListener("click", () => openColorModal(state.colorModalTarget));

  state.selectedFavoriteId = null;
  clearActiveColorChoice();
  els.colorDialog.close();
  unlockPageScroll();
});

  els.toggleFavoriteColorBtn.addEventListener("click", async () => {
    if (state.selectedFavoriteId) {
      const ok = await deleteFavoriteColorFromDb(state.selectedFavoriteId);
      if (ok) {
        state.selectedFavoriteId = null;
        els.toggleFavoriteColorBtn.textContent = "Als Favorit speichern";
        els.favoriteColorNameInput.value = "";
        clearActiveColorChoice();
      }
      return;
    }

    const favoriteName = els.favoriteColorNameInput.value.trim();
    if (!favoriteName) {
      alert("Bitte gib einen Namen für den Favoriten ein.");
      return;
    }

    const hex = els.customColorPicker.value;
    const ok = await saveFavoriteColorToDb(favoriteName, hex);
    if (ok) {
      state.selectedFavoriteId = null;
      els.toggleFavoriteColorBtn.textContent = "Als Favorit speichern";
      clearActiveColorChoice();
      alert("Favorit gespeichert.");
    }
  });

  els.closeColorDialog.addEventListener("click", () => {
    els.colorDialog.close();
    unlockPageScroll();
  });

  document.querySelectorAll(".price-key").forEach((btn) => {
    btn.addEventListener("click", () => appendPriceKey(btn.dataset.key));
  });

  els.clearPriceBtn.addEventListener("click", () => {
    state.priceDialogValue = "";
    renderPriceDialogValue();
  });

  els.applyPriceBtn.addEventListener("click", applyPriceDialog);

  els.closePriceDialog.addEventListener("click", () => {
    els.priceDialog.close();
    unlockPageScroll();
  });

  els.closeConfirmDialog.addEventListener("click", () => {
    els.confirmDialog.close();
    unlockPageScroll();
  });

  els.confirmCancelBtn.addEventListener("click", () => {
    els.confirmDialog.close();
    unlockPageScroll();
  });

  els.confirmOkBtn.addEventListener("click", async () => {
    const action = state.confirmAction;
    els.confirmDialog.close();
    unlockPageScroll();
    if (action) await action();
    state.confirmAction = null;
  });

  els.colorDialog.addEventListener("close", unlockPageScroll);
  els.priceDialog.addEventListener("close", unlockPageScroll);
  els.confirmDialog.addEventListener("close", unlockPageScroll);

  els.orderSearch.addEventListener("input", renderLists);
  els.stockSearch.addEventListener("input", renderLists);
  els.orderPriorityFilter.addEventListener("change", renderLists);
  els.orderStatusFilter.addEventListener("change", renderLists);

  setInterval(() => {
    if (state.currentMode === "order") saveDraft();
  }, 1500);
}

async function init() {
  await renderColorButtons();
  bindEvents();
  switchMode(state.currentMode);
  switchProduct(state.currentProduct);
  renderDraft();
  await loadOrders();
}

init();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Service Worker Fehler:", error);
    });
  });
}