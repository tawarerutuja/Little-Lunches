// State store: localStorage adapter with a silent in-memory fallback,
// tiny pub/sub, and a reset. All user state flows through here.

import { FOODS, HOUSE_RULES, STARTER_FOODS, RETURNING_PROFILE, DEFAULT_USUAL } from './data.js';

const KEY = 'littleplate:v1';

/* ---------- Storage adapter ---------- */
const memory = new Map();
const storage = (() => {
  try {
    const probe = '__lp_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return {
      get: (k) => window.localStorage.getItem(k),
      set: (k, v) => { try { window.localStorage.setItem(k, v); } catch { memory.set(k, v); } },
      remove: (k) => { try { window.localStorage.removeItem(k); } catch { /* ignore */ } memory.delete(k); },
    };
  } catch {
    return {
      get: (k) => (memory.has(k) ? memory.get(k) : null),
      set: (k, v) => memory.set(k, v),
      remove: (k) => memory.delete(k),
    };
  }
})();

/* ---------- Initial state ---------- */
function initialState() {
  const rules = {};
  HOUSE_RULES.forEach((r) => { rules[r.id] = r.defaultOn; });
  return {
    theme: null, // null = follow the system
    session: { signedIn: false, method: null, phone: '', account: null },
    pending: { phone: '', mode: 'new' }, // sign-in in progress
    child: { name: '', birth: null }, // birth = { y, m } (m: 0–11)
    allergies: [],
    noKnownAllergies: false,
    customAllergies: [], // [{ id, name }]
    // Milk allergy detail, asked in setup: which of curd / paneer / ghee he also reacts to.
    // null = not answered yet (treated as "avoid all", the safe default).
    milkAlso: null,
    rules,
    diet: 'veg',
    cuisines: [],
    mixed: { text: '', regions: [] },
    foods: { list: [...STARTER_FOODS], selected: [], custom: [] }, // custom: [{ id, name }]
    backup: { list: [], selected: null, custom: [] },
    setupDone: false,
    skipped: [],

    // ---- Flows R2–R7 ----
    parentName: '',
    history: {},          // { 'YYYY-MM-DD': { breakfast: { food, name, outcome, by, time, note, recipe } } }
    served: null,         // { date, meal, recipe, name, time } awaiting "How did he eat?"
    foodStatus: {},       // { foodId: 'well' | 'some' | 'not' }
    plan: { setup: null, days: {}, prepDone: {} }, // days: { 'YYYY-MM-DD': { busy, feeder, meals: { dinner: recipeId|null } } }
    home: { usual: [...DEFAULT_USUAL], today: null, note: '', meal: null, time: 20 },
    shopping: { manual: [], ranOut: [], got: [] },
    carers: [],           // [{ id, name, relation, status: 'joined' | 'pending', lang }]
    insight: null,        // { text, answered }
    dismissed: {},        // { 'refusal-YYYY-MM-DD': true }
    reminders: [],        // [{ id, kind, at, meal }]
    offlineSim: false,
    ui: {},               // transient params between screens (persisted so refresh works)
  };
}

function load() {
  try {
    const raw = storage.get(KEY);
    if (!raw) return initialState();
    return { ...initialState(), ...JSON.parse(raw) };
  } catch {
    return initialState();
  }
}

let state = load();
const listeners = new Set();

function persist() {
  try { storage.set(KEY, JSON.stringify(state)); } catch { /* in-memory only */ }
}

/* ---------- Public API ---------- */
export const store = {
  get() { return state; },

  /** Patch with an object or an updater (draft) => void. */
  set(patch) {
    if (typeof patch === 'function') {
      const draft = structuredClone(state);
      patch(draft);
      state = draft;
    } else {
      state = { ...state, ...patch };
    }
    persist();
    listeners.forEach((fn) => fn(state));
  },

  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  reset() {
    const theme = state.theme;
    storage.remove(KEY);
    state = { ...initialState(), theme };
    persist();
    listeners.forEach((fn) => fn(state));
  },

  /**
   * A returning parent signs in on this phone: the server returns their profile.
   * `seed` (from meals.js) adds two weeks of history, a plan and carers.
   */
  restoreReturningProfile(seed) {
    store.set((s) => {
      const p = structuredClone(RETURNING_PROFILE);
      Object.assign(s, p);
      if (seed) seed(s);
      s.setupDone = true;
    });
  },

  /** Set a transient screen param (e.g. which recipe to open). */
  ui(patch) { store.set((s) => { s.ui = { ...s.ui, ...patch }; }); },
};

/* ---------- Selectors / helpers (no DOM) ---------- */
export function childName(s = state) {
  return (s.child.name || '').trim();
}

/** "Aarav" or a gentle fallback when setup was skipped. */
export function nameOr(fallback = 'your child', s = state) {
  return childName(s) || fallback;
}

export function ageInMonths(birth, now = new Date()) {
  if (!birth) return null;
  return (now.getFullYear() - birth.y) * 12 + (now.getMonth() - birth.m);
}

export function ageLabel(months) {
  if (months == null) return '';
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} years ${m} month${m === 1 ? '' : 's'}` : `${y} years`;
}

export function findFood(id, s = state) {
  return FOODS.find((f) => f.id === id)
    || s.foods.custom.find((f) => f.id === id)
    || s.backup.custom?.find((f) => f.id === id)
    || null;
}

/** Milk foods that can be on their own (milk allergy may or may not include them). */
export const MILK_PARTS_IDS = ['curd', 'paneer', 'ghee'];
/** Milk foods this child avoids: milk itself, plus what the parent said (all of them until answered). */
export function milkAvoid(s = state) {
  if (!s.allergies.includes('milk')) return [];
  return ['milk', ...(Array.isArray(s.milkAlso) ? s.milkAlso : MILK_PARTS_IDS)];
}
/** Does this child avoid allergen `a`? The one rule every safety check goes through. */
export function avoids(a, s = state) {
  if (a === 'milk' || MILK_PARTS_IDS.includes(a)) return milkAvoid(s).includes(a);
  return s.allergies.includes(a);
}
/** Everything this child avoids, expanded (milk → milk + the parts the parent picked). */
export function avoidList(s = state) {
  return [...new Set([...s.allergies.filter((a) => a !== 'milk'), ...milkAvoid(s)])];
}

/** Allergen ids that make a food unsafe for this child. */
export function unsafeAllergens(food, s = state) {
  if (!food || !food.allergens) return [];
  return food.allergens.filter((a) => avoids(a, s));
}

/** His backup foods (more than one allowed). The first is the one we suggest first. */
export function backupIds(s = state) {
  const picked = s.backup.picked || (s.backup.selected ? [s.backup.selected] : []);
  return picked.filter(Boolean);
}
/** Mutates a draft: keeps `selected` (primary) in step with `picked`. */
export function setBackups(draft, ids) {
  draft.backup.picked = [...new Set(ids)];
  draft.backup.selected = draft.backup.picked[0] || null;
}

export function slug(text) {
  return 'custom-' + text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
}
