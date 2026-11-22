// Each route is a factory that returns { el, onEnter?, onLeave?, autofocus? }.
// Screens compose builders from components.js and read/write via store.js.

import { icon, logo } from './icons.js';
import {
  h, button, iconButton, topbar, textField, pickerField, micButton, chip, toggleRow,
  segmented, photoTile, choiceCard, radioGroupKeys, note, otpInput, lockupSmall,
  openSheet, confirmDialog, toast, comingSoon, smsBanner, watchOverflow, wait, nextId,
  focusIfKeyboard, reveal, tabBar,
} from './components.js';
import { seedReturning, typedFoodUnsafe } from './meals.js';
import { phulka } from './phulka.js';
import { navigate, back } from './router.js';
import {
  store, childName, nameOr, ageInMonths, ageLabel, findFood, unsafeAllergens, slug, backupIds, setBackups,
} from './store.js';
import {
  DEMO, ALLERGIES, MORE_ALLERGIES, HOUSE_RULES, DIETS, CUISINES, REGIONAL_CUISINES,
  FOODS, POPULAR_SEARCH, GOOGLE_ACCOUNTS, MONTHS, MONTHS_SHORT, AGE_RANGE, SETUP_STEPS,
  HERO_PHOTO, photoUrl, thumbUrl, MILK_PARTS,
} from './data.js';

/* ==========================================================================
   Shared helpers
   ========================================================================== */

/** Standard screen: optional top bar, scrolling body, pinned footer, optional tab bar. */
export function shell({ cls = '', bar, body = [], footer = [], label, tabs = null }) {
  const scroll = h('div', { class: 'screen__scroll' }, body);
  const foot = footer.length ? h('div', { class: 'screen__footer' + (tabs ? ' screen__footer--above-tabs' : '') }, footer) : null;
  const el = h('section', { class: `screen ${cls}${tabs ? ' screen--tabs' : ''}`.trim(), 'aria-label': label }, bar || null, scroll, foot, tabs ? tabBar(tabs) : null);
  let unwatch = () => {};
  if (foot) requestAnimationFrame(() => { unwatch = watchOverflow(scroll, foot); });
  // Hairline under the top bar once content scrolls beneath it (iOS pattern).
  scroll.addEventListener('scroll', () => el.classList.toggle('is-scrolled', scroll.scrollTop > 2), { passive: true });
  el.cleanup = () => unwatch();
  return { el, scroll, foot };
}

/** Stagger children in with the .rise animation. */
export function rise(nodes) {
  nodes.forEach((n, i) => { if (n) { n.classList.add('rise'); n.style.setProperty('--i', i); } });
  return nodes;
}

const fmtPhone = (digits) => (digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits);
const fullPhone = (digits) => `+91 ${fmtPhone(digits)}`;
const formatBirth = (b) => (b ? `${MONTHS[b.m]} ${b.y}` : '');

function allergyName(id) {
  const s = store.get();
  return ALLERGIES.find((a) => a.id === id)?.name
    || MILK_PARTS.find((a) => a.id === id)?.name
    || MORE_ALLERGIES.find((a) => a.id === id)?.name
    || s.customAllergies.find((a) => a.id === id)?.name
    || id;
}

export function joinNice(list, word = 'and') {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} ${word} ${list[list.length - 1]}`;
}

/** Footer message area for "pick at least one" style validation. */
export function footerMsg() {
  return h('p', { class: 'msg msg--error', 'aria-live': 'polite' });
}
export function showMsg(el, text) {
  el.innerHTML = '';
  if (!text) return;
  el.append(h('span', { html: icon('error'), class: 'contents' }), h('span', { text }));
  el.classList.remove('is-new'); void el.offsetWidth; el.classList.add('is-new');
}

/* ---------- Setup step navigation ---------- */
let lastStep = 0;

function stepIndex(name) { return SETUP_STEPS.indexOf(name) + 1; }

/**
 * After a successful sign-in. Data stays on the phone after "Sign out" (PR06),
 * so a parent who signs back in returns straight to Today.
 */
function afterSignIn(returning) {
  const s = store.get();
  lastStep = 0;
  if (s.setupDone) {
    navigate('today', { reset: true });
    toast(`Welcome back. ${nameOr('His')}’s meals are ready.`, { iconName: 'success' });
  } else if (returning) {
    store.restoreReturningProfile(seedReturning);
    navigate('ready', { reset: true });
    toast(`Welcome back. ${nameOr('His')}’s setup is ready.`, { iconName: 'success' });
  } else {
    navigate('child', { reset: true });
  }
}

/** Setup screens are reused from Profile ("Edit") — then they save and go back. */
const editing = (name) => store.get().ui.edit === name;
const contLabel = () => (SETUP_STEPS.some((n) => editing(n)) ? 'Save changes' : 'Continue');

function setupBar(name, { onBack } = {}) {
  if (editing(name)) return topbar({ onBack: () => { store.ui({ edit: null }); back(); } });
  const step = stepIndex(name);
  const from = lastStep && lastStep !== step ? Math.min(lastStep, 5) : step - 1;
  lastStep = step;
  return topbar({
    onBack: onBack || (() => back()),
    progress: { step, from },
    action: { label: 'Skip', onClick: () => skipStep(name) },
  });
}

function nextStep(name) {
  if (editing(name)) {
    store.ui({ edit: null });
    back();
    toast('Saved', { iconName: 'success' });
    return;
  }
  const i = SETUP_STEPS.indexOf(name);
  if (i < SETUP_STEPS.length - 1) navigate(SETUP_STEPS[i + 1]);
  else finishSetup();
}

function skipStep(name) {
  store.set((s) => { if (!s.skipped.includes(name)) s.skipped.push(name); });
  nextStep(name);
}

function markDone(name) {
  store.set((s) => { s.skipped = s.skipped.filter((x) => x !== name); });
}

function finishSetup() {
  store.set({ setupDone: true });
  lastStep = 0;
  navigate('ready', { reset: true });
}

/** Sign out: destructive, so it is confirmed. */
function confirmSignOut({ title = 'Sign out?', body } = {}) {
  const s = store.get();
  const who = s.session.method === 'google' && s.session.account
    ? s.session.account.email
    : (s.session.phone ? fullPhone(s.session.phone) : 'this phone');
  confirmDialog({
    title,
    body: body || `You are signed in as ${who}. Your setup on this phone will be cleared.`,
    confirmLabel: 'Sign out',
    onConfirm: () => {
      store.reset();
      lastStep = 0;
      navigate('welcome', { reset: true });
      toast('Signed out', { iconName: 'success' });
    },
  });
}

/* ---------- Search helpers ---------- */
const norm = (t) => t.toLowerCase().replace(/[-\s]+/g, ' ').trim();

function searchFoods(q) {
  const n = norm(q);
  if (!n) return [];
  const s = store.get();
  const pool = [...FOODS, ...s.foods.custom];
  const starts = pool.filter((f) => norm(f.name).startsWith(n));
  const contains = pool.filter((f) => !starts.includes(f) && norm(f.name).includes(n));
  return [...starts, ...contains].slice(0, 6);
}

function capitalise(t) {
  const x = t.trim().replace(/\s+/g, ' ');
  return x.charAt(0).toUpperCase() + x.slice(1);
}

function foodMedia(food, cls = 'row__thumb') {
  if (food?.photo) return h('img', { class: cls, src: thumbUrl(food.photo), alt: '', loading: 'lazy', decoding: 'async', width: '44', height: '44' });
  return h('span', { class: `${cls} ${cls}--icon`, html: icon('bowl') });
}

/* ==========================================================================
   S00 · Splash
   ========================================================================== */
export function splashScreen({ next }) {
  const el = h('section', { class: 'screen splash', 'aria-label': 'Little Plate is starting' },
    h('div', { class: 'splash__mark', html: logo({ size: 130, label: 'Little Plate logo', steam: true }) }),
    h('h1', { class: 'splash__word', text: 'little plate' }),
    h('p', { class: 'splash__tag', text: 'Know what to feed your toddler, right now' }));
  let t1, t2, gone = false;
  const leave = () => {
    if (gone) return; gone = true;
    clearTimeout(t1);
    el.classList.add('is-leaving');
    t2 = setTimeout(() => next(), 120);
  };
  // Mascot spec: "Tap skips it."
  el.addEventListener('click', leave);
  return {
    el,
    onEnter() { t1 = setTimeout(leave, 1640); }, // + ~360 ms fade-in ≈ 2 s on screen

    onLeave() { clearTimeout(t1); clearTimeout(t2); },
    autofocus() {},
  };
}

/* ==========================================================================
   W01 · Welcome
   ========================================================================== */
export function welcomeScreen() {
  const go = (mode) => {
    store.set((s) => { s.pending.mode = mode; });
    navigate('signin');
  };
  // Before setup we don't know the child's gender: neutral wording.
  const points = ['3 ideas for your toddler’s next meal', 'Made from food your family already eats', 'No diaries or meal plans to fill'];
  const hero = h('img', {
    class: 'welcome__hero',
    src: photoUrl(HERO_PHOTO),
    alt: 'A steel thali with dal, rice, roti and vegetables next to a small bowl of khichdi',
    width: '362', height: '280', fetchpriority: 'high', decoding: 'async',
  });
  const title = h('h1', { class: 'welcome__title t-display', text: 'Know what to feed your toddler, right now' });
  const list = h('ul', { class: 'welcome__points', 'aria-label': 'What Little Plate does' },
    points.map((p) => h('li', { class: 'welcome__point' }, h('span', { html: icon('check'), class: 'contents' }), h('span', { text: p }))));

  const { el, scroll } = shell({
    cls: 'welcome',
    label: 'Welcome',
    bar: h('header', { class: 'welcome__brand' }, lockupSmall()),
    body: rise([hero, title, list]),
    footer: [
      button({ label: 'Get started', onClick: () => go('new') }),
      button({ label: 'I already have an account', variant: 'text', onClick: () => go('returning') }),
    ],
  });
  void scroll;
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   W02 · Sign in (phone, or Google)
   ========================================================================== */
export function signinScreen() {
  const s = store.get();
  const returning = s.pending.mode === 'returning';
  let digits = s.pending.phone || '';

  const field = textField({
    label: 'Mobile number',
    prefix: '+91',
    type: 'tel',
    inputmode: 'numeric',
    autocomplete: 'tel-national',
    maxlength: '11',
    placeholder: '98765 43210',
    value: fmtPhone(digits),
    enterkeyhint: 'send',
    onInput: (e) => {
      const input = e.target;
      const raw = input.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10);
      digits = raw;
      const formatted = fmtPhone(raw);
      if (input.value !== formatted) input.value = formatted;
      paintValid();
    },
    onEnter: () => submit(),
  });
  const validMark = h('span', { class: 'field__valid', html: icon('success'), 'aria-hidden': 'true' });
  field.control.append(validMark);
  function paintValid() { validMark.classList.toggle('is-on', /^[6-9]\d{9}$/.test(digits)); }
  paintValid();

  const sendBtn = button({ label: 'Send code', onClick: () => submit() });

  async function submit() {
    if (!digits.length) { field.setError('Please enter your mobile number.'); field.input.focus(); return; }
    if (digits.length !== 10) { field.setError('Please enter all 10 digits of your mobile number.'); field.input.focus(); return; }
    if (!/^[6-9]/.test(digits)) { field.setError('Indian mobile numbers start with 6, 7, 8 or 9. Please check it.'); field.input.focus(); return; }
    field.setError('');
    sendBtn.setLoading(true, 'Sending code…');
    await wait(DEMO.sendMs);
    store.set((st) => { st.pending.phone = digits; });
    sendBtn.setLoading(false);
    navigate('code');
  }

  // Google's own "G" mark, as in every app that offers Google sign-in (users look for it).
  const googleBtn = button({ label: 'Continue with Google', variant: 'secondary', iconName: 'google', cls: 'btn--google', onClick: () => openGoogleSheet(returning) });
  const terms = h('p', { class: 'signin__terms' },
    'By continuing you agree to the ',
    h('button', { type: 'button', class: 'link link--inline', text: 'Terms', onClick: () => comingSoon('Terms') }),
    ' and ',
    h('button', { type: 'button', class: 'link link--inline', text: 'Privacy Policy', onClick: () => comingSoon('Privacy Policy') }),
    '.');

  const title = h('h1', { class: 'screen-title t-title-l', text: returning ? 'Welcome back' : 'Your mobile number' });
  const lead = returning ? h('p', { class: 'screen-lead', text: 'Sign in with the number you used before. We will bring back his setup.' }) : null;

  const { el } = shell({
    label: 'Sign in',
    bar: topbar({ onBack: () => back() }),
    body: [title, lead, h('div', { class: 'signin__field' }, field), h('div', { class: 'divider-or', text: 'or' }), googleBtn, terms],
    footer: [sendBtn],
  });
  return {
    el,
    onLeave: el.cleanup,
    autofocus: () => field.input.focus({ preventScroll: true }),
  };
}

function openGoogleSheet(returning) {
  let api;
  const rows = GOOGLE_ACCOUNTS.map((acc) => {
    const row = h('button', { type: 'button', class: 'row row--compact' },
      h('span', { class: 'account__avatar', text: acc.initial, 'aria-hidden': 'true' }),
      h('span', { class: 'row__label' }, h('span', { class: 't-body-l-strong', text: acc.name }), h('span', { class: 'row__meta', text: acc.email })));
    row.addEventListener('click', async () => {
      if (row.dataset.busy) return;
      row.dataset.busy = '1';
      row.setAttribute('aria-busy', 'true');
      row.append(h('span', { class: 'spinner', 'aria-hidden': 'true' }));
      await wait(900);
      api.close({ keepFocus: true });
      store.set((st) => {
        st.session = { signedIn: true, method: 'google', phone: '', account: acc };
        if (!st.parentName) st.parentName = acc.name.split(' ')[0];
      });
      const hadData = store.get().setupDone;
      afterSignIn(returning);
      if (!hadData && !returning) toast(`Signed in as ${acc.name}`, { iconName: 'success' });
    });
    return row;
  });
  const other = h('button', { type: 'button', class: 'row row--compact' },
    h('span', { class: 'account__avatar', html: icon('user'), 'aria-hidden': 'true' }),
    h('span', { class: 'row__label t-body-l', text: 'Use another account' }));
  other.addEventListener('click', () => comingSoon('Adding another Google account'));
  api = openSheet({
    title: 'Choose an account',
    sub: 'to continue to Little Plate',
    body: h('div', {},
      h('p', { class: 'google-brand' }, h('span', { class: 'contents', html: icon('google') }), h('span', { text: 'Sign in with Google' })),
      h('div', { role: 'list' }, rows.map((r) => h('div', { role: 'listitem' }, r)), h('div', { role: 'listitem' }, other))),
    foot: h('p', { class: 't-caption t-secondary', text: 'Google will share your name and email with Little Plate. We never post anything.' }),
  });
}

/* ==========================================================================
   W03 / E07 · Enter code
   ========================================================================== */
export function codeScreen() {
  const s = store.get();
  const digits = s.pending.phone;
  const returning = s.pending.mode === 'returning';
  let seconds = DEMO.resendSeconds;
  let timer = null, smsTimer = null, banner = null, checking = false;

  const errorMsg = h('p', { class: 'msg msg--error', 'aria-live': 'assertive' });
  const timerEl = h('p', { class: 'code__timer', 'aria-live': 'off' });
  const resendBtn = h('button', { type: 'button', class: 'link code__resend', onClick: () => resend() },
    h('span', { html: icon('refresh'), class: 'contents' }), h('span', { text: 'Send a new code' }));
  const status = h('div', { class: 'code__status' }, errorMsg, timerEl, resendBtn);
  const sr = h('p', { class: 'sr-only', 'aria-live': 'polite' });

  const otp = otpInput({ onComplete: (code) => verify(code) });
  otp.classList.add('code__otp');
  otp.input.addEventListener('keydown', (e) => {
    if (otp.classList.contains('is-error') && (/^\d$/.test(e.key) || e.key === 'Backspace')) {
      otp.clear();
      otp.setError(false);
      showMsg(errorMsg, '');
      renderStatus();
    }
  });

  function renderStatus() {
    const err = otp.classList.contains('is-error');
    if (checking) {
      timerEl.innerHTML = '';
      timerEl.append(h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('span', { text: 'Checking the code…' }));
      timerEl.hidden = false; resendBtn.hidden = true;
      return;
    }
    if (err || seconds <= 0) {
      timerEl.hidden = true; resendBtn.hidden = false;
    } else {
      timerEl.hidden = false; resendBtn.hidden = true;
      timerEl.textContent = `Send again in 0:${String(seconds).padStart(2, '0')}`;
    }
  }

  function startTimer() {
    clearInterval(timer);
    seconds = DEMO.resendSeconds;
    renderStatus();
    timer = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) { clearInterval(timer); seconds = 0; }
      if (!checking) renderStatus();
    }, 1000);
  }

  function scheduleSms() {
    clearTimeout(smsTimer);
    smsTimer = setTimeout(() => {
      banner = smsBanner({ code: DEMO.otp, onTap: () => { otp.focus(); otp.fill(DEMO.otp); } });
    }, DEMO.smsDelayMs);
  }

  async function verify(code) {
    if (checking) return;
    checking = true;
    banner?.hide();
    otp.setChecking(true);
    renderStatus();
    sr.textContent = 'Checking the code';
    await wait(DEMO.verifyMs);
    checking = false;
    otp.setChecking(false);
    if (code === DEMO.otp) {
      clearInterval(timer);
      store.set((st) => {
        st.session = { signedIn: true, method: 'phone', phone: digits, account: null };
      });
      sr.textContent = 'Code accepted';
      afterSignIn(returning);
    } else {
      otp.setError(true);
      showMsg(errorMsg, 'That code is not right. Check the SMS and try again.');
      renderStatus();
      if (navigator.vibrate) navigator.vibrate(60);
    }
  }

  let resends = 0;
  function resend() {
    // Edge case: too many codes. Real SMS providers rate-limit; say what to do instead.
    if (resends >= 3) {
      showMsg(errorMsg, 'You asked for 3 new codes. Please wait 10 minutes, or go back and continue with Google.');
      resendBtn.hidden = true;
      return;
    }
    resends += 1;
    otp.clear();
    otp.setError(false);
    showMsg(errorMsg, '');
    startTimer();
    toast(`New code sent to ${fullPhone(digits)}`, { iconName: 'success' });
    scheduleSms();
    otp.focus();
  }

  const title = h('h1', { class: 'screen-title t-title-l', text: 'Enter the 6-digit code' });
  const sent = h('p', { class: 'code__sent' },
    h('span', { text: `Sent to ${fullPhone(digits)}` }),
    h('button', { type: 'button', class: 'link', text: 'Change', 'aria-label': 'Change mobile number', onClick: () => back() }));

  const { el } = shell({
    label: 'Enter code',
    bar: topbar({ onBack: () => back() }),
    body: [title, sent, otp, status, sr],
  });
  renderStatus();
  return {
    el,
    onEnter() { startTimer(); scheduleSms(); },
    onLeave() { clearInterval(timer); clearTimeout(smsTimer); banner?.hide(); el.cleanup(); },
    autofocus: () => otp.focus(),
  };
}

/* ==========================================================================
   W04 · About your child
   ========================================================================== */
export function childScreen() {
  const s = store.get();
  let birth = s.child.birth;

  const nameField = textField({
    label: 'Child’s name',
    placeholder: 'e.g. Aarav',
    value: s.child.name,
    autocomplete: 'off',
    autocapitalize: 'words',
    maxlength: '30',
    enterkeyhint: 'next',
    onInput: (e) => {
      store.set((st) => { st.child.name = e.target.value; });
      updateHelp();
    },
    onEnter: () => { if (!birth) openPicker(); else submit(); },
  });

  const picker = pickerField({
    label: 'Month and year of birth',
    value: formatBirth(birth),
    placeholder: 'Pick month and year',
    onOpen: () => openPicker(),
  });

  function updateHelp() {
    const months = ageInMonths(birth);
    if (months == null) { picker.setHelp('We use age for safe textures and amounts.'); return; }
    const who = childName() || 'Your child';
    picker.setHelp(`${who} is ${ageLabel(months)} old. We use age for safe textures and amounts.`);
  }

  function ageError(b) {
    const m = ageInMonths(b);
    if (m < AGE_RANGE.minMonths) return 'Little Plate is for children from 6 months. Below that, your doctor’s advice comes first.';
    if (m > AGE_RANGE.maxMonths) return 'Little Plate is made for children up to 4 years.';
    return '';
  }

  function openPicker() {
    const now = new Date();
    const minYear = now.getFullYear() - 4;
    let year = birth?.y ?? now.getFullYear() - 1;
    let month = birth?.m ?? null;
    let pickedYear = birth?.y ?? null;
    let api;

    const yearLabel = h('span', { class: 'year-stepper__value', 'aria-live': 'polite' });
    const prev = iconButton({ iconName: 'back', label: 'Previous year', variant: 'filled' });
    const next = iconButton({ iconName: 'forward', label: 'Next year', variant: 'filled' });
    const grid = h('div', { class: 'month-grid', role: 'radiogroup', 'aria-label': 'Month' });
    const doneBtn = button({ label: 'Done', onClick: () => commit() });
    const err = h('p', { class: 'msg msg--error', 'aria-live': 'polite' });

    function paint() {
      yearLabel.textContent = String(year);
      prev.disabled = year <= minYear;
      next.disabled = year >= now.getFullYear();
      grid.replaceChildren(...MONTHS_SHORT.map((label, i) => {
        const future = year === now.getFullYear() && i > now.getMonth();
        const on = pickedYear === year && month === i;
        const c = chip({
          label, checked: on, role: 'radio', disabled: future,
          onToggle: () => {
            if (future) { showMsg(err, 'That month has not come yet.'); return; }
            month = i; pickedYear = year; showMsg(err, ''); paint();
            focusIfKeyboard(grid.querySelector('[aria-checked="true"]'));
          },
        });
        c.setAttribute('aria-label', `${MONTHS[i]} ${year}${future ? ', not available' : ''}`);
        return c;
      }));
      radioGroupKeys(grid);
      doneBtn.setLabel(month != null && pickedYear != null ? `Done · ${MONTHS[month]} ${pickedYear}` : 'Done');
    }
    prev.addEventListener('click', () => { if (year > minYear) { year -= 1; paint(); } });
    next.addEventListener('click', () => { if (year < now.getFullYear()) { year += 1; paint(); } });

    function commit() {
      if (month == null || pickedYear == null) { showMsg(err, 'Please pick the birth month.'); return; }
      birth = { y: pickedYear, m: month };
      store.set((st) => { st.child.birth = birth; });
      picker.setValue(formatBirth(birth));
      picker.setError(ageError(birth));
      updateHelp();
      api.close();
    }

    paint();
    api = openSheet({
      title: 'Month and year of birth',
      sub: 'We only need the month, not the day.',
      body: h('div', {}, h('div', { class: 'year-stepper' }, prev, yearLabel, next), grid, err),
      foot: doneBtn,
      initialFocus: '.month-grid [tabindex="0"]',
    });
  }

  // Boy or girl: decides he/him or she/her everywhere in the app (no pronouns in this copy).
  let gender = s.child.gender || null;
  const genderErr = h('p', { class: 'msg msg--error', 'aria-live': 'polite' });
  const genderChips = h('div', { class: 'chips gender-chips', role: 'radiogroup', 'aria-labelledby': 'gender-label' });
  const paintGender = () => {
    genderChips.replaceChildren(...[['boy', 'Boy'], ['girl', 'Girl']].map(([id, label]) => chip({
      label, role: 'radio', checked: gender === id,
      onToggle: () => {
        gender = id;
        store.set((st) => { st.child.gender = id; });
        showMsg(genderErr, '');
        paintGender();
        focusIfKeyboard(genderChips.querySelector('[aria-checked="true"]'));
      },
    })));
    radioGroupKeys(genderChips);
  };
  paintGender();
  const genderField = h('div', { class: 'field' },
    h('span', { class: 'field__label', id: 'gender-label', text: 'Boy or girl?' }),
    genderChips, genderErr,
    h('p', { class: 'field__help', text: 'So the app talks about your child the right way.' }));

  const cont = button({ label: contLabel(), onClick: () => submit() });
  function submit() {
    const name = nameField.input.value.trim();
    let ok = true;
    if (name.length < 2) { nameField.setError('Please type at least 2 letters.'); ok = false; }
    else if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(name)) { nameField.setError('Please use letters only.'); ok = false; }
    if (!gender) { showMsg(genderErr, 'Please pick boy or girl.'); ok = false; }
    if (!birth) { picker.setError('Please pick the month and year of birth.'); ok = false; }
    else {
      const e = ageError(birth);
      if (e) { picker.setError(e); ok = false; }
    }
    if (!ok) {
      if (name.length < 2) nameField.input.focus();
      else if (!gender) reveal(genderChips);
      else picker.control.focus();
      return;
    }
    store.set((st) => { st.child.name = capitalise(name); });
    markDone('child');
    nextStep('child');
  }

  updateHelp();
  const { el } = shell({
    label: 'Setup step 1 of 5: your child',
    bar: setupBar('child', { onBack: () => confirmSignOut({ title: 'Go back to sign in?', body: 'You will be signed out on this phone. You can sign in again with the same number.' }) }),
    body: [h('h1', { class: 'screen-title t-title-l', text: 'Who are we feeding?' }), h('div', { class: 'child__fields' }, nameField, genderField, picker)],
    footer: [cont],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   W05 · Allergies and house rules
   ========================================================================== */
export function allergiesScreen() {
  const s0 = store.get();
  const who = nameOr('him');
  const chipsWrap = h('div', { class: 'chips', role: 'group', 'aria-label': 'Allergies' });
  const err = footerMsg();
  const chipMap = new Map();
  const summary = h('div', { class: 'allergy-summary', 'aria-live': 'polite' });

  /** Says, in words, what the selection means for him (never colour alone). */
  function paintSummary() {
    const s = store.get();
    const kid = childName() || 'your child';
    summary.replaceChildren();
    if (s.noKnownAllergies) {
      summary.append(note({ kind: 'success', iconName: 'success', text: `No known allergies. You can add one any time from Profile.` }));
    } else if (s.allergies.length) {
      // Milk counts as milk only, plus the milk foods the parent picked below.
      const list = s.allergies.flatMap((a) => (a === 'milk' ? ['milk', ...(Array.isArray(s.milkAlso) ? s.milkAlso : [])] : [a]));
      const names = joinNice(list.map(allergyName).map((n) => n.toLowerCase()));
      summary.append(note({ kind: 'error', iconName: 'shieldAlert', text: `We will never suggest food with ${names} to ${kid}.` }));
    }
    paintMilk();
  }

  /* Milk is not assumed to cover curd, paneer or ghee: we ask. Many children with a milk
     allergy react to all of them, some are fine with ghee or curd. Only the parent (and
     the child's doctor) know, so the answer is required, and "not sure" means avoid. */
  const milkQ = h('section', { class: 'milk-q', 'aria-labelledby': 'milk-q-t', hidden: true });
  const milkErr = h('p', { class: 'msg msg--error', 'aria-live': 'polite' });
  function paintMilk() {
    const s = store.get();
    const on = s.allergies.includes('milk');
    milkQ.hidden = !on;
    if (!on) return;
    const also = Array.isArray(s.milkAlso) ? s.milkAlso : null;
    const set = (next) => {
      store.set((st) => { st.milkAlso = next; });
      showMsg(milkErr, ''); showMsg(err, '');
      paintSummary();
    };
    const confirmRelax = (label, apply) => {
      if (!editing('allergies')) { apply(); return; }
      confirmDialog({
        title: `Allow ${label}?`,
        body: `Please check with ${nameOr('his')}’s doctor first. After this, ideas may include ${label}.`,
        confirmLabel: 'Allow', cancelLabel: 'Keep avoiding', onConfirm: apply,
      });
    };
    const parts = MILK_PARTS.map((p) => chip({
      label: p.long, kind: 'allergy', role: 'checkbox', checked: !!also && also.includes(p.id),
      onToggle: (picked) => {
        const cur = Array.isArray(store.get().milkAlso) ? store.get().milkAlso : [];
        if (picked) set([...new Set([...cur, p.id])]);
        else confirmRelax(p.name.toLowerCase(), () => set(cur.filter((x) => x !== p.id)));
      },
    }));
    const onlyMilk = chip({
      label: 'No, only milk', role: 'checkbox', checked: !!also && also.length === 0,
      onToggle: (picked) => {
        if (!picked) { set(null); return; }
        const cur = Array.isArray(store.get().milkAlso) ? store.get().milkAlso : [];
        if (cur.length) confirmRelax(joinNice(cur.map((id) => MILK_PARTS.find((p) => p.id === id).name.toLowerCase())), () => set([]));
        else set([]);
      },
    });
    milkQ.replaceChildren(
      h('h3', { class: 'milk-q__title', id: 'milk-q-t', text: `Does ${childName() || 'your child'} also react to these?` }),
      h('p', { class: 'milk-q__help', text: 'Milk allergy here means milk only. Pick any of these to avoid too. Not sure? Pick them, and ask your doctor.' }),
      h('div', { class: 'chips', role: 'group', 'aria-labelledby': 'milk-q-t' }, ...parts, onlyMilk),
      milkErr);
  }

  function paintChips(newId) {
    const s = store.get();
    chipMap.clear();
    const none = chip({
      label: 'No known allergies',
      checked: s.noKnownAllergies,
      onToggle: (on) => {
        store.set((st) => { st.noKnownAllergies = on; if (on) st.allergies = []; });
        showMsg(err, '');
        paintChips();
      },
    });
    const all = [...ALLERGIES, ...s.customAllergies];
    const items = all.map((a) => {
      const c = chip({
        label: a.name,
        kind: 'allergy',
        checked: s.allergies.includes(a.id),
        onToggle: (on) => {
          const apply = () => {
            store.set((st) => {
              st.noKnownAllergies = false;
              st.allergies = on ? [...new Set([...st.allergies, a.id])] : st.allergies.filter((x) => x !== a.id);
              if (a.id === 'milk' && !on) st.milkAlso = null; // ask again if milk is added back
            });
            showMsg(err, '');
            none.setChecked(false);
            c.setChecked(on);
            paintSummary();
          };
          // From Profile, removing an allergy is a safety change: confirm, and point to his doctor.
          if (!on && editing('allergies')) {
            confirmDialog({
              title: `Remove ${a.name.toLowerCase()}?`,
              body: `Please check with his doctor first. After this, ideas may include ${a.name.toLowerCase()}.`,
              confirmLabel: 'Remove',
              cancelLabel: 'Keep it',
              onConfirm: apply,
            });
            return;
          }
          apply();
        },
      });
      if (a.id === newId) c.classList.add('is-new');
      chipMap.set(a.id, c);
      return c;
    });
    const add = chip({ label: 'Add another', kind: 'add', role: 'button', onToggle: () => openAddAllergy() });
    add.setAttribute('aria-haspopup', 'dialog');
    chipsWrap.replaceChildren(none, ...items, add);
    paintSummary();
  }

  function openAddAllergy() {
    let api;
    const picked = new Set();
    const field = textField({ label: 'Allergy', placeholder: 'e.g. Sesame', autocapitalize: 'words', onEnter: () => save() });
    field.control.append(micButton({ input: field.input, sample: 'Sesame' }));
    const s = store.get();
    const available = MORE_ALLERGIES.filter((a) => !s.customAllergies.some((c) => c.id === a.id));
    const chips = h('div', { class: 'chips sheet-chips', role: 'group', 'aria-label': 'Common allergies' },
      available.map((a) => chip({
        label: a.name, kind: 'allergy',
        onToggle: (on, c) => { on ? picked.add(a.id) : picked.delete(a.id); c.setChecked(on); label(); },
      })));
    const saveBtn = button({ label: 'Add allergy', onClick: () => save() });
    const err2 = h('p', { class: 'msg msg--error', 'aria-live': 'polite' });
    field.input.addEventListener('input', () => { label(); showMsg(err2, ''); });

    function label() {
      const n = picked.size + (field.input.value.trim() ? 1 : 0);
      saveBtn.setLabel(n > 1 ? `Add ${n} allergies` : 'Add allergy');
    }
    function save() {
      const typed = field.input.value.trim();
      if (!typed && !picked.size) { showMsg(err2, 'Type an allergy or pick one below.'); return; }
      if (typed && typed.length < 2) { showMsg(err2, 'Please type at least 2 letters.'); return; }
      const added = [];
      let lastId = null;
      store.set((st) => {
        picked.forEach((id) => {
          const a = MORE_ALLERGIES.find((x) => x.id === id);
          if (!st.customAllergies.some((c) => c.id === id)) st.customAllergies.push({ ...a });
          if (!st.allergies.includes(id)) st.allergies.push(id);
          added.push(a.name); lastId = id;
        });
        if (typed) {
          const existing = [...ALLERGIES, ...st.customAllergies].find((a) => a.name.toLowerCase() === typed.toLowerCase());
          const id = existing ? existing.id : slug(typed);
          if (!existing) st.customAllergies.push({ id, name: capitalise(typed) });
          if (!st.allergies.includes(id)) st.allergies.push(id);
          added.push(existing ? existing.name : capitalise(typed)); lastId = id;
        }
        st.noKnownAllergies = false;
      });
      api.close();
      paintChips(lastId);
      showMsg(err, '');
      toast(`Added ${joinNice(added)}. We will never suggest ${added.length > 1 ? 'these' : 'it'}.`, { iconName: 'shieldAlert' });
    }

    api = openSheet({
      title: 'Add an allergy',
      sub: 'Type it, say it, or pick from the list',
      body: h('div', {}, field, err2, h('span', { class: 't-label', text: 'Or pick all that apply' }), available.length ? chips : h('p', { class: 'sheet-empty', text: 'All the common ones are already on his list.' })),
      foot: saveBtn,
      initialFocus: 'input',
    });
  }

  const rules = h('div', { class: 'list-card', role: 'group', 'aria-label': 'House rules' },
    HOUSE_RULES.map((r) => toggleRow({
      label: r.name,
      iconName: r.icon,
      checked: Boolean(s0.rules[r.id]),
      onChange: (on) => store.set((st) => { st.rules[r.id] = on; }),
    })));

  paintChips();

  const cont = button({
    label: contLabel(),
    onClick: () => {
      const s = store.get();
      if (!s.noKnownAllergies && !s.allergies.length) {
        showMsg(err, 'Pick his allergies, or tap “No known allergies”.');
        reveal(chipsWrap);
        return;
      }
      if (s.allergies.includes('milk') && !Array.isArray(s.milkAlso)) {
        showMsg(milkErr, 'Pick curd, paneer or ghee to avoid them too, or “No, only milk”.');
        showMsg(err, 'Please answer the milk question.');
        reveal(milkQ);
        return;
      }
      markDone('allergies');
      nextStep('allergies');
    },
  });

  const { el } = shell({
    cls: 'allergies',
    label: 'Setup step 2 of 5: allergies and house rules',
    bar: setupBar('allergies'),
    body: [
      h('h1', { class: 'screen-title t-title-l', text: 'Allergies and house rules' }),
      h('section', { class: 'section', 'aria-labelledby': 'sec-allergy' },
        h('h2', { class: 'section__title t-title-m', id: 'sec-allergy', text: 'Allergies' }),
        h('p', { class: 'section__help', text: 'We never suggest these foods' }),
        chipsWrap,
        milkQ,
        summary),
      h('section', { class: 'section', 'aria-labelledby': 'sec-rules' },
        h('h2', { class: 'section__title t-title-m', id: 'sec-rules', text: 'House rules' }),
        h('p', { class: 'section__help', text: `Shown to everyone who feeds ${who}` }),
        rules),
    ],
    footer: [err, cont],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   W06 · Family food (+ W06b Mixed or other)
   ========================================================================== */
export function familyScreen() {
  const s0 = store.get();
  const err = footerMsg();
  const tiles = new Map();

  const diet = segmented({
    options: DIETS,
    value: s0.diet,
    label: 'What your family eats',
    onChange: (id) => store.set((st) => { st.diet = id; }),
  });
  diet.classList.add('family__diet');

  const mixedSummary = () => {
    const m = store.get().mixed;
    if (m.regions.length) return m.regions.join(', ');
    if (m.text) return m.text;
    return 'Tell us in your words';
  };

  const grid = h('div', { class: 'tiles family__tiles', role: 'group', 'aria-label': 'Cuisines your family cooks. Pick all that fit.' },
    CUISINES.map((c) => {
      const t = photoTile({
        title: c.name,
        meta: c.opensSheet ? mixedSummary() : c.meta,
        src: photoUrl(c.photo),
        checked: s0.cuisines.includes(c.id),
        onToggle: (on) => {
          if (c.opensSheet) { openMixed(t); return; }
          store.set((st) => {
            st.cuisines = on ? [...new Set([...st.cuisines, c.id])] : st.cuisines.filter((x) => x !== c.id);
          });
          t.setChecked(on);
          showMsg(err, '');
        },
      });
      if (c.opensSheet) t.setAttribute('aria-haspopup', 'dialog');
      tiles.set(c.id, t);
      return t;
    }));

  function openMixed(tile) {
    const s = store.get();
    const regions = new Set(s.mixed.regions);
    let api;
    const field = textField({
      placeholder: 'e.g. Konkani at home, Punjabi on Sundays',
      value: s.mixed.text,
      onEnter: () => save(),
    });
    field.input.setAttribute('aria-label', 'Your family’s food, in your words');
    field.control.append(micButton({ input: field.input, sample: 'Konkani at home, Punjabi on Sundays' }));
    const chips = h('div', { class: 'chips sheet-chips', role: 'group', 'aria-label': 'Regional cuisines' },
      REGIONAL_CUISINES.map((r) => chip({
        label: r, checked: regions.has(r),
        onToggle: (on, c) => { on ? regions.add(r) : regions.delete(r); c.setChecked(on); },
      })));

    function save() {
      const text = field.input.value.trim();
      const has = Boolean(text || regions.size);
      store.set((st) => {
        st.mixed = { text, regions: [...regions] };
        st.cuisines = has ? [...new Set([...st.cuisines, 'mixed'])] : st.cuisines.filter((x) => x !== 'mixed');
      });
      tile.setChecked(has);
      tile.setMeta(mixedSummary());
      api.close();
      showMsg(err, '');
      toast(has ? 'Saved your family food' : 'Removed “Mixed or other”', { iconName: has ? 'success' : 'info' });
    }

    api = openSheet({
      title: 'Mixed or other',
      sub: 'Tell us in your own words',
      body: h('div', {}, field, h('span', { class: 't-label', text: 'Or pick all that fit' }), chips),
      foot: button({ label: 'Save family food', onClick: () => save() }),
      initialFocus: 'input',
    });
  }

  const cont = button({
    label: contLabel(),
    onClick: () => {
      if (!store.get().cuisines.length) {
        showMsg(err, 'Pick at least one, or tap Skip.');
        reveal(grid);
        return;
      }
      markDone('family');
      nextStep('family');
    },
  });

  const { el } = shell({
    label: 'Setup step 3 of 5: family food',
    bar: setupBar('family'),
    body: [h('h1', { class: 'screen-title t-title-l', text: 'Your family’s food' }), diet, grid],
    footer: [err, cont],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   W07 · Foods he eats (+ W07b Add a food he eats)
   ========================================================================== */
export function foodsScreen() {
  const err = footerMsg();
  const chipsWrap = h('div', { class: 'chips foods__chips', role: 'group', 'aria-label': 'Foods he eats. Pick a few.' });

  function paint(newIds = []) {
    const s = store.get();
    const nodes = s.foods.list.map((id) => {
      const f = findFood(id);
      if (!f) return null;
      const bad = unsafeAllergens(f);
      const c = chip({
        label: f.name,
        checked: s.foods.selected.includes(id) && !bad.length,
        thumb: f.photo ? thumbUrl(f.photo) : undefined,
        thumbIcon: f.photo ? undefined : 'bowl',
        disabled: bad.length > 0,
        blocked: bad.length > 0,
        onToggle: (on) => {
          if (bad.length) {
            toast(`${f.name} has ${joinNice(bad.map(allergyName)).toLowerCase()}. It is on ${nameOr('his')}’s allergy list.`, { iconName: 'shieldAlert' });
            return;
          }
          store.set((st) => {
            st.foods.selected = on ? [...new Set([...st.foods.selected, id])] : st.foods.selected.filter((x) => x !== id);
          });
          c.setChecked(on);
          showMsg(err, '');
        },
      });
      if (bad.length) c.setAttribute('aria-label', `${f.name}, not safe: has ${joinNice(bad.map(allergyName))}`);
      if (newIds.includes(id)) c.classList.add('is-new');
      return c;
    });
    const add = chip({ label: 'Add another', kind: 'add', role: 'button', onToggle: () => openAddFood() });
    add.setAttribute('aria-haspopup', 'dialog');
    chipsWrap.replaceChildren(...nodes.filter(Boolean), add);
  }

  function addFood(food) {
    store.set((st) => {
      if (food.id.startsWith('custom-') && !st.foods.custom.some((c) => c.id === food.id)) st.foods.custom.push(food);
      if (!st.foods.list.includes(food.id)) st.foods.list.push(food.id);
      if (!st.foods.selected.includes(food.id)) st.foods.selected.push(food.id);
    });
    paint([food.id]);
    showMsg(err, '');
  }

  function removeFood(food, wasInList) {
    store.set((st) => {
      st.foods.selected = st.foods.selected.filter((x) => x !== food.id);
      if (!wasInList) {
        st.foods.list = st.foods.list.filter((x) => x !== food.id);
        st.foods.custom = st.foods.custom.filter((x) => x.id !== food.id);
      }
    });
    paint();
  }

  function openAddFood() {
    const field = textField({ leadIcon: 'search', placeholder: 'Search or add a food', type: 'search', enterkeyhint: 'search' });
    field.input.setAttribute('aria-label', 'Search or add a food');
    field.input.setAttribute('aria-controls', 'food-results');
    field.control.append(micButton({ input: field.input, sample: 'Ragi laddoo' }));
    field.classList.add('sheet-search');
    const results = h('div', { id: 'food-results', role: 'list', 'aria-live': 'polite' });
    const who = nameOr('him');

    function row(food, { typed = false } = {}) {
      const s = store.get();
      const inList = s.foods.selected.includes(food.id);
      // Typed names are checked too: "Egg" or "peanut chikki" is blocked for an allergic child.
      const bad = typed ? typedFoodUnsafe(food.name).map((u) => u.id) : unsafeAllergens(food);
      const r = h('button', {
        type: 'button',
        class: 'row row--compact' + (inList ? ' is-added' : '') + (bad.length ? ' is-blocked' : ''),
        'aria-label': bad.length ? `${food.name}, not safe, has ${joinNice(bad.map(allergyName))}`
          : typed ? `Add “${food.name}” as you typed it` : `${food.name}${inList ? ', added' : ', add'}`,
      },
      typed ? h('span', { class: 'row__thumb row__thumb--icon row__thumb--neutral', html: icon('edit') }) : foodMedia(food),
      h('span', { class: 'row__label' },
        h('span', { class: typed ? 't-body-l' : 't-body-l-strong', text: typed ? `Add “${food.name}” as you typed it` : food.name }),
        bad.length ? h('span', { class: 'row__meta', text: `Has ${joinNice(bad.map(allergyName)).toLowerCase()} · on his allergy list` }) : null),
      h('span', { class: 'row__trail', html: icon(bad.length ? 'ban' : inList ? 'check' : 'plus') }));
      r.addEventListener('click', () => {
        if (bad.length) { toast(`${food.name} is not safe for ${who}. We left it out.`, { iconName: 'shieldAlert' }); return; }
        if (inList) return;
        const wasInList = store.get().foods.list.includes(food.id);
        addFood(food);
        toast(`Added ${food.name}`, { iconName: 'success', action: { label: 'Undo', onClick: () => { removeFood(food, wasInList); render(); } } });
        if (typed) { field.input.value = ''; }
        render();
        field.input.focus({ preventScroll: true });
      });
      return h('div', { role: 'listitem' }, r);
    }

    function render() {
      const q = field.input.value.trim();
      const s = store.get();
      if (!q) {
        const pop = POPULAR_SEARCH.map((id) => findFood(id)).filter((f) => f && !s.foods.selected.includes(f.id));
        results.replaceChildren(
          h('span', { class: 't-label', text: 'Popular with toddlers' }),
          ...pop.map((f) => row(f)));
        return;
      }
      const matches = searchFoods(q);
      const exact = matches.some((f) => norm(f.name) === norm(q));
      const nodes = matches.map((f) => row(f));
      if (!matches.length) nodes.push(h('p', { class: 'sheet-empty', text: `We do not have “${q}” yet. Add it as you typed it and we will learn it.` }));
      if (!exact && q.length >= 2) nodes.push(row({ id: slug(q), name: capitalise(q), photo: null, allergens: [] }, { typed: true }));
      else if (!exact && q.length < 2 && !matches.length) nodes.push(h('p', { class: 'sheet-empty', text: 'Keep typing…' }));
      results.replaceChildren(...nodes);
    }

    field.input.addEventListener('input', render);
    render();
    openSheet({
      title: `Add a food ${nameOr('') ? 'he' : 'your child'} eats`,
      body: h('div', {}, field, results),
      initialFocus: 'input',
    });
  }

  paint();
  const cont = button({
    label: contLabel(),
    onClick: () => {
      const s = store.get();
      const safeSelected = s.foods.selected.filter((id) => !unsafeAllergens(findFood(id)).length);
      if (!safeSelected.length) {
        showMsg(err, 'Pick at least one food he eats, or tap Skip.');
        reveal(chipsWrap);
        return;
      }
      markDone('foods');
      nextStep('foods');
    },
  });

  const name = childName();
  const { el } = shell({
    label: 'Setup step 4 of 5: foods he eats',
    bar: setupBar('foods'),
    body: [
      h('h1', { class: 'screen-title t-title-l', text: name ? `Foods ${name} eats` : 'Foods your child eats' }),
      h('p', { class: 'screen-lead', text: 'Pick a few. We learn the rest as you go.' }),
      chipsWrap,
    ],
    footer: [err, cont],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   W08 · His backup food (+ W08b Add a backup food)
   ========================================================================== */
function suggestBackups() {
  const s = store.get();
  const safe = (id) => { const f = findFood(id); return f && !unsafeAllergens(f).length; };
  const picked = s.foods.selected.filter(safe);
  const rank = (id) => findFood(id)?.backup ?? 99;
  let list = [...picked].sort((a, b) => rank(a) - rank(b)).slice(0, 3);
  if (!list.length) list = ['banana', 'curd-rice', 'idli'].filter(safe);
  return list;
}

export function backupScreen() {
  if (!store.get().backup.list.length) {
    store.set((st) => { st.backup.list = suggestBackups(); });
  }
  const err = footerMsg();
  // More than one backup is allowed: a toddler often has two or three "always eats" foods.
  const list = h('div', { class: 'choice-list backup__list', role: 'group', 'aria-label': 'His backup foods. Pick one or more.' });
  const count = h('p', { class: 'backup__count', 'aria-live': 'polite' });

  function paint(newId) {
    const s = store.get();
    const picked = backupIds(s);
    list.replaceChildren(...s.backup.list.map((id) => {
      const f = findFood(id);
      if (!f) return null;
      const on = picked.includes(id);
      const card = choiceCard({
        title: f.name,
        meta: on && picked[0] === id && picked.length > 1 ? 'We suggest this first' : null,
        src: f.photo ? thumbUrl(f.photo) : null,
        checked: on,
        role: 'checkbox',
        isNew: id === newId,
        onSelect: () => {
          store.set((st) => {
            const cur = backupIds(st);
            setBackups(st, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
          });
          showMsg(err, '');
          paint();
          focusIfKeyboard(list.querySelector(`[data-id="${id}"]`));
        },
      });
      card.dataset.id = id;
      return card;
    }).filter(Boolean));
    const n = backupIds().length;
    count.textContent = n ? `${n} picked` : '';
  }

  function openAddBackup() {
    let api;
    let pick = null;
    const field = textField({ leadIcon: 'search', placeholder: 'Search or add a food', type: 'search', enterkeyhint: 'search' });
    field.input.setAttribute('aria-label', 'Search or add a food');
    field.control.append(micButton({ input: field.input, sample: 'Khichdi' }));
    field.classList.add('sheet-search');
    const results = h('div', { role: 'radiogroup', 'aria-label': 'Backup food to add' });
    radioGroupKeys(results);
    const addBtn = button({ label: 'Pick a food to add', onClick: () => add() });
    addBtn.setDisabled(true);

    const pickRow = (food, { typed = false } = {}) => {
      const r = h('button', { type: 'button', class: 'row row--compact', role: 'radio', 'aria-checked': String(pick?.id === food.id) },
        typed ? h('span', { class: 'row__thumb row__thumb--icon row__thumb--neutral', html: icon('edit') }) : foodMedia(food),
        h('span', { class: 'row__label' }, h('span', { class: typed ? 't-body-l' : 't-body-l-strong', text: typed ? `Add “${food.name}” as you typed it` : food.name })),
        h('span', { class: 'radio-mark', html: icon('check'), 'aria-hidden': 'true' }));
      r.addEventListener('click', () => {
        pick = food;
        addBtn.setDisabled(false);
        addBtn.setLabel(`Add ${food.name} as a backup`);
        render();
        focusIfKeyboard(results.querySelector('[aria-checked="true"]'));
      });
      return r;
    };

    function render() {
      const s = store.get();
      const q = field.input.value.trim();
      const usable = (f) => f && !s.backup.list.includes(f.id) && !unsafeAllergens(f).length;
      const nodes = [];
      if (!q) {
        const mine = s.foods.selected.map((id) => findFood(id)).filter(usable);
        nodes.push(h('span', { class: 't-label', text: 'From the foods he eats' }));
        if (mine.length) mine.forEach((f) => nodes.push(pickRow(f)));
        else nodes.push(h('p', { class: 'sheet-empty', text: 'All the foods he eats are already here. Search for another one.' }));
      } else {
        const matches = searchFoods(q).filter(usable);
        matches.forEach((f) => nodes.push(pickRow(f)));
        const exact = matches.some((f) => norm(f.name) === norm(q)) || s.backup.list.some((id) => norm(findFood(id)?.name || '') === norm(q));
        if (!matches.length) nodes.push(h('p', { class: 'sheet-empty', text: `No match for “${q}” in his foods.` }));
        const typedBad = typedFoodUnsafe(q);
        if (!exact && q.length >= 2 && typedBad.length) {
          nodes.push(h('p', { class: 'strip strip--danger' }, h('span', { class: 'contents', html: icon('shieldAlert') }),
            h('span', { text: `“${capitalise(q)}” has ${joinNice(typedBad.map((u) => allergyName(u.id).toLowerCase()))}. It can’t be his backup.` })));
        } else if (!exact && q.length >= 2) {
          const typedFood = pick && pick.id.startsWith('custom-') && norm(pick.name) === norm(q) ? pick : { id: slug(q), name: capitalise(q), photo: null, allergens: [] };
          nodes.push(pickRow(typedFood, { typed: true }));
        }
      }
      results.replaceChildren(...nodes);
      results.syncRadios?.();
    }

    function add() {
      if (!pick) return;
      const food = pick;
      store.set((st) => {
        if (food.id.startsWith('custom-')) {
          st.backup.custom = st.backup.custom || [];
          st.backup.custom.push(food);
        }
        st.backup.list.push(food.id);
        setBackups(st, [...backupIds(st), food.id]);
      });
      api.close();
      paint(food.id);
      showMsg(err, '');
      toast(`Added ${food.name} as a backup`, { iconName: 'backup' });
    }

    field.input.addEventListener('input', () => {
      if (pick && pick.id.startsWith('custom-')) { pick = null; addBtn.setDisabled(true); addBtn.setLabel('Pick a food to add'); }
      render();
    });
    render();
    api = openSheet({
      title: 'Add a backup food',
      sub: 'Pick from his foods or type a new one',
      body: h('div', {}, field, results),
      foot: addBtn,
    });
  }

  paint();
  const addLink = h('button', { type: 'button', class: 'link backup__add', 'aria-haspopup': 'dialog', onClick: () => openAddBackup() },
    h('span', { html: icon('plus'), class: 'contents' }), h('span', { text: 'Add another' }));

  const showBtn = button({
    label: 'Show ideas',
    onClick: async () => {
      if (!backupIds().length) {
        showMsg(err, 'Pick at least one backup food, or tap Skip.');
        reveal(list);
        return;
      }
      markDone('backup');
      showBtn.setLoading(true, 'Saving…');
      await wait(500);
      finishSetup();
    },
  });

  const { el } = shell({
    label: 'Setup step 5 of 5: backup food',
    bar: setupBar('backup'),
    body: [
      h('h1', { class: 'screen-title t-title-l', text: 'His backup foods' }),
      h('p', { class: 'screen-lead', text: 'If he refuses a meal, what does he always eat? Pick one or more.' }),
      list,
      h('div', { class: 'backup__foot' }, addLink, count),
    ],
    footer: [err, showBtn],
  });
  return { el, onLeave: el.cleanup };
}

/* ==========================================================================
   Loading → Today (skeleton per the States sheet; under 1.5 s)
   ========================================================================== */
export function readyScreen() {
  const name = nameOr('your child');
  const card = h('div', { class: 'loading-screen__card', 'aria-hidden': 'true' },
    h('div', { class: 'skeleton loading-screen__img' }),
    h('div', { class: 'skeleton loading-screen__line' }),
    h('div', { class: 'skeleton loading-screen__line' }),
    h('div', { class: 'skeleton loading-screen__btn' }));
  const caption = h('p', { class: 'loading-screen__caption', role: 'status', text: `Finding ideas for ${name}…` });
  const el = h('section', { class: 'screen loading-screen', 'aria-label': 'Loading', 'aria-busy': 'true' },
    h('div', { class: 'today__header today__header--flush' },
      h('div', { class: 'today__greet' }, h('h1', { class: 't-title-l', text: childName() ? `${childName()}’s meals` : 'Your child’s meals' }))),
    h('div', { class: 'loading-screen__mascot', html: phulka({ mood: 'thinking', size: 132, animate: true }) }),
    caption, card);
  let t;
  return {
    el,
    onEnter() { t = setTimeout(() => navigate('today', { replace: true }), 1300); },
    onLeave() { clearTimeout(t); },
    autofocus() {},
  };
}

export { nextId, afterSignIn };
