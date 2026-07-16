const MODULE_ID = "ptr2e-skill-search-button";

const SELECTORS = {
  input: ".ptr2e-skill-search-button__input, .skill-search-input",
  list: ".skill-list",
  group: ".skill-group",
  groupLabel: ".skill-group-label",
  row: ".skill:not(header):not(.skill-group-label)",
  hidden: "ptr2e-skill-search-button-hidden",
};

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function elementFromHookPayload(payload) {
  if (payload instanceof HTMLElement) return payload;
  if (payload?.[0] instanceof HTMLElement) return payload[0];
  if (payload?.element instanceof HTMLElement) return payload.element;
  if (payload?.element?.[0] instanceof HTMLElement) return payload.element[0];
  return null;
}

function textForSkill(row) {
  return normalize(`${row.dataset.slug ?? ""} ${row.textContent ?? ""}`);
}

function ensureSearchControl(fieldset) {
  const existing = fieldset.querySelector(SELECTORS.input);
  if (existing) return existing;

  const list = fieldset.querySelector(SELECTORS.list);
  if (!list) return null;

  const label = document.createElement("label");
  label.className = "ptr2e-skill-search-button";
  label.dataset.tooltip = "Filter skills";
  label.innerHTML = `
    <i class="fa-solid fa-magnifying-glass"></i>
    <input type="search" class="ptr2e-skill-search-button__input" placeholder="Search skills..." autocomplete="off" spellcheck="false" aria-label="Search skills">
  `;

  fieldset.insertBefore(label, list);
  return label.querySelector(SELECTORS.input);
}

function filterSkills(fieldset) {
  const input = fieldset.querySelector(SELECTORS.input);
  const list = fieldset.querySelector(SELECTORS.list);
  if (!input || !list) return;

  const query = normalize(input.value);
  const matches = (element) => !query || textForSkill(element).includes(query);

  for (const group of list.querySelectorAll(SELECTORS.group)) {
    const label = group.querySelector(SELECTORS.groupLabel);
    const groupMatches = label ? matches(label) : false;
    let hasMatch = groupMatches;

    for (const row of group.querySelectorAll(`:scope > ${SELECTORS.row}`)) {
      const rowMatches = groupMatches || matches(row);
      row.classList.toggle(SELECTORS.hidden, !rowMatches);
      hasMatch ||= rowMatches;
    }

    group.classList.toggle(SELECTORS.hidden, !hasMatch);
  }

  for (const row of list.querySelectorAll(`:scope > ${SELECTORS.row}`)) {
    row.classList.toggle(SELECTORS.hidden, !matches(row));
  }
}

function bindSkillSearch(root) {
  const element = elementFromHookPayload(root);
  if (!element) return;

  for (const fieldset of element.querySelectorAll(".skill-component fieldset.skills")) {
    if (fieldset.dataset.component === "favourite-skills") continue;

    const input = ensureSearchControl(fieldset);
    if (!input || input.dataset.ptr2eSkillSearchButtonBound === "true") continue;
    input.dataset.ptr2eSkillSearchButtonBound = "true";

    input.addEventListener("input", () => filterSkills(fieldset));
    input.addEventListener("search", () => filterSkills(fieldset));
    filterSkills(fieldset);
  }
}

function registerHooks() {
  Hooks.on("renderApplicationV2", (_app, element) => bindSkillSearch(element));
  Hooks.on("renderActorSheet", (_app, element) => bindSkillSearch(element));
  Hooks.on("renderActorSheetPTRV2", (_app, element) => bindSkillSearch(element));
}

if (globalThis.game?.system?.id === "ptr2e") {
  registerHooks();
} else {
  Hooks.once("init", () => {
    if (game.system?.id !== "ptr2e") return;
    console.debug(`${MODULE_ID} | Registered skill search hooks.`);
    registerHooks();
  });
}

