// Flow R6 · Memory (M01–M04), Learn (LN01, LN02), Profile (PR01, PR02, PR06)
// and the invite from R4 (L03 sheet, L04 WhatsApp mock).

import { icon, logo } from './icons.js';
import {
  h, button, iconButton, topbar, chip, openSheet, toast, comingSoon, textField, segmented, toggleRow,
  confirmDialog, menuSheet, navRow, thumb, iconTile, phulkaEl, mealBadge, radioGroupKeys,
} from './components.js';
import { navigate, back, currentRoute } from './router.js';
import { store, childName, ageInMonths, ageLabel, findFood, unsafeAllergens, slug, backupIds, setBackups } from './store.js';
import {
  FOODS, ARTICLES, SOURCE_TODO, RELATIONS, HOUSE_RULES, CUISINES, DIETS, MONTHS, thumbUrl,
} from './data.js';
import {
  todayKey, fromKey, addDays, mondayOf, weekKeys, fmtRange, fmtLong, dayLetter, dayName, relDay,
  OUTCOMES, entry, lastEaten, foodGroupDays, FOOD_GROUP_LABELS, allergyName, capFirst, typedFoodUnsafe, newTriedIn,
} from './meals.js';

const statusLine = (id, s) => ({ well: 'Ate well · now one of his foods', some: 'Ate some · try it again soon', not: 'Not this time · we won’t suggest it for a while' })[s.foodStatus[id]] || 'Tried';
import { shell, rise, joinNice, showMsg } from './screens.js';
import { timelineRow, logSheet, childHeader } from './screens-today.js';

const refresh = () => navigate(currentRoute(), { replace: true, transition: 'fade' });
const kid = () => childName() || 'your child';

/* ==========================================================================
   M01 · Memory
   ========================================================================== */
export function memoryScreen() {
  const s = store.get();
  const mon = mondayOf();
  const keys = weekKeys(mon);
  const tk = todayKey();
  const blocks = [];

  // The one useful insight, asked as a question (never shown as a fact).
  if (s.insight && s.insight.answered == null) {
    blocks.push(h('section', { class: 'card insight', 'aria-labelledby': 'insight-t' },
      phulkaEl({ mood: 'thinking', size: 64, disc: false }),
      h('div', { class: 'insight__body' },
        h('p', { class: 'eyebrow eyebrow--note', id: 'insight-t', text: 'Something to check' }),
        h('p', { class: 'insight__text', text: s.insight.text }),
        h('div', { class: 'insight__actions' },
          button({ label: 'Yes, I’ve seen it', variant: 'secondary', size: 'm', cls: 'btn--auto btn--compact', onClick: () => answer('yes') }),
          button({ label: 'Not really', variant: 'text', size: 'm', cls: 'btn--auto btn--compact', onClick: () => answer('no') })))));
  } else if (s.insight && s.insight.answered) {
    blocks.push(h('p', { class: 'note note--success' }, h('span', { class: 'contents', html: icon('success') }),
      h('span', { text: s.insight.answered === 'yes' ? 'Thanks. We’ll suggest milk earlier in the day.' : 'Thanks. We won’t change anything for now.' })));
  }
  function answer(v) { store.set((d) => { d.insight.answered = v; }); refresh(); }

  // Week grid: shape carries the meaning, colour supports it.
  const rows = ['breakfast', 'lunch', 'dinner'];
  const grid = h('div', { class: 'week-grid', role: 'table', 'aria-label': 'How he ate this week' });
  grid.append(h('div', { class: 'week-grid__row week-grid__row--head', role: 'row' },
    h('span', { class: 'week-grid__corner', role: 'columnheader', 'aria-label': 'Meal' }),
    keys.map((k) => {
      const d = fromKey(k);
      const b = h('button', { type: 'button', class: 'week-grid__day' + (k === tk ? ' is-today' : ''), role: 'columnheader', 'aria-label': `${fmtLong(d)}. Open the day`, text: dayLetter(d) });
      b.addEventListener('click', () => daySheet(k));
      return b;
    })));
  rows.forEach((m) => {
    grid.append(h('div', { class: 'week-grid__row', role: 'row' },
      h('span', { role: 'rowheader', class: 'week-grid__meal' }, mealBadge(m), h('span', { class: 'sr-only', text: capFirst(m) })),
      keys.map((k) => {
        const e = entry(s, k, m);
        const future = k > tk;
        const label = `${dayName(fromKey(k))} ${m}: ${e?.outcome ? OUTCOMES[e.outcome].name : future ? 'later this week' : 'not added'}`;
        const cell = h('button', { type: 'button', class: 'mark' + (future ? ' mark--future' : ''), role: 'cell', 'aria-label': label });
        if (e?.outcome) cell.innerHTML = `<span class="face face--${e.outcome}">${icon(OUTCOMES[e.outcome].icon)}</span>`;
        else cell.innerHTML = '<span class="mark__none"></span>';
        cell.addEventListener('click', () => daySheet(k));
        return cell;
      })));
  });
  const legend = h('ul', { class: 'legend', 'aria-label': 'Key' },
    ['well', 'some', 'not'].map((o) => h('li', {}, h('span', { class: `face face--${o} face--s`, html: icon(OUTCOMES[o].icon) }), h('span', { text: OUTCOMES[o].name.replace('Ate some', 'Some') }))),
    h('li', {}, h('span', { class: 'mark__none mark__none--s' }), h('span', { text: 'Not added' })));
  blocks.push(h('section', { class: 'card week', 'aria-labelledby': 'week-t' },
    h('div', { class: 'section-label' }, h('h2', { class: 't-title-m', id: 'week-t', text: 'This week' }), h('span', { class: 'row__meta', text: 'Tap a day' })),
    grid, legend));

  // Foods he eats
  const selected = s.foods.selected;
  const counts = { well: 0, some: 0, not: 0 };
  selected.forEach((id) => { counts[s.foodStatus[id] || 'well'] += 1; });
  const stack = h('span', { class: 'thumb-stack', 'aria-hidden': 'true' }, selected.slice(0, 3).map((id) => thumb(findFood(id)?.photo ? thumbUrl(findFood(id).photo) : null, 'thumb-stack__img')));
  const foodsRow = navRow({ title: 'Foods he eats', sub: selected.length ? `${counts.well} eat well · ${counts.some} sometimes · ${counts.not} not now` : 'Add the foods he eats', media: stack, onClick: () => navigate('his-foods'), cls: 'card foods-row' });
  blocks.push(foodsRow);

  // Food groups: days per group, not a score.
  const days = foodGroupDays(keys.filter((k) => k <= tk), s);
  const any = Object.values(days).some(Boolean);
  blocks.push(h('section', { class: 'card groups', 'aria-labelledby': 'groups-t' },
    h('div', { class: 'section-label' }, h('h2', { class: 't-title-m', id: 'groups-t', text: 'Food groups' }), h('span', { class: 'row__meta', text: 'Days this week' })),
    any ? h('ul', { class: 'groups__list' }, FOOD_GROUP_LABELS.map(([g, name]) => h('li', { class: 'group-row' },
      h('span', { class: 'group-row__name', text: name }),
      h('span', { class: 'segbar', 'aria-hidden': 'true' }, Array.from({ length: 7 }, (_, i) => h('span', { class: i < days[g] ? 'is-on' : '' }))),
      h('span', { class: 'group-row__n', text: String(days[g]), 'aria-label': `${days[g]} days` }))))
      : h('p', { class: 'row__meta', text: 'Add what he eats on Today and this fills in by itself.' })));

  // Variety (FigJam "Variety tracker"): new twists tried this week, never a score.
  const fresh = newTriedIn(s, keys);
  blocks.push(h('section', { class: 'card variety', 'aria-labelledby': 'variety-t' },
    h('div', { class: 'section-label' }, h('h2', { class: 't-title-m', id: 'variety-t', text: 'New this week' }),
      h('span', { class: 'row__meta', text: fresh.length ? `${fresh.length} tried` : 'None yet' })),
    fresh.length
      ? h('ul', { class: 'variety__list' }, fresh.map((f) => h('li', { class: 'variety__item' },
        thumb(f.photo ? thumbUrl(f.photo) : null, 'nav-thumb'),
        h('span', { class: 'variety__text' }, h('span', { class: 'variety__name', text: f.name }), h('span', { class: 'row__meta', text: statusLine(f.id, s) })))))
      : h('p', { class: 'row__meta', text: 'Ideas tagged “New” are small twists on foods he already eats. Try one when you have the energy.' })));

  const { el } = shell({
    cls: 'memory',
    label: 'Memory',
    bar: h('header', { class: 'tab-header' }, h('div', { class: 'tab-header__titles' }, h('h1', { class: 't-title-l', text: 'Memory' }), h('p', { class: 'tab-header__sub', text: `This week · ${fmtRange(mon)}` }))),
    body: rise(blocks),
    tabs: 'memory',
  });
  return { el, onLeave: el.cleanup };
}

/* ---------- M02 · A day in Memory (sheet) ---------- */
function daySheet(k) {
  const s = store.get();
  if (k > todayKey()) { toast('That day has not come yet.', { iconName: 'info' }); return; }
  const rows = ['breakfast', 'lunch', 'snack', 'dinner'].flatMap((m) => [timelineRow(s, k, m), helperNotes(s, k, m)]).filter(Boolean);
  openSheet({ title: fmtLong(fromKey(k)), body: h('div', { class: 'timeline timeline--sheet' }, rows) });
}

/** What the helper said for this meal: her words (typed or spoken) and her voice note with a play button. */
function helperNotes(s, k, m) {
  const notes = (s.carerNotes || {})[`${k}|${m}`] || [];
  if (!notes.length) return null;
  return h('div', { class: 'helper-notes' }, notes.map((n) => {
    let audio = null;
    const playBtn = n.voice ? h('button', { type: 'button', class: 'voice-play', 'aria-pressed': 'false', 'aria-label': `Play ${n.by}’s voice note, ${n.secs || 0} seconds` },
      h('span', { class: 'contents voice-play__icon', html: icon('play') }), h('span', { text: `Voice note · 0:${String(n.secs || 0).padStart(2, '0')}` })) : null;
    playBtn?.addEventListener('click', () => {
      const ico = playBtn.querySelector('.voice-play__icon');
      const reset = () => { playBtn.setAttribute('aria-pressed', 'false'); ico.innerHTML = icon('play'); };
      if (audio && !audio.paused) { audio.pause(); reset(); return; }
      audio = audio || new Audio(n.voice);
      audio.onended = reset;
      audio.play().then(() => { playBtn.setAttribute('aria-pressed', 'true'); ico.innerHTML = icon('pause'); }).catch(() => { reset(); toast('Could not play this voice note.', { iconName: 'info' }); });
    });
    return h('div', { class: 'helper-note' },
      h('span', { class: 'helper-note__icon contents', html: icon(n.voice ? 'mic' : 'message') }),
      h('div', { class: 'helper-note__body' },
        h('p', { class: 'row__meta', text: `${n.by}${n.time ? ', ' + n.time : ''}` }),
        n.text ? h('p', { class: 'helper-note__text', text: `“${n.text}”` }) : null,
        playBtn));
  }));
}

/* ==========================================================================
   M03 · Foods he eats  ·  M04 · Change a food (sheet)
   ========================================================================== */
export function foodsListScreen() {
  const s = store.get();
  const tab = s.ui.foodsTab || 'well';
  const status = (id) => s.foodStatus[id] || 'well';
  const counts = { well: 0, some: 0, not: 0 };
  s.foods.selected.forEach((id) => { counts[status(id)] += 1; });
  const seg = segmented({
    options: [{ id: 'well', name: `Eats well · ${counts.well}` }, { id: 'some', name: `Sometimes · ${counts.some}` }, { id: 'not', name: `Not now · ${counts.not}` }],
    value: tab, label: 'How he eats them',
    onChange: (id) => { store.ui({ foodsTab: id }); refresh(); },
  });
  const items = s.foods.selected.filter((id) => status(id) === tab).map((id) => {
    const f = findFood(id);
    if (!f) return null;
    const last = lastEaten(id, s);
    const isBackup = backupIds(s).includes(id);
    const sub = [isBackup ? 'His backup' : null, last ? `${isBackup ? 'last' : 'Last'}: ${relDay(last.key)}${last.outcome ? ', ' + OUTCOMES[last.outcome].short : ''}` : 'Not given yet'].filter(Boolean).join(' · ');
    return navRow({ title: f.name, sub, media: thumb(f.photo ? thumbUrl(f.photo) : null, 'nav-thumb'), onClick: () => changeFoodSheet(id) });
  }).filter(Boolean);
  const list = items.length ? h('div', { class: 'card nav-list' }, items)
    : h('div', { class: 'state' }, h('span', { class: 'state__icon state__icon--neutral', html: icon('bowl') }),
      h('h2', { class: 't-title-m state__title', text: tab === 'not' ? 'Nothing here' : 'No foods here yet' }),
      h('p', { class: 'state__body', text: tab === 'not' ? 'Foods he refuses for now will show here. We try them again later.' : 'Tap Add to put a food he eats here.' }));
  const { el } = shell({
    label: 'Foods he eats',
    bar: topbar({ onBack: () => back(), action: { label: '+ Add', onClick: () => addFoodSheet() } }),
    body: [h('h1', { class: 'screen-title t-title-l', text: 'Foods he eats' }), h('div', { class: 'block-gap' }, seg), h('div', { class: 'block-gap' }, list)],
  });
  return { el, onLeave: el.cleanup };
}

function changeFoodSheet(id) {
  const s = store.get();
  const f = findFood(id);
  const last = lastEaten(id, s);
  let status = s.foodStatus[id] || 'well';
  let backup = backupIds(s).includes(id);
  let api;
  const seg = segmented({ options: [{ id: 'well', name: 'Well' }, { id: 'some', name: 'Sometimes' }, { id: 'not', name: 'Not now' }], value: status, label: 'He eats it', onChange: (v) => { status = v; } });
  const sw = toggleRow({ label: 'Use as his backup', checked: backup, onChange: (v) => { backup = v; } });
  sw.classList.add('toggle-row--plain');
  sw.querySelector('.row__label').append(h('span', { class: 'row__meta', text: 'Shown when he refuses a meal' }));
  const head = h('div', { class: 'food-head' }, thumb(f.photo ? thumbUrl(f.photo) : null, 'food-head__img'));
  const remove = h('button', { type: 'button', class: 'link link--danger link--center', text: 'Remove from his foods', onClick: () => {
    const prev = structuredClone({ sel: store.get().foods.selected, status: store.get().foodStatus[id] });
    store.set((d) => { d.foods.selected = d.foods.selected.filter((x) => x !== id); });
    api.close({ keepFocus: true });
    refresh();
    toast(`Removed ${f.name}`, { iconName: 'trash', action: { label: 'Undo', onClick: () => { store.set((d) => { d.foods.selected = prev.sel; if (prev.status) d.foodStatus[id] = prev.status; }); refresh(); } } });
  } });
  api = openSheet({
    title: f.name,
    sub: last ? `Last given ${relDay(last.key)}${last.outcome ? ' · ' + OUTCOMES[last.outcome].short : ''}` : 'Not given yet',
    body: h('div', {}, head, h('h3', { class: 't-label sheet-label', text: 'He eats it' }), seg, h('div', { class: 'sheet-gap' }, sw)),
    foot: h('div', { class: 'stack' },
      button({ label: 'Save', onClick: () => {
        store.set((d) => {
          d.foodStatus[id] = status;
          const cur = backupIds(d);
          if (backup) { setBackups(d, [...cur, id]); if (!d.backup.list.includes(id)) d.backup.list.unshift(id); }
          else setBackups(d, cur.filter((x) => x !== id));
        });
        api.close({ keepFocus: true });
        refresh();
        toast(`Saved ${f.name}`, { iconName: 'success' });
      } }),
      remove),
  });
  // Photo sits beside the title, as in M04.
  const titles = api.el.querySelector('.sheet__head');
  titles.prepend(head);
}

function addFoodSheet() {
  let api;
  const field = textField({ leadIcon: 'search', placeholder: 'Search or add a food', type: 'search' });
  field.input.setAttribute('aria-label', 'Search or add a food');
  const results = h('div', { role: 'list', 'aria-live': 'polite' });
  const add = (food) => {
    const s = store.get();
    if (unsafeAllergens(food, s).length) { toast(`${food.name} is not safe for ${kid()}.`, { iconName: 'shieldAlert' }); return; }
    store.set((d) => {
      if (food.id.startsWith('custom-')) d.foods.custom.push(food);
      if (!d.foods.list.includes(food.id)) d.foods.list.push(food.id);
      if (!d.foods.selected.includes(food.id)) d.foods.selected.push(food.id);
      d.foodStatus[food.id] = 'well';
    });
    api.close({ keepFocus: true });
    refresh();
    toast(`Added ${food.name}`, { iconName: 'success' });
  };
  const render = () => {
    const q = field.input.value.trim().toLowerCase();
    const s = store.get();
    const pool = FOODS.filter((f) => !s.foods.selected.includes(f.id) && (!q || f.name.toLowerCase().includes(q))).slice(0, 6);
    const nodes = pool.map((f) => {
      const bad = unsafeAllergens(f, s);
      const r = h('button', { type: 'button', class: 'row row--compact' + (bad.length ? ' is-blocked' : '') },
        thumb(f.photo ? thumbUrl(f.photo) : null, 'row__thumb'),
        h('span', { class: 'row__label' }, h('span', { class: 't-body-l-strong', text: f.name }), bad.length ? h('span', { class: 'row__meta', text: `Has ${joinNice(bad.map((a) => allergyName(a))).toLowerCase()} · on his allergy list` }) : null),
        h('span', { class: 'row__trail', html: icon(bad.length ? 'ban' : 'plus') }));
      r.addEventListener('click', () => add(f));
      return h('div', { role: 'listitem' }, r);
    });
    const typedBad = q.length >= 2 ? typedFoodUnsafe(q) : [];
    if (typedBad.length) {
      nodes.push(h('p', { class: 'strip strip--danger' }, h('span', { class: 'contents', html: icon('shieldAlert') }),
        h('span', { text: `“${capFirst(q)}” has ${joinNice(typedBad.map((u) => allergyName(u.id).toLowerCase()))}. We won’t add it to his foods.` })));
    } else if (q.length >= 2 && !FOODS.some((f) => f.name.toLowerCase() === q)) {
      const typed = { id: slug(q), name: capFirst(q), photo: null, allergens: [] };
      const r = h('button', { type: 'button', class: 'row row--compact' },
        h('span', { class: 'row__thumb row__thumb--icon row__thumb--neutral', html: icon('edit') }),
        h('span', { class: 'row__label t-body-l', text: `Add “${capFirst(q)}” as you typed it` }),
        h('span', { class: 'row__trail', html: icon('plus') }));
      r.addEventListener('click', () => add(typed));
      nodes.push(h('div', { role: 'listitem' }, r));
    }
    if (!nodes.length) nodes.push(h('p', { class: 'sheet-empty', text: 'Keep typing to add a food.' }));
    results.replaceChildren(...nodes);
  };
  field.input.addEventListener('input', render);
  render();
  api = openSheet({ title: 'Add a food he eats', body: h('div', {}, field, results), initialFocus: 'input' });
}

/* ==========================================================================
   LN01 · Learn  ·  LN02 · Article
   ========================================================================== */
export function learnScreen() {
  const s = store.get();
  const months = ageInMonths(s.child.birth);
  const age = months != null ? ageLabel(months) : 'toddlers';
  const featured = ARTICLES.find((a) => a.featured);
  const open = (id) => { store.ui({ article: id }); navigate('article'); };

  const hero = h('button', { type: 'button', class: 'card learn-hero', onClick: () => open(featured.id) },
    h('span', { class: `learn-hero__art learn-hero__art--${featured.tint}` }, phulkaEl({ mood: featured.mood, size: 112, disc: false })),
    h('span', { class: 'learn-hero__body' },
      h('span', { class: 'tag', text: months != null ? `Common at ${age}` : 'Common at his age' }),
      h('span', { class: 'learn-hero__title', text: featured.title }),
      h('span', { class: 'row__meta', text: featured.read })));

  const minis = ARTICLES.filter((a) => a.short).map((a) => h('button', { type: 'button', class: 'mini-card', onClick: () => open(a.id) },
    iconTile(a.icon, a.tint), h('span', { class: 'mini-card__text', text: a.short })));

  const questions = ARTICLES.filter((a) => !a.short && !a.featured).map((a) => navRow({ title: a.title, onClick: () => open(a.id) }));

  // Ask other parents: not built yet. Clearly marked "Coming soon" so nobody thinks it is broken.
  const community = navRow({
    title: 'Ask other parents', sub: 'Questions from parents with kids his age', media: iconTile('people'),
    trail: null, cls: 'community-row', onClick: () => communitySheet(),
  });
  community.querySelector('.row__label').append(h('span', { class: 'tag tag--wip community-row__tag', text: 'Coming soon' }));
  community.setAttribute('aria-haspopup', 'dialog');

  const { el } = shell({
    cls: 'learn',
    label: 'Learn',
    bar: h('header', { class: 'tab-header' }, h('div', { class: 'tab-header__titles' }, h('h1', { class: 't-title-l', text: 'Learn' }), h('p', { class: 'tab-header__sub', text: `For ${age}` }))),
    body: rise([
      hero,
      h('section', { 'aria-labelledby': 'gtk' }, h('h2', { class: 't-label section-gap', id: 'gtk', text: 'Good to know at his age' }), h('div', { class: 'mini-row' }, minis)),
      h('section', { 'aria-labelledby': 'cq' }, h('h2', { class: 't-label section-gap', id: 'cq', text: 'Common questions' }), h('div', { class: 'card nav-list' }, questions)),
      h('div', { class: 'card nav-list block-gap' }, community),
    ]),
    tabs: 'learn',
  });
  return { el, onLeave: el.cleanup };
}

/** "Coming soon" sheet for Ask other parents. One tap to hear when it is ready. */
function communitySheet() {
  let api;
  const asked = store.get().learnCommunityInterest;
  const btn = button({
    label: asked ? 'We’ll let you know' : 'Tell me when it’s ready', variant: asked ? 'secondary' : 'primary',
    onClick: () => {
      if (store.get().learnCommunityInterest) { api.close(); return; }
      store.set({ learnCommunityInterest: true });
      api.close();
      toast('We’ll let you know', { iconName: 'success' });
    },
  });
  api = openSheet({
    title: 'Ask other parents',
    label: 'Ask other parents, coming soon',
    body: h('div', { class: 'soon' },
      h('div', { class: 'soon__art' }, phulkaEl({ mood: 'calm', size: 96, disc: true })),
      h('h3', { class: 't-title-m soon__title', text: 'Coming soon' }),
      h('p', { class: 'soon__body', text: 'Soon you can ask other parents and read their answers here.' })),
    foot: btn,
  });
}

export function articleScreen() {
  const s = store.get();
  const a = ARTICLES.find((x) => x.id === s.ui.article) || ARTICLES[0];
  const { el } = shell({
    cls: 'article',
    label: a.title,
    bar: topbar({ onBack: () => back() }),
    body: [
      h('div', { class: `article__art article__art--${a.tint}` }, phulkaEl({ mood: a.mood, size: 120, disc: false, animate: a.mood === 'calm' })),
      h('h1', { class: 't-title-l article__title', text: a.title }),
      ...a.intro.map((p) => h('p', { class: 'article__p', text: p })),
      h('h2', { class: 't-label section-gap', text: 'What you can try' }),
      h('ul', { class: 'tips' }, a.tips.map((t) => h('li', { class: 'tip' }, h('span', { class: 'tip__mark', html: icon('check') }), h('span', { text: t })))),
      h('p', { class: 'note note--info block-gap' }, h('span', { class: 'contents', html: icon('info') }), h('span', { text: a.doctor })),
      // "Based on:" from the article's own sources. No source yet = a visible placeholder, never a guess.
      h('p', { class: 'source' }, 'Based on: ',
        ...(a.sources?.length
          ? a.sources.flatMap((src, i) => [i ? ', ' : '', src.url
            ? h('a', { href: src.url, target: '_blank', rel: 'noopener noreferrer', class: 'source__link', text: src.name, 'aria-label': `${src.name} (opens in a new tab)` })
            : src.name])
          : [h('span', { class: 'source__todo', text: SOURCE_TODO })])),
    ],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   PR01 · Profile  ·  PR06 · Sign out?
   ========================================================================== */
export function profileScreen() {
  const s = store.get();
  const months = ageInMonths(s.child.birth);
  const name = childName() || 'Your child';
  const rulesOn = HOUSE_RULES.filter((r) => s.rules[r.id]).length;
  // "Milk only" or "milk (also curd, ghee)": the summary says what the parent actually chose.
  const milkText = () => {
    if (!Array.isArray(s.milkAlso)) return 'milk (curd, paneer, ghee not answered)';
    return s.milkAlso.length ? `milk (also ${joinNice(s.milkAlso.map((id) => allergyName(id).toLowerCase()))})` : 'milk only';
  };
  const allergyText = s.noKnownAllergies ? 'No known allergies' : s.allergies.length ? capFirst(joinNice(s.allergies.map((a) => (a === 'milk' ? milkText() : allergyName(a).toLowerCase())))) : 'Not added';
  const diet = { veg: 'Vegetarian', egg: 'Eggetarian', nonveg: 'Non-vegetarian', jain: 'Jain' }[s.diet];
  const cuisine = s.cuisines.map((id) => (id === 'mixed' ? (s.mixed.regions[0] || 'Mixed') : CUISINES.find((c) => c.id === id)?.name)).filter(Boolean)[0];
  const usual = s.home.usual;
  const counts = { well: 0, not: 0 };
  s.foods.selected.forEach((id) => { const st = s.foodStatus[id] || 'well'; if (st === 'well') counts.well += 1; if (st === 'not') counts.not += 1; });
  const carers = s.carers;

  const edit = (route) => { store.ui({ edit: route }); navigate(route); };
  const childCard = h('div', { class: 'card profile-child' },
    h('span', { class: 'avatar avatar--wheat avatar--l', text: name.charAt(0).toUpperCase(), 'aria-hidden': 'true' }),
    h('div', { class: 'profile-child__text' },
      h('p', { class: 'profile-child__name', text: name }),
      h('p', { class: 'row__meta', text: s.child.birth ? `${ageLabel(months)} · born ${MONTHS[s.child.birth.m]} ${s.child.birth.y}` : 'Age not added' })),
    h('button', { type: 'button', class: 'link', text: 'Edit', 'aria-label': `Edit ${name}’s name and birth month`, onClick: () => edit('child') }));

  const group1 = h('div', { class: 'card nav-list' },
    navRow({ title: 'Allergies and house rules', sub: `${allergyText} · ${rulesOn} rule${rulesOn === 1 ? '' : 's'}`, media: iconTile('allergy', 'allergy'), onClick: () => edit('allergies') }),
    navRow({ title: 'Family food', sub: [diet, cuisine].filter(Boolean).join(' · ') || 'Not added', media: iconTile('pot', 'leaf'), onClick: () => edit('family') }),
    navRow({ title: 'Usually at home', sub: `${usual.length} things · ${usual.slice(0, 3).join(', ').replace(/-/g, ' ')}…`, media: iconTile('basket', 'leaf'), onClick: () => navigate('home-all') }),
    navRow({ title: 'Foods he likes and refuses', sub: `${counts.well} eat well · ${counts.not} not now`, media: iconTile('bowl', 'breakfast'), onClick: () => navigate('his-foods') }),
    navRow({ title: 'People who feed him', sub: carers.length ? `${carers.map((c) => c.name).join(', ')} · invite someone else` : 'Invite someone who feeds him', media: iconTile('people', 'dinner'), onClick: () => navigate('people') }));

  const group2 = h('div', { class: 'card nav-list' },
    navRow({ title: 'Language', sub: 'English', media: iconTile('language', 'neutral'), onClick: () => languageSheet() }),
    navRow({ title: 'Appearance', sub: THEMES.find((x) => x.id === (s.theme || 'system')).name, media: iconTile('moon', 'neutral'), onClick: () => appearanceSheet(), cls: 'appearance-row' }),
    navRow({ title: 'Help', sub: 'Common questions and chat', media: iconTile('help', 'neutral'), onClick: () => navigate('help') }),
    navRow({ title: 'Add another child', media: iconTile('plus', 'leaf'), cls: 'nav-row--link', onClick: () => comingSoon('Adding another child') }));

  const signOut = h('button', { type: 'button', class: 'link link--danger link--center block-gap', text: 'Sign out', onClick: () => signOutDialog() });

  const { el } = shell({
    label: 'Profile',
    bar: topbar({ onBack: () => back() }),
    body: [h('h1', { class: 'screen-title t-title-l', text: 'Profile' }), h('div', { class: 'block-gap stack-16' }, childCard, group1, group2), signOut],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   Help (added): short answers that expand, and a way to reach a person
   ========================================================================== */
const FAQ = [
  ['How does Little Plate pick ideas?', 'From the foods he eats, your family’s food and what’s at home. Every idea is checked against his allergies and your house rules before you see it.'],
  ['Is this medical advice?', 'No. Little Plate gives everyday feeding ideas. If he seems unwell, is losing weight, or you are worried, talk to his doctor.'],
  ['Can Aai use it without an account?', 'Yes. Invite her from People who feed him. She opens a WhatsApp link and sees what to give, in her language. No sign-up.'],
  ['What happens to my data when I sign out?', 'It stays saved. Sign in again with the same number and everything comes back.'],
  ['Does it work without internet?', 'Yes. His usual ideas and the family’s dinner work offline. Anything you add is saved on the phone and syncs when you’re back online.'],
];
export function helpScreen() {
  const items = FAQ.map(([q, a], i) => {
    const id = `faq-${i}`;
    const panel = h('div', { class: 'faq__a', id, role: 'region', hidden: true }, h('p', { text: a }));
    const btn = h('button', { type: 'button', class: 'faq__q', 'aria-expanded': 'false', 'aria-controls': id },
      h('span', { text: q }), h('span', { class: 'faq__chev', html: icon('down') }));
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    });
    return h('div', { class: 'faq' }, btn, panel);
  });
  const { el } = shell({
    label: 'Help',
    bar: topbar({ onBack: () => back() }),
    body: [h('h1', { class: 'screen-title t-title-l', text: 'Help' }), h('p', { class: 'screen-lead', text: 'Quick answers. Tap a question to open it.' }), h('div', { class: 'card faq-list block-gap' }, items)],
    footer: [button({ label: 'Chat with us on WhatsApp', variant: 'secondary', iconName: 'message', onClick: () => comingSoon('Chat with the Little Plate team') })],
  });
  return { el, onLeave: el.cleanup };
}

/* ---------- Appearance: same as phone (default), light or dark ---------- */
const THEMES = [
  { id: 'system', name: 'Same as phone', sub: 'Changes when your phone does', icon: 'phone' },
  { id: 'light', name: 'Light', icon: 'today' },
  { id: 'dark', name: 'Dark', icon: 'moon' },
];
function appearanceSheet() {
  let api;
  const current = store.get().theme || 'system';
  const group = h('div', { class: 'nav-list', role: 'radiogroup', 'aria-label': 'Appearance' }, THEMES.map((t) => {
    const b = h('button', { type: 'button', class: 'row nav-row', role: 'radio', 'aria-checked': String(t.id === current) },
      iconTile(t.icon, 'neutral'),
      h('span', { class: 'row__label' }, h('span', { class: 'nav-row__title', text: t.name }), t.sub ? h('span', { class: 'row__meta nav-row__sub', text: t.sub }) : null),
      h('span', { class: 'radio-mark', html: icon('check'), 'aria-hidden': 'true' }));
    b.addEventListener('click', () => {
      // Applies at once (app.js listens for theme changes) and is remembered.
      store.set({ theme: t.id === 'system' ? null : t.id });
      group.querySelectorAll('[role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      const row = document.querySelector('.appearance-row .nav-row__sub');
      if (row) row.textContent = t.name;
      setTimeout(() => api.close(), 180);
    });
    return b;
  }));
  radioGroupKeys(group);
  api = openSheet({ title: 'Appearance', body: group, initialFocus: '[aria-checked="true"]' });
}

function languageSheet() {
  openSheet({
    title: 'Language',
    sub: 'The app is in English for now',
    body: h('div', { class: 'nav-list' },
      navRow({ title: 'English', media: h('span', { class: 'row__icon', html: icon('check') }), trail: null, onClick: () => {} }),
      navRow({ title: 'हिंदी', sub: 'Coming soon for parents. Carers can already use it.', trail: null, onClick: () => comingSoon('Hindi for parents') }),
      navRow({ title: 'मराठी', sub: 'Coming soon', trail: null, onClick: () => comingSoon('Marathi') })),
  });
}

/** PR06 · the safe choice is the main button; sign out is red text. Data stays. */
function signOutDialog() {
  let api;
  const body = h('div', { class: 'dialog__stack' },
    button({ label: 'Stay signed in', onClick: () => api.close() }),
    h('button', { type: 'button', class: 'link link--danger link--center', text: 'Sign out', onClick: () => {
      api.close({ keepFocus: true });
      store.set((d) => { d.session.signedIn = false; d.served = null; d.ui = {}; });
      navigate('welcome', { reset: true });
      toast('Signed out. Your data stays saved.', { iconName: 'success' });
    } }));
  api = openSheet({ kind: 'dialog', title: 'Sign out?', sub: 'Your data stays saved. Sign in again any time with the same number.', body, initialFocus: '.btn--primary' });
}

/* ==========================================================================
   PR02 · People who feed him  ·  L03 · Invite (sheet)
   ========================================================================== */
export function peopleScreen() {
  const s = store.get();
  const rows = s.carers.map((c) => {
    const status = c.status === 'joined'
      ? h('span', { class: 'status status--ok' }, h('span', { class: 'contents', html: icon('success') }), h('span', { text: 'Joined' }))
      : h('span', { class: 'tag tag--busy', text: 'Invite not opened yet' });
    const more = iconButton({ iconName: 'more', label: `More for ${c.name}`, onClick: () => menuSheet({
      title: c.name,
      items: [
        ...(c.status === 'pending' ? [{ label: 'Resend invite', icon: 'refresh', onClick: () => resend(c) }] : [{ label: 'Open their view', icon: 'phone', onClick: () => openCarer(c) }]),
        { label: `Remove ${c.name}`, icon: 'trash', danger: true, onClick: () => removeCarer(c) },
      ],
    }) });
    return h('div', { class: 'person' },
      h('span', { class: `avatar avatar--${c.status === 'joined' ? 'wheat' : 'leaf'}`, text: c.name.charAt(0).toUpperCase(), 'aria-hidden': 'true' }),
      h('div', { class: 'person__text' }, h('p', { class: 'person__name', text: c.name }), h('p', { class: 'row__meta', text: c.relation }), status,
        // Shown to the parent, never to the helper (e.g. "This phone has no Nepali voice. Playing Hindi.").
        c.voiceNote ? h('p', { class: 'person__voice', text: c.voiceNote }) : null),
      more);
  });
  const pending = s.carers.filter((c) => c.status === 'pending');
  const body = [h('h1', { class: 'screen-title t-title-l', text: 'People who feed him' })];
  if (rows.length) body.push(h('div', { class: 'card people block-gap' }, rows));
  else body.push(h('div', { class: 'state' }, h('span', { class: 'state__icon state__icon--neutral', html: icon('people') }), h('h2', { class: 't-title-m state__title', text: 'Just you for now' }), h('p', { class: 'state__body', text: 'Invite Aai, a helper or anyone who feeds him. They see what to give, in their language.' })));
  pending.forEach((c) => body.push(h('button', { type: 'button', class: 'link block-gap', onClick: () => resend(c) }, h('span', { class: 'contents', html: icon('refresh') }), h('span', { text: `Resend ${c.name}’s invite` }))));
  const { el } = shell({
    label: 'People who feed him',
    bar: topbar({ onBack: () => back() }),
    body,
    footer: [button({ label: 'Invite someone', iconName: 'share', onClick: () => inviteSheet() })],
  });
  return { el, onLeave: el.cleanup };
}

function resend(c) {
  store.ui({ invite: c.id });
  navigate('whatsapp');
}
function openCarer(c) { store.ui({ invite: c.id, carerLang: c.lang || 'hi' }); navigate('carer-lang'); }

function removeCarer(c) {
  confirmDialog({
    title: `Remove ${c.name}?`,
    body: `${c.name} will no longer see ${kid()}’s meals. Meals ${c.name} added stay in Memory.`,
    confirmLabel: 'Remove',
    onConfirm: () => { store.set((d) => { d.carers = d.carers.filter((x) => x.id !== c.id); }); refresh(); toast(`Removed ${c.name}`, { iconName: 'success' }); },
  });
}

export function inviteSheet() {
  const s = store.get();
  let relation = 'Grandmother';
  let api;
  const preview = h('div', { class: 'preview' },
    h('h3', { class: 't-label', text: 'They will see' }),
    h('ul', { class: 'preview__list' }, ['What to give, in their language', 'Your house rules and his allergies', 'One tap to say how he ate'].map((t) => h('li', {}, h('span', { class: 'contents', html: icon('check') }), h('span', { text: t })))));
  const mine = !s.parentName ? textField({ label: 'Your name', placeholder: 'Shown in the invite', autocapitalize: 'words' }) : null;
  const theirs = textField({ label: 'Their name', placeholder: 'e.g. Aai', autocapitalize: 'words' });
  const rel = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'They are his' });
  const paint = () => rel.replaceChildren(...RELATIONS.map((r) => chip({ label: r, role: 'radio', checked: r === relation, onToggle: () => { relation = r; paint(); } })));
  paint();
  radioGroupKeys(rel);
  const share = button({ label: 'Share invite on WhatsApp', iconName: 'share', onClick: () => {
    const n = theirs.input.value.trim();
    const me = mine ? mine.input.value.trim() : s.parentName;
    let ok = true;
    if (mine && me.length < 2) { mine.setError('Please type your name, so they know who invited them.'); ok = false; }
    if (n.length < 2) { theirs.setError('Please type at least 2 letters.'); ok = false; }
    else {
      const dup = store.get().carers.find((c) => c.name.toLowerCase() === n.toLowerCase());
      if (dup) {
        theirs.setError(dup.status === 'joined'
          ? `${dup.name} has already joined. If this is someone else, add a surname or nickname.`
          : `${dup.name} is already invited. Use Resend in the list instead.`);
        ok = false;
      }
    }
    if (!ok) return;
    const id = slug(n);
    store.set((d) => {
      if (mine) d.parentName = capFirst(me);
      d.carers.push({ id, name: capFirst(n), relation, status: 'pending', lang: 'hi' });
    });
    api.close({ keepFocus: true });
    store.ui({ invite: id });
    navigate('whatsapp');
  } });
  api = openSheet({
    title: 'Invite someone who feeds him',
    body: h('div', { class: 'stack-16' }, preview, mine, theirs, h('div', {}, h('h3', { class: 't-label sheet-label sheet-label--first', text: 'They are his' }), rel)),
    foot: share,
    initialFocus: 'input',
  });
}

/* ==========================================================================
   L04 · WhatsApp invite (outside the app, on the carer's phone)
   ========================================================================== */
export function whatsappScreen() {
  const s = store.get();
  const c = s.carers.find((x) => x.id === s.ui.invite) || s.carers[0];
  const parent = s.parentName || 'Your family';
  const child = childName() || 'your child';
  const linkName = (c?.name || 'aai').toLowerCase().replace(/[^a-z]/g, '') || 'carer';
  const time = new Date();
  const hh = time.getHours() % 12 || 12;
  const stamp = `${hh}:${String(time.getMinutes()).padStart(2, '0')} ${time.getHours() >= 12 ? 'pm' : 'am'}`;
  const open = () => { store.ui({ invite: c?.id, carerLang: c?.lang || 'hi' }); navigate('carer-lang'); };
  const header = h('header', { class: 'wa__bar' },
    h('button', { type: 'button', class: 'wa__back', 'aria-label': 'Back to Little Plate', html: icon('back'), onClick: () => back() }),
    h('span', { class: 'wa__avatar', text: parent.charAt(0).toUpperCase(), 'aria-hidden': 'true' }),
    h('span', { class: 'wa__who' }, h('span', { class: 'wa__name', text: parent }), h('span', { class: 'wa__status', text: 'online' })));
  const bubble = h('div', { class: 'wa__bubble' },
    h('button', { type: 'button', class: 'wa__preview', onClick: open, 'aria-label': `Open ${child}’s meals on Little Plate` },
      h('span', { class: 'wa__icon', html: logo({ size: 40, label: '' }) }),
      h('span', { class: 'wa__ptext' }, h('span', { class: 'wa__ptitle', text: `${capFirst(child)}’s meals · little plate` }), h('span', { class: 'wa__pdomain', text: 'littleplate.app' }))),
    h('p', { class: 'wa__msg', text: `${parent} invited you to help with ${child}’s meals. Open to see what to give him. No sign-up needed.` }),
    h('button', { type: 'button', class: 'wa__link', text: `littleplate.app/join/${linkName}`, onClick: open }),
    h('span', { class: 'wa__time', text: stamp }));
  const el = h('section', { class: 'screen wa', 'aria-label': `WhatsApp chat on ${c?.name || 'their'} phone` },
    header,
    h('div', { class: 'wa__chat' }, h('p', { class: 'wa__hint', text: `On ${c?.name || 'their'}’s phone` }), bubble),
    h('div', { class: 'wa__input', 'aria-hidden': 'true' }, h('span', { class: 'wa__field', text: 'Message' }), h('span', { class: 'wa__mic', html: icon('mic') })));
  return { el };
}
