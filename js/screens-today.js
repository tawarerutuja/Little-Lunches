// Flow R2 (Today: decide what to give, two ways to start, the recipe),
// R3 (after serving, refusal) and R7 edge cases E01, E03, E04, E05, E06.

import { icon } from './icons.js';
import { phulka } from './phulka.js';
import {
  h, button, iconButton, topbar, textField, micButton, chip, note, openSheet, toast, comingSoon,
  radioGroupKeys, phulkaEl, mealBadge, outcomeTiles, mealSegmented, listenSheet, lockNotification,
  scheduleReminder, cancelReminder, sectionLabel, navRow, thumb, iconTile, focusIfKeyboard, menuSheet,
  askPermission, haptic, saveFailed, sim,
} from './components.js';
import { navigate, back, currentRoute } from './router.js';
import { store, childName, nameOr, ageInMonths, ageLabel, findFood, backupIds, unsafeAllergens, avoids } from './store.js';
import {
  MEALS, INGREDIENTS, INGREDIENT_GROUPS, TIME_CHOICES, FAMILY_DISHES, REQUEST_PICKS, REFUSAL_REASONS,
  SERVE_WAYS, thumbUrl, photoUrl,
} from './data.js';
import {
  todayKey, dateKey, addDays, mealNow, mealHeading, meal as mealOf, earlierMeals, recipe, recipeSafe,
  readyIdeas, ideaMeta, homeToday, homeSummary, homeIdeas, nothingFitsFixes, parseRequest, requestIdeas,
  requestTitle, familyPlate, OUTCOMES, entry, logMeal, entryLine, usualFor, refusalStreak, planDay,
  prepReminder, fmtTime, allergyName, ingredient, capFirst, fmtLong, fromKey, twistTag, planAlternatives, adaptForChild, allergyReason,
} from './meals.js';
import { shell, rise, joinNice, footerMsg, showMsg } from './screens.js';

/* ==========================================================================
   Helpers
   ========================================================================== */
export const isOffline = () => store.get().offlineSim || (typeof navigator !== 'undefined' && navigator.onLine === false);
const refresh = () => navigate(currentRoute(), { replace: true, transition: 'fade' });
const mealWord = (id) => mealOf(id).name.toLowerCase();
const kid = () => childName() || 'your child';
const possessive = () => (childName() ? `${childName()}’s` : 'Your child’s');

/** His backups that are still safe (an allergy added later removes a backup). */
function safeBackups() {
  return backupIds().map((id) => findFood(id)).filter((f) => f && !unsafeAllergens(f).length);
}
/** "banana" or "banana or curd-rice" (his safe backups, first two). */
function backupFood() {
  const names = safeBackups().map((f) => f.name.toLowerCase()).slice(0, 2);
  return names.length ? names.join(' or ') : null;
}
/** The one backup we suggest first (refusal screen). */
function firstBackup() {
  const f = safeBackups()[0];
  return f ? f.name.toLowerCase() : null;
}

function openRecipe(r, { replace = false } = {}) {
  if (!r) return;
  if (r.id === 'custom') store.ui({ recipe: 'custom', customRecipe: r, recipeCtx: null });
  else store.ui({ recipe: r.id, recipeCtx: null });
  navigate('recipe', replace ? { replace: true } : {});
}

/** Idea row: photo, name, meta, chevron. */
function ideaRow(r, { best = false } = {}) {
  const b = h('button', { type: 'button', class: 'row idea-row' },
    thumb(r.photo ? thumbUrl(r.photo) : null, 'idea-row__img'),
    h('span', { class: 'row__label' },
      best ? h('span', { class: 'tag tag--best', text: 'Best fit' }) : null,
      twistTag(r) ? h('span', { class: 'tag tag--new', text: twistTag(r) }) : null,
      h('span', { class: 'idea-row__name', text: r.name }),
      h('span', { class: 'row__meta', text: ideaMeta(r) })),
    h('span', { class: 'nav-row__chev', html: icon('forward') }));
  b.addEventListener('click', () => openRecipe(r));
  return b;
}

/** Ingredients by name or local word ("palak" → Spinach, "aloo" → Potato). Name matches first. */
function findIngredients(q) {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const byName = INGREDIENTS.filter((i) => i.name.toLowerCase().includes(t));
  const byWord = INGREDIENTS.filter((i) => !byName.includes(i) && (i.words || []).some((w) => w.startsWith(t) || (t.length > 3 && t.startsWith(w))));
  return [...byName, ...byWord];
}

function checkedStrip() {
  return h('p', { class: 'strip strip--safe' }, h('span', { class: 'contents', html: icon('backup') }), h('span', { text: 'Checked against his allergies and house rules' }));
}

function tagList(items) {
  return h('ul', { class: 'tag-list', 'aria-label': 'What you asked for' }, items.filter(Boolean).map((t) => h('li', { class: 'tag-pill', text: t })));
}

/* ==========================================================================
   Header (tab screens): name + age, avatar opens "Whose meals?"
   ========================================================================== */
export function childHeader(title) {
  const s = store.get();
  const months = ageInMonths(s.child.birth);
  // One child for now, so no switcher chevron: the avatar opens Profile, where
  // "Add another child" and every setting live (one control, one meaning).
  const avatar = childName()
    ? h('span', { class: 'avatar', text: childName().charAt(0).toUpperCase(), 'aria-hidden': 'true' })
    : h('span', { class: 'avatar avatar--icon', html: icon('child'), 'aria-hidden': 'true' });
  const profileBtn = h('button', { type: 'button', class: 'child-switch', 'aria-label': 'Profile and settings', title: 'Profile and settings' }, avatar);
  profileBtn.addEventListener('click', () => navigate('profile'));
  return h('header', { class: 'tab-header' },
    h('div', { class: 'tab-header__titles' },
      h('h1', { class: 't-title-l', text: title || `${possessive()} meals` }),
      months != null ? h('p', { class: 'tab-header__sub', text: ageLabel(months) }) : null),
    profileBtn);
}

/* ==========================================================================
   T01 · Today (also E01 offline, E06 refused 3 days, K01, K04, PL08)
   ========================================================================== */
export function todayScreen() {
  const s = store.get();
  const tk = todayKey();
  const now = mealNow();
  const blocks = [];

  // E01 · No internet: what still works, not an error.
  if (isOffline()) {
    blocks.push(note({ kind: 'info', iconName: 'offline', text: 'You’re offline. Ideas from his usual foods still work.' }));
  }

  // E06 · Refused dinner 3 days in a row (calm, says when to call the doctor).
  if (refusalStreak(s) >= 3 && !s.dismissed[`refusal-${tk}`]) {
    const n = refusalStreak(s);
    const card = h('section', { class: 'notice', 'aria-labelledby': 'notice-t' },
      h('div', { class: 'notice__top' },
        phulkaEl({ mood: 'calm', size: 64, disc: false }),
        h('div', {},
          h('h2', { class: 't-title-s', id: 'notice-t', text: `He didn’t eat dinner ${n} days in a row` }),
          h('p', { class: 'notice__body', text: 'This is often normal at his age. If he seems unwell, has a fever or stops drinking, call his doctor.' }))),
      h('div', { class: 'notice__actions' },
        button({ label: 'Got it', variant: 'secondary', size: 'm', cls: 'btn--auto', onClick: () => { store.set((d) => { d.dismissed[`refusal-${tk}`] = true; }); refresh(); } }),
        button({ label: 'Read more', variant: 'text', size: 'm', cls: 'btn--auto', onClick: () => { store.ui({ article: 'refused-liked' }); navigate('article'); } })));
    blocks.push(card);
  }

  // Earlier today, right here: what he already ate (from her or a carer), and an
  // optional + for meals not added yet. No need to open Memory to see today.
  const earlier = earlierMeals(now);
  const loggedNow = entry(s, tk, now);
  const servedToday = s.served && s.served.date === tk;
  const earlierBlock = earlier.length && !loggedNow && !servedToday ? earlierToday(s, tk, earlier) : null;

  // Tonight's head start for tomorrow: one small step per planned meal (5 minutes or less).
  // Soaking is a must-do and says so; the rest are optional head starts.
  const prep = prepReminder(s);
  const prepCard = prep ? h('section', { class: 'prep-card', 'aria-labelledby': 'prep-t' },
    h('p', { class: 'prep-card__eyebrow', id: 'prep-t' }, h('span', { class: 'contents', html: icon('clock') }),
      h('span', { text: `${loggedNow ? 'Before bed' : 'Tonight'} · ${prep.label.replace('For ', 'for ')}` })),
    h('ul', { class: 'prep-card__list' }, prep.items.map((x) => h('li', { class: 'prep-item' },
      h('span', { class: 'prep-item__head' },
        h('span', { class: `tl__meal tl__meal--${x.meal}`, text: mealOf(x.meal).name }),
        h('span', { class: 'prep-item__dish', text: x.recipe.name }),
        x.must ? h('span', { class: 'tag tag--prep', text: 'Must do' }) : null),
      h('span', { class: 'prep-item__text', text: x.text })))),
    h('div', { class: 'prep-card__foot' },
      button({ label: prep.items.length > 1 ? 'All done' : 'Done', variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact', onClick: () => {
        store.set((d) => { d.plan.prepDone[prep.key] = true; });
        haptic(10);
        toast('Nice. Tomorrow has a head start.', { iconName: 'success', action: { label: 'Undo', onClick: () => { store.set((d) => { delete d.plan.prepDone[prep.key]; }); refresh(); } } });
        refresh();
      } }))) : null;

  const served = s.served && s.served.date === tk && !entry(s, tk, s.served.meal) ? s.served : null;
  const planned = planDay(tk)?.meals?.[now];
  let plannedRecipe = planned ? recipe(planned) : null;
  // Edge case: an allergy added after planning makes tonight's planned meal unsafe.
  if (plannedRecipe && !recipeSafe(plannedRecipe, s)) {
    const bad = plannedRecipe.allergens.filter((a) => avoids(a, s)).map((a) => allergyName(a).toLowerCase());
    blocks.push(h('div', { class: 'alert', role: 'alert' }, h('span', { class: 'contents', html: icon('allergy') }),
      h('div', {}, h('p', { class: 'alert__title', text: `Your planned ${plannedRecipe.name.toLowerCase()} has ${joinNice(bad)}` }),
        h('p', { class: 'alert__body', text: `It is on his allergy list now, so we left it out. Pick something else below.` }))));
    plannedRecipe = null;
  }

  if (served) {
    if (prepCard) blocks.push(prepCard);
    blocks.push(howDidHeEatCard(served));
    // Same "Earlier today" section as before serving: only meals before this one.
    const before = earlierMeals(served.meal);
    if (before.length) blocks.push(earlierToday(s, tk, before));
  } else if (loggedNow) {
    // K04 · after the meal: one timeline, the prep, then tomorrow's breakfast.
    blocks.push(timeline({ title: 'Today' }));
    if (prepCard) blocks.push(prepCard);
    blocks.push(nextMealCard(now));
  } else {
    // Day in time order: what he ate earlier → tonight's prep → the decision.
    if (earlierBlock) blocks.push(earlierBlock);
    if (prepCard) blocks.push(prepCard);
    // Same card for every meal: the planned dish, or his best-fit idea when nothing is planned.
    if (plannedRecipe) blocks.push(suggestionCard(plannedRecipe, now, { planned: true }));
    else {
      const pick = todayPick(tk, now);
      blocks.push(pick ? suggestionCard(pick, now, { planned: false }) : emptyDecideCard(now));
    }
  }

  const { el } = shell({ cls: 'today', label: 'Today', bar: childHeader(), body: rise(blocks), tabs: 'today' });
  return { el, onLeave: el.cleanup };
}

/** Earlier today: logged meals with how he ate, and optional + rows for the rest. */
function earlierToday(s, tk, earlier) {
  const logged = earlier.filter((m) => entry(s, tk, m));
  const missing = earlier.length - logged.length;

  // T01 (Figma): nothing added yet → one quiet, optional row. Tap opens L02.
  if (!logged.length) {
    const b = h('button', { type: 'button', class: 'ask-card', 'aria-label': 'Did he eat earlier today? Optional. Tap to add.' },
      h('span', { class: 'ask-card__icons' }, earlier.map((m) => mealBadge(m, 's'))),
      h('span', { class: 'ask-card__text' },
        h('span', { class: 'ask-card__title', text: 'Did he eat earlier today?' }),
        h('span', { class: 'row__meta', text: 'Optional · tap to add' })),
      h('span', { class: 'nav-row__chev', html: icon('forward') }));
    b.addEventListener('click', () => logSheet(earlier.find((m) => !entry(s, tk, m)) || earlier[0], tk));
    return b;
  }

  // Something is added → show what was eaten, and what is still open (in time order).
  return h('section', { class: 'earlier', 'aria-labelledby': 'earlier-t' },
    h('div', { class: 'section-label section-gap' },
      h('h2', { class: 't-label', id: 'earlier-t', text: 'Earlier today' }),
      h('span', { class: 'row__meta', text: missing ? `${logged.length} of ${earlier.length} added · rest optional` : 'All added' })),
    h('div', { class: 'card timeline timeline--compact' }, earlier.map((m) => timelineRow(s, tk, m))));
}

/* ---------- Today's decision: one card for every meal (planned dish or best fit) ---------- */
/** The idea shown when nothing is planned: his best fit, or the one Swap moved to. */
function todayPick(tk, now) {
  const s = store.get();
  const id = s.ui.todayPick?.[`${tk}-${now}`];
  const chosen = id ? recipe(id) : null;
  if (chosen && recipeSafe(chosen, s)) return chosen;
  return readyIdeas(now)[0] || null;
}

/**
 * ONE connected card (agreed design, Gestalt common region): the idea first (Make this,
 * Swap, Ask), then, inside the same card, the other ways to decide: start from the
 * family's food or what's at home, or pick another ready idea. No sheet, nothing hidden.
 */
function suggestionCard(r, now, { planned }) {
  const tk = todayKey();
  const s = store.get();
  const prepNote = r.prep ? (s.plan.prepDone[tk] ? `${r.prep.replace('before bed', '').trim()} done last night` : 'Needs prep') : r.meta;
  const others = readyIdeas(now, s, [r.id]).slice(0, 2);
  return h('section', { class: 'card feature feature--decide', 'aria-labelledby': 'planned-t' },
    r.photo ? h('img', { class: 'feature__img', src: photoUrl(r.photo), alt: r.name, width: '362', height: '190', loading: 'eager' }) : null,
    h('div', { class: 'feature__body' },
      h('div', { class: 'tag-row' }, h('span', { class: `tag tag--meal-${now}`, text: mealHeading(now) }),
        h('span', { class: planned ? 'tag' : 'tag tag--best', text: planned ? 'From your plan' : 'Best fit' }),
        twistTag(r) ? h('span', { class: 'tag tag--new', text: twistTag(r) }) : null),
      h('h2', { class: 'feature__title', id: 'planned-t', text: r.name }),
      h('p', { class: 'feature__meta', text: planned ? `${r.mins} min · ${prepNote}` : ideaMeta(r) }),
      button({ label: 'Make this', onClick: () => openRecipe(r) }),
      // Real life changes plans: one tap swaps (Undo in the toast), or ask for something.
      h('div', { class: 'feature__actions' },
        button({ label: 'Swap', variant: 'secondary', size: 'm', iconName: 'swap', ariaLabel: `Swap ${r.name} for another idea`, onClick: () => (planned ? swapToday(tk, now) : swapPick(tk, now, r)) }),
        button({ label: 'Ask', variant: 'secondary', size: 'm', iconName: 'ai', ariaLabel: 'Ask for something specific', onClick: () => (isOffline() ? toast('Asking needs internet. Swap still works.', { iconName: 'offline' }) : askSheet()) }))),
    // The other ways to decide live in the same card, right below the idea.
    h('div', { class: 'feature__more-ways dinner' },
      h('p', { class: 'dinner__or', role: 'separator', 'aria-label': 'Or start from' }, h('span', { text: 'or start from' })),
      startCards(now),
      others.length ? h('p', { class: 'dinner__or', role: 'separator', 'aria-label': 'Or pick another idea' }, h('span', { text: 'or pick another idea' })) : null,
      others.length ? h('div', { class: 'idea-list idea-list--flat' }, others.map((x) => ideaRow(x))) : null,
      button({ label: 'None of these? Show other ideas', variant: 'text', iconName: 'refresh', cls: 'dinner__none', onClick: () => moreIdeasSheet(now, [r.id, ...others.map((x) => x.id)]) })));
}

/** Swap when nothing is planned: the next of his ready ideas, cycling, with Undo. */
function swapPick(tk, now, cur) {
  const s = store.get();
  const key = `${tk}-${now}`;
  const all = readyIdeas(now);
  const seen = new Set([...(s.ui.swapSeen?.[key] || []), cur.id]);
  const next = all.find((x) => !seen.has(x.id)) || all.find((x) => x.id !== cur.id);
  if (!next) { toast('This is his best fit for now. Try Ask for something specific.', { iconName: 'info' }); return; }
  const fresh = all.some((x) => !seen.has(x.id));
  haptic(10);
  store.ui({ todayPick: { ...(s.ui.todayPick || {}), [key]: next.id }, swapSeen: { ...(s.ui.swapSeen || {}), [key]: fresh ? [...seen] : [cur.id] } });
  refresh();
  toast(`Swapped to ${next.name}`, { iconName: 'swap', action: { label: 'Undo', onClick: () => { store.ui({ todayPick: { ...(store.get().ui.todayPick || {}), [key]: cur.id } }); refresh(); } } });
}

/** The two ways to start (family's cooking, what's at home), used in the sheet and the empty card. */
function startCards(now) {
  const offline = isOffline();
  const s = store.get();
  const family = h('button', { type: 'button', class: 'start-card start-card--family' },
    h('span', { class: 'start-card__art', html: icon('pot') }),
    h('span', { class: 'start-card__text' }, h('span', { class: 'start-card__title', text: ['lunch', 'dinner'].includes(now) ? `The family’s ${mealWord(now)}` : 'What the family eats' }), h('span', { class: 'start-card__sub', text: 'His plate from your cooking' })),
    h('span', { class: 'nav-row__chev', html: icon('forward') }));
  family.addEventListener('click', () => navigate('family-dinner'));
  const home = h('button', { type: 'button', class: 'start-card start-card--home', 'aria-disabled': offline ? 'true' : null },
    h('span', { class: 'start-card__art', html: icon('basket') }),
    h('span', { class: 'start-card__text' }, h('span', { class: 'start-card__title', text: 'What’s at home' }), h('span', { class: 'start-card__sub', text: offline ? 'Needs internet' : homeSummary(s) })),
    h('span', { class: 'nav-row__chev', html: icon('forward') }));
  home.addEventListener('click', () => {
    if (offline) { toast('“What’s at home” needs internet. His usual ideas below still work.', { iconName: 'offline' }); return; }
    store.set((d) => { d.home.meal = now; });
    navigate('home');
  });
  return h('div', { class: 'dinner__starts' }, family, home);
}

/** Edge case: nothing safe fits his foods yet (e.g. many allergies, few foods). */
function emptyDecideCard(now) {
  return h('section', { class: 'card dinner', 'aria-labelledby': 'decide-t' },
    h('header', { class: 'dinner__head' },
      h('p', { class: `eyebrow eyebrow--${now}` }, h('span', { class: 'contents', html: icon(now) }), h('span', { text: mealHeading(now) })),
      h('h2', { class: 't-title-m', id: 'decide-t', text: `Make his ${mealWord(now)} from` })),
    startCards(now),
    h('div', { class: 'dinner__empty' },
      h('p', { class: 'dinner__empty-title', text: 'No ready ideas yet' }),
      h('p', { class: 'row__meta', text: 'Add a few foods he eats, or start from the family’s food above.' }),
      button({ label: 'Add foods he eats', variant: 'secondary', size: 'm', onClick: () => navigate('his-foods') })));
}

/** One-tap swap on Today: the plan's next best fit for this meal, with Undo. */
function swapToday(tk, now) {
  const s = store.get();
  const prev = s.plan.days[tk].meals[now];
  // Each tap shows a dish not seen yet this time; after the last one it starts over.
  const key = `${tk}-${now}`;
  const seen = new Set([...(s.ui.swapSeen?.[key] || []), prev]);
  const all = planAlternatives(s, tk, now, 20);
  const next = all.find((r) => !seen.has(r.id)) || all[0];
  if (!next) { toast('This is his best fit for now. Try Ask for something specific.', { iconName: 'info' }); return; }
  if (saveFailed(() => swapToday(tk, now))) return;
  const fresh = all.some((r) => !seen.has(r.id));
  store.ui({ swapSeen: { ...(s.ui.swapSeen || {}), [key]: fresh ? [...seen] : [prev] } });
  haptic(10);
  store.set((d) => { d.plan.days[tk].meals[now] = next.id; });
  refresh();
  toast(`Swapped to ${next.name}`, { iconName: 'swap', action: { label: 'Undo', onClick: () => { store.set((d) => { d.plan.days[tk].meals[now] = prev; }); refresh(); } } });
}

/* ---------- K01 · How did he eat? ---------- */
function howDidHeEatCard(served) {
  const r = served.recipe ? recipe(served.recipe) : null;
  const bf = backupFood();
  const tiles = outcomeTiles({ onPick: (o, b) => pickOutcome(served, o, b) });
  const later = h('button', { type: 'button', class: 'link later-link', onClick: () => tellLater(served) },
    h('span', { class: 'contents', html: icon('bell') }), h('span', { text: 'Tell us later · we’ll ask in 30 min' }));
  return h('section', { class: 'card k01', 'aria-labelledby': 'k01-t' },
    h('div', { class: 'k01__served' },
      thumb(r?.photo ? thumbUrl(r.photo) : null, 'k01__img'),
      h('div', { class: 'k01__served-text' },
        h('span', { class: `tag tag--meal-${served.meal}`, text: mealHeading(served.meal) }),
        h('p', { class: 'k01__name', text: served.name }),
        h('p', { class: 'row__meta', text: `Served at ${served.time}` })),
      // Still cooking or feeding? A labelled way back to the steps (no hidden tap target).
      r ? button({ label: 'View recipe', variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact k01__recipe', ariaLabel: `Open the recipe for ${served.name}`, onClick: () => openRecipe(r) }) : null),
    h('h2', { class: 't-title-m k01__q', id: 'k01-t', text: 'How did he eat?' }),
    tiles, later,
    bf ? h('p', { class: 'note k01__backup' }, h('span', { class: 'contents', html: icon('backup') }), h('span', {}, h('strong', { text: 'If he refuses: ' }), `${bf} is ready`)) : null);
}

function pickOutcome(served, o) {
  if (saveFailed(() => pickOutcome(served, o))) return;
  cancelReminder('ask');
  if (o === 'not') {
    store.set((d) => { logMeal(d, { meal: served.meal, food: served.food, name: served.name, outcome: 'not', recipe: served.recipe }); });
    navigate('refused');
    return;
  }
  const prevServed = structuredClone(served);
  store.set((d) => {
    logMeal(d, { meal: served.meal, food: served.food, name: served.name, outcome: o, recipe: served.recipe });
    d.served = null;
    if (served.food) d.foodStatus[served.food] = d.foodStatus[served.food] || (o === 'well' ? 'well' : 'some');
  });
  savedToast(`Saved: ${mealWord(served.meal)}, ${OUTCOMES[o].short}`, {
    action: { label: 'Undo', onClick: () => { store.set((d) => { delete d.history[served.date]?.[served.meal]; d.served = prevServed; }); refresh(); } },
  });
  refresh();
}

/** "Tell us later" → K03 lock-screen notification (prototype: ~8 s). */
function tellLater(served) {
  askPermission('notify', {
    onAllow: () => {
      toast('We’ll ask you in 30 minutes', { iconName: 'bell' });
      scheduleReminder('ask', () => askNotification(served));
    },
  });
}

/** Saved feedback: Phulka's "saved" hop in the toast, and offline honesty. */
function savedToast(text, opts = {}) {
  haptic(12);
  toast(isOffline() ? `${text}. Saved on this phone; it syncs when you’re online.` : text, { mascot: !isOffline(), ...opts });
}

export function askNotification(served) {
  const s = store.get();
  if (!s.served || entry(s, served.date, served.meal)) return;
  const save = (o) => {
    store.set((d) => {
      logMeal(d, { meal: served.meal, food: served.food, name: served.name, outcome: o, recipe: served.recipe });
      if (o !== 'not') d.served = null;
    });
    if (o === 'not') navigate('refused', { reset: true });
    else { navigate('today', { reset: true, transition: 'fade' }); savedToast(`Saved: ${mealWord(served.meal)}, ${OUTCOMES[o].short}`); }
  };
  lockNotification({
    title: `How did ${kid()} eat ${mealWord(served.meal)}?`,
    body: 'One tap is enough.',
    actions: [{ label: 'Ate well', onClick: () => save('well') }, { label: 'Some', onClick: () => save('some') }, { label: 'Did not eat', onClick: () => save('not') }],
    onOpen: () => navigate('today', { reset: true, transition: 'fade' }),
  });
}

/* ---------- Timeline of the day (K01 rest of today, K04, M02) ---------- */
export function timeline({ title, exclude = [], date = todayKey(), heading = true }) {
  const s = store.get();
  const rows = MEALS.filter((m) => !exclude.includes(m.id)).map((m) => timelineRow(s, date, m.id));
  return h('section', { class: 'timeline-wrap', 'aria-label': title },
    heading ? h('h2', { class: 't-label section-gap', text: title }) : null,
    h('div', { class: 'card timeline' }, rows));
}

export function timelineRow(s, date, m) {
  const e = entry(s, date, m);
  const label = h('span', { class: `tl__meal tl__meal--${m}`, text: mealOf(m).name });
  if (!e) {
    const b = h('button', { type: 'button', class: 'tl tl--empty', 'aria-label': `${mealOf(m).name}: add what he ate` },
      mealBadge(m),
      h('span', { class: 'tl__text' }, label, h('span', { class: 'tl__add', text: 'Add what he ate' })),
      h('span', { class: 'plus-btn', html: icon('plus') }));
    b.addEventListener('click', () => logSheet(m, date, { lock: true }));
    return b;
  }
  const line = entryLine(e);
  const b = h('button', { type: 'button', class: 'tl', 'aria-label': [`${mealOf(m).name}: ${e.name}`, line, 'Change'].filter(Boolean).join('. ') },
    mealBadge(m),
    h('span', { class: 'tl__text' }, label, h('span', { class: 'tl__food', text: e.name }), line ? h('span', { class: 'row__meta', text: line }) : null),
    e.outcome ? h('span', { class: `face face--${e.outcome}`, html: icon(OUTCOMES[e.outcome].icon) }) : null);
  b.addEventListener('click', () => logSheet(m, date, { lock: true }));
  return b;
}

/* ---------- K04 · After the meal: tomorrow's breakfast / next meal ---------- */
function nextMealCard(now) {
  const s = store.get();
  const nextIdx = MEALS.findIndex((m) => m.id === now) + 1;
  const isTomorrow = nextIdx >= MEALS.length;
  const target = isTomorrow ? 'breakfast' : MEALS[nextIdx].id;
  const dk = isTomorrow ? dateKey(addDays(new Date(), 1)) : todayKey();
  const planned = planDay(dk, s)?.meals?.[target];
  const r = (planned && recipe(planned)) || readyIdeas(target)[0];
  if (!r) return null;
  return h('section', { 'aria-label': 'Next meal' },
    h('h2', { class: 't-label section-gap', text: isTomorrow ? 'Tomorrow’s breakfast' : `Next: ${mealOf(target).name.toLowerCase()}` }),
    h('div', { class: 'card idea-list' }, ideaRow(r)));
}

/* ==========================================================================
   L02 · Add what he ate (sheet)
   ========================================================================== */
export function logSheet(preselect, date = todayKey(), { lock = false } = {}) {
  const s = store.get();
  const now = mealNow();
  const isToday = date === todayKey();
  // Opened from a meal's own row → that meal only (no tabs). Opened from the general
  // "Did he eat earlier today?" row → tabs for the earlier meals not added yet.
  const open = isToday ? MEALS.filter((m) => earlierMeals(now).includes(m.id) && !entry(s, date, m.id)) : MEALS;
  const options = lock ? MEALS.filter((m) => m.id === preselect) : (open.length ? open : MEALS.filter((m) => m.id === preselect));
  let mealId = options.some((m) => m.id === preselect) ? preselect : options[0].id;
  const existing = entry(s, date, mealId);
  const picked = new Set(existing?.food ? [existing.food] : []);
  let outcome = existing?.outcome || null;
  let api;

  const label = h('h3', { class: 't-label sheet-label' });
  const chipsWrap = h('div', { class: 'chips', role: 'group' });
  const field = textField({ placeholder: 'Something else? Type or say it', value: existing && !existing.food ? existing.name : '' });
  field.input.setAttribute('aria-label', 'Something else he had');
  field.control.append(micButton({ input: field.input, sample: 'Idli with a little sambar' }));
  const err = h('p', { class: 'msg msg--error', 'aria-live': 'polite' });
  const saveBtn = button({ label: '', onClick: () => save() });

  const paint = () => {
    const plural = { breakfast: 'breakfasts', lunch: 'lunches', snack: 'snacks', dinner: 'dinners' }[mealId];
    label.textContent = `His usual ${plural} · most eaten first`;
    chipsWrap.setAttribute('aria-label', `His usual ${plural}`);
    chipsWrap.replaceChildren(...usualFor(mealId).map((id) => {
      const f = findFood(id);
      return chip({
        label: f.name, checked: picked.has(id),
        thumb: f.photo ? thumbUrl(f.photo) : undefined, thumbIcon: f.photo ? undefined : 'bowl',
        onToggle: (on, c) => { on ? picked.add(id) : picked.delete(id); c.setChecked(on); showMsg(err, ''); },
      });
    }));
    saveBtn.setLabel(`Save ${mealWord(mealId)}`);
  };

  function save() {
    const typed = field.input.value.trim();
    if (!picked.size && typed.length < 2) { showMsg(err, 'Pick a food or type what he had.'); return; }
    // Saving failed: keep the sheet open with her picks, so "Try again" loses nothing.
    if (saveFailed(() => save())) return;
    const names = [...picked].map((id) => findFood(id)?.name).filter(Boolean);
    if (typed) names.push(capFirst(typed));
    const prev = structuredClone(store.get().history[date]?.[mealId] || null);
    store.set((d) => {
      logMeal(d, { date, meal: mealId, food: [...picked][0] || null, name: joinNice(names), outcome, by: 'you' });
    });
    api.close({ keepFocus: true });
    savedToast(`Saved: ${mealWord(mealId)}`, {
      action: { label: 'Undo', onClick: () => { store.set((d) => { if (prev) d.history[date][mealId] = prev; else delete d.history[date]?.[mealId]; }); refresh(); } },
    });
    refresh();
  }

  const seg = mealSegmented({ value: mealId, meals: options, onChange: (id) => { mealId = id; picked.clear(); paint(); } });
  paint();
  api = openSheet({
    title: options.length > 1 ? `What did ${kid()} have?` : `What did ${kid()} have for ${mealId === 'snack' ? 'a snack' : mealWord(mealId)}?`,
    sub: isToday ? '' : fmtLong(fromKey(date)),
    body: h('div', {}, options.length > 1 ? seg : null, label, chipsWrap, h('div', { class: 'sheet-gap' }, field), err,
      h('h3', { class: 't-label sheet-label', text: 'How much? (optional)' }),
      outcomeTiles({ mode: 'radio', selected: outcome, onPick: (o) => { outcome = o; }, groupLabel: 'How much he ate' })),
    foot: saveBtn,
  });
}

/* ==========================================================================
   T05 · More ideas (sheet) → T05s · Ask for something specific (sheet)
   ========================================================================== */
export function moreIdeasSheet(mealId, seen = []) {
  let api;
  const list = readyIdeas(mealId, store.get(), seen).slice(0, 3);
  const rows = list.length ? list.map((r) => {
    const row = ideaRow(r);
    row.addEventListener('click', () => api.close({ keepFocus: true }), { capture: true });
    return row;
  }) : [h('p', { class: 'sheet-empty', text: 'That’s all his usual ideas for now. Ask for something specific below.' })];
  const ask = button({ label: 'Ask for something specific', variant: 'secondary', iconName: 'ai', onClick: () => askSheet() });
  if (isOffline()) ask.setDisabled(true);
  api = openSheet({
    title: `More ideas for ${mealWord(mealId)}`,
    sub: list.length ? `${list.length} more from his usual foods` : 'You’ve seen all his usual ideas',
    body: h('div', {}, h('div', { class: 'idea-list idea-list--sheet' }, rows), checkedStrip(),
      isOffline() ? h('p', { class: 'row__meta sheet-gap', text: 'Asking for something new needs internet.' }) : null),
    foot: ask,
  });
}

export function askSheet(prefill = '') {
  let api;
  const field = textField({ placeholder: 'e.g. something with paneer', value: prefill, onEnter: () => go() });
  field.input.setAttribute('aria-label', 'What would you like?');
  field.control.append(micButton({ input: field.input, sample: 'Something with paneer' }));
  const err = h('p', { class: 'msg msg--error', 'aria-live': 'polite' });
  const picks = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Quick picks' });
  const paintPicks = () => picks.replaceChildren(...REQUEST_PICKS.map((p) => chip({
    label: p, role: 'radio', checked: field.input.value.trim() === p,
    onToggle: () => { field.input.value = p; showMsg(err, ''); paintPicks(); },
  })));
  field.input.addEventListener('input', () => { showMsg(err, ''); paintPicks(); });
  paintPicks();
  function go() {
    const t = field.input.value.trim();
    if (t.length < 3) { showMsg(err, 'Type or say what you would like, or tap a quick pick.'); return; }
    api.close({ keepFocus: true });
    store.ui({ ideasMode: 'request', request: t });
    navigate('ideas');
  }
  api = openSheet({
    title: 'Ask for something specific',
    sub: 'Type or say it. We still check his allergies.',
    body: h('div', {}, field, err, h('h3', { class: 't-label sheet-label', text: 'Quick picks' }), picks, checkedStrip()),
    foot: button({ label: 'Show ideas', onClick: () => go() }),
    initialFocus: 'input',
  });
}

/* ==========================================================================
   T07 · Family dinner → T08-L loading → T08 / E04 his plate
   ========================================================================== */
export function familyScreen() {
  const s = store.get();
  const field = textField({ placeholder: 'e.g. Dal, rice and bhindi', value: s.ui.familyText || '', onEnter: () => go() });
  field.input.setAttribute('aria-label', 'What is the family eating?');
  field.control.append(micButton({ input: field.input, sample: 'Dal, rice and bhindi' }));
  const chips = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Dishes you often cook' });
  const paint = () => chips.replaceChildren(...FAMILY_DISHES.map((d) => chip({
    label: d.name, role: 'radio', checked: field.input.value.trim().toLowerCase() === d.name.toLowerCase(),
    thumb: thumbUrl(d.photo),
    onToggle: () => { field.input.value = d.name; err.innerHTML = ''; paint(); },
  })));
  field.input.addEventListener('input', paint);
  paint();
  const err = footerMsg();
  function go() {
    const t = field.input.value.trim();
    if (t.length < 2) { showMsg(err, 'Type or say what the family is eating.'); field.input.focus(); return; }
    store.ui({ familyText: t });
    navigate('plate');
  }
  const { el } = shell({
    label: 'What is the family eating?',
    bar: topbar({ onBack: () => back() }),
    body: [
      h('h1', { class: 'screen-title t-title-l', text: 'What is the family eating?' }),
      h('div', { class: 'block-gap' }, field),
      h('h2', { class: 't-label section-gap', text: 'Or tap one you often cook' }),
      chips,
      h('p', { class: 'strip strip--safe block-gap' }, h('span', { class: 'contents', html: icon('pot') }), h('span', { text: `We make ${kid()}’s version from your pot. No extra cooking.` })),
    ],
    footer: [err, button({ label: `Show ${childName() ? childName() + '’s' : 'his'} plate`, onClick: () => go() })],
  });
  return { el, onLeave: el.cleanup, autofocus: () => { if (!field.input.value) field.input.focus({ preventScroll: true }); } };
}

export function plateScreen() {
  const s = store.get();
  const text = s.ui.familyText || 'dal and rice';
  const plate = familyPlate(text, s);
  const live = h('div', { class: 'plate', 'aria-live': 'polite', 'aria-busy': 'true' });
  const loading = h('div', { class: 'plate__loading' },
    phulkaEl({ mood: 'thinking', size: 148, animate: true }),
    h('p', { class: 'plate__caption', text: 'Making his plate from your dinner…' }),
    h('div', { class: 'skeleton plate__sk1' }), h('div', { class: 'skeleton plate__sk2' }), h('div', { class: 'skeleton plate__sk2' }));
  live.append(loading);

  function result() {
    live.setAttribute('aria-busy', 'false');
    const r = plate.feature;
    const kids = kid();
    const nodes = [];
    plate.unsafe.forEach((u) => {
      nodes.push(h('div', { class: 'alert', role: 'alert' },
        h('span', { class: 'contents', html: icon('allergy') }),
        h('div', {},
          h('p', { class: 'alert__title', text: `${capFirst(u.phrase)} is not safe for ${kids}` }),
          h('p', { class: 'alert__body', text: `He ${allergyReason(u.id)}, so we left it out of his plate.` }))));
    });
    const card = h('section', { class: 'card feature', 'aria-labelledby': 'plate-t' },
      r.photo ? h('img', { class: 'feature__img', src: photoUrl(r.photo), alt: r.name, width: '362', height: '190' })
        : h('div', { class: 'feature__art', html: icon('bowl') }),
      h('div', { class: 'feature__body' },
        h('span', { class: plate.unsafe.length ? 'tag tag--safe' : 'tag', text: plate.unsafe.length ? 'Safe for him' : 'Easiest · no extra cooking' }),
        h('h2', { class: 'feature__title', id: 'plate-t', text: r.name }),
        h('p', { class: 'feature__meta', text: plate.unsafe.length ? `${r.mins} min · ${r.meta}` : `${r.mins} min` }),
        h('p', { class: 'note' }, h('span', { class: 'contents', html: icon('tip') }), h('span', { text: capFirst(r.tip) })),
        button({ label: 'Make this', onClick: () => openRecipe(r) })));
    nodes.push(card);
    if (plate.more.length) {
      nodes.push(h('h2', { class: 't-label section-gap', text: 'Or make it a little different' }));
      nodes.push(h('div', { class: 'idea-list idea-list--flat' }, plate.more.map((m) => ideaRow(m))));
    }
    live.replaceChildren(...rise(nodes));
  }

  const { el } = shell({
    label: plate.title,
    bar: topbar({ onBack: () => back() }),
    body: [h('h1', { class: 'screen-title t-title-l', text: plate.title }), h('p', { class: 'screen-lead', text: plate.from }), live],
  });
  let t;
  return {
    el,
    onEnter() { t = setTimeout(result, 1500); },
    onLeave() { clearTimeout(t); el.cleanup(); },
  };
}

/* ==========================================================================
   T09 · What's at home (+ T09g meal and time, V01 listening) · T09f all items
   ========================================================================== */
export function homeScreen() {
  const s0 = store.get();
  if (!s0.home.today) store.set((d) => { d.home.today = [...d.home.usual]; });
  if (!s0.home.meal) store.set((d) => { d.home.meal = mealNow(); });

  const ctx = h('p', { class: 'home__ctx' });
  const paintCtx = () => {
    const s = store.get();
    ctx.replaceChildren(
      h('span', { class: `home__ctx-icon home__ctx-icon--${s.home.meal}`, html: icon(s.home.meal) }),
      h('span', { text: `For ${mealWord(s.home.meal)} · ${s.home.time} min` }),
      h('button', { type: 'button', class: 'link', text: 'Change', 'aria-label': 'Change meal and time', onClick: () => mealTimeSheet(paintCtx) }));
  };
  paintCtx();

  const search = textField({ leadIcon: 'search', placeholder: 'Type or say an ingredient', type: 'search' });
  search.input.setAttribute('aria-label', 'Type or say an ingredient');
  const mic = iconButton({ iconName: 'mic', label: 'Say it', variant: 'filled', size: 'sm', onClick: () => listenSheet({
    sample: ['Tomato', 'Potato', 'Peas'],
    onDone: (words) => { addWords(words); },
  }) });
  search.control.append(mic);
  const results = h('div', { class: 'chips home__results', 'aria-live': 'polite' });
  const usual = h('div', { class: 'chips', role: 'group', 'aria-label': 'Usually at home. Untick what ran out.' });
  const seeAll = h('button', { type: 'button', class: 'link', onClick: () => navigate('home-all') });

  function addWords(words) {
    const added = [];
    store.set((d) => {
      words.forEach((w) => {
        const ing = findIngredients(w)[0];
        if (ing) {
          if (!d.home.today.includes(ing.id)) d.home.today.push(ing.id);
          if (!d.home.usual.includes(ing.id)) d.home.usual.push(ing.id);
          added.push(ing.name);
        }
      });
    });
    paintUsual();
    if (added.length) toast(`Added ${joinNice(added)}`, { iconName: 'success' });
  }

  function paintUsual() {
    const s = store.get();
    const today = new Set(s.home.today);
    seeAll.textContent = `See all ${INGREDIENTS.length}`;
    usual.replaceChildren(...s.home.usual.map((id) => chip({
      label: ingredient(id)?.name || id, checked: today.has(id),
      onToggle: (on, c) => {
        store.set((d) => { d.home.today = on ? [...new Set([...d.home.today, id])] : d.home.today.filter((x) => x !== id); });
        c.setChecked(on);
      },
    })));
  }
  paintUsual();

  search.input.addEventListener('input', () => {
    const q = search.input.value.trim().toLowerCase();
    if (!q) { results.replaceChildren(); return; }
    const s = store.get();
    const hits = findIngredients(q).slice(0, 6);
    results.replaceChildren(...(hits.length ? hits.map((i) => chip({
      label: i.name, checked: s.home.today.includes(i.id),
      onToggle: () => { addWords([i.name]); search.input.value = ''; results.replaceChildren(); },
    })) : [h('p', { class: 'row__meta', text: `We don’t know “${search.input.value.trim()}” yet. Try another word.` })]));
  });

  const noteField = textField({ placeholder: 'e.g. he is teething, keep it soft', value: s0.home.note, onInput: (e) => store.set((d) => { d.home.note = e.target.value; }) });
  noteField.input.setAttribute('aria-label', 'Anything to keep in mind?');
  noteField.control.append(micButton({ input: noteField.input, sample: 'He is teething, keep it soft', onResult: (t) => store.set((d) => { d.home.note = t; }) }));

  const err = footerMsg();
  const go = button({
    label: 'Show 3 ideas',
    onClick: () => {
      const s = store.get();
      if (!homeToday(s).length) { showMsg(err, 'Tick at least one thing you have.'); return; }
      const { list } = homeIdeas(s);
      store.ui({ ideasMode: 'home' });
      navigate(list.length ? 'ideas' : 'nothing');
    },
  });

  const { el } = shell({
    label: 'What’s at home?',
    bar: topbar({ onBack: () => back() }),
    body: [
      h('h1', { class: 'screen-title t-title-l', text: 'What’s at home?' }),
      ctx,
      h('div', { class: 'block-gap' }, search), results,
      h('div', { class: 'section-label section-gap' }, h('h2', { class: 't-label', text: 'Usually at home' }), seeAll),
      usual,
      h('h2', { class: 't-label section-gap', text: 'Anything to keep in mind? (optional)' }),
      noteField,
    ],
    footer: [err, go],
  });
  return { el, onLeave: el.cleanup };
}

function mealTimeSheet(done) {
  const s = store.get();
  let mealId = s.home.meal || mealNow();
  let time = s.home.time || 20;
  let api;
  const seg = mealSegmented({ value: mealId, meals: MEALS, onChange: (id) => { mealId = id; } });
  const times = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Time you have' });
  const paint = () => times.replaceChildren(...TIME_CHOICES.map((t) => chip({ label: t.name, role: 'radio', checked: t.id === time, onToggle: () => { time = t.id; paint(); focusIfKeyboard(times.querySelector('[aria-checked="true"]')); } })));
  paint();
  radioGroupKeys(times);
  api = openSheet({
    title: 'Which meal, how much time?',
    body: h('div', {}, h('h3', { class: 't-label sheet-label sheet-label--first', text: 'Meal' }), seg, h('h3', { class: 't-label sheet-label', text: 'Time you have' }), times),
    foot: button({ label: 'Done', onClick: () => { store.set((d) => { d.home.meal = mealId; d.home.time = time; }); api.close(); done?.(); } }),
  });
}

export function homeAllScreen() {
  const s0 = store.get();
  const usual = new Set(s0.home.usual);
  const search = textField({ leadIcon: 'search', placeholder: 'Search or add', type: 'search' });
  search.input.setAttribute('aria-label', 'Search or add an ingredient');
  search.control.append(iconButton({ iconName: 'mic', label: 'Say it', variant: 'filled', size: 'sm', onClick: () => listenSheet({
    sample: ['Paneer', 'Apple'],
    onDone: (words) => { words.forEach((w) => { const i = INGREDIENTS.find((x) => x.name.toLowerCase().startsWith(w.toLowerCase())); if (i) usual.add(i.id); }); paint(); },
  }) }));
  const groupsWrap = h('div', {});
  function paint() {
    const q = search.input.value.trim().toLowerCase();
    groupsWrap.replaceChildren(...INGREDIENT_GROUPS.map((g) => {
      const items = INGREDIENTS.filter((i) => i.group === g.id && (!q || i.name.toLowerCase().includes(q)));
      if (!items.length) return null;
      return h('section', { 'aria-label': g.name },
        h('h2', { class: 't-label section-gap', text: g.name }),
        h('div', { class: 'chips', role: 'group', 'aria-label': g.name }, items.map((i) => chip({
          label: i.name, checked: usual.has(i.id),
          onToggle: (on, c) => { on ? usual.add(i.id) : usual.delete(i.id); c.setChecked(on); },
        }))));
    }).filter(Boolean));
    if (!groupsWrap.children.length) groupsWrap.append(h('p', { class: 'sheet-empty', text: `Nothing called “${search.input.value.trim()}” yet.` }));
  }
  search.input.addEventListener('input', paint);
  paint();
  const save = () => {
    store.set((d) => {
      const before = new Set(d.home.usual);
      d.home.usual = [...usual];
      if (d.home.today) d.home.today = [...new Set([...d.home.today.filter((x) => usual.has(x)), ...[...usual].filter((x) => !before.has(x))])];
    });
    back();
    toast(`Saved: ${usual.size} things usually at home`, { iconName: 'success' });
  };
  const { el } = shell({
    label: 'Usually at home',
    bar: topbar({ onBack: () => back(), action: { label: 'Done', onClick: save } }),
    body: [h('h1', { class: 'screen-title t-title-l', text: 'Usually at home' }), h('div', { class: 'block-gap' }, search), groupsWrap],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   T10 / T10s / E05 · Ideas · E03 Nothing fits
   ========================================================================== */
/** Loading (slow network): Phulka thinking + a skeleton of the result, then the real screen. */
function waitScreen(label, caption, onDone) {
  const card = h('div', { class: 'loading-screen__card', 'aria-hidden': 'true' },
    h('div', { class: 'skeleton loading-screen__img' }), h('div', { class: 'skeleton loading-screen__line' }),
    h('div', { class: 'skeleton loading-screen__line' }), h('div', { class: 'skeleton loading-screen__btn' }));
  const { el } = shell({
    cls: 'loading-screen', label,
    bar: topbar({ onBack: () => back() }),
    body: [h('div', { class: 'loading-screen__mascot', html: phulka({ mood: 'thinking', size: 112, animate: true }) }),
      h('p', { class: 'loading-screen__caption', role: 'status', text: caption }), card],
  });
  el.setAttribute('aria-busy', 'true');
  let t;
  return { el, onEnter() { t = setTimeout(onDone, 2600); }, onLeave() { clearTimeout(t); el.cleanup?.(); } };
}

/** Ideas could not load: what happened, what still works, one clear retry. */
function loadErrorScreen(label, retry) {
  const { el } = shell({
    cls: 'nothing', label,
    bar: topbar({ onBack: () => back() }),
    body: [h('div', { class: 'state' },
      phulkaEl({ mood: 'calm', size: 112 }),
      h('h1', { class: 't-title-l state__title', text: 'Couldn’t load ideas' }),
      h('p', { class: 'state__body', text: 'The internet seems slow or off. His usual meals are saved on this phone and still work.' }))],
    footer: [button({ label: 'Try again', iconName: 'refresh', onClick: retry }),
      button({ label: 'Show his usual meals', variant: 'secondary', onClick: () => { store.ui({ ideasMode: 'usual' }); navigate('ideas', { replace: true, transition: 'fade' }); } })],
  });
  el.querySelector('.state')?.setAttribute('role', 'alert');
  return { el, onLeave: el.cleanup };
}

export function ideasScreen() {
  const s = store.get();
  const mode = s.ui.ideasMode || 'home';
  // Prototype failure states (panel → Simulate). "His usual meals" works offline, so it never fails.
  if (mode !== 'usual' && sim.on('ideas')) return loadErrorScreen('Ideas', () => navigate('ideas', { replace: true, transition: 'fade' }));
  if (mode !== 'usual' && sim.on('slow') && !s.ui.ideasLoaded) {
    return waitScreen('Finding ideas', mode === 'request' ? 'Reading your request…' : 'Checking what you have…', () => { store.ui({ ideasLoaded: true }); navigate('ideas', { replace: true, transition: 'fade' }); });
  }
  if (s.ui.ideasLoaded) store.ui({ ideasLoaded: false });
  let list = [];
  let title = '';
  let tags = [];
  let req = null;
  const mealId = s.home.meal || mealNow();

  let almost = [];
  let honest = null; // what we could not match, said plainly
  if (mode === 'request') {
    req = parseRequest(s.ui.request || '', s);
    list = requestIdeas(req, s);
    title = requestTitle(req);
    // Show what we understood (recognition over recall: she can check we got it right).
    tags = req.understood.length ? [...req.understood, req.withinTime ? `${s.home.time || 20} min` : null] : [];
    if (!req.understood.length && !req.unsafe.length) honest = 'We didn’t catch a food or a way to cook in that. These are from his usual foods. Try naming a food, like palak or paneer.';
    else if (req.understood.length && !req.exact) honest = `No dish he has matches all of “${req.understood.join(', ').toLowerCase()}” yet. These are the closest.`;
  } else if (mode === 'usual') {
    list = readyIdeas(mealId).slice(0, 3);
    title = `His usual ${mealWord(mealId)}s`;
    tags = ['From his usual foods'];
  } else {
    const res = homeIdeas(s);
    list = res.list.slice(0, 3);
    almost = res.almost;
    title = `${res.ctx.soft ? 'Soft ideas' : 'Ideas'} for ${mealWord(mealId)}`;
    const names = homeToday(s).slice(0, 4).map((id) => ingredient(id)?.name.toLowerCase().replace(' flour', ''));
    const more = homeToday(s).length - names.length;
    tags = [capFirst(names.join(', ')) + (more > 0 ? ` +${more}` : ''), `${s.home.time} min`, ...res.note.understood];
  }

  const body = [h('h1', { class: 'screen-title t-title-l', text: title })];
  if (req) body.push(h('p', { class: 'quote-chip', text: `You asked: “${req.text}”` }));
  if (honest) body.push(h('p', { class: 'note note--info' }, h('span', { class: 'contents', html: icon('info') }), h('span', { text: honest })));
  if (req?.unsafe.length) {
    if (tags.length) body.push(tagList(tags));
    req.unsafe.forEach((u) => body.push(h('div', { class: 'alert', role: 'alert' },
      h('span', { class: 'contents', html: icon('allergy') }),
      h('div', {},
        h('p', { class: 'alert__title', text: `We left ${allergyName(u.id).toLowerCase()} out` }),
        h('p', { class: 'alert__body', text: `${kid()} ${allergyReason(u.id)}, so these ideas don’t use it.` })))));
    body.push(h('div', { class: 'card idea-list' }, list.map((r) => ideaRow(r))));
    body.push(h('p', { class: 'note note--info ai-note' }, h('span', { class: 'contents', html: icon('ai') }), h('span', { text: 'Made by AI from your words. Please look over it before cooking.' })));
  } else {
    body.push(tagList(tags));
    body.push(checkedStrip());
    const [best, ...rest] = list;
    if (best) {
      body.push(h('section', { class: 'card feature', 'aria-labelledby': 'best-t' },
        best.photo ? h('img', { class: 'feature__img', src: photoUrl(best.photo), alt: best.name, width: '362', height: '180' }) : h('div', { class: 'feature__art', html: icon('bowl') }),
        h('div', { class: 'feature__body' },
          h('div', { class: 'tag-row' }, h('span', { class: 'tag tag--best', text: 'Best fit' }), twistTag(best) ? h('span', { class: 'tag tag--new', text: twistTag(best) }) : null),
          h('h2', { class: 'feature__title', id: 'best-t', text: best.name }),
          h('p', { class: 'feature__meta', text: ideaMeta(best) }),
          button({ label: 'Make this', onClick: () => openRecipe(best) }))));
    }
    if (rest.length) body.push(h('div', { class: 'idea-list idea-list--flat' }, rest.map((r) => ideaRow(r))));
    // Pantry-app pattern: close matches that need one more thing.
    if (almost.length) {
      body.push(h('section', { 'aria-labelledby': 'almost-t' },
        h('h2', { class: 't-label section-gap', id: 'almost-t', text: 'Needs one more thing' }),
        h('div', { class: 'card idea-list' }, almost.map(({ r, missing }) => {
          const row = ideaRow(r);
          row.querySelector('.row__meta').textContent = `${r.mins} min · Needs ${ingredient(missing[0])?.name.toLowerCase()}`;
          row.setAttribute('aria-label', `${r.name}. Needs ${ingredient(missing[0])?.name.toLowerCase()}. Open recipe`);
          return row;
        }))));
    }
    if (mode === 'request') body.push(h('p', { class: 'note note--info ai-note' }, h('span', { class: 'contents', html: icon('ai') }), h('span', { text: 'Made by AI from your words. Please look over it before cooking.' })));
    body.push(h('button', { type: 'button', class: 'link more-link', onClick: () => moreIdeasSheet(mealId, list.map((r) => r.id)) },
      h('span', { class: 'contents', html: icon('refresh') }), h('span', { text: 'None of these? Show other ideas' })));
  }

  const { el } = shell({
    label: title,
    bar: topbar({ onBack: () => back(), action: { label: 'Edit', onClick: () => (mode === 'request' ? (back(), setTimeout(() => askSheet(s.ui.request), 420)) : back()) } }),
    body: rise(body),
  });
  return { el, onLeave: el.cleanup };
}

export function nothingScreen() {
  const s = store.get();
  const { fixes, tags } = nothingFitsFixes(s);
  const mascot = phulkaEl({ mood: 'searching', size: 132, animate: true, label: 'Phulka is still looking' });
  const apply = (id) => {
    store.set((d) => {
      if (id === 'time' || id === 'both') d.home.time = 20;
      if (id === 'staples' || id === 'both') d.home.today = [...new Set([...(d.home.today || d.home.usual), 'rice', 'moong-dal'])];
      if (id.startsWith('add:')) {
        d.home.today = [...new Set([...(d.home.today || d.home.usual), id.slice(4)])];
        if (d.home.time < 20) d.home.time = 20;
      }
    });
    const { list } = homeIdeas(store.get());
    store.ui({ ideasMode: list.length ? 'home' : 'usual' });
    navigate('ideas', { replace: true });
  };
  const rows = fixes.map((f) => navRow({ title: f.title, sub: f.sub, media: iconTile(f.icon, 'leaf'), onClick: () => apply(f.id) }));
  const { el } = shell({
    cls: 'nothing',
    label: 'Nothing fits',
    bar: topbar({ onBack: () => back() }),
    body: [
      h('div', { class: 'state state--tight' }, mascot,
        h('h1', { class: 't-title-l state__title', text: 'Nothing fits all of these' }),
        tagList(tags)),
      ...(rows.length ? [
        h('h2', { class: 't-label', text: 'Change one thing and we’ll look again' }),
        h('div', { class: 'card nav-list' }, rows),
      ] : [h('p', { class: 't-body state__body', text: 'None of his dishes can be made with this. His usual meals are still safe to pick.' })]),
    ],
    footer: [button({ label: 'Show his usual meals', onClick: () => { store.ui({ ideasMode: 'usual' }); navigate('ideas', { replace: true }); } })],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   T02 · Recipe (+ T04 Missing something?)
   ========================================================================== */
export function recipeScreen() {
  const s = store.get();
  // Always show the recipe as it should be cooked for this child (e.g. oil instead of ghee for a milk allergy).
  const r = adaptForChild(recipe(s.ui.recipe) || readyIdeas(mealNow())[0], s);
  const unsafe = r.id !== 'custom' && !recipeSafe(r, s);
  const months = ageInMonths(s.child.birth);
  const missing = new Set((s.ui.missing || {})[r.id] || []);
  const bf = backupFood();

  const hero = h('div', { class: 'recipe__hero' },
    r.photo ? h('img', { class: 'recipe__img', src: photoUrl(r.photo), alt: r.name, width: '402', height: '300' }) : h('div', { class: 'recipe__img recipe__img--art', html: icon('bowl') }),
    h('div', { class: 'recipe__float' },
      iconButton({ iconName: 'back', label: 'Go back', cls: 'icon-btn--float', onClick: () => back() }),
      iconButton({ iconName: 'swap', label: 'Swap for something else', cls: 'icon-btn--float', onClick: () => swapRecipe(r) })),
    h('button', { type: 'button', class: 'watch-pill', onClick: () => comingSoon('Recipe videos') },
      h('span', { class: 'contents', html: icon('play') }), h('span', { text: 'Watch · 45 s' })));

  const metaTags = [`${r.mins} min`, ...r.meta.split(' · ')];
  if (r.food && (s.foodStatus[r.food] === 'well' || s.foods.selected.includes(r.food))) metaTags.push('He eats this often');

  const ingRows = r.ingredients.map(([id, name, qty]) => {
    const gone = missing.has(id);
    const sub = gone && r.swaps?.[id] ? ingredient(r.swaps[id])?.name : null;
    return h('li', { class: 'ing' + (gone ? ' is-missing' : '') },
      h('span', { class: 'ing__name' }, gone ? h('s', { text: name }) : name, sub ? h('span', { class: 'ing__sub', text: ` → ${sub}` }) : (gone ? h('span', { class: 'ing__sub', text: ' · leave out' }) : null)),
      h('span', { class: 'ing__qty', text: qty }));
  });

  const bad = (r.allergens || []).filter((a) => avoids(a, s)).map((a) => allergyName(a).toLowerCase());
  const body = h('div', { class: 'recipe__sheet' },
    h('h1', { class: 't-title-l', text: r.name }),
    // Safety first: a recipe opened from an old plan or link may no longer be safe for him.
    unsafe ? h('div', { class: 'alert', role: 'alert' }, h('span', { class: 'contents', html: icon('allergy') }),
      h('div', {}, h('p', { class: 'alert__title', text: bad.length ? `Has ${joinNice(bad)}. Not safe for ${kid()}` : `Not right for ${kid()}’s diet` }),
        h('p', { class: 'alert__body', text: 'It is on his allergy list or outside your family’s diet. Please pick something else.' }))) : null,
    h('ul', { class: 'tag-list', 'aria-label': 'About this dish' }, [...new Set(metaTags)].map((t) => h('li', { class: 'tag-pill', text: t }))),
    r.swapped?.length ? h('p', { class: 'note note--info' }, h('span', { class: 'contents', html: icon('allergy') }),
      h('span', { text: r.swapped.map((x) => `Made with ${x.to} instead of ${x.from}, because of his ${x.allergen} allergy.`).join(' ') })) : null,
    h('p', { class: 'note' }, h('span', { class: 'contents', html: icon('tip') }),
      h('span', {}, h('strong', { text: `For ${kid()}${months != null ? ', ' + ageLabel(months) : ''}: ` }), r.tip)),
    bf ? h('p', { class: 'note' }, h('span', { class: 'contents', html: icon('backup') }),
      h('span', {}, h('strong', { text: 'If he refuses: ' }), `${bf}, his backup. Or roll it into small balls he can hold.`)) : null,
    h('div', { class: 'section-label section-gap' }, h('h2', { class: 't-title-s', text: 'Ingredients' }),
      r.id === 'custom' ? null : h('button', { type: 'button', class: 'link', text: 'Missing something?', 'aria-haspopup': 'dialog', onClick: () => missingSheet(r) })),
    h('ul', { class: 'ings' }, ingRows),
    h('h2', { class: 't-title-s section-gap', text: 'Steps' }),
    h('ol', { class: 'steps' }, r.steps.map((st, i) => h('li', { class: 'step' },
      h('span', { class: 'step__n', 'aria-hidden': 'true', text: String(i + 1) }),
      h('span', { class: 'step__text', text: st })))));

  // Already served (opened again from Today's "How did he eat?" card): don't serve twice.
  const cur = store.get().served;
  const alreadyServed = cur && cur.date === todayKey() && cur.recipe === r.id;
  // Opened from Plan for another day: reading ahead, nothing to serve yet.
  const ctx = store.get().ui.recipeCtx;
  const future = ctx && ctx.k !== todayKey();
  const served = unsafe ? button({ label: 'Pick something else', onClick: () => back() })
    : alreadyServed ? button({ label: 'Back to Today', variant: 'secondary', onClick: () => back() })
    : future ? button({ label: `Back to the plan`, variant: 'secondary', onClick: () => back() }) : button({
    label: 'Served it',
    onClick: function serve() {
      if (saveFailed(() => serve())) return;
      // The planned meal it was opened for, else the meal chosen on "What's at home", else the meal of the hour.
      const m = (ctx && ctx.k === todayKey() && ctx.m) || store.get().home.meal || mealNow();
      store.set((d) => {
        d.served = { date: todayKey(), meal: m, recipe: r.id === 'custom' ? null : r.id, food: r.food || null, name: r.name, time: fmtTime() };
        d.home.meal = null;
      });
      navigate('today', { reset: true, transition: 'fade' });
      toast('Enjoy. Tell us how he ate when he’s done.', { iconName: 'heart' });
    },
  });

  const { el } = shell({ cls: 'recipe', label: r.name, body: [hero, body], footer: [served] });
  return { el, onLeave: el.cleanup };
}

function swapRecipe(r) {
  const next = readyIdeas(mealNow(), store.get(), [r.id])[0];
  if (!next) { toast('That’s his best fit for now.', { iconName: 'info' }); return; }
  const prev = r;
  openRecipe(next, { replace: true });
  toast(`Swapped to ${next.name}`, { iconName: 'swap', action: { label: 'Undo', onClick: () => openRecipe(prev, { replace: true }) } });
}

function missingSheet(r) {
  const s = store.get();
  const missing = new Set((s.ui.missing || {})[r.id] || []);
  let api;
  const feedback = h('div', { 'aria-live': 'polite' });
  const items = r.ingredients.filter(([id]) => !['water', 'turmeric', 'family', 'idli'].includes(id));
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Ingredients in this recipe' });
  const short = (n) => n.split(',')[0].replace(/^(Cooked|Fresh|Thick|Ripe|Plain) /i, '').toLowerCase();
  const paint = () => {
    chips.replaceChildren(...items.map(([id, name]) => {
      const on = missing.has(id);
      const c = h('button', { type: 'button', class: 'chip chip--missing', 'aria-pressed': String(on), text: on ? `No ${short(name)}` : capFirst(short(name)) });
      c.addEventListener('click', () => { on ? missing.delete(id) : missing.add(id); paint(); });
      return c;
    }));
    const core = [...missing].filter((id) => r.needs.includes(id) && !r.swaps?.[id]);
    feedback.replaceChildren(...[...missing].map((id) => {
      const name = short(items.find((x) => x[0] === id)?.[1] || id);
      const swap = r.swaps?.[id] ? ingredient(r.swaps[id])?.name.toLowerCase() : null;
      const listed = INGREDIENTS.some((i) => i.id === id);
      if (core.includes(id)) {
        return h('p', { class: 'strip strip--warn' }, h('span', { class: 'contents', html: icon('info') }),
          h('span', { text: `No ${name}? It’s the base of this dish, so it won’t work without it.${listed ? ` ${capFirst(name)} is added to your shopping list.` : ''}` }));
      }
      const text = `No ${name}? ${swap ? `Use ${swap}, or leave it out. Both are fine for ${kid()}.` : 'Leave it out; the dish still works.'}${listed ? ` ${capFirst(name)} is added to your shopping list.` : ''}`;
      return h('p', { class: 'strip strip--safe' }, h('span', { class: 'contents', html: icon('success') }), h('span', { text }));
    }));
    updateBtn.setLabel(core.length ? 'Show other ideas' : 'Update recipe');
  };
  const updateBtn = button({
    label: 'Update recipe',
    onClick: () => {
      const core = [...missing].filter((id) => r.needs.includes(id) && !r.swaps?.[id]);
      store.set((d) => {
        d.ui.missing = { ...(d.ui.missing || {}), [r.id]: [...missing] };
        missing.forEach((id) => { if (INGREDIENTS.some((i) => i.id === id) && !d.shopping.ranOut.includes(id)) d.shopping.ranOut.push(id); });
        // What ran out is not at home today, so the next ideas skip it.
        if (d.home.today) d.home.today = d.home.today.filter((x) => !missing.has(x));
      });
      api.close({ keepFocus: true });
      if (core.length) {
        moreIdeasSheet(store.get().home.meal || mealNow(), [r.id]);
        toast(`${capFirst(short(items.find((x) => x[0] === core[0])?.[1] || core[0]))} added to your shopping list`, { iconName: 'list' });
        return;
      }
      navigate('recipe', { replace: true });
      if (missing.size) toast('Recipe updated. Added to your shopping list.', { iconName: 'success' });
    },
  });
  paint();
  api = openSheet({
    title: 'What’s missing?',
    sub: 'Tap what you don’t have',
    body: h('div', {}, chips, h('div', { class: 'sheet-gap' }, feedback)),
    foot: updateBtn,
  });
}

/* ==========================================================================
   K05 / K05b · He did not eat · K06 serve it a different way · K07
   ========================================================================== */
export function refusedScreen() {
  const s = store.get();
  const reasonId = s.ui.reason || null;
  const reason = REFUSAL_REASONS.find((r) => r.id === reasonId);
  const bf = firstBackup();
  const bfFood = safeBackups()[0] || null;
  const served = s.served || { meal: mealNow(), name: 'his meal' };

  const reasons = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Know why? It helps (optional)' },
    REFUSAL_REASONS.map((r) => chip({
      label: r.name, role: 'radio', checked: r.id === reasonId,
      onToggle: () => { store.ui({ reason: r.id === reasonId ? null : r.id }); navigate('refused', { replace: true }); },
    })));
  radioGroupKeys(reasons);

  const waitAgain = () => {
    askPermission('notify', {
      onAllow: () => {
        toast('We’ll remind you in 20 minutes', { iconName: 'bell' });
        scheduleReminder('again', () => tryAgainNotification());
        finish();
      },
      onDeny: () => finish(),
    });
  };
  const giveBackup = () => {
    store.set((d) => {
      const e = d.history[todayKey()]?.[served.meal];
      if (e) e.note = `had ${bf} instead`;
      d.served = null;
    });
    toast(`Saved. ${capFirst(bf || 'his backup')} instead.`, { iconName: 'success' });
    finish();
  };
  function finish() { store.ui({ reason: null }); store.set((d) => { d.served = null; }); navigate('today', { reset: true, transition: 'fade' }); }

  const waitRow = navRow({ title: 'Wait, then offer it again', sub: 'Try again in 20 minutes', media: iconTile('clock', 'neutral'), onClick: waitAgain });
  const serveRow = navRow({ title: 'Serve it a different way', sub: 'Small balls, strips or dal to dip', media: iconTile('balls', 'leaf'), onClick: () => serveWaySheet(finish) });
  serveRow.setAttribute('aria-haspopup', 'dialog');
  const backupRow = bf ? navRow({ title: `Give his backup: ${bf}`, sub: 'He eats it every time', media: thumb(bfFood?.photo ? thumbUrl(bfFood.photo) : null, 'nav-thumb'), onClick: giveBackup }) : null;

  let body;
  if (reason && reason.id !== 'unsure') {
    // K05b · the reason changes the top suggestion.
    let primary;
    if (reason.action === 'recipe') {
      const r = recipeSafe(recipe(reason.recipe), s) ? recipe(reason.recipe) : recipe(reason.safeAlt);
      primary = button({ label: `Make ${r.name.toLowerCase()} · ${r.mins} min`, onClick: () => { store.ui({ reason: null }); openRecipe(r); } });
    } else if (reason.action === 'backup' && bf) {
      primary = button({ label: `Give ${bf}`, onClick: giveBackup });
    } else {
      primary = button({ label: 'Done for now', onClick: () => { toast('Saved. Try again at the next meal.', { iconName: 'success' }); finish(); } });
    }
    const pic = reason.action === 'recipe' ? recipe(reason.recipe) : null;
    body = [
      h('h1', { class: 'screen-title t-title-l', text: 'That’s okay. Try this.' }),
      h('div', { class: 'block-gap' }, reasons),
      h('section', { class: 'card suggest', 'aria-labelledby': 'suggest-t' },
        h('p', { class: 'eyebrow eyebrow--dinner' }, h('span', { text: `Because you picked ${reason.name.toLowerCase()}` })),
        h('div', { class: 'suggest__row' },
          pic?.photo ? h('img', { class: 'suggest__img', src: thumbUrl(pic.photo), alt: '', width: '64', height: '64' }) : null,
          h('div', {}, h('h2', { class: 't-title-s', id: 'suggest-t', text: reason.title }), h('p', { class: 'suggest__body', text: reason.body }))),
        primary),
      h('div', { class: 'card nav-list' }, reason.action !== 'done' ? waitRow : null, backupRow),
      h('p', { class: 'note note--info' }, h('span', { class: 'contents', html: icon('info') }), h('span', { text: 'This follows what you picked. It is not a diagnosis. If he has a fever or stops drinking, call his doctor.' })),
    ];
  } else {
    body = [
      h('div', { class: 'state state--tight' },
        phulkaEl({ mood: 'calm', size: 132, animate: true }),
        h('h1', { class: 't-title-l state__title', text: 'That’s okay. Try this.' }),
        h('p', { class: 'state__body', text: 'Toddlers often refuse food they ate before.' })),
      h('section', { class: 'card suggest', 'aria-labelledby': 'wait-t' },
        h('p', { class: 'eyebrow eyebrow--dinner' }, h('span', { class: 'contents', html: icon('clock') }), h('span', { text: 'Many parents try this first' })),
        h('h2', { class: 't-title-m', id: 'wait-t', text: 'Wait, then offer it again' }),
        h('p', { class: 'suggest__body', text: 'Keep the plate aside for 20 minutes.' }),
        button({ label: 'Remind me in 20 min', iconName: 'bell', onClick: waitAgain })),
      h('div', { class: 'card nav-list' }, serveRow, backupRow),
      h('h2', { class: 't-label section-gap', text: 'Know why? It helps (optional)' }),
      reasons,
    ];
  }
  const { el } = shell({
    cls: 'refused',
    label: 'He did not eat',
    bar: topbar({ onBack: () => { store.ui({ reason: null }); store.set((d) => { d.served = null; }); navigate('today', { reset: true, transition: 'fade' }); }, backLabel: 'Back to Today' }),
    body: rise(body),
  });
  return { el, onLeave: el.cleanup };
}

function serveWaySheet(done) {
  const s = store.get();
  let api;
  const ways = SERVE_WAYS.filter((w) => {
    if (w.fallbackFor) return SERVE_WAYS.find((x) => x.id === w.fallbackFor).allergens.some((a) => avoids(a, s));
    return !(w.allergens || []).some((a) => avoids(a, s));
  });
  const rows = ways.map((w) => navRow({
    title: w.name, sub: w.sub, media: iconTile(w.icon, w.meal),
    onClick: () => {
      api.close({ keepFocus: true });
      toast(`Good idea. ${w.name}, then offer it again.`, { iconName: 'success' });
      scheduleReminder('again', () => tryAgainNotification());
      done?.();
    },
  }));
  api = openSheet({ title: 'Serve it a different way', sub: 'Same food, new shape', body: h('div', { class: 'nav-list' }, rows) });
}

/** K07 · "Try again" notification (prototype: ~8 s). */
export function tryAgainNotification() {
  const s = store.get();
  const last = Object.entries(s.history[todayKey()] || {}).reverse().find(([, e]) => e.outcome === 'not');
  const m = last ? last[0] : mealNow();
  lockNotification({
    title: `Try ${mealWord(m)} again with ${kid()}?`,
    body: 'A small portion, no pressure.',
    actions: [
      { label: 'Done', onClick: () => {
        const e = last?.[1];
        store.set((d) => { d.served = { date: todayKey(), meal: m, recipe: e?.recipe || null, food: e?.food || null, name: e?.name || 'his meal', time: fmtTime() }; delete d.history[todayKey()]?.[m]; });
        navigate('today', { reset: true, transition: 'fade' });
        toast('Tell us how he ate this time.', { iconName: 'heart' });
      } },
      { label: '10 more min', onClick: () => { scheduleReminder('again', () => tryAgainNotification()); } },
    ],
    onOpen: () => navigate('today', { reset: true, transition: 'fade' }),
  });
}
