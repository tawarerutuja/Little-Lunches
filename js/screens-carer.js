// Flow R4 · the carer view (C01–C04). Opens from the WhatsApp link: no sign-up,
// no onboarding. Carer text is 20 px Mukta (LP/Carer/*). Hindi and English;
// Marathi is shown as "coming soon".

import { icon, logo } from './icons.js';
import { h, button, toast, comingSoon, phulkaEl, outcomeTiles, radioGroupKeys, thumb, sim } from './components.js';
import { navigate } from './router.js';
import { store, childName, findFood, backupIds, unsafeAllergens, milkAvoid } from './store.js';
import { CARER_LANGS, CARER_TEXT, NAMES_HI, FOOD_HI, ALLERGY_HI, MEALS, MILK_PARTS, photoUrl, thumbUrl } from './data.js';
import { todayKey, mealNow, recipe, readyIdeas, planDay, logMeal, fmtTime, allergyName, recipeSafe } from './meals.js';

const lang = () => (store.get().ui.carerLang === 'en' ? 'en' : 'hi');
const T = () => CARER_TEXT[lang()];
const carer = () => { const s = store.get(); return s.carers.find((c) => c.id === s.ui.invite) || s.carers[0] || { id: 'aai', name: 'Aai' }; };
const inScript = (name) => (lang() === 'hi' ? NAMES_HI[name] || name : name);
const parentName = () => inScript(store.get().parentName || (lang() === 'hi' ? 'परिवार' : 'The family'));
const kidName = () => inScript(childName() || (lang() === 'hi' ? 'बच्चे' : 'your child'));

function foodName(id, fallback = '') {
  if (!id) return fallback;
  if (lang() === 'hi') return FOOD_HI[id] || findFood(id)?.name || fallback;
  return (findFood(id)?.name || fallback).toLowerCase();
}
/** His first backup that is still safe (allergies can change after setup). */
function safeBackupId(s) { return backupIds(s).find((id) => { const f = findFood(id); return f && !unsafeAllergens(f, s).length; }) || null; }

function mealText(m) { const x = MEALS.find((y) => y.id === m); return lang() === 'hi' ? x.hi : x.en; }

/** What the parent picked for this meal: served → planned → best idea. */
function chosenDish() {
  const s = store.get();
  const m = s.served?.date === todayKey() ? s.served.meal : mealNow();
  // Served → planned → best idea; anything that is no longer safe for him is skipped.
  const candidates = [(s.served?.date === todayKey() && s.served.recipe), planDay(todayKey(), s)?.meals?.[m], ...readyIdeas(m, s).map((r) => r.id)];
  const rid = candidates.find((id) => id && recipeSafe(recipe(id), s));
  return { meal: m, r: recipe(rid) };
}

function carerShell(cls, label, nodes, footer) {
  return h('section', { class: `screen carer ${cls}`, 'aria-label': label, lang: lang() === 'hi' ? 'hi' : 'en' },
    h('div', { class: 'screen__scroll' }, nodes),
    footer ? h('div', { class: 'screen__footer' }, footer) : null);
}

/* ==========================================================================
   C01 · Choose language
   ========================================================================== */
export function carerLangScreen() {
  const s = store.get();
  let pick = s.ui.carerLang || carer().lang || 'hi';
  const tiles = h('div', { class: 'lang-list', role: 'radiogroup', 'aria-label': 'Choose language' });
  const cont = button({ label: CARER_TEXT[pick].cont, cls: 'btn--carer', onClick: () => go() });
  const paint = () => {
    tiles.replaceChildren(...CARER_LANGS.map((l) => {
      const b = h('button', { type: 'button', class: 'lang-tile', role: 'radio', 'aria-checked': String(pick === l.id), 'aria-disabled': l.ready ? null : 'true', lang: l.id },
        h('span', { class: 'lang-tile__text' }, h('span', { class: 'lang-tile__name', text: l.name }), l.sub ? h('span', { class: 'lang-tile__sub', text: l.sub }) : null),
        l.ready ? h('span', { class: 'radio-mark', html: icon('check'), 'aria-hidden': 'true' }) : h('span', { class: 'tag tag--wip', text: 'Coming soon' }));
      b.addEventListener('click', () => {
        if (!l.ready) { comingSoon('Marathi'); return; }
        pick = l.id; cont.setLabel(CARER_TEXT[pick].cont); paint();
        tiles.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
      });
      return b;
    }));
    radioGroupKeys(tiles);
  };
  paint();
  function go() {
    store.ui({ carerLang: pick });
    store.set((d) => { const c = d.carers.find((x) => x.id === carer().id); if (c) { c.status = 'joined'; c.lang = pick; } });
    navigate('carer-give', { replace: true });
  }
  const parent = store.get().parentName || 'Your family';
  const el = carerShell('carer-lang', 'Choose language', [
    h('div', { class: 'carer-invite' },
      h('span', { class: 'carer-invite__logo', html: logo({ size: 48, label: 'Little Plate' }) }),
      h('p', { class: 'carer-invite__text', text: `${parent} invited you to help with ${childName() || 'your child'}’s meals` })),
    h('h1', { class: 'carer-title', text: 'भाषा चुनें · Choose language' }),
    tiles,
  ], [cont]);
  return { el };
}

/* ==========================================================================
   C02 · What to give
   ========================================================================== */
export function carerGiveScreen() {
  const s = store.get();
  const t = T();
  const { meal, r } = chosenDish();
  const c = carer();
  const backupId = safeBackupId(s);
  // Carers cook with ghee, curd and paneer every day: for a milk allergy, name them, never just "milk".
  // Exactly what the parent said about curd, paneer and ghee: what to avoid, and what is fine.
  const milkLine = (() => {
    if (!s.allergies.includes('milk')) return '';
    const avoid = MILK_PARTS.filter((p) => milkAvoid(s).includes(p.id));
    const fine = MILK_PARTS.filter((p) => !milkAvoid(s).includes(p.id));
    const hi = lang() === 'hi';
    const join = (l) => (hi ? l.map((p) => p.hi) : l.map((p) => p.name.toLowerCase())).reduce((a, w, i, arr) => (i === 0 ? w : `${a}${i === arr.length - 1 ? (hi ? ' और ' : ' or ') : ', '}${w}`), '');
    const joinAnd = (l) => (hi ? l.map((p) => p.hi) : l.map((p) => p.name.toLowerCase())).reduce((a, w, i, arr) => (i === 0 ? w : `${a}${i === arr.length - 1 ? (hi ? ' और ' : ' and ') : ', '}${w}`), '');
    if (hi) return `दूध की एलर्जी: ${avoid.length ? `${join(avoid)} भी नहीं।` : ''}${fine.length ? ` ${joinAnd(fine)} ठीक ${fine.length > 1 ? 'हैं' : 'है'}।` : ''}`.trim();
    const fineTxt = fine.length ? ` ${joinAnd(fine).replace(/^./, (c) => c.toUpperCase())} ${fine.length > 1 ? 'are' : 'is'} fine.` : '';
    return `Milk allergy:${avoid.length ? ` no ${join(avoid)} either.` : ''}${fineTxt}`;
  })();
  const allergyList = s.allergies.map((a) => (lang() === 'hi' ? ALLERGY_HI[a] || allergyName(a, s) : allergyName(a, s).toLowerCase()));
  // The house rules she actually set (it used to say "sugar or spice" even when only salt was on).
  const rulesText = lang() === 'hi'
    ? (s.rules.sugar && s.rules.salt ? 'ऊपर से नमक, चीनी या मसाला नहीं' : s.rules.sugar ? 'ऊपर से चीनी नहीं' : 'ऊपर से नमक या मसाला नहीं')
    : (s.rules.sugar && s.rules.salt ? 'No added salt, sugar or spice' : s.rules.sugar ? 'No added sugar' : 'No added salt or spice');
  const dish = r ? (lang() === 'hi' ? r.hi || r.name : r.name) : null;

  const save = (o) => {
    if (o === 'not') { navigate('carer-not', { replace: true }); return; }
    // Saving failed: say so in her language, keep her tap, one button to try again.
    if (sim.on('save')) { toast(t.saveFail, { iconName: 'error', tone: 'error', action: { label: t.retry, onClick: () => save(o) } }); return; }
    store.set((d) => { logMeal(d, { meal, food: r?.food || null, name: r?.name || 'Meal', outcome: o, by: c.name, recipe: r?.id || null, time: fmtTime() }); if (d.served?.meal === meal) d.served = null; });
    store.ui({ carerDone: { kind: 'outcome', outcome: o, meal } });
    navigate('carer-saved', { replace: true });
  };

  const nodes = [
    h('p', { class: 'carer-hello', text: t.hello(inScript(c.name)) }),
    h('h1', { class: 'carer-title', text: t.mealOf(kidName(), mealText(meal)) }),
  ];
  if (r) {
    if (r.photo) nodes.push(h('img', { class: 'carer-photo', src: photoUrl(r.photo), alt: dish, width: '362', height: '170' }));
    nodes.push(h('h2', { class: 'carer-dish', text: dish }));
    nodes.push(h('p', { class: 'carer-body', text: t.picked(parentName(), (r.tags || []).includes('finger')) }));
  } else {
    nodes.push(h('p', { class: 'carer-body', text: t.nothingPlanned }));
  }
  const notes = h('div', { class: 'carer-notes' });
  if (backupId) notes.append(h('p', { class: 'note carer-note' }, h('span', { class: 'contents', html: icon('backup') }), h('span', { text: t.backup(foodName(backupId)) })));
  if (allergyList.length) notes.append(h('p', { class: 'note note--error carer-note', role: 'note' }, h('span', { class: 'contents', html: icon('allergy') }), h('span', {}, h('span', { text: t.allergy(allergyList.join(t.or)) }),
    milkLine ? h('span', { class: 'carer-note__more', text: milkLine }) : null)));
  if (s.rules.sugar || s.rules.salt) notes.append(h('p', { class: 'note note--sand carer-note' }, h('span', { class: 'contents', html: icon('info') }), h('span', { text: rulesText })));
  nodes.push(notes);
  nodes.push(h('p', { class: 'carer-body carer-after', text: t.after }));
  nodes.push(outcomeTiles({ size: 'carer', labels: { well: t.well, some: t.some, not: t.not }, groupLabel: t.after, onPick: save }));

  return { el: carerShell('carer-give', 'What to give', nodes) };
}

/* ==========================================================================
   C03 · He did not eat
   ========================================================================== */
export function carerNotScreen() {
  const s = store.get();
  const t = T();
  const { meal, r } = chosenDish();
  const c = carer();
  const bId = safeBackupId(s);
  const bf = foodName(bId, lang() === 'hi' ? 'उसका बैकअप' : 'his backup');
  const bFood = findFood(bId);
  const done = (kind) => {
    store.set((d) => { logMeal(d, { meal, food: r?.food || null, name: r?.name || 'Meal', outcome: 'not', by: c.name, recipe: r?.id || null, note: kind === 'backup' ? `had ${findFood(bId)?.name.toLowerCase() || 'his backup'} instead` : 'will try again in 20 min', time: fmtTime() }); });
    store.ui({ carerDone: { kind, meal } });
    navigate('carer-saved', { replace: true });
  };
  const nodes = [
    h('div', { class: 'state state--carer' },
      phulkaEl({ mood: 'calm', size: 128, animate: true }),
      h('h1', { class: 'carer-title carer-title--center', text: t.okay }),
      h('p', { class: 'carer-body carer-body--center', text: t.tryLater(bf) })),
    h('section', { class: 'card carer-choice' },
      h('div', { class: 'carer-choice__head' },
        thumb(bFood?.photo ? thumbUrl(bFood.photo) : null, 'carer-choice__img'),
        h('div', {}, h('h2', { class: 'carer-choice__title', text: t.giveTitle(bf) }), h('p', { class: 'carer-choice__sub', text: store.get().child.gender === 'girl' ? t.giveSub.replace('खाता', 'खाती') : t.giveSub }))),
      button({ label: t.gave(bf), cls: 'btn--carer', onClick: () => done('backup') })),
    h('section', { class: 'card carer-choice' },
      h('div', { class: 'carer-choice__head' },
        h('span', { class: 'icon-tile icon-tile--dinner carer-choice__img', html: icon('clock'), 'aria-hidden': 'true' }),
        h('div', {}, h('h2', { class: 'carer-choice__title', text: t.waitTitle }), h('p', { class: 'carer-choice__sub', text: t.waitSub }))),
      button({ label: t.remind, variant: 'secondary', cls: 'btn--carer', onClick: () => done('remind') })),
  ];
  return { el: carerShell('carer-not', 'He did not eat', nodes) };
}

/* ==========================================================================
   C04 · Saved → closes by itself and returns to the parent's phone
   ========================================================================== */
export function carerSavedScreen() {
  const s = store.get();
  const t = T();
  const info = s.ui.carerDone || { kind: 'outcome', outcome: 'some', meal: mealNow() };
  const c = carer();
  let text;
  if (info.kind === 'backup') text = t.sawBackup(parentName(), kidName(), foodName(safeBackupId(s), lang() === 'hi' ? 'बैकअप' : 'his backup'));
  else if (info.kind === 'remind') text = t.sawRemind;
  else text = t.saw(parentName(), kidName(), mealText(info.meal), t[info.outcome]);
  const nodes = [h('div', { class: 'state state--carer state--center' },
    phulkaEl({ mood: 'saved', size: 160, animate: true }),
    h('h1', { class: 'carer-title carer-title--center', text: t.thanks }),
    h('p', { class: 'carer-body carer-body--center', text }),
    h('p', { class: 'carer-close', text: t.closes }))];
  let timer;
  return {
    el: carerShell('carer-saved', 'Saved', nodes),
    onEnter() {
      timer = setTimeout(() => {
        // Back on the parent's phone: Today shows what the carer added.
        const mealName = MEALS.find((m) => m.id === info.meal)?.name.toLowerCase();
        navigate('today', { reset: true, transition: 'fade' });
        const backupName = (findFood(safeBackupId(store.get()))?.name || 'his backup').toLowerCase();
        const msg = info.kind === 'backup' ? `${c.name} gave ${backupName} instead of ${mealName}`
          : info.kind === 'remind' ? `${c.name} will offer ${mealName} again in 20 minutes`
            : `${c.name} added ${mealName}: ${CARER_TEXT.en[info.outcome].toLowerCase()}`;
        toast(msg, { iconName: 'people' });
      }, 3200);
    },
    onLeave() { clearTimeout(timer); },
    autofocus() {},
  };
}
