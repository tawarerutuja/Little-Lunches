// Domain logic for flows R2–R7 (no DOM). Everything a screen needs to
// decide, rank, plan or summarise lives here, so screens stay thin.

import {
  MEALS, MEAL_HOURS, RECIPES, INGREDIENTS, FAMILY_RULES, ALLERGEN_WORDS, FOODS,
  RETURNING_USUAL, ALLERGIES, MORE_ALLERGIES, BUY_QTY, REQUEST_FLAGS, REQUEST_NEGATIONS, MILK_PARTS, SNACK_STOCK,
} from './data.js';
import { store, findFood, avoids, avoidList } from './store.js';

/** Why he can't have it, in plain words: "has a peanut allergy" / "avoids curd (milk allergy)". */
export function allergyReason(id, s = store.get()) {
  const name = allergyName(id, s).toLowerCase();
  if (MILK_PARTS.some((p) => p.id === id)) return `avoids ${name} (milk allergy)`;
  return `has ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name} allergy`;
}

/* ==========================================================================
   Dates
   ========================================================================== */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const pad = (n) => String(n).padStart(2, '0');
export function dateKey(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function fromKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export const todayKey = () => dateKey(new Date());
export function mondayOf(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); }
export function weekKeys(monday) { return Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i))); }
export const weekdayIndex = (d) => (d.getDay() + 6) % 7; // Mon = 0
export const dayName = (d) => DAY_NAMES[d.getDay()];
export const dayShort = (d) => DAY_NAMES[d.getDay()].slice(0, 3);
export const dayLetter = (d) => DAY_NAMES[d.getDay()][0];
export const fmtDayNum = (d) => `${dayShort(d)} ${d.getDate()}`;
export const fmtLong = (d) => `${dayName(d)} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
export function fmtRange(mon) {
  const sun = addDays(mon, 6);
  if (mon.getMonth() === sun.getMonth()) return `${mon.getDate()} – ${sun.getDate()} ${MONTH_NAMES[sun.getMonth()]}`;
  return `${mon.getDate()} ${MONTH_NAMES[mon.getMonth()].slice(0, 3)} – ${sun.getDate()} ${MONTH_NAMES[sun.getMonth()].slice(0, 3)}`;
}
export function fmtTime(d = new Date()) {
  let h = d.getHours(); const m = pad(d.getMinutes()); const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12; return `${h}:${m} ${ap}`;
}
export function relDay(key) {
  const t = todayKey();
  if (key === t) return 'today';
  if (key === dateKey(addDays(new Date(), -1))) return 'yesterday';
  const d = fromKey(key);
  const diff = (fromKey(t) - d) / 86400000;
  return diff < 7 ? dayName(d) : `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

/* ==========================================================================
   Meals of the day
   ========================================================================== */
export const meal = (id) => MEALS.find((m) => m.id === id);

export function mealNow(d = new Date()) {
  // Prototype panel can pin the meal of the hour, for testing every time of day.
  const pinned = store.get().timeOverride;
  if (pinned) return pinned;
  const h = d.getHours() < 5 ? d.getHours() + 24 : d.getHours();
  return MEALS.find((m) => h >= MEAL_HOURS[m.id][0] && h < MEAL_HOURS[m.id][1])?.id || 'dinner';
}
export function mealHeading(id) {
  return { breakfast: 'This morning’s breakfast', lunch: 'Today’s lunch', snack: 'Today’s snack', dinner: 'Tonight’s dinner' }[id];
}
export const earlierMeals = (id) => MEALS.slice(0, MEALS.findIndex((m) => m.id === id)).map((m) => m.id);

/* ==========================================================================
   Safety: allergies, diet, house rules
   ========================================================================== */
const DIET_RANK = { veg: 0, jain: 0, egg: 1, nonveg: 2 };
const ROOT_VEG = ['carrot', 'potato'];

export function recipe(id) {
  if (!id) return null;
  if (id === 'custom' && store.get().ui.customRecipe) return store.get().ui.customRecipe;
  if (id.startsWith('c-')) return customRecipe(id);
  return RECIPES.find((r) => r.id === id) || null;
}

/* ---------- Your own dishes (usability round: 3 of 3 wanted this in Plan) ---------- */
/** A dish she typed, shaped like a recipe so Plan, Today, Memory and shopping just work. */
export function customRecipe(id, s = store.get()) {
  const c = (s.customDishes || []).find((x) => x.id === id);
  if (!c) return null;
  const needs = c.needs || [];
  // Allergens come from what she said it needs and from the words in its name.
  const fromNeeds = needs.flatMap((n) => INGREDIENTS.find((i) => i.id === n)?.allergens || []);
  const fromName = Object.entries(ALLERGEN_WORDS).filter(([, ws]) => ws.some((w) => new RegExp(`(^|\\s)${w}`, 'i').test(c.name))).map(([a]) => a);
  return {
    id: c.id, name: c.name, custom: true, photo: null, mins: null, meta: 'Your dish',
    meals: ['breakfast', 'lunch', 'snack', 'dinner'], needs, allergens: [...new Set([...fromNeeds, ...fromName])], diet: 'veg',
    tags: [], groups: [], food: null, tip: '', ahead: null, notes: c.notes || '',
    ingredients: [...needs.map((n) => [n, INGREDIENTS.find((i) => i.id === n)?.name || n, '']), ...(c.extra || []).map((x) => ['', x, ''])],
    steps: [],
  };
}
/** Save a typed dish. Mutates draft; returns its id. */
export function saveCustomDish(draft, { name, needs = [], extra = [] }) {
  draft.customDishes = draft.customDishes || [];
  const found = draft.customDishes.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (found) { found.needs = [...new Set([...found.needs, ...needs])]; found.extra = [...new Set([...(found.extra || []), ...extra])]; return found.id; }
  const id = `c-${Date.now().toString(36)}`;
  draft.customDishes.unshift({ id, name, needs, extra, notes: '', made: todayKey() });
  return id;
}
/** Ingredients a dish name suggests ("Aloo paratha" → potato, atta). */
export function guessNeeds(name) {
  const t = ` ${name.toLowerCase()} `;
  return INGREDIENTS.filter((i) => [i.name.toLowerCase(), ...(i.words || [])].some((w) => new RegExp(`\\s${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es)?\\s`).test(t))).map((i) => i.id);
}

export function recipeSafe(r, s = store.get()) {
  if (!r) return false;
  if (r.allergens.some((a) => avoids(a, s))) return false;
  if ((DIET_RANK[r.diet] ?? 0) > (DIET_RANK[s.diet] ?? 0)) return false;
  if (s.diet === 'jain' && r.needs.some((n) => ROOT_VEG.includes(n))) return false;
  return true;
}

/**
 * Cooking fats and small extras that carry an allergen, with the everyday swap.
 * Ghee is a milk product: not safe for a milk allergy, so the recipe says oil instead.
 */
// Only when the parent said ghee is a problem too (milk allergy alone does not decide it).
const SAFE_SWAPS = { ghee: { allergen: 'ghee', name: 'Oil', word: 'oil' } };
/** The recipe as it should be cooked for this child (swaps applied, and listed so we can say so). */
export function adaptForChild(r, s = store.get()) {
  if (!r) return r;
  const all = `${(r.steps || []).join(' ')} ${r.tip || ''} ${r.ahead || ''}`;
  const active = Object.entries(SAFE_SWAPS).filter(([id, x]) => avoids(x.allergen, s)
    && ((r.ingredients || []).some((i) => i[0] === id) || new RegExp(`\\b${id}\\b`, 'i').test(all)));
  if (!active.length) return r;
  const rep = (t) => active.reduce((acc, [id, x]) => acc.replace(new RegExp(`\\b${id}\\b`, 'gi'), x.word), t || '');
  return {
    ...r,
    ingredients: (r.ingredients || []).map(([id, name, qty]) => {
      const x = active.find(([a]) => a === id);
      return x ? [x[1].word, `${x[1].name} (not ${id})`, qty] : [id, name, qty];
    }),
    steps: (r.steps || []).map(rep), tip: rep(r.tip), ahead: rep(r.ahead),
    swapped: active.map(([id, x]) => ({ from: id, to: x.name.toLowerCase(), allergen: x.allergen })),
  };
}

export function allergyName(id, s = store.get()) {
  return ALLERGIES.find((a) => a.id === id)?.name
    || MILK_PARTS.find((a) => a.id === id)?.name
    || MORE_ALLERGIES.find((a) => a.id === id)?.name
    || s.customAllergies.find((a) => a.id === id)?.name || id;
}

/** Allergens of his that her words mention, with the phrase she used ("peanut chutney"). */
export function unsafeInText(text, s = store.get()) {
  const t = ` ${text.toLowerCase().replace(/[^a-zऀ-ॿ\s]/g, ' ')} `;
  const hits = [];
  avoidList(s).forEach((a) => {
    const words = ALLERGEN_WORDS[a] || [allergyName(a, s).toLowerCase()];
    for (const w of words) {
      // "peanut chutney", "mungfali ki sabzi", "doodh wali chai": keep the dish word that follows.
      const m = t.match(new RegExp(`\\s(${w}\\w*)((?:\\s+(?:ki|ka|ke|wali|wala|wale|chi|cha|che))?\\s+(?!and\\b|with\\b|or\\b|aur\\b)(\\w{3,}))?`));
      if (m) {
        const phrase = (m[1] + (m[2] || '')).replace(/\s+/g, ' ').trim();
        hits.push({ id: a, phrase, dish: m[3] || null });
        break;
      }
    }
  });
  return hits;
}

/** True if a typed food name contains one of his allergens. */
export function typedFoodUnsafe(name, s = store.get()) {
  return unsafeInText(` ${name} `, s);
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/* ==========================================================================
   Ranking ideas
   ========================================================================== */
const STATUS_SCORE = { well: 3, some: 1, not: -3 };

/* ---------- Known foods and twists ---------- */
/** He eats it (well or sometimes), or she ticked it in setup and it hasn't failed yet. */
export function knownFood(food, s = store.get()) {
  if (!food) return false;
  const st = s.foodStatus[food];
  return st ? st !== 'not' : s.foods.selected.includes(food);
}
/** The accepted food a twist is built on (e.g. palak cheela → cheela). */
export function twistBase(r) { return r?.food ? FOODS.find((f) => f.id === r.food)?.twistOf || null : null; }
/** A twist he hasn't had yet. */
export function isNewFor(r, s = store.get()) {
  return !!twistBase(r) && !s.foodStatus[r.food] && !s.foods.selected.includes(r.food);
}
/** A new twist is only suggested on its own when he accepts the base it is built on. */
function twistOk(r, s) { return knownFood(twistBase(r), s); }
/** Known foods first; at most one new twist, in third place (variety without risk). */
export function withOneTwist(list, s = store.get()) {
  const known = list.filter((r) => !isNewFor(r, s));
  const fresh = list.filter((r) => isNewFor(r, s));
  return [...known.slice(0, 2), ...fresh.slice(0, 1), ...known.slice(2), ...fresh.slice(1)];
}

function score(r, s, ctx) {
  let n = 0;
  const st = r.food ? s.foodStatus[r.food] : null;
  if (st) n += STATUS_SCORE[st];
  else if (r.food && s.foods.selected.includes(r.food)) n += 2;
  else if (isNewFor(r, s) && twistOk(r, s)) n += 0.8;
  if (ctx.soft && r.tags.includes('soft')) n += 3;
  if (ctx.busy && r.mins <= 15 && !r.prep) n += 2;
  if (r.tags.includes('sameFamily')) n += 0.5;
  if (r.mins <= 10) n += 0.5;
  // Snack time: ready-to-eat first (2 of 3 parents: a snack is bought or ready, not cooked).
  // Homemade stock at home leads, then fruit/packets that are at home, then the rest.
  if (ctx.meal === 'snack' && r.snackType) {
    const atHome = (r.needs || []).every((x) => homeToday(s).includes(x));
    n += SNACK_STOCK.some((d) => d.id === r.id && d.kind === 'stock') ? 5 : atHome ? 4 : 1.5;
  }
  return n;
}

/**
 * Rank recipes for a meal.
 * ctx: { meal, time, home: string[]|null, soft, finger, busy, exclude: [], allowNew }
 */
export function rankIdeas(ctx, s = store.get()) {
  const home = ctx.home ? new Set(ctx.home) : null;
  return RECIPES
    .filter((r) => !r.familyOnly && recipeSafe(r, s))
    .filter((r) => snackAvailable(r, s))   // no ladoo idea when the jar is empty
    // A brand-new dish only when it builds on something he accepts (or she asked for it).
    .filter((r) => ctx.allowNew || !isNewFor(r, s) || twistOk(r, s))
    .filter((r) => !ctx.meal || r.meals.includes(ctx.meal))
    .filter((r) => !ctx.time || r.mins <= ctx.time)
    .filter((r) => !home || r.needs.every((n) => home.has(n)))
    .filter((r) => !(ctx.exclude || []).includes(r.id))
    .filter((r) => !ctx.finger || r.tags.includes('finger'))
    .filter((r) => !ctx.soft || r.tags.includes('soft'))
    .filter((r) => !ctx.busy || !r.prep)
    .map((r, i) => ({ r, n: score(r, s, ctx) - i * 0.001 }))
    .sort((a, b) => b.n - a.n)
    .map((x) => x.r);
}

/** "Or pick a ready idea": his usual foods, no ingredient check. */
export function readyIdeas(mealId, s = store.get(), exclude = []) {
  const list = rankIdeas({ meal: mealId, exclude }, s);
  return withOneTwist(list.length ? list : rankIdeas({ exclude }, s), s);
}

export function ideaMeta(r, s = store.get()) {
  // Snacks from the jar are ready now: their minutes are for making a batch, not for serving.
  if (r.snackType === 'stock') return stockStatus(s, r.id) === 'low' ? 'Ready · from your jar · running low' : 'Ready · from your jar';
  if (r.custom) return 'Your dish';
  const parts = [`${r.mins} min`, r.meta];
  if (isNewFor(r, s)) {
    // The tag says what is new; this says why it is likely to work.
    const base = findFood(twistBase(r))?.name;
    return base ? `${r.mins} min · Like his ${base.toLowerCase()}` : `${r.mins} min · ${r.meta}`;
  } else if (r.food && (s.foodStatus[r.food] === 'well' || (!s.foodStatus[r.food] && s.foods.selected.includes(r.food)))) parts.push('He eats this often');
  return [...new Set(parts)].join(' · ');
}

/** "New twist on cheela": the one new ingredient, for the idea's tag. */
export function twistTag(r, s = store.get()) {
  if (!isNewFor(r, s)) return null;
  const add = INGREDIENTS.find((i) => i.id === r.adds)?.name;
  return add ? `New · adds ${add.toLowerCase()}` : 'New for him';
}

/* ---------- What's at home ---------- */
export function homeToday(s = store.get()) {
  // Today's ticks count only for today; otherwise the last list she confirmed (nothing for a new parent).
  const base = (s.home.todayDate === todayKey() ? s.home.today : (s.home.lastToday ?? s.home.today)) || [];
  return base.filter((id) => !s.shopping.ranOut.includes(id));
}
export const ingredient = (id) => INGREDIENTS.find((i) => i.id === id);
export function homeSummary(s = store.get()) {
  const list = homeToday(s).map((id) => ingredient(id)?.name.toLowerCase()).filter(Boolean);
  if (!list.length) return 'Tick what you have';
  const short = [...new Set(list.map((n) => n.replace(' flour', '').replace(/^(moong|toor) dal$/, 'dal')))];
  const first = short.slice(0, 3).join(', ');
  const more = short.length - 3;
  return more > 0 ? `${cap(first)} + ${more} more` : cap(first);
}

export function homeIdeas(s = store.get()) {
  // "Anything to keep in mind?" is read the same way as a request: soft, finger food, no rice…
  const note = parseRequest(s.home.note || '', s);
  const soft = note.flags.soft; const finger = note.flags.finger;
  const home = homeToday(s);
  const ctx = { meal: s.home.meal || mealNow(), time: s.home.time, home, soft, finger, exclude: [] };
  const avoid = (r) => !note.exclude.some((id) => r.needs.includes(id));
  let list = rankIdeas(ctx, s).filter(avoid);
  if (!list.length && (soft || finger)) list = rankIdeas({ ...ctx, soft: false, finger: false }, s).filter(avoid);
  list = withOneTwist(list, s);
  // Pantry-app pattern: dishes that need just ONE more thing (never an allergen; she can buy or skip it).
  const almost = rankIdeas({ ...ctx, home: null }, s).filter(avoid)
    .filter((r) => !list.includes(r))
    .map((r) => ({ r, missing: r.needs.filter((n) => !home.includes(n)) }))
    .filter((x) => x.missing.length === 1)
    // Two different things to pick up, not two dishes that both need curd.
    .filter((x, i, a) => a.findIndex((y) => y.missing[0] === x.missing[0]) === i)
    .slice(0, 2);
  return { list, almost, ctx: { ...ctx, soft, finger }, note };
}

/** Why nothing fits, and the one-tap fixes (E03). */
export function nothingFitsFixes(s = store.get()) {
  const home = homeToday(s);
  const meal = s.home.meal || mealNow();
  // Offer a fix only if it really brings back ideas.
  const works = (patch) => rankIdeas({ meal, time: s.home.time, home, ...patch }, s).length > 0;
  const candidates = [
    { id: 'time', title: 'Allow 20 minutes', sub: 'More of his usual dishes fit', icon: 'clock', ok: (s.home.time || 20) < 20 && works({ time: 20 }) },
    { id: 'staples', title: 'Add rice or dal', sub: 'Most of his foods use one of these', icon: 'bowl', ok: !home.includes('rice') && works({ home: [...home, 'rice', 'moong-dal'] }) },
    { id: 'both', title: 'Add rice or dal, and allow 20 minutes', sub: 'Most of his usual dishes fit then', icon: 'bowl', ok: (s.home.time || 20) < 20 && !home.includes('rice') && works({ time: 20, home: [...home, 'rice', 'moong-dal'] }) },
  ];
  let fixes = candidates.filter((c) => c.ok);
  // Prefer single changes; show the combined one only if neither single change works.
  if (fixes.some((f) => f.id !== 'both')) fixes = fixes.filter((f) => f.id !== 'both');
  // Still nothing? Find the one ingredient that would unlock the most of his dishes.
  if (fixes.length < 2) {
    const time = Math.max(s.home.time || 20, 20);
    const more = time !== s.home.time ? ' in 20 minutes' : '';
    const covered = fixes.some((f) => f.id === 'staples' || f.id === 'both') ? ['rice', 'moong-dal'] : [];
    const unlocks = INGREDIENTS
      .filter((i) => !home.includes(i.id) && !covered.includes(i.id) && !(i.allergens || []).some((a) => avoids(a, s)))
      .map((i) => ({ i, n: rankIdeas({ meal, time, home: [...home, i.id] }, s).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 2 - fixes.length);
    unlocks.forEach(({ i, n }) => fixes.push({ id: `add:${i.id}`, title: `Add ${i.name.toLowerCase()}`, sub: `${n} of his dishes fit with it${more}`, icon: 'basket' }));
  }
  const tags = [];
  const named = home.slice(0, 2).map((id) => ingredient(id)?.name).filter(Boolean);
  tags.push(!home.length ? 'Nothing ticked' : home.length <= 2 && named.length ? `${named.join(' and ')} only` : `${home.length} things at home`);
  tags.push(`${s.home.time} min`);
  return { fixes, tags };
}

/* ---------- Ask for something specific ---------- */
/* Words → what she means. Matching is on whole words, in English, Hindi and Marathi. */
const DISH_WORDS = {
  khichdi: ['khichdi', 'khichri', 'khichadi', 'खिचड़ी', 'खिचडी'], cheela: ['cheela', 'chilla', 'chila', 'dosa', 'pancake', 'चीला', 'धिरडे'],
  poha: ['poha', 'pohe'], upma: ['upma'], idli: ['idli', 'idly'], porridge: ['porridge', 'dalia', 'kanji', 'pej', 'malt'],
  balls: ['balls', 'laddoo', 'ladoo', 'laddu'], bhurji: ['bhurji', 'scramble', 'scrambled'], 'curd rice': ['curd rice', 'curd-rice', 'dahi chawal', 'dahi bhat', 'thayir sadam'],
  'dal-rice': ['dal rice', 'dal-rice', 'dal chawal', 'varan bhat', 'dal bhat'], roti: ['roti', 'chapati', 'phulka', 'paratha', 'bhakri'],
};
const FLAG_LABELS = { soft: 'Soft', finger: 'Finger food', quick: 'Quick', sweet: 'Naturally sweet', noCook: 'No cooking', light: 'Light on the tummy' };
const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Commas and "but" end a clause, so "no rice, palak" never reads as "no palak".
const normText = (t) => ` ${t.toLowerCase().replace(/[,.;!?]|\bbut\b|\bpar\b/g, ' | ').replace(/[^a-z0-9ऀ-ॿ\s|-]/g, ' ').replace(/\s+/g, ' ').trim()} `;
const hasWord = (t, w) => new RegExp(`\\s${esc(w)}(?:s|es)?(?=\\s)`).test(t);
// English negations come before the food ("no rice", "without egg", "bina chawal");
// Hindi/Marathi ones come after it ("chawal nahi", "palak nako").
const PRE_NEG = REQUEST_NEGATIONS.filter((w) => !['nahi', 'nako'].includes(w));
const negated = (t, w) => new RegExp(`\\s(?:${PRE_NEG.join('|')})\\s(?:[^\\s|]+\\s)?${esc(w)}(?:s|es)?(?=\\s)`).test(t)
  || new RegExp(`\\s${esc(w)}(?:s|es)?\\s(?:nahi|nahin|nako|mat|नहीं|नको)(?=\\s)`).test(t);
const MEAL_WORDS = { breakfast: ['breakfast', 'nashta', 'nashta', 'morning'], lunch: ['lunch', 'jevan', 'afternoon'], snack: ['snack', 'evening snack', 'tiffin'], dinner: ['dinner', 'tonight', 'night', 'raat'] };

/** Read a request ("something with palak, no rice") into what to include, avoid and how. */
export function parseRequest(text, s = store.get()) {
  const t = normText(text);
  const include = []; const exclude = [];
  INGREDIENTS.forEach((i) => {
    const words = [...(i.words || []), i.name.toLowerCase()];
    const hit = words.find((w) => hasWord(t, w));
    if (!hit) return;
    if (words.some((w) => negated(t, w))) exclude.push(i.id); else include.push(i.id);
  });
  // "dal" alone is too general to force moong dal when she also named a dish with dal.
  const dishes = Object.keys(DISH_WORDS).filter((k) => DISH_WORDS[k].some((w) => hasWord(t, w) && !negated(t, w)));
  if (dishes.includes('dal-rice')) { const x = include.indexOf('moong-dal'); if (x > -1) include.splice(x, 1); const y = include.indexOf('rice'); if (y > -1) include.splice(y, 1); }
  if (dishes.includes('curd rice')) ['curd', 'rice'].forEach((id) => { const x = include.indexOf(id); if (x > -1) include.splice(x, 1); });
  const flags = Object.fromEntries(Object.entries(REQUEST_FLAGS).map(([k, ws]) => [k, ws.some((w) => hasWord(t, w))]));
  // Allergens: what she named that he can't have. Saying "no paneer" is not a risk.
  const unsafe = unsafeInText(text, s).filter((u) => !exclude.some((id) => (INGREDIENTS.find((i) => i.id === id)?.allergens || []).includes(u.id)));
  include.filter((id) => (INGREDIENTS.find((i) => i.id === id)?.allergens || []).some((a) => avoids(a, s)))
    .forEach((id) => { const a = INGREDIENTS.find((i) => i.id === id).allergens.find((x) => avoids(x, s)); if (!unsafe.some((u) => u.id === a)) unsafe.push({ id: a, phrase: ingredient(id).name.toLowerCase() }); });
  const safeInclude = include.filter((id) => !(INGREDIENTS.find((i) => i.id === id)?.allergens || []).some((a) => avoids(a, s)));
  const understood = [
    ...dishes.map((d) => capFirst(d)),
    ...safeInclude.map((id) => ingredient(id).name.replace(' flour', '')),
    ...exclude.map((id) => `No ${ingredient(id).name.toLowerCase().replace(' flour', '')}`),
    ...Object.keys(flags).filter((k) => flags[k]).map((k) => FLAG_LABELS[k]),
  ];
  const meal = Object.keys(MEAL_WORDS).find((m) => MEAL_WORDS[m].some((w) => hasWord(t, w))) || null;
  if (meal && understood.length) understood.push(`For ${meal}`);
  return { text: text.trim(), include: safeInclude, exclude, dishes, flags, unsafe, understood, meal, soft: flags.soft, finger: flags.finger };
}

const ingOf = (r) => new Set([...r.needs, ...(r.ingredients || []).map((x) => x[0])]);
const dishText = (r) => `${r.name} ${findFood(r.food)?.name || ''}`.toLowerCase().replace(/-/g, ' ');
function requestChecks(req) {
  const checks = [];
  req.include.forEach((id) => checks.push((r) => ingOf(r).has(id)));
  req.dishes.forEach((d) => checks.push((r) => DISH_WORDS[d].some((w) => dishText(r).includes(w.replace(/-/g, ' '))) || dishText(r).includes(d.replace(/-/g, ' '))));
  if (req.flags.soft) checks.push((r) => r.tags.includes('soft'));
  if (req.flags.finger) checks.push((r) => r.tags.includes('finger'));
  if (req.flags.quick) checks.push((r) => r.mins <= 10);
  if (req.flags.sweet) checks.push((r) => r.tags.includes('sweet') || ['banana', 'dates', 'apple'].some((f) => ingOf(r).has(f)));
  if (req.flags.noCook) checks.push((r) => r.tags.includes('noCook'));
  if (req.flags.light) checks.push((r) => r.tags.includes('soft') && !r.allergens.some((a) => ['milk', 'curd', 'paneer', 'ghee'].includes(a)));
  return checks;
}

/** Ideas for her request. Sets req.exact (all of it matched) and req.withinTime. */
export function requestIdeas(req, s = store.get()) {
  // Asked for = allowed to be new; still only safe, never what she excluded.
  // A meal she named ("quick breakfast…") narrows the pool; otherwise any meal.
  const pool = (req.meal && rankIdeas({ allowNew: true, meal: req.meal }, s).length ? rankIdeas({ allowNew: true, meal: req.meal }, s) : rankIdeas({ allowNew: true }, s))
    .filter((r) => !req.exclude.some((id) => ingOf(r).has(id)));
  const checks = requestChecks(req);
  req.criteria = checks.length;
  let list;
  if (!checks.length) {
    // Only exclusions or a meal ("no rice tonight"): the pool already honours them.
    list = withOneTwist(pool, s);
    req.exact = true;
  } else {
    const scored = pool.map((r, i) => ({ r, hits: checks.filter((c) => c(r)).length, i }));
    const exact = scored.filter((x) => x.hits === checks.length).map((x) => x.r);
    req.exact = exact.length > 0;
    list = req.exact ? exact : scored.filter((x) => x.hits > 0).sort((a, b) => b.hits - a.hits || a.i - b.i).map((x) => x.r);
    // What he already eats leads; new twists follow (she still sees them, never first).
    list = [...list.filter((r) => !isNewFor(r, s)), ...list.filter((r) => isNewFor(r, s))];
    if (!list.length) list = withOneTwist(pool, s);
  }
  // Respect the time she has; relax only when nothing fits in it.
  const time = s.home.time || null;
  const timed = time ? list.filter((r) => r.mins <= time) : list;
  req.withinTime = !!time && timed.length > 0;
  return (timed.length ? timed : list).slice(0, 3);
}

export function requestTitle(req) {
  if (!req.understood.length) return req.unsafe.length ? 'Ideas for your request' : 'Ideas from his usual foods';
  if (!req.exact) return 'Closest ideas';
  const f = req.flags;
  const head = f.soft ? 'Soft ideas' : f.finger ? 'Finger food ideas' : f.sweet ? 'Naturally sweet ideas' : f.quick ? 'Quick ideas'
    : f.noCook ? 'No-cook ideas' : f.light ? 'Light ideas' : req.dishes.length ? `${capFirst(req.dishes[0])} ideas` : 'Ideas';
  const withs = req.include.map((id) => ingredient(id).name.toLowerCase().replace(' flour', ''));
  const withouts = req.exclude.map((id) => ingredient(id).name.toLowerCase().replace(' flour', ''));
  return `${head}${withs.length ? ` with ${joinWords(withs)}` : ''}${withouts.length ? ` without ${joinWords(withouts)}` : ''}`;
}
const joinWords = (l) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);

/* ---------- The family's dinner → his plate ---------- */
export function familyPlate(text, s = store.get()) {
  const t = text.toLowerCase();
  const name = s.child.name || 'him';
  const rule = FAMILY_RULES.find((r) => r.words.some((w) => new RegExp(`\\b${w}`).test(t)));
  const unsafe = unsafeInText(text, s);
  const safe = (id) => recipeSafe(recipe(id), s);
  if (!rule && unsafe.length) {
    // An unknown dish that names his allergen: never turn it into "Soft <allergen>".
    // Offer his safest usual plate instead, with the allergy alert on top.
    const fallback = ['soft-dal-rice', 'dal-rice-balls', 'mashed-banana'].map(recipe).find((r) => recipeSafe(r, s));
    return { title: `${name === 'him' ? 'His' : `${name}’s`} plate`, from: `From tonight’s ${t.trim()}`, feature: fallback, more: ['dal-rice-balls', 'plain-curd-rice'].map(recipe).filter((r) => r && r.id !== fallback?.id && recipeSafe(r, s)), unsafe };
  }
  if (!rule) {
    const custom = {
      id: 'custom', name: `Soft ${t.split(/,| and /)[0].trim() || 'plate'}`, hi: '', photo: null, mins: 5,
      meta: 'From the family’s pot', meals: ['lunch', 'dinner'], needs: [], allergens: [], diet: 'veg', tags: ['sameFamily'], groups: [],
      tip: 'take his part out before salt, chilli and tadka. Mash or cut it small.',
      ingredients: [['family', `${cap(text.trim())}, his part`, '½ cup']],
      steps: ['Take his part out before salt, chilli and tadka.', 'Mash it or cut it into small soft pieces.', 'Serve warm, not hot.'],
    };
    return { title: `${name === 'him' ? 'His' : `${name}’s`} plate`, from: `From tonight’s ${t.trim()}`, feature: custom, more: ['dal-rice-balls', 'soft-dal-rice'].filter(safe).map(recipe), unsafe };
  }
  // A dish is unsafe if it has his allergen, or if her unsafe phrase names a part of it
  // ("mungfali ki sabzi" → anything with sabzi is out).
  const unsafeParts = unsafe.map((u) => u.dish).filter(Boolean);
  const partOk = (id) => !unsafeParts.some((p) => recipe(id).name.toLowerCase().includes(p));
  const ok = (id) => safe(id) && partOk(id);
  let featureId = rule.feature;
  if (!ok(featureId)) featureId = rule.more.find(ok) || ['soft-dal-rice', 'dal-rice-balls', 'mashed-banana'].find(ok) || 'mashed-banana';
  const more = rule.more.filter((id) => id !== featureId && ok(id)).map(recipe);
  return {
    title: `${rule.title} for ${name}`,
    from: `From tonight’s ${t.trim().replace(/\s+/g, ' ')}`,
    feature: recipe(featureId),
    more: more.length ? more : ['dal-rice-balls'].filter(safe).map(recipe),
    unsafe,
  };
}

/* ==========================================================================
   History (what he ate)
   ========================================================================== */
export const OUTCOMES = {
  well: { id: 'well', name: 'Ate well', short: 'ate well', icon: 'ateWell' },
  some: { id: 'some', name: 'Ate some', short: 'ate some', icon: 'ateSome' },
  not: { id: 'not', name: 'Did not eat', short: 'did not eat', icon: 'didNotEat' },
};

export function entry(s, key, mealId) { return s.history[key]?.[mealId] || null; }

/** Mutates a store draft. */
export function logMeal(draft, { date = todayKey(), meal: mealId, food = null, name, outcome = null, by = 'you', note = '', recipe: rid = null, time = fmtTime() }) {
  draft.history[date] = draft.history[date] || {};
  const had = draft.history[date][mealId];
  draft.history[date][mealId] = { food, name, outcome, by, note, recipe: rid, time };
  // A snack from the jar uses one serving (not twice if the same entry is re-saved).
  const stockId = rid && SNACK_STOCK.some((d) => d.id === rid) ? rid : null;
  if (stockId && !(had && had.recipe === rid)) {
    const st = (draft.snackStock || []).find((x) => x.id === stockId);
    if (st && st.servingsLeft > 0) { st.servingsLeft -= 1; st.status = st.servingsLeft <= 0 ? 'finished' : st.servingsLeft <= 2 ? 'low' : 'plenty'; }
  }
  // A new twist he has now tried joins "Foods he eats" with how it went; Memory counts it as new.
  const f = food ? FOODS.find((x) => x.id === food) : null;
  if (f?.twistOf && outcome) {
    draft.foods.list = [...new Set([...draft.foods.list, food])];
    draft.foods.selected = [...new Set([...draft.foods.selected, food])];
    draft.foodStatus[food] = outcome === 'well' ? 'well' : outcome === 'some' ? 'some' : 'not';
    draft.firstTried = draft.firstTried || {};
    if (!draft.firstTried[food]) draft.firstTried[food] = date;
  }
}

/** Twists he tried for the first time in the week of `monday` (Memory → Variety). */
export function newTriedIn(s, keys) {
  return Object.entries(s.firstTried || {}).filter(([, d]) => keys.includes(d)).map(([food]) => findFood(food)).filter(Boolean);
}

export function entryLine(e) {
  if (!e) return '';
  const parts = [];
  if (e.outcome) parts.push(OUTCOMES[e.outcome].name);
  if (e.by && e.by !== 'you') parts.push(`added by ${e.by}${e.time ? ', ' + e.time : ''}`);
  else if (e.by === 'you' && e.outcome) parts.push('added by you');
  if (e.note) parts.push(`noted “${e.note}”`);
  return parts.join(' · ').replace(/^./, (c) => c.toUpperCase());
}

/** His usual foods for a meal, most eaten first (L02 chips). */
export function usualFor(mealId, s = store.get()) {
  const counts = {};
  Object.values(s.history).forEach((day) => {
    const e = day[mealId];
    if (e?.food) counts[e.food] = (counts[e.food] || 0) + 1;
  });
  const fromHistory = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const fitting = s.foods.selected.filter((id) => {
    const r = RECIPES.find((x) => x.food === id);
    return !r || r.meals.includes(mealId);
  });
  return [...new Set([...fromHistory, ...fitting, ...s.foods.selected])]
    .filter((id) => findFood(id) && s.foodStatus[id] !== 'not')
    .slice(0, 6);
}

export function lastEaten(foodId, s = store.get()) {
  const keys = Object.keys(s.history).sort().reverse();
  for (const k of keys) {
    const hit = Object.values(s.history[k]).find((e) => e.food === foodId);
    if (hit) return { key: k, outcome: hit.outcome };
  }
  return null;
}

/** Days in a row (ending today or yesterday) he did not eat dinner. */
export function refusalStreak(s = store.get()) {
  let n = 0;
  let d = new Date();
  if (!entry(s, dateKey(d), 'dinner')) d = addDays(d, -1);
  for (let i = 0; i < 14; i++) {
    const e = entry(s, dateKey(d), 'dinner');
    if (e?.outcome === 'not') { n++; d = addDays(d, -1); } else break;
  }
  return n;
}

const GROUP_WORDS = {
  grains: ['rice', 'khichdi', 'poha', 'upma', 'idli', 'ragi', 'roti', 'oats', 'dosa', 'cheela', 'bhurji with rice', 'paratha', 'thepla', 'dalia', 'pulao'],
  dal: ['dal', 'khichdi', 'cheela', 'moong', 'rajma', 'pongal', 'sambar', 'varan'],
  veg: ['palak', 'veg', 'bhindi', 'peas', 'carrot', 'spinach', 'sabzi', 'cucumber', 'potato', 'saag'],
  fruit: ['banana', 'apple', 'papaya', 'mango', 'chikoo', 'date', 'fruit'],
  dairy: ['curd', 'milk', 'paneer', 'kheer', 'malt', 'dahi'],
};
export const FOOD_GROUP_LABELS = [
  ['grains', 'Grains and cereals'], ['dal', 'Dal and pulses'], ['veg', 'Vegetables'], ['fruit', 'Fruit'], ['dairy', 'Milk and curd'],
];
export function groupsOf(e) {
  const r = e.recipe ? recipe(e.recipe) : null;
  if (r?.groups?.length) return r.groups.filter((g) => g !== 'egg');
  const name = (e.name || '').toLowerCase();
  return Object.keys(GROUP_WORDS).filter((g) => GROUP_WORDS[g].some((w) => name.includes(w)));
}
export function foodGroupDays(keys, s = store.get()) {
  const out = Object.fromEntries(FOOD_GROUP_LABELS.map(([g]) => [g, 0]));
  keys.forEach((k) => {
    const set = new Set();
    Object.values(s.history[k] || {}).forEach((e) => { if (e.outcome !== 'not') groupsOf(e).forEach((g) => set.add(g)); });
    set.forEach((g) => { out[g] += 1; });
  });
  return out;
}

/* ==========================================================================
   Plan
   ========================================================================== */
export const FEEDERS = [{ id: 'me', name: 'Me' }, { id: 'aai', name: 'Aai' }, { id: 'helper', name: 'Helper' }];
export function feederName(id, s = store.get()) {
  if (id === 'me') return 'you';
  const c = s.carers.find((x) => x.id === id || x.relation.toLowerCase() === id);
  return c?.name || FEEDERS.find((f) => f.id === id)?.name || id;
}

function pickFor(s, mealId, busy, used) {
  const list = rankIdeas({ meal: mealId, busy, exclude: used }, s);
  return (list[0] || rankIdeas({ meal: mealId, exclude: [] }, s)[0])?.id || null;
}

/** Fill days [from..to] (keys) from the plan setup. Mutates draft. */
export function fillPlan(draft, keys) {
  const setup = draft.plan.setup;
  if (!setup) return;
  const used = [];
  keys.forEach((k) => {
    const d = fromKey(k);
    const busy = setup.busy.includes(weekdayIndex(d));
    const meals = busy ? [...new Set(['breakfast', 'lunch', ...setup.meals])] : [...setup.meals];
    const ordered = ['breakfast', 'lunch', 'snack', 'dinner'].filter((m) => meals.includes(m));
    const day = { busy, feeder: busy ? setup.feeder : 'me', meals: {} };
    // Not the same dish he already ate that day (e.g. poha at breakfast, poha again at dinner).
    const eatenToday = Object.values(draft.history[k] || {}).flatMap((e) => [e.recipe, ...RECIPES.filter((r) => r.food && r.food === e.food).map((r) => r.id)]).filter(Boolean);
    ordered.forEach((m) => {
      const id = pickFor(draft, m, busy, [...used.slice(-6), ...eatenToday]);
      day.meals[m] = id;
      if (id) used.push(id);
    });
    draft.plan.days[k] = day;
  });
}

export function planDay(key, s = store.get()) { return s.plan.days[key] || null; }

/** Other ideas for a planned meal: not already that day; dishes from the day before or after go last. */
export function planAlternatives(s, key, mealId, n = 3) {
  const day = s.plan.days[key];
  if (!day) return [];
  const list = rankIdeas({ meal: mealId, busy: day.busy, exclude: Object.values(day.meals).filter(Boolean) }, s);
  const d = fromKey(key);
  const near = [-1, 1].flatMap((x) => Object.values(s.plan.days[dateKey(addDays(d, x))]?.meals || {}));
  return [...list.filter((r) => !near.includes(r.id)), ...list.filter((r) => near.includes(r.id))].slice(0, n);
}

/* ---------- Snacks at home (usability round) ---------- */
const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000);
/** Status of one snack at home: plenty / low / finished (finished if none, used up or past its keep date). */
export function stockStatus(s, id) {
  const def = SNACK_STOCK.find((x) => x.id === id);
  const st = (s.snackStock || []).find((x) => x.id === id);
  if (!def || !st || !st.made) return 'finished';
  if (daysBetween(st.made, todayKey()) > def.keepsDays) return 'finished';
  if (st.servingsLeft <= 0) return 'finished';
  if (st.servingsLeft <= 2) return 'low';
  return 'plenty';
}
/** Set from "Snacks at home" (Plenty / Running low / Finished). Mutates draft. */
export function setStock(draft, id, status) {
  const def = SNACK_STOCK.find((x) => x.id === id);
  if (!def) return;
  draft.snackStock = (draft.snackStock || []).filter((x) => x.id !== id);
  const left = status === 'plenty' ? def.servings : status === 'low' ? 2 : 0;
  draft.snackStock.push({ id, made: status === 'finished' ? null : todayKey(), keepsDays: def.keepsDays, servingsLeft: left, status });
}
/** "Made it" from prep: back to plenty with today's date (or undo to finished). */
export function markStock(draft, id, made = true) { setStock(draft, id, made ? 'plenty' : 'finished'); }
/** Homemade stock that is low or finished → a TODAY prep item (never must-do). */
export function snackStockPrep(s) {
  const r = (id) => recipe(id);
  return SNACK_STOCK.filter((d) => d.kind === 'stock')
    .map((d) => ({ d, st: stockStatus(s, d.id), rec: r(d.id) }))
    .filter(({ st, rec }) => (st === 'low' || st === 'finished') && rec && recipeSafe(rec, s) && (s.snackStock || []).some((x) => x.id === rec.id))
    .map(({ d, st, rec }) => ({
      key: `stock|${d.id}`, date: todayKey(), meal: null, recipe: rec, stock: d.id, must: false, mins: d.mins, done: false,
      text: `${st === 'low' ? 'Almost over' : 'Finished'}. ${d.prepLine.replace(/ · \d+ min$/, '')}`,
    }));
}
/** Finished bought snacks → shopping list "Snacks" group. */
export function snacksToBuy(s) {
  return SNACK_STOCK.filter((d) => d.kind === 'buy' && (s.snackStock || []).some((x) => x.id === d.id) && stockStatus(s, d.id) === 'finished')
    .map((d) => d.ingredient);
}
/** Can this snack be offered now? Stock snacks need some at home. */
export function snackAvailable(r, s) {
  if (!r.snackType) return true;
  const def = SNACK_STOCK.find((x) => x.id === r.id);
  if (!def) return true;                  // fresh fruit: depends on what's at home, not stock
  return stockStatus(s, r.id) !== 'finished';
}

/* ---------- Prep: "show one, see all" (DS v1.3 pattern) ---------- */
/** Was this prep step done? Per item; an old whole-day "done" still counts. */
export function prepIsDone(s, date, meal) {
  return !!(s.plan.prepItems?.[`${date}|${meal}`] || s.plan.prepDone?.[date]);
}

const prepItem = (s, date, meal, r, extra = {}) => ({
  key: `${date}|${meal}`, date, meal, recipe: r,
  text: (/[.!?]$/.test(r.ahead) ? r.ahead : `${r.ahead}.`).replace(/\.$/, ''),
  must: !!r.prep, mins: r.aheadMins || 5, done: prepIsDone(s, date, meal), ...extra,
});

/**
 * Prep for today and tomorrow.
 * today: the planned meals still ahead today (prep done last night shows as done);
 * tomorrow: every planned meal tomorrow with a real step (no filler).
 * Snack stock to make again is added to `today` (see snackStockPrep).
 */
export function prepPlan(s = store.get()) {
  const now = mealNow();
  const tk = todayKey();
  const tmk = dateKey(addDays(new Date(), 1));
  const order = MEALS.map((m) => m.id);
  const fromDay = (date, mealsToUse) => {
    const day = s.plan.days[date];
    if (!day) return [];
    return mealsToUse.filter((m) => day.meals[m])
      .map((m) => [m, adaptForChild(recipe(day.meals[m]), s)])
      .filter(([, r]) => r && recipeSafe(r, s) && r.ahead)
      .map(([m, r]) => prepItem(s, date, m, r));
  };
  const ahead = order.slice(order.indexOf(now));
  const today = fromDay(tk, ahead).filter((x) => !entry(s, tk, x.meal) && !(s.served?.date === tk && s.served.meal === x.meal))
    .map((x) => ({ ...x, doneLastNight: x.done }));
  const stock = typeof snackStockPrep === 'function' ? snackStockPrep(s) : [];
  const tomorrow = fromDay(tmk, order);
  const all = [...today, ...stock, ...tomorrow];
  const open = all.filter((x) => !x.done);
  // The one to show: a must-do first, then what is needed soonest (today before tomorrow).
  const lead = open.find((x) => x.must && x.date === tmk) || open.find((x) => x.date === tk) || open[0] || null;
  return { today: [...today, ...stock], tomorrow, all, open, lead, todayKey: tk, tomorrowKey: tmk };
}


/** Mark prep items done (or undo). `keys` like "2026-11-28|breakfast". */
export function setPrepDone(draft, keys, done = true) {
  draft.plan.prepItems = draft.plan.prepItems || {};
  keys.forEach((k) => { if (done) draft.plan.prepItems[k] = true; else delete draft.plan.prepItems[k]; });
}

/** Shopping list from the coming week's plan. */
export function shoppingList(s = store.get()) {
  const have = new Set(homeToday(s));
  const got = new Set(s.shopping.got);
  const groups = [];
  const seen = new Set();
  const snackItems = [];   // ready-to-eat snacks in the plan + finished bought snacks
  const start = new Date();
  for (let i = 0; i < 8; i++) {
    const d = addDays(start, i);
    const dk = dateKey(d);
    const day = s.plan.days[dk];
    if (!day) continue;
    const items = [];
    MEALS.map((x) => x.id).filter((m) => day.meals[m]).forEach((m) => {
      const rid = day.meals[m];
      if (entry(s, dk, m)) return; // already eaten: nothing to buy for it
      const r = recipe(rid);
      r?.needs.forEach((n) => {
        if (have.has(n) || seen.has(n)) return;
        seen.add(n);
        // What it is for ("for Wed palak khichdi"), so she can swap that dish instead of buying.
        const dayShort = i === 0 ? 'today’s' : d.toLocaleDateString('en-IN', { weekday: 'short' });
        const item = {
          id: n, name: ingredient(n)?.name || n, qty: BUY_QTY[n] || '',
          forText: `for ${dayShort} ${r.name.toLowerCase()}`, forKey: dk, forMeal: m, forName: r.name,
          // Perishable and 3+ days away: buy it closer to the day so it is fresh.
          buyLater: ingredient(n)?.perishable && i >= 3 ? d.toLocaleDateString('en-IN', { weekday: 'short' }) : null,
        };
        (r.snackType === 'buy' ? snackItems : items).push(item);
      });
    });
    if (items.length) groups.push({ title: i === 0 ? 'For today' : `For ${dayName(d)}`, items });
  }
  const ranOut = s.shopping.ranOut.filter((n) => !seen.has(n)).map((n) => ({ id: n, name: ingredient(n)?.name || n, qty: BUY_QTY[n] || '' }));
  ranOut.forEach((x) => seen.add(x.id));
  if (ranOut.length) groups.push({ title: 'Ran out', items: ranOut });
  // Bought snacks that are finished (Snacks at home → Finished).
  snacksToBuy(s).filter((n) => !seen.has(n)).forEach((n) => { seen.add(n); snackItems.push({ id: n, name: ingredient(n)?.name || n, qty: BUY_QTY[n] || '', forText: 'finished at home' }); });
  if (snackItems.length) groups.push({ title: 'Snacks', items: snackItems });
  const manual = s.shopping.manual.filter((x) => !seen.has(x.id)).map((x) => ({ ...x, forText: x.for || '' }));
  if (manual.length) groups.push({ title: 'Added by you', items: manual });
  const all = groups.flatMap((g) => g.items);
  const open = groups.map((g) => ({ ...g, items: g.items.filter((x) => !got.has(x.id)) })).filter((g) => g.items.length);
  const done = all.filter((x) => got.has(x.id));
  return { groups: open, done, count: open.reduce((n, g) => n + g.items.length, 0) };
}

/* ==========================================================================
   Returning parent: two weeks of believable history, a plan, carers
   ========================================================================== */
export function seedReturning(draft) {
  const today = new Date();
  const P = (food, outcome, by = 'you', time = '', note = '') => ({ food, name: findFoodName(food), outcome, by, time, note, recipe: null });
  // 13 days back → yesterday. Patterns repeat; no 3-day dinner refusal.
  const pattern = [
    { breakfast: P('poha', 'well'), lunch: P('dal-rice', 'well'), dinner: P('khichdi', 'well') },
    { breakfast: P('ragi-porridge', 'well', 'Aai', '9:05 am'), lunch: P('curd-rice', 'some', 'Aai', '1:10 pm'), snack: P('banana', 'well'), dinner: P('khichdi', 'some') },
    { breakfast: P('upma', 'some'), lunch: P('dal-rice', 'well'), dinner: P('cheela', 'well') },
    { breakfast: P('poha', 'well', 'Aai', '9:15 am'), lunch: P('palak-khichdi', 'some', 'Aai', '1:20 pm'), snack: { food: null, name: 'Milk', outcome: 'well', by: 'you', time: '5:30 pm', note: '', recipe: null }, dinner: P('dal-rice', 'some') },
    { breakfast: P('idli', 'well'), lunch: P('dal-rice', 'well'), dinner: P('khichdi', 'not') },
    { breakfast: P('poha', 'well'), lunch: P('curd-rice', 'well'), dinner: P('khichdi', 'well') },
    { breakfast: P('ragi-porridge', 'some'), dinner: P('dal-rice', 'well') },
  ];
  for (let i = 13; i >= 1; i--) {
    const k = dateKey(addDays(today, -i));
    const p = structuredClone(pattern[i % pattern.length]);
    if (i === 2) p.snack = { food: null, name: 'Milk', outcome: 'well', by: 'you', time: '5:40 pm', note: '', recipe: null };
    if (i === 2 && p.dinner) p.dinner.outcome = 'some';
    draft.history[k] = p;
  }
  // Today: Aai gave breakfast; lunch noted if it is past lunch.
  const tk = dateKey(today);
  draft.history[tk] = { breakfast: P('poha', 'well', 'Aai', '9:10 am') };
  if (today.getHours() >= 15) draft.history[tk].lunch = P('dal-rice', 'some', 'Aai', '1:15 pm', 'seemed tired');

  draft.home.usual = [...RETURNING_USUAL];
  draft.home.today = null;
  draft.home.lastToday = [...RETURNING_USUAL];   // "Use last time's list" has something to restore
  draft.shopping = { manual: [{ id: 'm-bananas', name: 'Bananas', qty: '6' }], ranOut: [], got: ['m-bananas'] };
  draft.carers = [
    { id: 'aai', name: 'Aai', relation: 'Grandmother', status: 'joined', lang: 'hi' },
    { id: 'sunita', name: 'Sunita', relation: 'Helper', status: 'pending', lang: 'hi' },
  ];
  draft.insight = { text: 'On 2 evenings he had milk after 5 pm, and both times he ate less dinner. Have you seen this too?', answered: null };
  draft.plan = { setup: { meals: ['dinner'], busy: [1, 3], feeder: 'aai' }, days: {}, prepDone: {}, prepItems: {} };
  // Snacks at home: a jar of ladoo, makhana running low, murmura, rice cakes finished.
  const ago = (n) => dateKey(addDays(new Date(), -n));
  draft.snackStock = [
    { id: 'dry-fruit-ladoo', made: ago(5), keepsDays: 14, servingsLeft: 6, status: 'plenty' },
    { id: 'roasted-makhana', made: ago(6), keepsDays: 10, servingsLeft: 2, status: 'low' },
    { id: 'murmura-bowl', made: ago(10), keepsDays: 30, servingsLeft: 8, status: 'plenty' },
    { id: 'rice-cakes-snack', made: null, keepsDays: 60, servingsLeft: 0, status: 'finished' },
  ];
  const mon = mondayOf(today);
  const keys = [...weekKeys(mon), ...weekKeys(addDays(mon, 7)).slice(0, 4)];
  fillPlan(draft, keys);
  // Make tomorrow's dinner the cheela that needs soaking, as in the Figma story.
  const tmr = dateKey(addDays(today, 1));
  if (draft.plan.days[tmr]) draft.plan.days[tmr].meals.dinner = 'moong-cheela';
}

function findFoodName(id) { return FOODS.find((f) => f.id === id)?.name || id; }

/* ==========================================================================
   Misc
   ========================================================================== */
export function capFirst(t) { return cap(t); }
