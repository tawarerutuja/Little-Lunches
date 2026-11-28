// Flow R5 · Plan: a light, flexible week.
// PL01 first plan · PL02 this week · PL02b after a swap · PL04 a planned meal ·
// PL05 shopping list · PL10 edit plan · PL11 next week.

import { icon } from './icons.js';
import {
  h, button, iconButton, topbar, chip, openSheet, toast, radioGroupKeys, checkRow,
  segmented, thumb, textField, micButton, menuSheet,
} from './components.js';
import { navigate, back, currentRoute } from './router.js';
import { store, childName, avoids } from './store.js';
import { MEALS, thumbUrl, INGREDIENTS } from './data.js';
import {
  todayKey, dateKey, fromKey, addDays, mondayOf, weekKeys, fmtRange, fmtDayNum, dayLetter, dayName,
  weekdayIndex, recipe, fillPlan, planAlternatives, shoppingList, FEEDERS, feederName, rankIdeas,
  entry, mealNow, capFirst, allergyName, recipeSafe, saveCustomDish, guessNeeds, typedFoodUnsafe, homeToday,
} from './meals.js';
import { shell, rise, footerMsg, showMsg, joinNice } from './screens.js';

const refresh = () => navigate(currentRoute(), { replace: true, transition: 'fade' });
/** Photo, or the neutral plate for a dish she typed (no recipe photo). */
const dishThumb = (r, cls) => (r.custom
  ? h('span', { class: `${cls} ${cls}--icon dish-plate`, html: icon('illoPlate'), 'aria-hidden': 'true' })
  : thumb(r.photo ? thumbUrl(r.photo) : null, cls));
const MEAL_NAMES = Object.fromEntries(MEALS.map((m) => [m.id, m.name]));
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* ==========================================================================
   The three questions (PL01 first time, PL10 edit)
   ========================================================================== */
function planQuestions(initial) {
  const v = structuredClone(initial);
  const meals = h('div', { class: 'chips', role: 'group', 'aria-label': 'Which meals to plan?' },
    MEALS.map((m) => {
      const c = chip({
        label: m.name, checked: v.meals.includes(m.id),
        onToggle: (on) => { v.meals = on ? [...new Set([...v.meals, m.id])] : v.meals.filter((x) => x !== m.id); c.setChecked(on); paintIcons(); },
      });
      c.dataset.meal = m.id;
      return c;
    }));
  // Unticked chips show the meal icon in its tint; ticked ones show the check.
  function paintIcons() {
    meals.querySelectorAll('.chip').forEach((c) => {
      const mark = c.querySelector('.chip__mark');
      if (c.getAttribute('aria-checked') !== 'true') mark.innerHTML = `<span class="chip__meal chip__meal--${c.dataset.meal}">${icon(c.dataset.meal)}</span>`;
    });
  }
  paintIcons();

  const days = h('div', { class: 'day-pills', role: 'group', 'aria-label': 'Which days are busy?' },
    DAY_LETTERS.map((l, i) => {
      const b = h('button', { type: 'button', class: 'day-pill', role: 'checkbox', 'aria-checked': String(v.busy.includes(i)), 'aria-label': DAY_FULL[i], text: l });
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-checked') !== 'true';
        v.busy = on ? [...new Set([...v.busy, i])].sort() : v.busy.filter((x) => x !== i);
        b.setAttribute('aria-checked', String(on));
      });
      return b;
    }));

  const s = store.get();
  const feederOptions = [{ id: 'me', name: 'Me' }, ...s.carers.map((c) => ({ id: c.id, name: c.name })), ...FEEDERS.filter((f) => f.id !== 'me' && !s.carers.some((c) => c.id === f.id))];
  const feeders = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Who feeds him on busy days?' });
  const paintFeeders = () => feeders.replaceChildren(...feederOptions.map((f) => chip({
    label: f.name, role: 'radio', checked: v.feeder === f.id,
    onToggle: () => { v.feeder = f.id; paintFeeders(); },
  })));
  paintFeeders();
  radioGroupKeys(feeders);

  const node = h('div', { class: 'plan-q' },
    h('h2', { class: 't-label section-gap', text: 'Which meals to plan?' }), meals,
    h('h2', { class: 't-label section-gap', text: 'Which days are busy?' }), days,
    h('h2', { class: 't-label section-gap', text: 'Who feeds him on busy days?' }), feeders);
  return { node, value: () => v };
}

/* ==========================================================================
   Plan tab: PL01 when there is no plan yet, else PL02 / PL11
   ========================================================================== */
export function planScreen() {
  const s = store.get();
  return s.plan.setup ? weekView() : firstPlan();
}

function firstPlan() {
  // "How it works" is information, not navigation: a numbered stepper on the page
  // background (no card edges, no shadows), so nothing looks tappable.
  const how = h('section', { class: 'how', 'aria-labelledby': 'how-t' },
    h('h2', { class: 't-label', id: 'how-t', text: 'How it works' }),
    h('ol', { class: 'how__steps' },
      [['Pick busy days', 'And who feeds him'], ['We fill the week', 'From foods he eats'], ['Swap or shop', 'Change any meal']].map(([t, sub], i) =>
        h('li', { class: 'how__step' },
          h('span', { class: 'how__num', 'aria-hidden': 'true', text: String(i + 1) }),
          h('span', { class: 'how__title', text: t }),
          h('span', { class: 'how__sub', text: sub })))));
  const q = planQuestions({ meals: ['dinner'], busy: [], feeder: store.get().carers[0]?.id || 'me' });
  const err = footerMsg();
  const make = button({
    label: 'Make my week',
    onClick: async () => {
      const v = q.value();
      if (!v.meals.length) { showMsg(err, 'Pick at least one meal to plan.'); return; }
      make.setLoading(true, 'Making your week…');
      await new Promise((r) => setTimeout(r, 700));
      store.set((d) => {
        d.plan.setup = v;
        const mon = mondayOf();
        const keys = [...weekKeys(mon).filter((k) => k >= todayKey()), ...weekKeys(addDays(mon, 7)).slice(0, 4)];
        fillPlan(d, keys);
      });
      store.ui({ planWeek: 'this' });
      refresh();
      toast('Your week is ready. Swap any meal with one tap.', { iconName: 'success' });
    },
  });
  const { el } = shell({
    cls: 'plan',
    label: 'Plan your week',
    bar: h('header', { class: 'tab-header' }, h('div', { class: 'tab-header__titles' }, h('h1', { class: 't-title-l', text: 'Plan your week' }), h('p', { class: 'tab-header__sub', text: 'A light plan. Change any meal, any day.' }))),
    body: rise([how, q.node, h('div', { class: 'block-gap' }, err, make)]),
    tabs: 'plan',
  });
  return { el, onLeave: el.cleanup };
}

function weekView() {
  const s = store.get();
  const which = s.ui.planWeek === 'next' ? 'next' : 'this';
  const mon = which === 'next' ? addDays(mondayOf(), 7) : mondayOf();
  const keys = weekKeys(mon);
  const tk = todayKey();
  const list = shoppingList(s);

  const header = h('header', { class: 'tab-header' },
    h('div', { class: 'tab-header__titles' },
      h('h1', { class: 't-title-l', text: which === 'next' ? 'Next week' : 'This week' }),
      h('p', { class: 'tab-header__sub', text: fmtRange(mon) })),
    h('div', { class: 'tab-header__actions' },
      which === 'this' ? h('button', { type: 'button', class: 'pill-btn', 'aria-label': `Shopping list, ${list.count} to buy`, onClick: () => navigate('shopping') },
        h('span', { class: 'contents', html: icon('list') }), h('span', { text: list.count ? `${list.count} to buy` : 'List' })) : null,
      iconButton({ iconName: 'edit', label: 'Edit your plan', variant: 'surface', onClick: () => navigate('plan-edit') })));

  const seg = segmented({
    options: [{ id: 'this', name: 'This week' }, { id: 'next', name: 'Next week' }],
    value: which, label: 'Week',
    onChange: (id) => { if (id !== which) { store.ui({ planWeek: id }); refresh(); } },
  });

  const cards = [];
  let notPlanned = [];
  keys.forEach((k) => {
    const d = fromKey(k);
    if (k < tk) return; // past days live in Memory
    const day = s.plan.days[k];
    if (!day) { notPlanned.push(k); return; }
    if (notPlanned.length) { cards.push(notPlannedCard(notPlanned)); notPlanned = []; }
    cards.push(dayCard(k, d, day, k === tk));
  });
  if (notPlanned.length) cards.push(notPlannedCard(notPlanned));

  const strip = which === 'this' ? dayStrip(keys, tk) : null;

  const { el, scroll } = shell({
    cls: 'plan',
    label: which === 'next' ? 'Next week' : 'This week',
    bar: header,
    body: [seg, strip, ...rise(cards)],
    tabs: 'plan',
  });
  flashChangedRow(el);
  el.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => {
    const target = el.querySelector(`#day-${b.dataset.jump}`);
    if (target) scroll.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' });
    else toast('That day is done. You can see it in Memory.', { iconName: 'memory' });
  }));
  return { el, onLeave: el.cleanup };
}

function dayStrip(keys, tk) {
  return h('div', { class: 'day-strip', role: 'list', 'aria-label': 'Days this week' }, keys.map((k) => {
    const d = fromKey(k);
    const b = h('button', { type: 'button', class: 'day-strip__day' + (k === tk ? ' is-today' : '') + (k < tk ? ' is-past' : ''), 'data-jump': k, 'aria-label': `${dayName(d)} ${d.getDate()}${k === tk ? ', today' : ''}`, 'aria-current': k === tk ? 'date' : null },
      h('span', { class: 'day-strip__l', text: dayLetter(d) }), h('span', { class: 'day-strip__n', text: String(d.getDate()) }));
    return h('div', { role: 'listitem' }, b);
  }));
}

function dayCard(k, d, day, isToday) {
  const s = store.get();
  const head = h('div', { class: 'day-card__head' },
    h('h2', { class: 'day-card__title', text: isToday ? `${fmtDayNum(d)} · Today` : fmtDayNum(d) }),
    day.busy ? h('span', { class: 'tag tag--busy', text: `Busy · ${capFirst(feederName(day.feeder, s))} feeds` }) : null);
  const card = h('section', { class: 'card day-card', id: `day-${k}`, 'aria-label': `${dayName(d)} ${d.getDate()}` }, head);

  let order = ['breakfast', 'lunch', 'snack', 'dinner'].filter((m) => m in day.meals);
  if (isToday) {
    const done = order.filter((m) => entry(s, k, m));
    if (done.length) {
      card.append(h('p', { class: 'day-card__done' },
        h('span', { class: 'contents', html: icon('success') }),
        h('span', { text: `${capFirst(joinNice(done.map((m) => MEAL_NAMES[m].toLowerCase())))} done` }),
        h('button', { type: 'button', class: 'link link--small', text: 'See in Memory', onClick: () => navigate('memory', { reset: true, transition: 'fade' }) })));
      order = order.filter((m) => !entry(s, k, m));
    }
  }
  if (!order.length) {
    card.append(h('div', { class: 'day-card__empty' },
      h('p', { class: 'row__meta', text: 'Nothing planned. Decide on the day.' }),
      h('button', { type: 'button', class: 'link', onClick: () => addMealsSheet(k) }, h('span', { class: 'contents', html: icon('plus') }), h('span', { text: 'Add meals' }))));
  }
  order.forEach((m) => card.append(mealRow(k, m, day)));
  // Any meal can be added to any day, not only to empty days.
  const pastToday = isToday ? ['breakfast', 'lunch', 'snack', 'dinner'].slice(0, ['breakfast', 'lunch', 'snack', 'dinner'].indexOf(mealNow())) : [];
  const missing = MEALS.map((x) => x.id).filter((m) => !(m in day.meals) && !pastToday.includes(m) && !(isToday && entry(s, k, m)));
  if (order.length && missing.length) {
    const add = h('button', { type: 'button', class: 'link day-card__add', 'aria-haspopup': 'dialog' },
      h('span', { class: 'contents', html: icon('plus') }),
      h('span', { text: `Add ${joinNice(missing.map((m) => MEAL_NAMES[m].toLowerCase()), 'or')}` }));
    add.addEventListener('click', () => addMealsSheet(k, missing));
    card.append(add);
  }
  return card;
}

function mealRow(k, m, day) {
  const r = recipe(day.meals[m]);
  if (!r) {
    return h('div', { class: 'plan-row plan-row--empty' },
      h('span', { class: 'plan-row__img plan-row__img--empty', html: icon(m), 'aria-hidden': 'true' }),
      h('span', { class: 'plan-row__text' },
        h('span', { class: `tl__meal tl__meal--${m}`, text: MEAL_NAMES[m] }),
        h('span', { class: 'plan-row__name plan-row__name--muted', text: 'Decide on the day' })),
      button({ label: 'Plan it', variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact plan-row__change',
        ariaLabel: `Plan ${dayName(fromKey(k))} ${MEAL_NAMES[m].toLowerCase()}`, onClick: () => fillEmpty(k, m) }));
  }
  const s = store.get();
  const needsPrep = r.prep && !s.plan.prepDone[k];
  // Edge case: an allergy added after planning. Flag it in red and point to the swap.
  const bad = r.allergens.filter((a) => avoids(a, s));
  // The dish opens its recipe (a new screen). "Change" is the labelled action that opens
  // the sheet with other ideas: one visible control per job, no hidden tap targets.
  const open = h('button', { type: 'button', class: 'plan-row__open', 'aria-label': `${MEAL_NAMES[m]}: ${r.name}, ${r.custom ? 'your dish' : r.mins + ' minutes'}. Open recipe` },
    dishThumb(r, 'plan-row__img'),
    h('span', { class: 'plan-row__text' },
      // The meal is a text label, not a lone icon (the moon read as a button).
      h('span', { class: `tl__meal tl__meal--${m}`, text: MEAL_NAMES[m] }),
      h('span', { class: 'plan-row__name', text: r.name }),
      r.custom ? h('span', { class: 'plan-row__meta', text: 'Your dish' }) : h('span', { class: 'plan-row__meta' },
        h('span', { class: 'contents', html: icon('clock') }),
        h('span', { text: `${r.mins} min${r.tags.includes('noCook') ? ' · No cooking' : r.tags.includes('sameFamily') ? ' · Same as family' : r.tags.includes('onePot') ? ' · One pot' : day.busy && !r.prep ? ' · No prep' : ''}` }),
        needsPrep && !bad.length ? h('span', { class: 'tag tag--prep', text: r.prepShort }) : null,
        bad.length ? h('span', { class: 'tag tag--danger', text: `Has ${bad.map((a) => allergyName(a).toLowerCase()).join(', ')} · change it` }) : null)));
  open.addEventListener('click', () => openPlannedRecipe(k, m));
  const change = button({
    label: 'Change', variant: bad.length ? 'danger' : 'secondary', size: 'm', cls: 'btn--auto btn--compact plan-row__change',
    ariaLabel: `Change ${dayName(fromKey(k))} ${MEAL_NAMES[m].toLowerCase()}`, onClick: () => plannedMealSheet(k, m),
  });
  change.setAttribute('aria-haspopup', 'dialog');
  return h('div', { class: 'plan-row' + (bad.length ? ' plan-row--unsafe' : ''), id: `row-${k}-${m}` }, open, change);
}

/** Recipe for a planned meal: knows which day and meal it is for. */
function openPlannedRecipe(k, m) {
  const id = store.get().plan.days[k]?.meals?.[m];
  if (!id) return;
  store.ui({ recipe: id, recipeCtx: { k, m } });
  navigate('recipe');
}

function fillEmpty(k, m) {
  store.set((d) => {
    const day = d.plan.days[k];
    const pick = rankIdeas({ meal: m, busy: day.busy }, d)[0];
    day.meals[m] = pick?.id || null;
  });
  store.ui({ flash: `${k}-${m}` });
  refresh();
}

function notPlannedCard(keys) {
  const first = fromKey(keys[0]);
  const last = fromKey(keys[keys.length - 1]);
  const label = keys.length === 1 ? fmtDayNum(first) : `${fmtDayNum(first)} – ${fmtDayNum(last)}`;
  // Say up front what "Plan these days" will do, and where to change it.
  const setup = store.get().plan.setup || { meals: ['dinner'], busy: [] };
  const mealsText = joinNice(['breakfast', 'lunch', 'snack', 'dinner'].filter((m) => setup.meals.includes(m)));
  const what = setup.busy.length && setup.meals.length < 3
    ? `We’ll plan ${mealsText}, and breakfast and lunch on busy days.`
    : `We’ll plan ${mealsText}.`;
  const edit = h('button', { type: 'button', class: 'link link--inline', text: 'Change', 'aria-label': 'Change which meals we plan', onClick: () => navigate('plan-edit') });
  return h('section', { class: 'card day-card day-card--dashed', 'aria-label': `${label}, not planned yet` },
    h('h2', { class: 'day-card__title', text: label }),
    h('p', { class: 'row__meta', text: 'Not planned yet' }),
    h('p', { class: 'row__meta day-card__what' }, h('span', { text: `${what} ` }), edit),
    button({ label: keys.length === 1 ? 'Plan this day' : 'Plan these days', variant: 'secondary', size: 'm', onClick: () => {
      store.set((d) => fillPlan(d, keys));
      refresh();
      toast(`Planned ${keys.length} day${keys.length > 1 ? 's' : ''}`, { iconName: 'success' });
    } }));
}

function addMealsSheet(k, only = MEALS.map((m) => m.id)) {
  let api;
  const picked = new Set(only.length === 1 ? only : []);
  const err = h('p', { class: 'msg msg--error', 'aria-live': 'polite' });
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Meals to add' },
    MEALS.filter((m) => only.includes(m.id)).map((m) => chip({ label: m.name, checked: picked.has(m.id), onToggle: (on, c) => { on ? picked.add(m.id) : picked.delete(m.id); c.setChecked(on); showMsg(err, ''); } })));
  api = openSheet({
    title: `Add to ${dayName(fromKey(k))}`,
    sub: 'We’ll pick from foods he eats. You can change any of them.',
    body: h('div', {}, chips, err),
    foot: button({ label: 'Add meals', onClick: () => {
      if (!picked.size) { showMsg(err, 'Pick at least one meal.'); return; }
      store.set((d) => {
        const day = d.plan.days[k];
        const kd = fromKey(k);
        const near = [...Object.values(day.meals), ...[-1, 1].flatMap((x) => Object.values(d.plan.days[dateKey(addDays(kd, x))]?.meals || {}))];
        picked.forEach((m) => {
          const list = rankIdeas({ meal: m, busy: day.busy }, d);
          day.meals[m] = (list.find((r) => !near.includes(r.id)) || list[0])?.id || null;
          near.push(day.meals[m]);
        });
      });
      api.close({ keepFocus: true });
      refresh();
      toast(`Added ${joinNice([...picked].map((m) => MEAL_NAMES[m].toLowerCase()))} to ${dayName(fromKey(k))}`, { iconName: 'success' });
    } }),
  });
}

/* ==========================================================================
   PL04 · A planned meal (sheet)
   ========================================================================== */
function plannedMealSheet(k, m) {
  const s = store.get();
  const day = s.plan.days[k];
  const r = recipe(day.meals[m]);
  let api;
  const d = fromKey(k);
  const now = h('div', { class: 'planned-now' },
    dishThumb(r, 'planned-now__img'),
    h('div', { class: 'planned-now__text' }, h('p', { class: 'planned-now__name', text: r.name }), h('p', { class: 'row__meta', text: r.custom ? 'Your dish' : `${r.mins} min${r.prep ? ' · ' + r.prepShort : ''}` })),
    h('button', { type: 'button', class: 'link', text: 'Recipe', onClick: () => { api.close({ keepFocus: true }); openPlannedRecipe(k, m); } }));
  const options = planAlternatives(s, k, m, 3);
  const rows = options.map((o) => h('div', { class: 'row row--compact use-row' },
    thumb(o.photo ? thumbUrl(o.photo) : null, 'use-row__img'),
    h('span', { class: 'row__label' }, h('span', { class: 't-body-l-strong', text: o.name }), h('span', { class: 'row__meta', text: `${o.mins} min · ${o.prep ? o.prepShort : o.tags.includes('sameFamily') ? 'Same as family' : 'No prep'}` })),
    button({ label: 'Use this', variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact', ariaLabel: `Use ${o.name}`, onClick: () => {
      const prev = r.id;
      store.set((x) => { x.plan.days[k].meals[m] = o.id; });
      api.close({ keepFocus: true });
      store.ui({ flash: `${k}-${m}` });
      refresh();
      toast(`${dayName(d)} ${MEAL_NAMES[m].toLowerCase()} is now ${o.name}`, { iconName: 'success', action: { label: 'Undo', onClick: () => { store.set((x) => { x.plan.days[k].meals[m] = prev; }); refresh(); } } });
    } })));
  // One way to take a meal off a day (it was two: "leave empty" and "remove" did the same job).
  // "+ Add …" on the day brings it back, and Undo is there right away.
  const remove = h('button', { type: 'button', class: 'link link--center link--danger', text: `Remove ${MEAL_NAMES[m].toLowerCase()} from ${dayName(d)}`, onClick: () => {
    const prev = r.id;
    store.set((x) => { delete x.plan.days[k].meals[m]; });
    api.close({ keepFocus: true });
    refresh();
    toast(`Removed ${MEAL_NAMES[m].toLowerCase()} from ${dayName(d)}`, { iconName: 'info', action: { label: 'Undo', onClick: () => { store.set((x) => { x.plan.days[k].meals[m] = prev; }); refresh(); } } });
  } });
  const bad = r.allergens.filter((a) => avoids(a, s));
  const alert = bad.length ? h('div', { class: 'alert', role: 'alert' }, h('span', { class: 'contents', html: icon('allergy') }),
    h('div', {}, h('p', { class: 'alert__title', text: `${r.name} has ${joinNice(bad.map((a) => allergyName(a).toLowerCase()))}` }),
      h('p', { class: 'alert__body', text: 'It is on his allergy list now. Pick one of the ideas below.' }))) : null;
  // Her own dishes (saved before) come first next time; then "Type your own dish".
  const useDish = (id, name) => {
    const prev = r.id;
    store.set((x) => { x.plan.days[k].meals[m] = id; });
    api.close({ keepFocus: true });
    store.ui({ flash: `${k}-${m}` });
    refresh();
    toast(`${dayName(d)} ${MEAL_NAMES[m].toLowerCase()} is now ${name}`, { iconName: 'success', action: { label: 'Undo', onClick: () => { store.set((x) => { x.plan.days[k].meals[m] = prev; }); refresh(); } } });
  };
  const mine = (s.customDishes || []).filter((c) => c.id !== r.id).map((c) => recipe(c.id)).filter((c) => c && recipeSafe(c, s)).slice(0, 3);
  const mineRows = mine.map((c) => h('div', { class: 'row row--compact use-row' },
    dishThumb(c, 'use-row__img'),
    h('span', { class: 'row__label' }, h('span', { class: 't-body-l-strong', text: c.name }), h('span', { class: 'row__meta', text: 'Your dish' })),
    button({ label: 'Use this', variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact', ariaLabel: `Use ${c.name}`, onClick: () => useDish(c.id, c.name) })));
  const typeOwn = h('button', { type: 'button', class: 'row row--compact use-row own-dish', 'aria-haspopup': 'dialog' },
    h('span', { class: 'use-row__img use-row__img--icon own-dish__icon', html: icon('edit'), 'aria-hidden': 'true' }),
    h('span', { class: 'row__label' }, h('span', { class: 't-body-l-strong', text: 'Type your own dish' }), h('span', { class: 'row__meta', text: 'Anything your family makes' })),
    h('span', { class: 'nav-row__chev', html: icon('forward') }));
  typeOwn.addEventListener('click', () => { api.close({ keepFocus: true }); setTimeout(() => ownDishSheet(k, m), 340); });

  api = openSheet({
    title: `${dayName(d)} ${MEAL_NAMES[m].toLowerCase()}`,
    sub: day.busy ? `Busy day · ${capFirst(feederName(day.feeder, s))} feeds` : '',
    body: h('div', {}, alert,
      h('h3', { class: 't-label sheet-label sheet-label--first', text: 'Planned now' }), now,
      mineRows.length ? h('h3', { class: 't-label sheet-label', text: 'Your dishes' }) : null,
      mineRows.length ? h('div', { class: 'use-list' }, mineRows) : null,
      h('h3', { class: 't-label sheet-label', text: day.busy ? 'Or pick one · quick for a busy day' : 'Or pick one · quick and easy' }),
      rows.length ? h('div', { class: 'use-list' }, rows) : h('p', { class: 'row__meta', text: 'No other ideas fit this meal yet.' }),
      h('div', { class: 'use-list own-dish-wrap' }, typeOwn),
      remove),
  });
}

/* ---------- Type your own dish: name → "Need anything for this?" → plan + shopping ---------- */
function ownDishSheet(k, m) {
  let api;
  const d = fromKey(k);
  const field = textField({ placeholder: 'e.g. Aloo paratha', onEnter: () => next() });
  field.input.setAttribute('aria-label', 'Name of your dish');
  field.control.append(micButton({ input: field.input, sample: 'Aloo paratha' }));
  const err = h('p', { class: 'msg msg--error', 'aria-live': 'polite' });
  const body = h('div', { class: 'own-dish' }, field, err);
  const foot = h('div', { class: 'own-dish__foot' });

  function next() {
    const name = capFirst(field.input.value.trim());
    if (name.length < 2) { showMsg(err, 'Please type the dish name.'); return; }
    // Safety: a dish that names his allergen is not added.
    const bad = typedFoodUnsafe(name);
    if (bad.length) { showMsg(err, `${capFirst(bad[0].phrase)} isn’t safe for ${childName() || 'him'}. It is on his allergy list.`); return; }
    askNeeds(name);
  }

  function askNeeds(name) {
    const s = store.get();
    const have = new Set(homeToday(s));
    const picked = new Set();
    const extra = [];
    const guess = guessNeeds(name).filter((id) => !(INGREDIENTS.find((i) => i.id === id)?.allergens || []).some((a) => avoids(a, s)));
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Things to buy for this' });
    const paint = () => chips.replaceChildren(
      ...guess.map((id) => chip({ label: INGREDIENTS.find((i) => i.id === id).name + (have.has(id) ? ' · at home' : ''), checked: picked.has(id),
        onToggle: (on, c) => { on ? picked.add(id) : picked.delete(id); c.setChecked(on); } })),
      ...extra.map((x) => chip({ label: x, checked: true, onToggle: (on, c) => { if (!on) { extra.splice(extra.indexOf(x), 1); paint(); } else c.setChecked(true); } })));
    paint();
    const add = textField({ placeholder: 'Add item, e.g. ghee', onEnter: () => addItem() });
    add.input.setAttribute('aria-label', 'Add an item to buy');
    function addItem() {
      const t = capFirst(add.input.value.trim());
      if (t.length < 2) return;
      const ing = INGREDIENTS.find((i) => i.name.toLowerCase() === t.toLowerCase() || (i.words || []).includes(t.toLowerCase()));
      if (ing) { if (!guess.includes(ing.id)) guess.push(ing.id); picked.add(ing.id); } else if (!extra.includes(t)) extra.push(t);
      add.input.value = ''; paint();
    }
    const addBtn = button({ label: 'Add', variant: 'secondary', size: 'm', cls: 'btn--auto', onClick: addItem });
    body.replaceChildren(
      h('p', { class: 'own-dish__name t-title-s', text: name }),
      h('h3', { class: 't-label sheet-label', text: 'Need anything for this?' }),
      guess.length ? chips : h('p', { class: 't-help', text: 'Add anything you need to buy. We put it on the shopping list.' }),
      h('div', { class: 'add-row block-gap' }, add, addBtn));
    if (!guess.length) body.insertBefore(chips, body.lastChild);
    foot.replaceChildren(button({ label: `Add to ${dayName(d)}`, onClick: () => {
      let id;
      store.set((x) => {
        id = saveCustomDish(x, { name, needs: [...picked], extra });
        x.plan.days[k].meals[m] = id;
        // Ticked items she doesn't have go to the shopping list (via the plan); free-text items as manual items.
        extra.forEach((t) => { if (!x.shopping.manual.some((i) => i.name.toLowerCase() === t.toLowerCase())) x.shopping.manual.push({ id: `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name: t, qty: '', for: `for ${d.toLocaleDateString('en-IN', { weekday: 'short' })} ${name.toLowerCase()}` }); });
        [...picked].forEach((p) => { x.shopping.got = x.shopping.got.filter((g) => g !== p); });
      });
      api.close();
      store.ui({ flash: `${k}-${m}` });
      refresh();
      const toBuy = [...picked].filter((p) => !have.has(p)).length + extra.length;
      toast(toBuy ? `${name} added. ${toBuy} thing${toBuy === 1 ? '' : 's'} on your shopping list.` : `${name} added to ${dayName(d)}.`, { iconName: 'success' });
    } }));
  }

  foot.append(button({ label: 'Save', onClick: () => next() }));
  api = openSheet({ title: 'Type your own dish', sub: `For ${dayName(d)} ${MEAL_NAMES[m].toLowerCase()}`, body, foot, initialFocus: 'input' });
}

/* ==========================================================================
   PL05 · Shopping list
   ========================================================================== */
/**
 * One item. Tick = bought. "Have it" (visible, secondary) = already at home, fix it right here.
 * The "for Wed palak khichdi" line is a button: it offers "Swap that dish" instead of buying.
 */
function shopRow(it) {
  const check = h('button', { type: 'button', class: 'check-row shop-row__check', role: 'checkbox', 'aria-checked': 'false', 'aria-label': `${it.name}${it.qty ? ', ' + it.qty : ''}. Bought` },
    h('span', { class: 'checkbox', 'aria-hidden': 'true', html: icon('check') }),
    h('span', { class: 'row__label', text: it.name }),
    it.qty ? h('span', { class: 'shop-row__qty', text: it.qty }) : null);
  check.addEventListener('click', () => {
    check.setAttribute('aria-checked', 'true');
    check.classList.add('is-leaving');
    setTimeout(() => { store.set((d) => { d.shopping.got = [...new Set([...d.shopping.got, it.id])]; }); refresh(); }, 260);
  });
  const isIng = INGREDIENTS.some((i) => i.id === it.id);
  const forLine = it.forKey
    ? h('button', { type: 'button', class: 'shop-row__for shop-row__for--btn', 'aria-haspopup': 'dialog', 'aria-label': `${capFirst(it.forText)}. Swap that dish`,
      onClick: () => menuSheet({ title: `${it.name} is ${it.forText}`, items: [{ icon: 'swap', label: 'Swap that dish', onClick: () => plannedMealSheet(it.forKey, it.forMeal) }] }) },
      capFirst(it.forText))
    : it.forText ? h('span', { class: 'shop-row__for', text: capFirst(it.forText) }) : null;
  const have = button({ label: 'Have it', variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact shop-row__have', ariaLabel: `Have ${it.name} at home already`, onClick: () => haveIt(it, isIng) });
  return h('div', { class: 'shop-row' },
    h('div', { class: 'shop-row__main' }, check,
      (forLine || it.buyLater) ? h('div', { class: 'shop-row__sub' }, forLine,
        it.buyLater ? h('span', { class: 'tag tag--guide', text: `Buy closer to ${it.buyLater}` }) : null) : null),
    have);
}

/** She already has it: off the list, and onto today's "What's at home". */
function haveIt(it, isIng) {
  const before = structuredClone({ home: store.get().home, manual: store.get().shopping.manual, ranOut: store.get().shopping.ranOut });
  store.set((d) => {
    if (isIng) {
      const base = homeToday(d);
      d.home.today = [...new Set([...base, it.id])];
      d.home.todayDate = todayKey();
      d.home.lastToday = d.home.today;
      if (!d.home.usual.includes(it.id)) d.home.usual.push(it.id);
      d.shopping.ranOut = d.shopping.ranOut.filter((x) => x !== it.id);
    }
    d.shopping.manual = d.shopping.manual.filter((x) => x.id !== it.id);
  });
  refresh();
  toast(`${it.name} is at home. Off the list.`, { iconName: 'success', action: { label: 'Undo', onClick: () => {
    store.set((d) => { d.home = before.home; d.shopping.manual = before.manual; d.shopping.ranOut = before.ranOut; }); refresh();
  } } });
}

export function shoppingScreen() {
  const s = store.get();
  const list = shoppingList(s);
  const groups = list.groups.map((g) => h('section', { 'aria-label': g.title },
    h('h2', { class: 't-label section-gap', text: g.title }),
    h('div', { class: 'card check-list' }, g.items.map((it) => shopRow(it)))));
  const done = list.done.length ? h('section', { 'aria-label': 'Got it' },
    h('h2', { class: 't-label section-gap', text: 'Got it' }),
    h('div', { class: 'card check-list check-list--done' }, list.done.map((it) => checkRow({
      label: it.name, meta: it.qty, checked: true,
      onChange: () => { store.set((d) => { d.shopping.got = d.shopping.got.filter((x) => x !== it.id); }); refresh(); },
    })))) : null;

  const empty = !list.groups.length && !list.done.length
    ? h('div', { class: 'state' }, h('span', { class: 'state__icon', html: icon('basket') }), h('h2', { class: 't-title-m state__title', text: 'Nothing to buy' }), h('p', { class: 'state__body', text: 'Everything in this week’s plan is at home. Add anything else below.' }))
    : null;

  const addField = textField({ placeholder: 'e.g. Bananas', enterkeyhint: 'done' });
  addField.input.setAttribute('aria-label', 'Add an item');
  const addLink = h('button', { type: 'button', class: 'link block-gap' }, h('span', { class: 'contents', html: icon('plus') }), h('span', { text: 'Add an item' }));
  const addNow = () => {
    const t = addField.input.value.trim();
    if (t.length < 2) { addField.setError('Please type at least 2 letters.'); return; }
    const onList = [...list.groups.flatMap((g) => g.items), ...list.done].some((i) => i.name.toLowerCase() === t.toLowerCase());
    if (onList) { addField.setError(`${capFirst(t)} is already on your list.`); return; }
    store.set((d) => { d.shopping.manual.push({ id: `m-${Date.now().toString(36)}`, name: capFirst(t), qty: '' }); });
    refresh();
    toast(`Added ${capFirst(t)}`, { iconName: 'success' });
  };
  addField.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addNow(); } });
  const addBtn = button({ label: 'Add', variant: 'secondary', size: 'm', cls: 'btn--auto', onClick: addNow });
  const addRow = h('div', { class: 'add-row block-gap', hidden: true }, addField, addBtn);
  addLink.addEventListener('click', () => { addRow.hidden = false; addLink.hidden = true; addField.input.focus(); });

  // Copy without the async clipboard API (blocked in some webviews).
  const copyText = (text) => {
    const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0;pointer-events:none' });
    ta.value = text; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove(); return ok;
  };
  const share = button({
    label: 'Share on WhatsApp', iconName: 'share',
    onClick: async () => {
      // Every group, including Ran out, Snacks and Added by you.
      const text = `Shopping list for ${childName() ? childName() + '’s' : 'our'} meals:\n` + list.groups.map((g) => `\n*${g.title}*\n` + g.items.map((i) => `• ${i.name}${i.qty ? ' (' + i.qty + ')' : ''}${i.buyLater ? ` · buy closer to ${i.buyLater}` : ''}`).join('\n')).join('\n');
      if (navigator.share) {
        try { await navigator.share({ text }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
      }
      try { await navigator.clipboard.writeText(text); toast('List copied. Paste it in WhatsApp.', { iconName: 'success' }); return; } catch { /* fall through */ }
      if (copyText(text)) { toast('List copied. Paste it in WhatsApp.', { iconName: 'success' }); return; }
      toast('Could not copy the list. Please try again.', { iconName: 'info' });
    },
  });
  if (!list.count) share.setDisabled(true);

  const { el } = shell({
    label: 'Shopping list',
    bar: topbar({ onBack: () => back() }),
    body: [
      h('h1', { class: 'screen-title t-title-l', text: 'Shopping list' }),
      h('p', { class: 'screen-lead', text: list.count ? `${list.count} to buy · from this week’s plan` : 'From this week’s plan' }),
      empty, ...groups, done, addLink, addRow,
    ],
    footer: [share],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   PL10 · Edit your plan
   ========================================================================== */
export function planEditScreen() {
  const s = store.get();
  const q = planQuestions(s.plan.setup || { meals: ['dinner'], busy: [], feeder: 'me' });
  const err = footerMsg();
  const save = button({
    label: 'Save changes',
    onClick: () => {
      const v = q.value();
      if (!v.meals.length) { showMsg(err, 'Pick at least one meal to plan.'); return; }
      store.set((d) => {
        d.plan.setup = v;
        const tomorrow = dateKey(addDays(new Date(), 1));
        const keys = Object.keys(d.plan.days).filter((k) => k >= tomorrow);
        fillPlan(d, keys);
      });
      back();
      toast('Plan updated. Changes apply from tomorrow.', { iconName: 'success' });
    },
  });
  const { el } = shell({
    label: 'Edit your plan',
    bar: topbar({ onBack: () => back() }),
    body: [h('h1', { class: 'screen-title t-title-l', text: 'Edit your plan' }), h('p', { class: 'screen-lead', text: 'Changes apply from tomorrow' }), q.node],
    footer: [err, save],
  });
  return { el, onLeave: el.cleanup };
}

/* Flash the row that just changed (PL02b), then fade the tint. */
export function flashChangedRow(root) {
  const f = store.get().ui.flash;
  if (!f) return;
  const row = root.querySelector(`#row-${f}`);
  if (row) row.classList.add('is-flash');
  store.ui({ flash: null });
}
