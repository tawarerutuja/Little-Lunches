// DOM builders for every reusable UI piece. Each builder returns a node
// (or a small controller). Styling lives in css/components.css.

import { icon, logo } from './icons.js';
import { DEMO } from './data.js';
import { phulka } from './phulka.js';
import { navigate, currentRoute } from './router.js';
import { store } from './store.js';
import { speak, stopSpeaking } from './voice.js';

/* --------------------------------------------------------------------------
   Tiny element helper
   -------------------------------------------------------------------------- */
/**
 * He or she: the app's copy is written with he/him/his (as in Figma). When the
 * parent says the child is a girl, every visible string and accessible name is
 * switched to she/her here, in one place.
 */
const PRONOUNS = { he: 'she', He: 'She', him: 'her', Him: 'Her', his: 'her', His: 'Her', himself: 'herself', Himself: 'Herself' };
export function pronouns(text) {
  if (typeof text !== 'string' || store.get().child?.gender !== 'girl') return text;
  return text.replace(/\b(he|He|him|Him|his|His|himself|Himself)\b/g, (w) => PRONOUNS[w]);
}

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = pronouns(String(v));
    else if (k === 'aria-label' || k === 'placeholder' || k === 'title') el.setAttribute(k, pronouns(String(v)));
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  appendAll(el, children);
  return el;
}

function appendAll(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(pronouns(String(c))));
  }
}

export function iconEl(name, cls = '') {
  const span = h('span', { class: cls, html: icon(name), 'aria-hidden': 'true' });
  span.classList.add('contents');
  return span;
}

let uid = 0;
export const nextId = (p = 'lp') => `${p}-${++uid}`;


/* --------------------------------------------------------------------------
   Buttons
   -------------------------------------------------------------------------- */
export function button({ label, variant = 'primary', size = 'l', iconName, iconAfter = false, onClick, type = 'button', ariaLabel, cls = '' }) {
  const lbl = h('span', { class: 'btn__label', text: label });
  const btn = h('button', {
    type,
    class: `btn btn--${variant}${size === 'm' ? ' btn--m' : ''} ${cls}`.trim(),
    'aria-label': ariaLabel,
  });
  if (iconName && !iconAfter) btn.append(iconEl(iconName));
  btn.append(lbl);
  if (iconName && iconAfter) btn.append(iconEl(iconName));
  btn.addEventListener('click', (e) => {
    if (btn.classList.contains('is-loading') || btn.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    onClick?.(e);
  });

  btn.setLabel = (t) => { lbl.textContent = pronouns(t); };
  btn.setLoading = (on, loadingLabel) => {
    btn.classList.toggle('is-loading', on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    const existing = btn.querySelector('.spinner');
    if (on) {
      btn.dataset.label = lbl.textContent;
      if (loadingLabel) lbl.textContent = loadingLabel;
      if (!existing) btn.prepend(h('span', { class: 'spinner', 'aria-hidden': 'true' }));
    } else {
      existing?.remove();
      if (btn.dataset.label) lbl.textContent = btn.dataset.label;
    }
  };
  btn.setDisabled = (on) => {
    if (on) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
  };
  return btn;
}

export function iconButton({ iconName, label, onClick, variant = '', size = '', cls = '' }) {
  const b = h('button', {
    type: 'button',
    class: `icon-btn${variant ? ' icon-btn--' + variant : ''}${size ? ' icon-btn--' + size : ''} ${cls}`.trim(),
    'aria-label': label,
    title: label,
    html: icon(iconName),
  });
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

/* --------------------------------------------------------------------------
   Top bar with optional five-part progress and a text action
   -------------------------------------------------------------------------- */
export function topbar({ onBack, backLabel = 'Go back', progress, action, title } = {}) {
  const bar = h('header', { class: 'topbar' });
  if (onBack) bar.append(iconButton({ iconName: 'back', label: backLabel, onClick: onBack }));
  if (progress) bar.append(progressBar(progress));
  else if (title) bar.append(h('h2', { class: 'topbar__title t-title-s', text: title }));
  else bar.append(h('div', { class: 'topbar__spacer' }));
  if (action) {
    bar.append(button({ label: action.label, variant: 'text', size: 'm', onClick: action.onClick, cls: 'btn--auto topbar__action' }));
  }
  return bar;
}

/** Five-part bar. Segments up to `from` are drawn instantly, then it animates to `step`. */
export function progressBar({ step, total = 5, from = step - 1 }) {
  const wrap = h('div', {
    class: 'progress',
    role: 'progressbar',
    'aria-label': 'Setup progress',
    'aria-valuemin': '0',
    'aria-valuemax': String(total),
    'aria-valuenow': String(step),
    'aria-valuetext': `Step ${step} of ${total}`,
  });
  const segs = [];
  for (let i = 1; i <= total; i++) {
    const seg = h('span', { class: 'progress__seg' + (i <= from ? ' is-done' : '') });
    segs.push(seg);
    wrap.append(seg);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    segs.forEach((s, i) => s.classList.toggle('is-done', i + 1 <= step));
  }));
  return wrap;
}

/* --------------------------------------------------------------------------
   Text field (label above, helper/error below)
   -------------------------------------------------------------------------- */
export function textField({ label, value = '', placeholder = '', type = 'text', inputmode, autocomplete, maxlength = '80', prefix, leadIcon, trailing, help = '', id = nextId('f'), onInput, onEnter, enterkeyhint, autocapitalize, cls = '' }) {
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const input = h('input', {
    id, type, value, placeholder,
    class: 'field__input',
    inputmode, autocomplete, maxlength, enterkeyhint, autocapitalize,
    spellcheck: 'false',
    'aria-describedby': `${helpId} ${errId}`,
  });
  input.value = value;
  const control = h('div', { class: 'field__control' });
  if (leadIcon) control.append(h('span', { class: 'field__lead-icon', html: icon(leadIcon) }));
  if (prefix) control.append(h('span', { class: 'field__prefix', text: prefix, 'aria-hidden': 'true' }));
  control.append(input);
  if (trailing) control.append(trailing);

  const helpEl = h('p', { class: 'field__help', id: helpId, text: help });
  const errEl = h('p', { class: 'msg msg--error', id: errId, 'aria-live': 'polite' });
  const wrap = h('div', { class: `field ${cls}`.trim() },
    label ? h('label', { class: 'field__label', for: id, text: label }) : null,
    control, errEl, helpEl);

  input.addEventListener('input', (e) => { if (wrap.hasError) setError(''); onInput?.(e); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onEnter?.(e); });

  function setError(msg) {
    wrap.hasError = Boolean(msg);
    control.classList.toggle('is-invalid', wrap.hasError);
    input.setAttribute('aria-invalid', wrap.hasError ? 'true' : 'false');
    errEl.innerHTML = '';
    if (msg) {
      errEl.append(h('span', { html: icon('error'), class: 'contents' }), h('span', { text: msg }));
      errEl.classList.remove('is-new'); void errEl.offsetWidth; errEl.classList.add('is-new');
    }
  }
  wrap.input = input;
  wrap.control = control;
  wrap.setError = setError;
  wrap.setHelp = (t) => { helpEl.textContent = t; };
  return wrap;
}

/** A field-looking button that opens a picker (e.g. month and year). */
export function pickerField({ label, value, placeholder, trailingIcon = 'plan', onOpen, help = '', id = nextId('p') }) {
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const labelId = `${id}-label`;
  const valueEl = h('span', { class: 'field__value' + (value ? '' : ' is-placeholder'), text: value || placeholder });
  const control = h('button', {
    type: 'button',
    id,
    class: 'field__control field__control--button',
    'aria-haspopup': 'dialog',
    'aria-labelledby': `${labelId} ${id}`,
    'aria-describedby': `${helpId} ${errId}`,
  }, valueEl, h('span', { class: 'field__trail-icon', html: icon(trailingIcon) }));
  control.addEventListener('click', onOpen);
  const helpEl = h('p', { class: 'field__help', id: helpId, text: help });
  const errEl = h('p', { class: 'msg msg--error', id: errId, 'aria-live': 'polite' });
  const wrap = h('div', { class: 'field' }, h('span', { class: 'field__label', id: labelId, text: label }), control, errEl, helpEl);
  wrap.control = control;
  wrap.setValue = (v) => {
    valueEl.textContent = v || placeholder;
    valueEl.classList.toggle('is-placeholder', !v);
  };
  wrap.setHelp = (t) => { helpEl.textContent = t; };
  wrap.setError = (msg) => {
    control.classList.toggle('is-invalid', Boolean(msg));
    errEl.innerHTML = '';
    if (msg) errEl.append(h('span', { html: icon('error'), class: 'contents' }), h('span', { text: msg }));
  };
  return wrap;
}

/* --------------------------------------------------------------------------
   Mic button with type-or-say. Uses the Web Speech API when the browser
   has it (Chrome, Edge, Safari); otherwise fills a sample phrase so the
   flow can still be tried.
   -------------------------------------------------------------------------- */
/**
 * size: '' = small, inside a text field. 'xl' = the big helper mic (72 px, shown before
 * any text box). lang: what she speaks ('hi-IN', 'en-IN', 'ne-NP', 'mr-IN').
 * onState('listening' | 'idle'), onBlocked() when the mic is off or refused.
 */
export function micButton({ input, sample = '', onResult, label = 'Say it', stopLabel = 'Stop listening', lang = 'en-IN', size = '', onState, onBlocked }) {
  const btn = size === 'xl'
    ? h('button', { type: 'button', class: 'mic-xl', 'aria-label': label, html: icon('mic') })
    : iconButton({ iconName: 'mic', label, variant: 'filled', size: 'sm' });
  let rec = null;
  let fakeTimer = null;
  const originalPh = input.placeholder;

  const stop = () => {
    const was = btn.classList.contains('is-listening');
    btn.classList.remove('is-listening');
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', label);
    input.placeholder = originalPh;
    clearTimeout(fakeTimer);
    try { rec?.stop(); } catch { /* ignore */ }
    rec = null;
    if (was) onState?.('idle');
  };
  const blocked = (msg) => { stop(); if (onBlocked) onBlocked(); else toast(msg, { iconName: 'info' }); };
  const deliver = (text) => {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    onResult?.(text);
  };

  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', () => {
    if (btn.classList.contains('is-listening')) { stop(); return; }
    askPermission('mic', { onAllow: begin, onDeny: () => onBlocked?.() });
  });
  function begin() {
    btn.classList.add('is-listening');
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', stopLabel);
    input.placeholder = 'Listening…';
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    onState?.('listening');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && !sim.on('voice')) {
      try {
        rec = new SR();
        rec.lang = lang;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.onresult = (e) => {
          const text = Array.from(e.results).map((r) => r[0].transcript).join(' ');
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          if (e.results[e.results.length - 1].isFinal) { onResult?.(text); stop(); }
        };
        rec.onerror = (e) => {
          stop();
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            blocked('Microphone is off. You can still type.');
          } else if (e.error === 'no-speech') {
            toast('We did not catch that. Try again or type it.', { iconName: 'info' });
          } else if (sample) {
            deliver(sample);
          }
        };
        rec.onend = () => { if (btn.classList.contains('is-listening')) stop(); };
        rec.start();
        return;
      } catch { /* fall through to the demo */ }
    }
    fakeTimer = setTimeout(() => {
      stop();
      if (sim.on('voice')) { toast('We didn’t catch that. Try again closer to the phone, or type it.', { iconName: 'mic', tone: 'error' }); input.focus(); return; }
      deliver(sample);
    }, 1600);
  }
  btn.stop = stop;
  return btn;
}

/* --------------------------------------------------------------------------
   Listen: reads the screen aloud in her language (helper view). A speaker and
   the word in her language; Stop while it speaks; the line being read is
   highlighted (.is-reading). 56 px tall.
   -------------------------------------------------------------------------- */
export function listenButton({ lang = 'hi', label = 'Listen', stopLabel = 'Stop', getLines, onFallback, cls = '' }) {
  const text = h('span', { class: 'listen-btn__label', text: label });
  const ico = h('span', { class: 'listen-btn__icon contents', html: icon('speaker') });
  const btn = h('button', { type: 'button', class: `listen-btn ${cls}`.trim(), 'aria-pressed': 'false' }, ico, text);
  const reset = () => { btn.setAttribute('aria-pressed', 'false'); btn.classList.remove('is-speaking'); text.textContent = label; ico.innerHTML = icon('speaker'); };
  btn.addEventListener('click', () => {
    if (btn.classList.contains('is-speaking')) { stopSpeaking(); reset(); return; }
    btn.setAttribute('aria-pressed', 'true'); btn.classList.add('is-speaking');
    text.textContent = stopLabel; ico.innerHTML = icon('stop');
    haptic(10);
    speak(getLines(), { lang, onFallback, onEnd: reset });
  });
  btn.reset = reset;
  return btn;
}

/* --------------------------------------------------------------------------
   Chips
   -------------------------------------------------------------------------- */
export function chip({ label, checked = false, kind = '', thumb, thumbIcon, onToggle, role = 'checkbox', disabled = false, blocked = false, describedBy }) {
  const c = h('button', {
    type: 'button',
    class: `chip${kind ? ' chip--' + kind : ''}${thumb !== undefined || thumbIcon ? ' chip--photo' : ''}${blocked ? ' chip--blocked' : ''}`,
    role,
    'aria-checked': role === 'button' ? null : String(checked),
    'aria-disabled': disabled ? 'true' : null,
    'aria-describedby': describedBy,
  });
  if (thumb) c.append(h('img', { class: 'chip__thumb', src: thumb, alt: '', loading: 'lazy', decoding: 'async', width: '36', height: '36' }));
  else if (thumbIcon) c.append(h('span', { class: 'chip__thumb chip__thumb--icon', html: icon(thumbIcon) }));
  const mark = h('span', { class: 'chip__mark contents' });
  c.append(mark, h('span', { class: 'chip__label', text: label }));
  if (blocked) c.append(h('span', { class: 'chip__trail', html: icon('ban') }));

  const paint = (on) => {
    mark.innerHTML = '';
    if (kind === 'allergy' && on) mark.innerHTML = icon('banFilled');
    else if (kind === 'add') mark.innerHTML = icon('plus');
    else if (on) mark.innerHTML = icon('check');
  };
  paint(checked);
  c.setChecked = (on) => {
    if (role !== 'button') c.setAttribute('aria-checked', String(on));
    paint(on);
  };
  if (kind === 'add') paint(false);
  c.addEventListener('click', () => {
    if (role === 'button') { onToggle?.(); return; }
    const next = c.getAttribute('aria-checked') !== 'true';
    onToggle?.(next, c);
  });
  return c;
}

/* --------------------------------------------------------------------------
   Toggle (switch) inside a row
   -------------------------------------------------------------------------- */
export function toggleRow({ label, iconName, checked, onChange }) {
  const id = nextId('t');
  const sw = h('button', { type: 'button', class: 'toggle', role: 'switch', 'aria-checked': String(checked), 'aria-labelledby': id });
  const row = h('div', { class: 'row row--tappable' },
    iconName ? h('span', { class: 'row__icon', html: icon(iconName) }) : null,
    h('span', { class: 'row__label', id, text: label }),
    sw);
  const flip = () => {
    const next = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(next));
    onChange?.(next);
  };
  sw.addEventListener('click', (e) => { e.stopPropagation(); flip(); });
  row.addEventListener('click', flip);
  return row;
}

/* --------------------------------------------------------------------------
   Segmented control (radiogroup) with a sliding thumb + arrow keys
   -------------------------------------------------------------------------- */
export function segmented({ options, value, label, onChange }) {
  const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': label });
  const thumb = h('span', { class: 'segmented__thumb', 'aria-hidden': 'true' });
  group.append(thumb);
  const btns = options.map((o) => {
    const b = h('button', { type: 'button', class: 'segmented__opt', role: 'radio', 'aria-checked': String(o.id === value), tabindex: o.id === value ? '0' : '-1', text: o.name });
    b.addEventListener('click', () => select(o.id, true));
    group.append(b);
    return b;
  });
  const place = () => {
    const i = Math.max(0, options.findIndex((o) => o.id === value));
    const w = `calc((100% - 8px) / ${options.length})`;
    thumb.style.width = w;
    thumb.style.transform = `translateX(calc(${i} * 100%))`;
  };
  function select(id, focus) {
    value = id;
    btns.forEach((b, i) => {
      const on = options[i].id === id;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    place();
    onChange?.(id);
  }
  group.addEventListener('keydown', (e) => {
    const i = options.findIndex((o) => o.id === value);
    let n = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % options.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + options.length) % options.length;
    if (n != null) { e.preventDefault(); select(options[n].id, true); }
  });
  place();
  return group;
}

/* --------------------------------------------------------------------------
   Photo tile (multi-select, role=checkbox)
   -------------------------------------------------------------------------- */
export function photoTile({ title, meta, src, checked, onToggle }) {
  const metaEl = h('span', { class: 'tile__meta', text: meta });
  const t = h('button', { type: 'button', class: 'tile', role: 'checkbox', 'aria-checked': String(checked) },
    h('img', { class: 'tile__img', src, alt: '', loading: 'lazy', decoding: 'async', width: '164', height: '96' }),
    h('span', { class: 'tile__head' },
      h('span', { class: 'tile__title', text: title }),
      h('span', { class: 'tile__check', html: icon('check'), 'aria-hidden': 'true' })),
    metaEl);
  t.addEventListener('click', () => onToggle?.(t.getAttribute('aria-checked') !== 'true', t));
  t.setChecked = (on) => t.setAttribute('aria-checked', String(on));
  t.setMeta = (m) => { metaEl.textContent = m; };
  return t;
}

/* --------------------------------------------------------------------------
   Choice card (photo row + round tick, role=radio)
   -------------------------------------------------------------------------- */
export function choiceCard({ title, meta, src, checked, onSelect, isNew = false, role = 'radio' }) {
  const media = src
    ? h('img', { class: 'choice__img', src, alt: '', loading: 'lazy', decoding: 'async', width: '64', height: '64' })
    : h('span', { class: 'choice__img choice__img--icon', html: icon('bowl') });
  const c = h('button', { type: 'button', class: 'choice' + (isNew ? ' is-new' : '') + (role === 'checkbox' ? ' choice--multi' : ''), role, 'aria-checked': String(checked) },
    media,
    h('span', { class: 'choice__body' },
      h('span', { class: 'choice__title t-title-s', text: title }),
      meta ? h('span', { class: 'choice__meta', text: meta }) : null),
    h('span', { class: 'radio-mark', html: icon('check'), 'aria-hidden': 'true' }));
  c.addEventListener('click', () => onSelect?.());
  return c;
}

/** Roving tabindex + arrow keys for a list of role=radio children. */
export function radioGroupKeys(group) {
  const radios = () => Array.from(group.querySelectorAll('[role="radio"]'));
  const sync = () => {
    const rs = radios();
    const checked = rs.find((r) => r.getAttribute('aria-checked') === 'true') || rs[0];
    rs.forEach((r) => { r.tabIndex = r === checked ? 0 : -1; });
  };
  group.addEventListener('keydown', (e) => {
    const rs = radios();
    const i = rs.indexOf(document.activeElement);
    if (i < 0) return;
    let n = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % rs.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + rs.length) % rs.length;
    if (n != null) { e.preventDefault(); rs[n].click(); rs[n].focus(); }
  });
  sync();
  group.syncRadios = sync;
  return group;
}

/* --------------------------------------------------------------------------
   Note / alert
   -------------------------------------------------------------------------- */
export function note({ text, kind = '', iconName = 'backup' }) {
  return h('div', { class: `note${kind ? ' note--' + kind : ''}`, role: kind === 'error' ? 'alert' : null },
    h('span', { html: icon(iconName), class: 'contents' }),
    h('span', { text }));
}

/* --------------------------------------------------------------------------
   v1.3 · Section head: Hind SemiBold 18 title, optional 32 px Guide icon tile,
   help text lined up with the title text (not the icon).
   -------------------------------------------------------------------------- */
export function sectionHead({ title, help = '', iconName = null, id = nextId('sec') }) {
  return h('div', { class: 'section-head' },
    iconName ? h('span', { class: 'section-head__tile', html: icon(iconName), 'aria-hidden': 'true' }) : null,
    h('h2', { class: 't-section-title', id, text: title }),
    help ? h('p', { class: 't-help', text: help }) : null);
}

/* --------------------------------------------------------------------------
   v1.3 · Message family. One shape for all (radius 16, padding 16, 32 px tile,
   section-title style title, help-text body); the role sets colour and icon.
   reminder  · a small task with a 44 px tick (neutral card, Guide tile)
   notice    · a calm fact (refusals, backups)
   attention · time-bound with a real cost (jaggery, max 1 per screen)
   alertMsg  · allergies and unsafe food only (danger)
   infoMsg   · offline and system messages
   -------------------------------------------------------------------------- */
function messageCard(role, { iconName, title, body = '', meta = '', tags = [], actions = [], tick = null, foot = null, id = nextId('msg'), live = null }) {
  const main = h('div', { class: 'msg__main' },
    tags.length ? h('div', { class: 'msg__tags' }, tags) : null,
    h('p', { class: 'msg__title', id, text: title }),
    body ? (typeof body === 'string' ? h('p', { class: 'msg__body', text: body }) : body) : null,
    meta ? h('p', { class: 'msg__meta', text: meta }) : null,
    actions.length ? h('div', { class: 'msg__actions' }, actions) : null,
    foot);
  return h('section', { class: `msg msg--${role}`, 'aria-labelledby': id, role: live },
    h('span', { class: 'msg__tile', html: icon(iconName), 'aria-hidden': 'true' }),
    main,
    tick || h('span'));
}

/**
 * Reminder: a task with a tick. `tag` is a Guide tag text ("Needs tonight").
 * `seeAll: { label, onClick }` adds the footer text button ("See all prep · 3").
 * Returns the card; call card.setDone(text) to collapse it to the quiet done row.
 */
export function reminder({ title, line = '', meta = '', tag = '', onDone, seeAll = null, iconName = 'clock', doneLabel = 'Mark as done' }) {
  const tick = h('button', { type: 'button', class: 'msg__tick', 'aria-pressed': 'false', 'aria-label': `${doneLabel}: ${title}${line ? '. ' + line : ''}`, html: icon('check') });
  tick.addEventListener('click', () => { tick.setAttribute('aria-pressed', 'true'); haptic(12); setTimeout(() => onDone?.(), 160); });
  const see = seeAll ? h('button', { type: 'button', class: 'link msg__see', 'aria-haspopup': 'dialog' },
    h('span', { text: seeAll.label }), h('span', { class: 'contents', html: icon('forward') })) : null;
  if (see) see.addEventListener('click', () => seeAll.onClick(see));
  return messageCard('neutral', {
    iconName, title, body: line, meta,
    tags: tag ? [h('span', { class: 'tag tag--guide', text: tag })] : [],
    tick, foot: see,
  });
}

/** The collapsed Done state of a reminder: one quiet line with a green check. */
export function reminderDone(text) {
  return h('p', { class: 'msg msg--done', role: 'status' }, h('span', { class: 'contents', html: icon('success') }), h('span', { text }));
}

export function notice({ title, body = '', actions = [], iconName = 'tip' }) {
  return messageCard('notice', { iconName, title, body, actions });
}
export function attention({ title, body = '', action = null, iconName = 'clock' }) {
  return messageCard('attention', { iconName, title, body, actions: action ? [action] : [], live: 'alert' });
}
export function alertMsg({ title, body = '', iconName = 'allergy' }) {
  return messageCard('danger', { iconName, title, body, live: 'alert' });
}
export function infoMsg({ title, body = '', iconName = 'info' }) {
  return messageCard('info', { iconName, title, body });
}

/* --------------------------------------------------------------------------
   OTP: one real input (autocomplete=one-time-code, paste-friendly) drawn as
   six boxes.
   -------------------------------------------------------------------------- */
export function otpInput({ length = 6, onComplete, onChange }) {
  const input = h('input', {
    class: 'otp__input',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'one-time-code',
    pattern: '[0-9]*',
    maxlength: String(length),
    'aria-label': `${length}-digit code`,
  });
  const boxes = Array.from({ length }, () => h('span', { class: 'otp__box', 'aria-hidden': 'true' }));
  const wrap = h('div', { class: 'otp' }, h('div', { class: 'otp__boxes' }, boxes), input);
  let last = '';

  const paint = () => {
    const v = input.value;
    const focused = document.activeElement === input;
    boxes.forEach((b, i) => {
      const d = v[i] || '';
      if (b.textContent !== d) {
        b.textContent = d;
        b.classList.remove('has-digit');
        if (d) { void b.offsetWidth; b.classList.add('has-digit'); }
      }
      const idle = !wrap.classList.contains('is-error') && !wrap.classList.contains('is-checking');
      b.classList.toggle('is-active', focused && idle && i === Math.min(v.length, length - 1));
    });
  };

  input.addEventListener('input', () => {
    const clean = input.value.replace(/\D/g, '').slice(0, length);
    if (clean !== input.value) input.value = clean;
    if (wrap.classList.contains('is-error') && clean !== last) wrap.setError(false);
    last = clean;
    paint();
    onChange?.(clean);
    if (clean.length === length) onComplete?.(clean);
  });
  input.addEventListener('focus', paint);
  input.addEventListener('blur', paint);
  // Keep the caret at the end: tapping a box never edits the middle.
  input.addEventListener('select', () => { const n = input.value.length; input.setSelectionRange(n, n); });
  input.addEventListener('click', () => { const n = input.value.length; input.setSelectionRange(n, n); });

  wrap.input = input;
  wrap.value = () => input.value;
  wrap.fill = (code) => { input.value = code; input.dispatchEvent(new Event('input', { bubbles: true })); };
  wrap.clear = () => { input.value = ''; last = ''; paint(); };
  wrap.focus = () => { input.focus({ preventScroll: true }); paint(); };
  wrap.setError = (on) => { wrap.classList.toggle('is-error', on); input.setAttribute('aria-invalid', on ? 'true' : 'false'); paint(); };
  wrap.setChecking = (on) => { wrap.classList.toggle('is-checking', on); input.readOnly = on; paint(); };
  paint();
  return wrap;
}

/* --------------------------------------------------------------------------
   Logo lockups
   -------------------------------------------------------------------------- */
export function lockupSmall() {
  return h('div', { class: 'lockup lockup--sm', role: 'img', 'aria-label': 'Little Plate' },
    h('span', { html: logo({ size: 36, label: '' }), class: 'contents' }),
    h('span', { class: 'lockup__word', 'aria-hidden': 'true', text: 'little plate' }));
}

/* --------------------------------------------------------------------------
   Overlays: bottom sheet + confirm dialog. One at a time; a new one
   replaces the old. Close via button, scrim, Escape, or drag down.
   Focus is trapped and returned to the opener.
   -------------------------------------------------------------------------- */
let layer = null;
let current = null;

export function mountOverlayLayer(el) { layer = el; }

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])';

export function openSheet({ title, sub, body, foot, onClose, label, kind = 'sheet', initialFocus }) {
  const opener = document.activeElement;
  if (current) current.close({ instant: true, keepFocus: true });

  const titleId = nextId('sheet-t');
  const scrim = h('div', { class: 'scrim' });
  let panel;
  if (kind === 'dialog') {
    panel = h('div', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
      h('h2', { class: 't-title-s', id: titleId, text: title }),
      sub ? h('p', { class: 'dialog__body', text: sub }) : null,
      body || null);
  } else {
    const closeBtn = iconButton({ iconName: 'close', label: 'Close', variant: 'filled', onClick: () => api.close() });
    const grabber = h('div', { class: 'sheet__grabber', 'aria-hidden': 'true' });
    const bodyEl = h('div', { class: 'sheet__body' }, body || null);
    const footEl = h('div', { class: 'sheet__foot' }, foot || null);
    panel = h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, 'aria-label': label },
      grabber,
      h('div', { class: 'sheet__head' },
        h('div', { class: 'sheet__titles' },
          h('h2', { class: 't-title-m', id: titleId, text: title }),
          sub ? h('p', { class: 'sheet__sub', text: sub }) : null),
        closeBtn),
      bodyEl, footEl);
    enableDrag(panel, grabber, () => api.close());
    panel.bodyEl = bodyEl;
    panel.footEl = footEl;
  }

  const host = h('div', { class: 'sheet-layer' }, scrim, panel);
  layer.replaceChildren(host);
  layer.classList.add('has-overlay');
  scrim.addEventListener('click', () => api.close());
  document.querySelector('.status-bar')?.classList.add('is-dimmed');

  // Hide the screen behind from assistive tech while open.
  const behind = document.getElementById('viewport');
  behind?.setAttribute('aria-hidden', 'true');
  behind?.setAttribute('inert', '');

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); api.close(); return; }
    if (e.key === 'Tab') {
      const f = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', onKey, true);

  requestAnimationFrame(() => {
    host.classList.add('is-open');
    const heading = panel.querySelector('h2');
    heading.tabIndex = -1;
    const wanted = initialFocus && panel.querySelector(initialFocus);
    // Text fields take focus (keyboard opens, as in real apps); other controls only for keyboard users.
    const target = wanted && (wanted.tagName === 'INPUT' || lastWasKeyboard) ? wanted : heading;
    setTimeout(() => target?.focus({ preventScroll: true }), 60);
  });

  let closed = false;
  const api = {
    el: panel,
    body: panel.bodyEl,
    foot: panel.footEl,
    close({ instant = false, keepFocus = false } = {}) {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      behind?.removeAttribute('aria-hidden');
      behind?.removeAttribute('inert');
      document.querySelector('.status-bar')?.classList.remove('is-dimmed');
      if (current === api) current = null;
      onClose?.();
      const finish = () => { if (host.parentNode) host.remove(); if (!layer.children.length) layer.classList.remove('has-overlay'); };
      if (instant) finish();
      else {
        host.classList.remove('is-open');
        panel.style.transform = '';
        setTimeout(finish, 380);
      }
      if (!keepFocus && opener && document.contains(opener)) opener.focus({ preventScroll: true });
    },
  };
  current = api;
  return api;
}

export function closeOverlay() { current?.close(); }
export function hasOverlay() { return Boolean(current); }

function enableDrag(panel, handle, onDismiss) {
  let startY = 0, dy = 0, dragging = false;
  const down = (e) => {
    dragging = true; startY = e.clientY; dy = 0;
    panel.classList.add('is-dragging');
    handle.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!dragging) return;
    dy = Math.max(0, e.clientY - startY);
    panel.style.transform = `translateY(${dy}px)`;
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove('is-dragging');
    if (dy > 90) onDismiss();
    else panel.style.transform = '';
  };
  handle.addEventListener('pointerdown', down);
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', up);
  handle.addEventListener('pointercancel', up);
}

/** Destructive confirm (dialogs only for irreversible actions). */
export function confirmDialog({ title, body, confirmLabel, cancelLabel = 'Cancel', onConfirm }) {
  let api;
  const actions = h('div', { class: 'dialog__actions' },
    button({ label: cancelLabel, variant: 'secondary', size: 'm', onClick: () => api.close() }),
    button({ label: confirmLabel, variant: 'danger', size: 'm', onClick: () => { api.close({ keepFocus: true }); onConfirm?.(); } }));
  api = openSheet({ kind: 'dialog', title, sub: body, body: actions, initialFocus: '.btn--secondary' });
  return api;
}

/* --------------------------------------------------------------------------
   Toasts (ink, slide up, auto-dismiss, stack, optional Undo)
   -------------------------------------------------------------------------- */
let toastRegion = null;
export function mountToastRegion(el) { toastRegion = el; }

export function toast(text, { iconName, action, duration, mascot = false, tone = '' } = {}) {
  if (!toastRegion) return;
  // Errors are announced right away (role=alert) and stay longer: people need time to act.
  const t = h('div', { class: 'toast' + (mascot ? ' toast--mascot' : '') + (tone ? ` toast--${tone}` : ''), role: tone === 'error' ? 'alert' : 'status' },
    mascot ? h('span', { class: 'toast__mascot', html: phulka({ mood: 'saved', size: 34, disc: false, animate: true }) })
      : iconName ? h('span', { class: 'toast__icon', html: icon(iconName) }) : null,
    h('span', { class: 'toast__text', text }));
  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    t.classList.add('is-leaving');
    setTimeout(() => t.remove(), 240);
  };
  if (action) {
    t.append(h('button', { type: 'button', class: 'toast__action', text: action.label, onClick: () => { action.onClick?.(); dismiss(); } }));
  }
  toastRegion.append(t);
  while (toastRegion.children.length > 3) toastRegion.firstElementChild.remove();
  timer = setTimeout(dismiss, duration || (tone === 'error' ? 8000 : action ? 5000 : DEMO_TOAST_MS));
  return { dismiss };
}
const DEMO_TOAST_MS = 2500;

/* --------------------------------------------------------------------------
   Prototype: simulate failures (set from the panel beside the phone)
   save · saving fails   voice · voice not understood   slow · slow loading   ideas · ideas fail to load
   -------------------------------------------------------------------------- */
const SIM_KEY = 'littleplate:sim';
export const sim = {
  all() { try { return JSON.parse(localStorage.getItem(SIM_KEY)) || {}; } catch { return {}; } },
  on(k) { return !!sim.all()[k]; },
  set(k, v) { const a = sim.all(); a[k] = v; try { localStorage.setItem(SIM_KEY, JSON.stringify(a)); } catch { /* ignore */ } },
};
/**
 * Call before any save. When saving fails, nothing is stored, the person is told
 * what happened and what to do, and "Try again" repeats the same save.
 */
export function saveFailed(retry) {
  if (!sim.on('save')) return false;
  haptic(30);
  toast('Couldn’t save. Check your internet and try again.', { iconName: 'error', tone: 'error', action: retry ? { label: 'Try again', onClick: retry } : undefined });
  return true;
}

/** A light tick on phones that support it (Android). Silent elsewhere. */
export function haptic(ms = 10) {
  try { if (navigator.vibrate && navigator.userActivation?.isActive !== false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(ms); } catch { /* ignore */ }
}

/**
 * In-app permission pre-prompt (DS · States · Permission): says the benefit,
 * always offers the non-voice / no-reminder path. Sits above any sheet.
 * Remembers the answer for this phone.
 */
export function askPermission(kind, { onAllow, onDeny } = {}) {
  const PERMS = {
    mic: { icon: 'mic', title: 'Allow the microphone?', body: 'So you can say foods instead of typing. You can still type.', allow: 'Allow', deny: 'Not now', denied: 'Okay. You can type instead.' },
    notify: { icon: 'bell', title: 'Allow reminders?', body: 'One gentle reminder when it’s time, nothing else. You can turn it off in your phone settings.', allow: 'Allow reminders', deny: 'Not now', denied: 'No reminder. Tell us on Today when you’re ready.' },
  };
  const p = PERMS[kind];
  const saved = window.__lpPerms || (window.__lpPerms = {});
  try { Object.assign(saved, JSON.parse(localStorage.getItem('littleplate:perms') || '{}')); } catch { /* ignore */ }
  if (saved[kind] === 'granted') { onAllow?.(); return; }
  const remember = (v) => { saved[kind] = v; try { localStorage.setItem('littleplate:perms', JSON.stringify(saved)); } catch { /* in-memory only */ } };
  const phone = document.getElementById('phone');
  const opener = document.activeElement;
  const titleId = nextId('perm');
  const allowBtn = button({ label: p.allow, onClick: () => { remember('granted'); close(); onAllow?.(); } });
  const denyBtn = h('button', { type: 'button', class: 'link link--center', text: p.deny });
  denyBtn.addEventListener('click', () => { close(); toast(p.denied, { iconName: 'info' }); onDeny?.(); });
  const card = h('div', { class: 'perm__card', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
    h('span', { class: 'perm__icon', html: icon(p.icon) }),
    h('h2', { class: 't-title-m perm__title', id: titleId, text: p.title }),
    h('p', { class: 'perm__body', text: p.body }),
    allowBtn, denyBtn);
  const layer = h('div', { class: 'perm' }, h('div', { class: 'perm__scrim' }), card);
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); denyBtn.click(); } };
  document.addEventListener('keydown', onKey, true);
  function close() {
    document.removeEventListener('keydown', onKey, true);
    layer.classList.add('is-leaving');
    setTimeout(() => layer.remove(), 220);
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  }
  phone.append(layer);
  // Keyboard users land on Allow; touch users see no focus ring.
  const title = card.querySelector('h2');
  title.tabIndex = -1;
  setTimeout(() => (lastWasKeyboard ? allowBtn : title).focus({ preventScroll: true }), 80);
}

export function comingSoon(what = 'This') {
  toast(`${what} is coming soon.`, { iconName: 'info' });
}

/* --------------------------------------------------------------------------
   Simulated SMS notification banner (OS-level, inside the phone)
   -------------------------------------------------------------------------- */
export function smsBanner({ code, onTap }) {
  const phone = document.getElementById('phone');
  phone.querySelector('.sms-banner')?.remove();
  const b = h('button', { type: 'button', class: 'sms-banner', 'aria-label': `New message: ${code} is your Little Plate code. Tap to fill it in.` },
    h('span', { class: 'sms-banner__app', html: icon('message') }),
    h('span', { class: 'sms-banner__body' },
      h('span', { class: 'sms-banner__meta' }, h('span', { text: 'MESSAGES' }), h('span', { text: 'now' })),
      h('span', { class: 'sms-banner__text' },
        h('strong', { text: 'LP-LTPLTE' }), h('br'),
        `${code} is your Little Plate code. Do not share it with anyone.`)));
  let gone = false;
  const hide = () => {
    if (gone) return; gone = true;
    b.classList.add('is-leaving');
    setTimeout(() => b.remove(), 240);
  };
  b.addEventListener('click', () => { onTap?.(); hide(); });
  phone.append(b);
  const t = setTimeout(hide, 5000);
  return { hide: () => { clearTimeout(t); hide(); } };
}

/* --------------------------------------------------------------------------
   Footer fade when the content scrolls under the bottom action
   -------------------------------------------------------------------------- */
export function watchOverflow(scrollEl, footerEl) {
  if (!scrollEl || !footerEl) return () => {};
  const check = () => {
    const more = scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop > 4;
    footerEl.classList.toggle('has-overflow', more);
  };
  scrollEl.addEventListener('scroll', check, { passive: true });
  const ro = new ResizeObserver(check);
  ro.observe(scrollEl);
  Array.from(scrollEl.children).forEach((c) => ro.observe(c));
  requestAnimationFrame(check);
  return () => ro.disconnect();
}

/* --------------------------------------------------------------------------
   Keyboard vs pointer: only move focus programmatically for keyboard users,
   so mouse/touch users never see a focus ring appear on its own.
   -------------------------------------------------------------------------- */
let lastWasKeyboard = false;
document.addEventListener('keydown', (e) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) lastWasKeyboard = true; }, true);
document.addEventListener('pointerdown', () => { lastWasKeyboard = false; }, true);
export function focusIfKeyboard(el) { if (el && lastWasKeyboard) el.focus({ preventScroll: true }); }

/** Bring an invalid group into view (no focus ring for touch users). */
export function reveal(el) {
  if (!el) return;
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  focusIfKeyboard(el.querySelector('button, input, [tabindex="0"]') || el);
}

/* ==========================================================================
   Flows R2–R7: shared pieces
   ========================================================================== */

/** Phulka as a node. */
export function phulkaEl(opts) {
  const wrap = h('span', { class: 'contents', html: phulka(opts) });
  return wrap.firstElementChild;
}

/* ---------- Tab bar: four tabs, icon + label always ---------- */
export const TABS = [
  { id: 'today', name: 'Today', icon: 'today' },
  { id: 'plan', name: 'Plan', icon: 'plan' },
  { id: 'memory', name: 'Memory', icon: 'memory' },
  { id: 'learn', name: 'Learn', icon: 'learn' },
];
export function tabBar(active) {
  const nav = h('nav', { class: 'tabbar', 'aria-label': 'Main' });
  TABS.forEach((t) => {
    const on = t.id === active;
    const b = h('a', {
      href: `#/${t.id}`,
      class: 'tabbar__item' + (on ? ' is-active' : ''),
      'aria-current': on ? 'page' : null,
    },
    h('span', { class: 'tabbar__pill', html: icon(t.icon) }),
    h('span', { class: 'tabbar__label', text: t.name }));
    b.addEventListener('click', (e) => {
      e.preventDefault();
      if (on) {
        // Tapping the active tab scrolls to the top (DS: Tab bar).
        nav.closest('.screen')?.querySelector('.screen__scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      navigate(t.id, { reset: true, transition: 'fade' });
    });
    nav.append(b);
  });
  return nav;
}

/* ---------- Meal badge (tinted circle + icon) ---------- */
export function mealBadge(mealId, size = 'm') {
  const names = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };
  return h('span', { class: `meal-badge meal-badge--${mealId} meal-badge--${size}`, html: icon(mealId), title: names[mealId], 'aria-hidden': 'true' });
}

/* ---------- Outcome tiles: face + word + colour, never colour alone ---------- */
export function outcomeTiles({ onPick, selected = null, mode = 'action', size = '', labels, groupLabel = 'How did he eat?' }) {
  const items = [
    { id: 'well', icon: 'ateWell', label: labels?.well || 'Ate well' },
    { id: 'some', icon: 'ateSome', label: labels?.some || 'Ate some' },
    { id: 'not', icon: 'didNotEat', label: labels?.not || 'Did not eat' },
  ];
  const wrap = h('div', { class: `outcomes${size ? ' outcomes--' + size : ''}`, role: mode === 'radio' ? 'radiogroup' : 'group', 'aria-label': groupLabel });
  items.forEach((it) => {
    const b = h('button', {
      type: 'button',
      class: `outcome outcome--${it.id}`,
      role: mode === 'radio' ? 'radio' : null,
      'aria-checked': mode === 'radio' ? String(selected === it.id) : null,
    }, h('span', { class: 'outcome__face', html: icon(it.icon) }), h('span', { class: 'outcome__label', text: it.label }));
    b.addEventListener('click', () => {
      if (mode === 'radio') {
        const next = b.getAttribute('aria-checked') === 'true' ? null : it.id;
        wrap.querySelectorAll('.outcome').forEach((o) => o.setAttribute('aria-checked', 'false'));
        if (next) b.setAttribute('aria-checked', 'true');
        onPick?.(next);
      } else {
        b.classList.add('is-picked');
        haptic(12);
        onPick?.(it.id, b);
      }
    });
    wrap.append(b);
  });
  if (mode === 'radio') radioGroupKeys(wrap);
  return wrap;
}

/* ---------- Checkbox row (shopping list) ---------- */
export function checkRow({ label, meta = '', checked = false, onChange }) {
  const box = h('span', { class: 'checkbox', 'aria-hidden': 'true', html: icon('check') });
  const row = h('button', { type: 'button', class: 'row check-row', role: 'checkbox', 'aria-checked': String(checked) },
    box, h('span', { class: 'row__label', text: label }), meta ? h('span', { class: 'check-row__meta', text: meta }) : null);
  row.addEventListener('click', () => {
    const next = row.getAttribute('aria-checked') !== 'true';
    row.setAttribute('aria-checked', String(next));
    onChange?.(next, row);
  });
  return row;
}

/* ---------- Segmented control with icons (meal picker) ---------- */
export function mealSegmented({ value, onChange, meals }) {
  const group = segmented({ options: meals.map((m) => ({ id: m.id, name: m.name })), value, label: 'Meal', onChange });
  group.classList.add('segmented--icons');
  group.querySelectorAll('.segmented__opt').forEach((b, i) => { b.prepend(h('span', { class: 'segmented__icon', html: icon(meals[i].icon) })); });
  return group;
}

/* ---------- Menu sheet (••• actions) ---------- */
export function menuSheet({ title, items }) {
  let api;
  const list = h('div', { class: 'menu-list', role: 'menu' }, items.map((it) => {
    const b = h('button', { type: 'button', class: 'row row--compact' + (it.danger ? ' row--danger' : ''), role: 'menuitem' },
      h('span', { class: 'row__icon', html: icon(it.icon) }), h('span', { class: 'row__label t-body-l', text: it.label }));
    b.addEventListener('click', () => { api.close({ keepFocus: true }); it.onClick?.(); });
    return b;
  }));
  api = openSheet({ title, body: list });
  return api;
}

/* ---------- One Listening sheet for every mic (V01) ---------- */
export function listenSheet(opts) {
  askPermission('mic', { onAllow: () => openListen(opts) });
}
function openListen({ sub = 'Say it the way you would at home', sample = [], onDone, splitItems = true }) {
  let api, rec = null, fakeT = null;
  const heard = [];
  const chips = h('div', { class: 'chips listen__chips', 'aria-live': 'polite' });
  const label = h('span', { class: 't-label listen__label', text: 'We heard', hidden: true });
  const wave = h('div', { class: 'listen__wave is-on', 'aria-hidden': 'true' }, Array.from({ length: 13 }, (_, i) => h('span', { style: `--i:${i}` })));
  const mic = h('button', { type: 'button', class: 'listen__mic is-on', 'aria-label': 'Stop listening', html: icon('mic') });
  const status = h('p', { class: 'sr-only', 'aria-live': 'assertive', text: 'Listening' });
  const sub_ = h('p', { class: 'listen__msg', 'aria-live': 'polite' });

  const paint = () => {
    label.hidden = !heard.length;
    chips.replaceChildren(...heard.map((w, i) => {
      const c = h('button', { type: 'button', class: 'chip chip--heard', 'aria-label': `Remove ${w}` }, h('span', { text: w }), h('span', { class: 'contents', html: icon('close') }));
      c.addEventListener('click', () => { heard.splice(i, 1); paint(); });
      return c;
    }));
  };
  const addText = (text) => {
    const parts = splitItems ? text.split(/,| and | aur | और |\./i).map((x) => x.trim()).filter(Boolean) : [text.trim()];
    parts.forEach((p) => { const w = p.charAt(0).toUpperCase() + p.slice(1); if (!heard.includes(w)) heard.push(w); });
    paint();
  };
  const stop = () => {
    wave.classList.remove('is-on'); mic.classList.remove('is-on');
    mic.setAttribute('aria-label', 'Start listening'); status.textContent = 'Stopped listening';
    clearTimeout(fakeT); try { rec?.stop(); } catch { /* ignore */ } rec = null;
  };
  const start = () => {
    wave.classList.add('is-on'); mic.classList.add('is-on');
    mic.setAttribute('aria-label', 'Stop listening'); status.textContent = 'Listening';
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && !sim.on('voice')) {
      try {
        rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = false; rec.continuous = true;
        rec.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) addText(e.results[i][0].transcript); };
        rec.onerror = (e) => {
          stop();
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Microphone is off. You can still type.', { iconName: 'info' });
          else if (!heard.length && sample.length) sample.forEach(addText);
        };
        rec.onend = () => stop();
        rec.start();
        return;
      } catch { /* demo below */ }
    }
    if (sim.on('voice')) {
      fakeT = setTimeout(() => { stop(); status.textContent = 'We didn’t catch that'; sub_.textContent = 'We didn’t catch that. Tap the mic to try again, or close this and type.'; sub_.classList.add('msg--error'); }, 1800);
      return;
    }
    sub_.textContent = ''; sub_.classList.remove('msg--error');
    let i = 0;
    const next = () => { if (i < sample.length) { addText(sample[i++]); fakeT = setTimeout(next, 700); } else stop(); };
    fakeT = setTimeout(next, 900);
  };
  mic.addEventListener('click', () => (mic.classList.contains('is-on') ? stop() : start()));

  const done = button({ label: 'Done', onClick: () => { stop(); api.close(); onDone?.([...heard]); } });
  api = openSheet({
    title: 'Listening…',
    sub,
    body: h('div', { class: 'listen' }, wave, mic, status, sub_, label, chips),
    foot: done,
    onClose: () => stop(),
  });
  start();
  return api;
}

/* ---------- Lock-screen notification (K03, K07) ---------- */
export function lockNotification({ title, body, actions = [], onOpen }) {
  const phone = document.getElementById('phone');
  phone.querySelector('.lock')?.remove();
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const hh = now.getHours() % 12 || 12;
  const lock = h('div', { class: 'lock', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Lock screen notification' },
    h('div', { class: 'lock__wall', 'aria-hidden': 'true' }),
    h('div', { class: 'lock__clock', 'aria-hidden': 'true' },
      h('p', { class: 'lock__date', text: `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}` }),
      h('p', { class: 'lock__time', text: `${hh}:${String(now.getMinutes()).padStart(2, '0')}` })));
  const card = h('div', { class: 'notif' });
  const head = h('button', { type: 'button', class: 'notif__head', 'aria-label': `${title}. ${body}. Open Little Plate` },
    h('span', { class: 'notif__app', html: logo({ size: 26, label: '', detail: 'small' }) }),
    h('span', { class: 'notif__text' },
      h('span', { class: 'notif__meta' }, h('span', { text: 'little plate' }), h('span', { text: 'now' })),
      h('span', { class: 'notif__title', text: title }),
      h('span', { class: 'notif__body', text: body })));
  const acts = h('div', { class: 'notif__actions' + (actions.length === 2 ? ' notif__actions--2' : '') },
    actions.map((a) => {
      const b = h('button', { type: 'button', class: 'notif__btn', text: a.label });
      b.addEventListener('click', () => { close(); a.onClick?.(); });
      return b;
    }));
  card.append(head, acts);
  lock.append(card, h('p', { class: 'lock__hint', text: 'Tap the notification to open the app' }));
  head.addEventListener('click', () => { close(); onOpen?.(); });
  const onKey = (e) => { if (e.key === 'Escape') { close(); } };
  document.addEventListener('keydown', onKey);
  function close() {
    document.removeEventListener('keydown', onKey);
    lock.classList.add('is-leaving');
    setTimeout(() => lock.remove(), 380);
  }
  phone.append(lock);
  // Screen readers and keyboards land on the message; touch users see no ring.
  setTimeout(() => head.focus({ preventScroll: true, focusVisible: lastWasKeyboard }), 400);
  return { close };
}

/* ---------- Simulated reminders (prototype: ~8 s instead of 20–30 min) ---------- */
const timers = new Map();
export function scheduleReminder(id, fn, ms = DEMO_REMINDER_MS) {
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => { timers.delete(id); fn(); }, ms));
}
export function cancelReminder(id) { clearTimeout(timers.get(id)); timers.delete(id); }
const DEMO_REMINDER_MS = 8000;

/* ---------- Section label + list rows used across tabs ---------- */
export function sectionLabel(text, action) {
  return h('div', { class: 'section-label' }, h('h2', { class: 't-label', text }), action || null);
}

export function navRow({ title, sub, media, onClick, trail = 'forward', cls = '' }) {
  const b = h('button', { type: 'button', class: `row nav-row ${cls}`.trim() },
    media || null,
    h('span', { class: 'row__label' }, h('span', { class: 'nav-row__title', text: title }), sub ? h('span', { class: 'row__meta nav-row__sub', text: sub }) : null),
    trail ? h('span', { class: 'nav-row__chev', html: icon(trail) }) : null);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

export function thumb(src, cls = 'thumb') {
  return src ? h('img', { class: cls, src, alt: '', loading: 'lazy', decoding: 'async', width: '56', height: '56' })
    : h('span', { class: `${cls} ${cls}--icon`, html: icon('bowl') });
}

export function iconTile(name, tint = 'neutral') {
  return h('span', { class: `icon-tile icon-tile--${tint}`, html: icon(name), 'aria-hidden': 'true' });
}

export { currentRoute };

/** Short wait helper for simulated network. */
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export { DEMO };
