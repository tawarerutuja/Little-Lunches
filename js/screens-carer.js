// Flow R4 · the carer view (C01–C04). Opens from the WhatsApp link: no sign-up,
// no onboarding. Carer text is 20 px Mukta (LP/Carer/*). Hindi and English;
// Marathi is shown as "coming soon".

import { icon, logo } from './icons.js';
import {
  h, button, toast, comingSoon, phulkaEl, outcomeTiles, radioGroupKeys, thumb, sim,
  listenButton, micButton, textField, reminder, reminderDone, askPermission, haptic,
} from './components.js';
import { navigate } from './router.js';
import { store, childName, findFood, backupIds, unsafeAllergens, milkAvoid } from './store.js';
import { CARER_LANGS, CARER_TEXT, NAMES_HI, FOOD_HI, ALLERGY_HI, MEALS, MILK_PARTS, AHEAD_HI, photoUrl, thumbUrl } from './data.js';
import { todayKey, mealNow, recipe, readyIdeas, planDay, logMeal, fmtTime, allergyName, recipeSafe, prepPlan, setPrepDone, markStock } from './meals.js';
import { say, stopSpeaking, SPEECH_LANG, LANG_NAME } from './voice.js';

// Screen text: English, or Hindi (Nepali uses the Hindi text until it is translated; it is still SPOKEN in Nepali when the phone can).
const lang = () => (store.get().ui.carerLang === 'en' ? 'en' : 'hi');
/** The language she picked, for the voice: 'hi' | 'en' | 'ne'. */
const voiceLang = () => store.get().ui.carerLang || 'hi';
/** No voice for her language on this phone: tell the PARENT (People screen), never the helper. */
const onFallback = ({ wanted, used }) => {
  const msg = `This phone has no ${LANG_NAME[wanted]} voice. Playing ${LANG_NAME[used]}.`;
  store.set((d) => { const x = d.carers.find((y) => y.id === carer().id); if (x) x.voiceNote = msg; });
};
const seen = (key) => !!store.get().carerSeen?.[carer().id]?.[key];
const markSeen = (key) => store.set((d) => { d.carerSeen = d.carerSeen || {}; (d.carerSeen[carer().id] ||= {})[key] = true; });
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
  const textFor = (id) => CARER_TEXT[id === 'en' ? 'en' : 'hi'];
  const cont = button({ label: textFor(pick).cont, cls: 'btn--carer', onClick: () => go() });
  const paint = () => {
    tiles.replaceChildren(...CARER_LANGS.map((l) => {
      const b = h('button', { type: 'button', class: 'lang-tile', role: 'radio', 'aria-checked': String(pick === l.id), 'aria-disabled': l.ready ? null : 'true', lang: l.id },
        h('span', { class: 'lang-tile__text' }, h('span', { class: 'lang-tile__name', text: l.name }), l.sub ? h('span', { class: 'lang-tile__sub', text: l.sub }) : null),
        l.ready ? h('span', { class: 'radio-mark', html: icon('check'), 'aria-hidden': 'true' }) : h('span', { class: 'tag tag--wip', text: 'Coming soon' }));
      b.addEventListener('click', () => {
        if (!l.ready) { comingSoon('Marathi'); return; }
        pick = l.id; cont.setLabel(textFor(pick).cont); paint();
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

  // Every block that Listen reads gets its element, so the line being read is highlighted.
  const lines = [];
  const read = (el, text) => { lines.push({ el, text }); return el; };
  const title = h('h1', { class: 'carer-title', text: t.mealOf(kidName(), mealText(meal)) });
  const nodes = [h('p', { class: 'carer-hello', text: t.hello(inScript(c.name)) }), title];
  const listen = listenButton({ lang: voiceLang(), label: t.listen, stopLabel: t.stop, getLines: () => lines, onFallback, cls: 'carer-listen' });
  nodes.push(listen);
  if (r) {
    // A big picture for every meal: the photo, or the plate drawing for a dish without one.
    nodes.push(r.photo ? h('img', { class: 'carer-photo', src: photoUrl(r.photo), alt: dish, width: '362', height: '170' })
      : h('div', { class: 'carer-photo carer-photo--art', html: icon('illoPlate'), 'aria-hidden': 'true' }));
    const what = h('div', { class: 'carer-what' },
      h('h2', { class: 'carer-dish', text: dish }),
      h('p', { class: 'carer-body', text: t.picked(parentName(), (r.tags || []).includes('finger')) }));
    nodes.push(read(what, `${t.mealOf(kidName(), mealText(meal))}: ${dish}. ${t.picked(parentName(), (r.tags || []).includes('finger'))}`));
  } else {
    nodes.push(read(h('p', { class: 'carer-body', text: t.nothingPlanned }), `${t.mealOf(kidName(), mealText(meal))}. ${t.nothingPlanned}`));
  }
  const notes = h('div', { class: 'carer-notes' });
  if (backupId) notes.append(read(h('p', { class: 'note carer-note' }, h('span', { class: 'contents', html: icon('backup') }), h('span', { text: t.backup(foodName(backupId)) })), t.backup(foodName(backupId))));
  if (allergyList.length) notes.append(read(h('p', { class: 'note note--error carer-note', role: 'note' }, h('span', { class: 'contents', html: icon('allergy') }), h('span', {}, h('span', { text: t.allergy(allergyList.join(t.or)) }),
    milkLine ? h('span', { class: 'carer-note__more', text: milkLine }) : null)), `${t.allergy(allergyList.join(t.or))}. ${milkLine}`));
  if (s.rules.sugar || s.rules.salt) notes.append(read(h('p', { class: 'note note--sand carer-note' }, h('span', { class: 'contents', html: icon('info') }), h('span', { text: rulesText })), rulesText));
  nodes.push(notes);
  // Today's and tomorrow's prep, in her language, as Reminders (Listen reads them too).
  const prep = helperPrep(t);
  if (prep) { nodes.push(prep.el); prep.lines.forEach((l) => lines.push(l)); }
  nodes.push(h('p', { class: 'carer-body carer-after', text: t.after }));
  const labels = { well: t.well, some: t.some, not: t.not };
  // The faces speak their label when pressed, then save.
  const tiles = outcomeTiles({ size: 'carer', labels, groupLabel: t.after, onPick: (o) => { say(labels[o], voiceLang(), { onFallback }); save(o); } });
  nodes.push(read(tiles, t.outcomesSpoken));
  nodes.push(tellBlock({ meal, t, c, tiles }));

  return {
    el: carerShell('carer-give', 'What to give', nodes),
    onEnter() {
      // First time only: a short spoken welcome. After that, only when she taps Listen.
      if (!seen('welcome')) { markSeen('welcome'); setTimeout(() => say(t.welcome(kidName()), voiceLang(), { onFallback }), 700); }
    },
    onLeave() { listen.reset?.(); },
  };
}

/* ---------- Helper prep (7c): Reminder component, in her language ---------- */
function helperPrep(t) {
  const p = prepPlan(store.get());
  if (!p.all.length) return null;
  const hi = lang() === 'hi';
  const open = p.all.filter((x) => !x.done);
  if (!open.length) return { el: h('div', { class: 'carer-prep' }, reminderDone(t.prepDone)), lines: [] };
  const lines = [];
  const els = open.map((x) => {
    const dish = hi ? (x.recipe.hi || x.recipe.name) : x.recipe.name;
    const step = hi ? (AHEAD_HI[x.recipe.id] || x.text) : `${x.text}.`;
    const title = x.date === p.tomorrowKey ? t.prepTomorrow : t.prepToday;
    const el = reminder({
      title, line: `${dish} · ${step}`, meta: hi ? `${x.mins} मिनट` : `${x.mins} min`, doneLabel: t.done,
      onDone: () => {
        store.set((d) => (x.stock ? markStock(d, x.stock, true) : setPrepDone(d, [x.key], true)));
        el.replaceWith(reminderDone(`${t.done} · ${dish}`));
      },
    });
    lines.push({ el, text: `${title}. ${dish}. ${step}` });
    return el;
  });
  return { el: h('div', { class: 'carer-prep' }, els), lines };
}

/* ---------- Tell the parent (7b): big mic first, read-back, one tick; or a voice note ---------- */
function tellBlock({ meal, t, c, tiles }) {
  const vl = voiceLang();
  const parent = parentName();
  const stage = h('div', { class: 'carer-tell__stage', 'aria-live': 'polite' });
  let phase = 'idle';

  const send = ({ text = '', voice = null, secs = 0 }) => {
    store.set((d) => {
      d.carerNotes = d.carerNotes || {};
      (d.carerNotes[`${todayKey()}|${meal}`] ||= []).push({ by: c.name, text, voice, secs, time: fmtTime() });
    });
    haptic(15);
    phase = 'sent';
    stage.replaceChildren(reminderDone(t.sent(parent)));
    say(t.sent(parent), vl, { onFallback });
  };
  // Mic blocked or no voice support: say so aloud and point at the big outcome buttons.
  const micOff = () => {
    phase = 'idle';
    paintIdle(t.micBlocked);
    say(t.micBlocked, vl, { onFallback });
    tiles.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    tiles.classList.add('is-pointed');
    setTimeout(() => tiles.classList.remove('is-pointed'), 4000);
  };

  // The text box is the second option (behind "Or type"); the mic fills it.
  const field = textField({ placeholder: t.typePh, onEnter: () => typed() });
  field.input.setAttribute('aria-label', t.orType);
  const typed = () => { const v = field.input.value.trim(); if (v.length >= 2) send({ text: v }); };
  const typeRow = h('div', { class: 'carer-tell__type', hidden: true }, field, button({ label: t.send, cls: 'btn--carer', onClick: typed }));
  const orType = h('button', { type: 'button', class: 'link link--center carer-tell__or', text: t.orType });
  orType.addEventListener('click', () => { typeRow.hidden = false; orType.hidden = true; field.input.focus(); });

  const mic = micButton({
    input: field.input, sample: t.sample, label: t.speak, stopLabel: t.stop, lang: SPEECH_LANG[vl] || 'hi-IN', size: 'xl',
    onState: (st) => { if (st === 'listening') { phase = 'listening'; stopSpeaking(); paintListening(); } else if (phase === 'listening') { phase = 'idle'; paintIdle(); } },
    onResult: (text) => { if (text && text.trim()) readBack(text.trim()); },
    onBlocked: micOff,
  });
  // First time: a soft (pulsing) ring and a finger pointing at the mic, and the spoken hint.
  const hint = h('span', { class: 'mic-hint', html: icon('pointer'), 'aria-hidden': 'true' });
  const micWrap = h('div', { class: 'mic-wrap' + (seen('micHint') ? '' : ' is-hinting') }, mic, seen('micHint') ? null : hint);
  mic.addEventListener('click', () => { if (!seen('micHint')) { markSeen('micHint'); micWrap.classList.remove('is-hinting'); hint.remove(); } }, { capture: true });
  if (!seen('micHint') && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      // Wait for the welcome (or Listen) to finish so the two never talk over each other.
      const trySay = (n) => { if (window.speechSynthesis?.speaking && n < 8) setTimeout(() => trySay(n + 1), 1200); else if (!seen('micHint')) say(t.micHint, vl, { onFallback }); };
      setTimeout(() => trySay(0), 600);
    }, { threshold: 0.6 });
    setTimeout(() => io.observe(micWrap), 0);
  }

  const recBtn = button({ label: t.record, variant: 'secondary', iconName: 'record', cls: 'btn--carer carer-tell__rec', onClick: () => askPermission('mic', { onAllow: startRec, onDeny: micOff }) });

  function paintIdle(msg = '') {
    stage.replaceChildren(...[
      micWrap, h('p', { class: 'carer-tell__cap', text: t.speak }),
      msg ? h('p', { class: 'carer-tell__msg', role: 'status', text: msg }) : null,
      recBtn, orType, typeRow].filter(Boolean));
  }
  function paintListening() {
    stage.replaceChildren(micWrap,
      h('p', { class: 'carer-tell__listening', text: t.listening }),
      h('div', { class: 'soundbar', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map(() => h('span'))));
  }
  function readBack(text) {
    phase = 'readback';
    const tick = h('button', { type: 'button', class: 'big-tick', 'aria-label': t.send, html: icon('check') });
    tick.addEventListener('click', () => send({ text }));
    const again = h('button', { type: 'button', class: 'link link--center', text: t.again });
    again.addEventListener('click', () => { phase = 'idle'; paintIdle(); mic.click(); });
    stage.replaceChildren(
      h('p', { class: 'carer-tell__said', text: t.youSaid(text) }),
      h('p', { class: 'carer-tell__cap', text: t.tapTick }), tick, again);
    say(`${t.youSaid(text).replace(/[“”]/g, '')}. ${t.tapTickSpoken}`, vl, { onFallback });
    tick.focus({ preventScroll: true });
  }

  // Voice note: MediaRecorder, max 30 s, kept as a data URL; the parent plays it in Memory.
  let recorder = null; let stream = null; let timer = null; let secs = 0;
  async function startRec() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { micOff(); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { micOff(); return; }
    stopSpeaking();
    const chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      clearInterval(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      const fr = new FileReader();
      fr.onload = () => showClip(fr.result, Math.max(1, secs));
      fr.readAsDataURL(blob);
    };
    recorder.start();
    secs = 0;
    phase = 'recording';
    const clock = h('p', { class: 'carer-tell__clock', text: '0:00 / 0:30' });
    const stopBtn = h('button', { type: 'button', class: 'big-stop', 'aria-label': t.stopRec, html: icon('stop') });
    stopBtn.addEventListener('click', () => { if (recorder?.state === 'recording') recorder.stop(); });
    stage.replaceChildren(stopBtn, h('p', { class: 'carer-tell__listening', text: t.recording }), clock);
    stopBtn.focus({ preventScroll: true });
    timer = setInterval(() => {
      secs += 1;
      clock.textContent = `0:${String(secs).padStart(2, '0')} / 0:30`;
      if (secs >= 30 && recorder?.state === 'recording') recorder.stop();
    }, 1000);
  }
  function showClip(url, s) {
    phase = 'readback';
    let audio = null;
    const play = h('button', { type: 'button', class: 'voice-play voice-play--carer', 'aria-label': `${t.play} · ${t.yourNote}` },
      h('span', { class: 'contents', html: icon('play') }), h('span', { text: `${t.yourNote} · 0:${String(s).padStart(2, '0')}` }));
    play.addEventListener('click', () => { audio = audio || new Audio(url); audio.currentTime = 0; audio.play().catch(() => {}); });
    const tick = h('button', { type: 'button', class: 'big-tick', 'aria-label': t.send, html: icon('check') });
    tick.addEventListener('click', () => send({ voice: url, secs: s }));
    const again = h('button', { type: 'button', class: 'link link--center', text: t.again });
    again.addEventListener('click', () => askPermission('mic', { onAllow: startRec, onDeny: micOff }));
    stage.replaceChildren(play, h('p', { class: 'carer-tell__cap', text: t.tapTick }), tick, again);
    say(t.tapTickSpoken, vl, { onFallback });
  }

  paintIdle();
  return h('section', { class: 'card carer-tell', 'aria-labelledby': 'tell-t' },
    h('h2', { class: 'carer-tell__title', id: 'tell-t', text: t.tell(parent) }), stage);
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
