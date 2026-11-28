// Flow R2 (Today: decide what to give, two ways to start, the recipe),
// R3 (after serving, refusal) and R7 edge cases E01, E03, E04, E05, E06.

import { icon } from './icons.js';
import { phulka } from './phulka.js';
import {
  h, button, iconButton, topbar, textField, micButton, chip, note, segmented, openSheet, toast, comingSoon,
  radioGroupKeys, phulkaEl, mealBadge, outcomeTiles, mealSegmented, listenSheet, lockNotification,
  scheduleReminder, cancelReminder, sectionLabel, navRow, thumb, iconTile, focusIfKeyboard, menuSheet,
  askPermission, haptic, saveFailed, sim, reminder, reminderDone, notice, attention, alertMsg, infoMsg,
} from './components.js';
import { navigate, back, currentRoute } from './router.js';
import { store, childName, nameOr, ageInMonths, ageLabel, findFood, backupIds, unsafeAllergens, avoids } from './store.js';
import {
  MEALS, RECIPES, SNACK_STOCK, INGREDIENTS, INGREDIENT_GROUPS, TIME_CHOICES, FAMILY_DISHES, REQUEST_PICKS, REFUSAL_REASONS,
  SERVE_WAYS, thumbUrl, photoUrl,
} from './data.js';
import {
  todayKey, dateKey, addDays, mealNow, mealHeading, meal as mealOf, earlierMeals, recipe, recipeSafe,
  readyIdeas, ideaMeta, homeToday, homeSummary, homeIdeas, nothingFitsFixes, parseRequest, requestIdeas,
  requestTitle, familyPlate, OUTCOMES, entry, logMeal, entryLine, usualFor, refusalStreak, planDay,
  prepPlan, setPrepDone, planAlternatives, stockStatus, setStock, markStock, fmtTime, allergyName, ingredient, capFirst, fmtLong, fromKey, twistTag, adaptForChild, allergyReason,
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
function ideaRow(r, { best = false, tag = null } = {}) {
  const label = tag || (best ? 'Best fit' : null);
  const b = h('button', { type: 'button', class: 'row idea-row' },
    thumb(r.photo ? thumbUrl(r.photo) : null, 'idea-row__img'),
    h('span', { class: 'row__label' },
      label ? h('span', { class: label === 'From your plan' ? 'tag tag--plan' : 'tag tag--best', text: label }) : null,
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
    blocks.push(infoMsg({ iconName: 'offline', title: 'You’re offline', body: 'Ideas from his usual foods still work.' }));
  }

  // E06 · Refused dinner 3 days in a row (calm, says when to call the doctor).
  if (refusalStreak(s) >= 3 && !s.dismissed[`refusal-${tk}`]) {
    const n = refusalStreak(s);
    // v1.3 Notice: a calm fact, never an alarm. A refusal is not an error.
    blocks.push(notice({
      iconName: 'tip',
      title: `He didn’t eat dinner ${n} days in a row`,
      body: 'This is often normal at his age. If he seems unwell, has a fever or stops drinking, call his doctor.',
      actions: [
        button({ label: 'Got it', variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact', onClick: () => { store.set((d) => { d.dismissed[`refusal-${tk}`] = true; }); refresh(); } }),
        button({ label: 'Read more', variant: 'text', size: 'm', cls: 'btn--auto', onClick: () => { store.ui({ article: 'refused-liked' }); navigate('article'); } }),
      ],
    }));
  }

  // Earlier today, right here: what he already ate (from her or a carer), and an
  // optional + for meals not added yet. No need to open Memory to see today.
  const earlier = earlierMeals(now);
  const loggedNow = entry(s, tk, now);
  const servedToday = s.served && s.served.date === tk;
  const earlierBlock = earlier.length && !loggedNow && !servedToday ? earlierToday(s, tk, earlier) : null;

  // Prep (DS v1.3 "show one, see all"): one Reminder on Today, the rest one tap away.
  const prepCard = prepBlock(s);

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
    // K04 · this meal is done: what he ate so far, tonight's prep, then the SAME decision
    // card for the next meal (after dinner: tomorrow's breakfast).
    blocks.push(earlierToday(s, tk, [...earlierMeals(now), now], { title: 'Today so far' }));
    if (prepCard) blocks.push(prepCard);
    const nextIdx = MEALS.findIndex((m) => m.id === now) + 1;
    const tomorrow = nextIdx >= MEALS.length;
    const next = tomorrow ? 'breakfast' : MEALS[nextIdx].id;
    blocks.push(decisionCard(next, { date: tomorrow ? dateKey(addDays(new Date(), 1)) : tk, tomorrow }));
  } else {
    // Day in time order: what he ate earlier → tonight's prep → the decision (Figma T01).
    if (earlierBlock) blocks.push(earlierBlock);
    if (prepCard) blocks.push(prepCard);
    const cards = decisionCard(now, { planCard: true });
    blocks.push(...(Array.isArray(cards) ? cards : [cards]));
  }

  const { el } = shell({ cls: 'today', label: 'Today', bar: childHeader(), body: rise(blocks), tabs: 'today' });
  return { el, onLeave: el.cleanup };
}

/* ---------- Prep on Today: one Reminder, "See all prep · N" opens the sheet ---------- */
function prepBlock(s) {
  const p = prepPlan(s);
  if (!p.all.length) return null;
  // Everything ticked: a quiet line for the rest of the day (it doesn't vanish suddenly).
  if (!p.lead) return reminderDone(p.tomorrow.length ? 'Prep done for tomorrow' : 'Prep done for today');
  const x = p.lead;
  const forToday = x.date === p.todayKey;
  const markDone = (keys, msg) => {
    if (saveFailed(() => markDone(keys, msg))) return;
    store.set((d) => setPrepDone(d, keys, true));
    toast(msg, { iconName: 'success', action: { label: 'Undo', onClick: () => { store.set((d) => setPrepDone(d, keys, false)); refresh(); } } });
    refresh();
  };

  // Escalation: a must-do for tomorrow, still not done after 9 pm → the one Attention card.
  const lateHour = sim.on('late') || new Date().getHours() >= 21;
  if (x.must && !forToday && lateHour) {
    const soaked = /soak (.+?)( before bed| in water)?$/i.exec(x.text);
    const what = soaked ? capFirst(soaked[1].replace(/^\d+\s+/, '')) : x.recipe.name;
    return attention({
      title: soaked ? `${what} isn’t soaked yet` : `${x.recipe.name} needs this tonight`,
      body: `Tomorrow’s ${x.recipe.name.toLowerCase()} needs it. ${soaked ? 'Soak it now' : 'Do it now'}, or swap to a ${mealWord(x.meal)} that needs nothing tonight.`,
      action: button({ label: `Swap ${mealWord(x.meal)}`, variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact', onClick: () => swapNoPrep(x.date, x.meal) }),
    });
  }

  return reminder({
    title: forToday ? 'Get ready for today' : 'Get ready for tomorrow',
    line: `${x.recipe.name} · ${x.text}`,
    meta: p.open.length > 1 ? `${x.mins} min · 1 of ${p.open.length}` : `${x.mins} min`,
    tag: x.must && !forToday ? 'Needs tonight' : '',
    onDone: () => markDone([x.key], 'Done. One less thing for tomorrow.'),
    seeAll: p.open.length > 1 ? { label: `See all prep · ${p.open.length}`, onClick: () => prepSheet() } : null,
  });
}

/** Swap a planned meal for one that needs no prep tonight (from the Attention card). */
function swapNoPrep(date, meal) {
  const s = store.get();
  const prev = s.plan.days[date]?.meals?.[meal];
  const next = planAlternatives(s, date, meal, 20).find((r) => !r.prep);
  if (!next) { toast('No other idea fits without prep. Try soaking now.', { iconName: 'info' }); return; }
  store.set((d) => { d.plan.days[date].meals[meal] = next.id; });
  refresh();
  toast(`Swapped to ${next.name}. Nothing to do tonight.`, { iconName: 'swap', action: { label: 'Undo', onClick: () => { store.set((d) => { d.plan.days[date].meals[meal] = prev; }); refresh(); } } });
}

/** "Prep for today and tomorrow": every step in two groups, each with its own tick. */
function prepSheet() {
  let api;
  const s = store.get();
  const p = prepPlan(s);
  const changed = new Set();
  const row = (x) => {
    const tick = h('button', { type: 'button', class: 'msg__tick prep-row__tick', 'aria-pressed': String(x.done), 'aria-label': `${x.done ? 'Done' : 'Mark done'}: ${x.recipe.name}, ${x.text}`, html: icon('check') });
    const line = x.doneLastNight ? `${x.text} · done last night` : `${x.text}${x.mins ? ` · ${x.mins} min` : ''}`;
    const el = h('li', { class: 'prep-row' + (x.done ? ' is-done' : '') },
      h('div', { class: 'prep-row__main' },
        h('div', { class: 'prep-row__head' },
          x.meal ? h('span', { class: `tag tag--meal-${x.meal}`, text: mealOf(x.meal).name }) : h('span', { class: 'tag tag--status', text: 'Snack stock' }),
          h('span', { class: 'prep-row__dish', text: x.recipe.name }),
          x.must && !x.done ? h('span', { class: 'tag tag--guide', text: 'Needs tonight' }) : null),
        h('p', { class: 'prep-row__line', text: line })),
      tick);
    tick.addEventListener('click', () => {
      const on = tick.getAttribute('aria-pressed') !== 'true';
      if (on && saveFailed()) return;
      tick.setAttribute('aria-pressed', String(on)); el.classList.toggle('is-done', on); haptic(10);
      store.set((d) => (x.stock ? markStock(d, x.stock, on) : setPrepDone(d, [x.key], on)));
      changed.add(x.key);
    });
    return el;
  };
  const group = (label, items) => (items.length ? h('section', { class: 'prep-group', 'aria-label': label },
    h('h3', { class: 't-label prep-group__label', text: label }), h('ul', { class: 'prep-list' }, items.map(row))) : null);
  const markAll = button({ label: 'Mark all done', onClick: () => {
    const keys = prepPlan(store.get()).open.filter((x) => !x.stock).map((x) => x.key);
    const stock = prepPlan(store.get()).open.filter((x) => x.stock);
    if (saveFailed()) return;
    store.set((d) => { setPrepDone(d, keys, true); stock.forEach((x) => markStock(d, x.stock, true)); });
    api.close();
    toast('All prep done. Nice.', { iconName: 'success', action: { label: 'Undo', onClick: () => { store.set((d) => setPrepDone(d, keys, false)); refresh(); } } });
  } });
  const close = button({ label: 'Close', variant: 'text', cls: 'btn--auto', onClick: () => api.close() });
  api = openSheet({
    title: 'Prep for today and tomorrow',
    sub: `Small steps, ${Math.max(5, ...p.all.map((x) => x.mins || 5))} minutes or less.`,
    body: h('div', { class: 'prep-sheet' }, group('Today', p.today), group('Tomorrow', p.tomorrow)),
    foot: h('div', { class: 'prep-sheet__foot' }, markAll, close),
    onClose: () => refresh(),
  });
}

/** Earlier today: logged meals with how he ate, and optional + rows for the rest. */
function earlierToday(s, tk, earlier, { title = 'Earlier today' } = {}) {
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
      h('h2', { class: 't-label', id: 'earlier-t', text: title }),
      h('span', { class: 'row__meta', text: missing ? `${logged.length} of ${earlier.length} added · rest optional` : 'All added' })),
    h('div', { class: 'card timeline timeline--compact' }, earlier.map((m) => timelineRow(s, tk, m))));
}

/* ---------- T01 · The decision card (Figma: v3 · R2 Today, "Today: deciding dinner") ----------
   One card, one question: the meal → "Make his dinner from" → two big ways to start
   (Fitts: full-width ~96 px targets) → "Or pick a ready idea": exactly 3 rows (Hick),
   "Best fit" the only tag (Von Restorff) → "None of these?" opens 3 more, then Ask.
   Used for the current meal, and for the next meal once this one is logged. */
function decisionCard(meal, { date = todayKey(), tomorrow = false, planCard = false } = {}) {
  const s = store.get();
  const offline = isOffline();
  const heading = tomorrow ? `Tomorrow’s ${mealWord(meal)}` : mealHeading(meal);

  // Not the same dish he already had that day (curd rice at snack → not curd rice again at dinner).
  const eaten = Object.values(s.history[date] || {});
  const eatenIds = RECIPES.filter((r) => eaten.some((e) => e.recipe === r.id || (r.food && e.food === r.food))).map((r) => r.id);
  // The plan's dish (if safe and not already eaten) leads, tagged "From your plan"; then his best fits.
  const plannedId = planDay(date, s)?.meals?.[meal];
  const planned = plannedId ? recipe(plannedId) : null;
  const plannedOk = planned && recipeSafe(planned, s) && !eatenIds.includes(planned.id) ? planned : null;
  const ideas = [...(plannedOk ? [plannedOk] : []), ...readyIdeas(meal, s, [...eatenIds, ...(plannedOk ? [plannedOk.id] : [])])].slice(0, 3);

  const family = h('button', { type: 'button', class: 'start-card start-card--family' },
    h('span', { class: 'start-card__art start-card__art--illo', html: icon('illoPot') }),
    h('span', { class: 'start-card__text' },
      h('span', { class: 'start-card__title', text: ['lunch', 'dinner'].includes(meal) ? `The family’s ${mealWord(meal)}` : 'What the family eats' }),
      h('span', { class: 'start-card__sub', text: 'His plate from your cooking' })),
    h('span', { class: 'start-card__chev', html: icon('forward') }));
  family.addEventListener('click', () => navigate('family-dinner'));

  const home = h('button', { type: 'button', class: 'start-card start-card--home', 'aria-disabled': offline ? 'true' : null },
    h('span', { class: 'start-card__art start-card__art--illo', html: icon('illoBasket') }),
    h('span', { class: 'start-card__text' },
      h('span', { class: 'start-card__title', text: 'What’s at home' }),
      h('span', { class: 'start-card__sub', text: offline ? 'Needs internet' : homeSummary(s) })),
    h('span', { class: 'start-card__chev', html: icon('forward') }));
  home.addEventListener('click', () => {
    if (offline) { toast('“What’s at home” needs internet. His usual ideas below still work.', { iconName: 'offline' }); return; }
    store.set((d) => { d.home.meal = meal; });
    navigate('home');
  });

  // Planned day (usability round): the plan's dish gets its own photo card with a short
  // preview, "What the family eats" comes right after it, then the rest as before.
  if (planCard && plannedOk) {
    const others = readyIdeas(meal, s, [...eatenIds, plannedOk.id]).slice(0, 3);
    const rest = h('section', { class: 'card decide-card decide-card--rest', 'aria-labelledby': `decide-${meal}` },
      h('h2', { class: 't-section-title', id: `decide-${meal}`, text: 'Or something else' }),
      h('div', { class: 'decide-card__starts' }, home),
      others.length ? h('div', { class: 'decide-card__ideas' },
        h('h3', { class: 'decide-card__label', text: meal === 'snack' ? 'Ready to eat · nothing to cook' : 'Or pick a ready idea' }),
        h('div', { class: 'idea-list idea-list--flat' }, others.map((r, i) => ideaRow(r, { tag: i === 0 ? 'Best fit' : null }))),
        h('button', { type: 'button', class: 'link decide-card__none', onClick: () => moreIdeasSheet(meal, [plannedOk.id, ...others.map((r) => r.id)]) },
          h('span', { class: 'contents', html: icon('refresh') }), h('span', { text: 'None of these? Show other ideas' }))) : null);
    return [plannedPhotoCard(plannedOk, meal, s), h('div', { class: 'card decide-card decide-card--solo' }, family), rest];
  }

  const rows = ideas.map((r, i) => ideaRow(r, { tag: i === 0 ? (plannedOk && r.id === plannedOk.id ? 'From your plan' : 'Best fit') : null }));
  return h('section', { class: 'card decide-card', 'aria-labelledby': `decide-${meal}` },
    h('p', { class: `eyebrow eyebrow--${meal}` }, h('span', { class: 'contents', html: icon(meal) }), h('span', { text: heading })),
    h('h2', { class: 'decide-card__title', id: `decide-${meal}`, text: `Make his ${mealWord(meal)} from` }),
    h('div', { class: 'decide-card__starts' }, family, home),
    ideas.length
      ? h('div', { class: 'decide-card__ideas' },
        h('h3', { class: 'decide-card__label', text: meal === 'snack' ? 'Ready to eat · nothing to cook' : 'Or pick a ready idea' }),
        h('div', { class: 'idea-list idea-list--flat' }, rows),
        h('button', { type: 'button', class: 'link decide-card__none', onClick: () => moreIdeasSheet(meal, ideas.map((r) => r.id)) },
          h('span', { class: 'contents', html: icon('refresh') }), h('span', { text: 'None of these? Show other ideas' })))
      : h('div', { class: 'decide-card__empty' },
        h('p', { class: 'decide-card__empty-title', text: 'No ready ideas yet' }),
        h('p', { class: 'row__meta', text: 'Add a few foods he eats, or start from the family’s food above.' }),
        button({ label: 'Add foods he eats', variant: 'secondary', size: 'm', cls: 'btn--auto', onClick: () => navigate('his-foods') })));
}

/** The planned dish: photo, meal + "From your plan", name, two short info lines, Make this. */
function plannedPhotoCard(r, meal, s) {
  const home = homeToday(s);
  const missing = (r.needs || []).filter((n) => !home.includes(n)).map((n) => ingredient(n)?.name.toLowerCase()).filter(Boolean);
  const count = (r.ingredients || []).length;
  const line1 = [r.custom ? 'Your dish' : `${r.mins} min`, count ? `${count} ingredient${count === 1 ? '' : 's'}` : null,
    missing.length ? `Need ${joinNice(missing.slice(0, 2))}` : 'All at home'].filter(Boolean).join(' · ');
  const tip = r.tip ? capFirst(r.tip) : '';   // one line, trimmed with … by CSS
  return h('section', { class: 'card feature planned-card', 'aria-labelledby': 'planned-t' },
    r.photo ? h('img', { class: 'feature__img', src: photoUrl(r.photo), alt: r.name, width: '362', height: '190', loading: 'eager' })
      : h('div', { class: 'feature__art planned-card__art', html: icon('illoPlate') }),
    h('div', { class: 'feature__body' },
      h('div', { class: 'tag-row' }, h('span', { class: `tag tag--meal-${meal}`, text: mealHeading(meal) }), h('span', { class: 'tag tag--status', text: 'From your plan' })),
      h('h2', { class: 'feature__title', id: 'planned-t', text: r.name }),
      h('p', { class: 'planned-card__line', text: line1 }),
      tip ? h('p', { class: 'planned-card__tip', text: tip }) : null,
      button({ label: 'Make this', onClick: () => openRecipe(r) })));
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
  // A new day starts with nothing ticked; yesterday's list is kept as "last time".
  if (store.get().home.todayDate !== todayKey()) {
    store.set((d) => {
      if (d.home.today && d.home.today.length) d.home.lastToday = [...d.home.today];
      d.home.today = []; d.home.todayDate = todayKey();
    });
  }
  const s0 = store.get();
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

  // Nothing is pre-ticked. If she had a list before, one tap brings it back.
  const lastWrap = h('div', { class: 'home__last' });
  function paintLast() {
    const s = store.get();
    const last = (s.home.lastToday || []).filter((id) => ingredient(id));
    if (s.home.today.length) { lastWrap.replaceChildren(); return; }
    lastWrap.replaceChildren(last.length
      ? button({ label: 'Use last time’s list', variant: 'secondary', size: 'm', iconName: 'refresh', cls: 'btn--auto', onClick: () => {
        store.set((d) => { d.home.today = [...last]; d.home.usual = [...new Set([...d.home.usual, ...last])]; });
        paintUsual(); paintLast();
        toast(`Ticked ${last.length} things from last time`, { iconName: 'success', action: { label: 'Undo', onClick: () => { store.set((d) => { d.home.today = []; }); paintUsual(); paintLast(); } } });
      } })
      : h('p', { class: 't-help', text: 'Tick what you have. We’ll remember it for next time.' }));
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
        paintLast();
      },
    })));
  }
  paintUsual();
  paintLast();

  // Snacks at home: homemade jars and bought packets, each Plenty / Running low / Finished.
  const STOCK_OPTS = [{ id: 'plenty', name: 'Plenty' }, { id: 'low', name: 'Running low' }, { id: 'finished', name: 'Finished' }];
  const snacks = h('div', { class: 'card snack-stock' }, SNACK_STOCK.map((d) => {
    const r = recipe(d.id);
    if (!r || !recipeSafe(r, store.get())) return null;
    const seg = segmented({ options: STOCK_OPTS, value: stockStatus(store.get(), d.id), label: `${r.name} at home`,
      onChange: (st) => { store.set((x) => setStock(x, d.id, st)); haptic(8); } });
    seg.classList.add('segmented--s');
    return h('div', { class: 'snack-stock__row' },
      h('div', { class: 'snack-stock__name' }, h('span', { text: r.name }),
        h('span', { class: 't-meta', text: d.kind === 'stock' ? `Homemade · keeps ${d.keepsDays} days` : 'Bought' })),
      seg);
  }));

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
      lastWrap,
      usual,
      h('h2', { class: 't-label section-gap', text: 'Snacks at home' }),
      snacks,
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
      if (id === 'staples' || id === 'both') d.home.today = [...new Set([...(d.home.today || []), 'rice', 'moong-dal'])]; d.home.todayDate = todayKey();
      if (id.startsWith('add:')) {
        d.home.today = [...new Set([...(d.home.today || []), id.slice(4)])]; d.home.todayDate = todayKey();
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

  // A dish she typed herself: name, what it needs, her own notes. No steps, no photo.
  if (r.custom) return customDishScreen(r, s, unsafe);

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

  const served = servedButton(r, unsafe);
  const { el } = shell({ cls: 'recipe', label: r.name, body: [hero, body], footer: [served] });
  return { el, onLeave: el.cleanup };
}

/** Footer of a recipe: Served it, or a way back when it is not for now. */
function servedButton(r, unsafe) {
  // Already served (opened again from Today's "How did he eat?" card): don't serve twice.
  const cur = store.get().served;
  const alreadyServed = cur && cur.date === todayKey() && cur.recipe === r.id;
  // Opened from Plan for another day: reading ahead, nothing to serve yet.
  const ctx = store.get().ui.recipeCtx;
  const future = ctx && ctx.k !== todayKey();
  return unsafe ? button({ label: 'Pick something else', onClick: () => back() })
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
}

/** "Make this" on a dish she typed: plate, name, what it needs, her notes (saved as she types). */
function customDishScreen(r, s, unsafe) {
  const bad = (r.allergens || []).filter((a) => avoids(a, s)).map((a) => allergyName(a).toLowerCase());
  const notesId = 'dish-notes';
  const notes = h('textarea', { id: notesId, class: 'field__input field__input--area', rows: '4', maxlength: '400', placeholder: 'How you make it, or what he likes in it' });
  notes.value = r.notes || '';
  let t;
  const saved = h('p', { class: 'field__help', 'aria-live': 'polite' });
  notes.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      store.set((d) => { const c = (d.customDishes || []).find((x) => x.id === r.id); if (c) c.notes = notes.value.trim(); });
      saved.textContent = 'Saved';
    }, 500);
  });
  const ings = r.ingredients.length
    ? h('ul', { class: 'ings' }, r.ingredients.map(([, name]) => h('li', { class: 'ing' }, h('span', { class: 'ing__name', text: name }))))
    : h('p', { class: 't-help', text: 'Nothing added. Add things you need from the plan.' });
  const hero = h('div', { class: 'recipe__hero' },
    h('div', { class: 'recipe__img recipe__img--art recipe__img--plate', html: icon('illoPlate') }),
    h('div', { class: 'recipe__float' }, iconButton({ iconName: 'back', label: 'Go back', cls: 'icon-btn--float', onClick: () => back() })));
  const body = h('div', { class: 'recipe__sheet' },
    h('h1', { class: 't-title-l', text: r.name }),
    unsafe ? h('div', { class: 'alert', role: 'alert' }, h('span', { class: 'contents', html: icon('allergy') }),
      h('div', {}, h('p', { class: 'alert__title', text: bad.length ? `Has ${joinNice(bad)}. Not safe for ${kid()}` : `Not right for ${kid()}’s diet` }),
        h('p', { class: 'alert__body', text: 'It is on his allergy list. Please pick something else.' }))) : null,
    h('ul', { class: 'tag-list', 'aria-label': 'About this dish' }, h('li', { class: 'tag-pill', text: 'Your dish' })),
    h('h2', { class: 't-title-s section-gap', text: 'Ingredients' }), ings,
    h('div', { class: 'field section-gap' },
      h('label', { class: 't-title-s dish-notes__label', for: notesId, text: 'Notes' }),
      h('div', { class: 'field__control field__control--area' }, notes), saved));
  const { el } = shell({ cls: 'recipe', label: r.name, body: [hero, body], footer: [servedButton(r, unsafe)] });
  return { el, onLeave() { clearTimeout(t); el.cleanup?.(); } };
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
