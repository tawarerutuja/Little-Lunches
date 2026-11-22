// Entry: route table, guards, initial route, theme and the phone frame.

import { icon } from './icons.js';
import { h, mountOverlayLayer, mountToastRegion, confirmDialog, toast, sim } from './components.js';
import { initRouter, navigate, currentRoute } from './router.js';
import { store } from './store.js';
import {
  splashScreen, welcomeScreen, signinScreen, codeScreen, childScreen, allergiesScreen,
  familyScreen as setupFamilyScreen, foodsScreen, backupScreen, readyScreen,
} from './screens.js';
import {
  todayScreen, familyScreen as familyDinnerScreen, plateScreen, homeScreen, homeAllScreen, ideasScreen,
  nothingScreen, recipeScreen, refusedScreen,
} from './screens-today.js';
import { planScreen, shoppingScreen, planEditScreen } from './screens-plan.js';
import {
  memoryScreen, foodsListScreen, learnScreen, articleScreen, profileScreen, peopleScreen, whatsappScreen, helpScreen,
} from './screens-more.js';
import { carerLangScreen, carerGiveScreen, carerNotScreen, carerSavedScreen } from './screens-carer.js';
import { addDays, dateKey, logMeal } from './meals.js';

const phone = document.getElementById('phone');
const viewport = document.getElementById('viewport');

/* ---------- Guards ---------- */
const signedIn = () => store.get().session.signedIn;
const needsSignIn = () => (signedIn() ? null : 'welcome');
const homeIfDone = () => (signedIn() && store.get().setupDone ? 'today' : null);
const needsApp = () => needsSignIn() || (store.get().setupDone ? null : 'child');

/** Where a cold start should land after the splash. */
function startRoute() {
  const s = store.get();
  if (!s.session.signedIn) return 'welcome';
  if (s.setupDone) return 'today';
  return 'child';
}

// Read the deep link before the splash replaces the URL (validated in afterSplash).
let deepLink = (location.hash || '').replace(/^#\/?/, '').split('?')[0] || null;

const routes = {
  // R1 · first time
  splash: { render: () => splashScreen({ next: afterSplash }) },
  welcome: { render: welcomeScreen, guard: homeIfDone },
  signin: { render: signinScreen, guard: homeIfDone },
  code: { render: codeScreen, guard: () => homeIfDone() || (store.get().pending.phone ? null : 'signin') },
  child: { render: childScreen, guard: needsSignIn },
  allergies: { render: allergiesScreen, guard: needsSignIn },
  family: { render: setupFamilyScreen, guard: needsSignIn },
  foods: { render: foodsScreen, guard: needsSignIn },
  backup: { render: backupScreen, guard: needsSignIn },
  ready: { render: readyScreen, guard: needsSignIn },

  // R2 / R3 / R7 · Today
  today: { render: todayScreen, guard: needsApp },
  'family-dinner': { render: familyDinnerScreen, guard: needsApp },
  plate: { render: plateScreen, guard: needsApp },
  home: { render: homeScreen, guard: needsApp },
  'home-all': { render: homeAllScreen, guard: needsApp },
  ideas: { render: ideasScreen, guard: needsApp },
  nothing: { render: nothingScreen, guard: needsApp },
  recipe: { render: recipeScreen, guard: needsApp },
  refused: { render: refusedScreen, guard: needsApp },

  // R5 · Plan
  plan: { render: planScreen, guard: needsApp },
  shopping: { render: shoppingScreen, guard: needsApp },
  'plan-edit': { render: planEditScreen, guard: needsApp },

  // R6 · Memory, Learn, Profile
  memory: { render: memoryScreen, guard: needsApp },
  'his-foods': { render: foodsListScreen, guard: needsApp },
  learn: { render: learnScreen, guard: needsApp },
  article: { render: articleScreen, guard: needsApp },
  profile: { render: profileScreen, guard: needsApp },
  people: { render: peopleScreen, guard: needsApp },
  help: { render: helpScreen, guard: needsApp },

  // R4 · Shared care (on the carer's phone)
  whatsapp: { render: whatsappScreen, guard: needsApp },
  'carer-lang': { render: carerLangScreen, guard: needsApp },
  'carer-give': { render: carerGiveScreen, guard: needsApp },
  'carer-not': { render: carerNotScreen, guard: needsApp },
  'carer-saved': { render: carerSavedScreen, guard: needsApp },
};

const NO_DEEP_LINK = ['splash', 'ready', 'carer-saved', 'plate'];
function afterSplash() {
  const valid = deepLink && routes[deepLink] && !NO_DEEP_LINK.includes(deepLink);
  const target = valid ? deepLink : startRoute();
  deepLink = null;
  navigate(target, { reset: true, transition: 'fade' });
}

/* ---------- Theme (system by default; derived dark theme) ---------- */
const media = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const chosen = store.get().theme;
  const theme = chosen || (media.matches ? 'dark' : 'light');
  phone.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171512' : '#fbf6ec');
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.innerHTML = `${icon(theme === 'dark' ? 'today' : 'moon')}<span>${theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>`;
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}
media.addEventListener?.('change', applyTheme);

/* ---------- Network: Today changes one card when offline (E01) ---------- */
function onNetwork() {
  paintOfflineBtn();
  if (['today', 'plan', 'ideas'].includes(currentRoute())) navigate(currentRoute(), { replace: true, transition: 'fade' });
}
window.addEventListener('online', () => { onNetwork(); toast('Back online', { iconName: 'success' }); });
window.addEventListener('offline', onNetwork);

/* ---------- Scale the framed phone to fit short windows ---------- */
// The prototype panel never covers the phone: it docks in its own column on the right
// when there is room, otherwise it folds into a "Prototype" button that opens it.
const PANEL_W = 248 + 48; // panel + gaps
function fit() {
  if (window.innerWidth < 520) { phone.style.removeProperty('--fit'); phone.style.removeProperty('--phone-x'); return; }
  const side = window.innerWidth - PANEL_W >= 380;
  document.body.classList.toggle('tools-side', side);
  if (side) document.body.classList.remove('tools-open');
  const availW = side ? window.innerWidth - PANEL_W : window.innerWidth;
  // 32 px breathing room on each side, plus the 11 px bezel drawn by the shadow.
  const scale = Math.min(1, (window.innerHeight - 86) / 874, (availW - 86) / 402);
  phone.style.setProperty('--fit', String(scale));
  phone.style.setProperty('--phone-x', `${Math.round(availW / 2)}px`);
}
window.addEventListener('resize', fit);

/* ---------- Prototype tools (outside the phone, desktop only) ---------- */
let offlineBtn = null;
function paintOfflineBtn() {
  if (!offlineBtn) return;
  const on = store.get().offlineSim;
  offlineBtn.innerHTML = `${icon('offline')}<span>${on ? 'Go back online' : 'Go offline'}</span>`;
  offlineBtn.setAttribute('aria-pressed', String(on));
}

function mountTools() {
  const tools = document.getElementById('proto-tools');
  if (!tools) return;
  const themeBtn = h('button', { type: 'button', class: 'proto-tools__btn', id: 'theme-toggle' });
  themeBtn.addEventListener('click', () => {
    const now = phone.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    store.set({ theme: now });
    applyTheme();
  });

  offlineBtn = h('button', { type: 'button', class: 'proto-tools__btn' });
  offlineBtn.addEventListener('click', () => {
    store.set((d) => { d.offlineSim = !d.offlineSim; });
    onNetwork();
  });
  paintOfflineBtn();

  // E06 needs three refused dinners in a row; this sets them up for testing.
  const refusals = h('button', { type: 'button', class: 'proto-tools__btn', html: `${icon('didNotEat')}<span>Refused 3 dinners</span>` });
  refusals.addEventListener('click', () => {
    if (!store.get().setupDone) { toast('Finish setup first.', { iconName: 'info' }); return; }
    store.set((d) => {
      for (let i = 1; i <= 3; i++) logMeal(d, { date: dateKey(addDays(new Date(), -i)), meal: 'dinner', food: 'khichdi', name: 'Khichdi', outcome: 'not', time: '8:00 pm' });
      Object.keys(d.dismissed).forEach((k) => { if (k.startsWith('refusal-')) delete d.dismissed[k]; });
    });
    navigate('today', { reset: true, transition: 'fade' });
  });

  // Time of day: Auto follows the clock; otherwise Today acts as if it is that meal.
  const ORDER = [null, 'breakfast', 'lunch', 'snack', 'dinner'];
  const timeBtn = h('button', { type: 'button', class: 'proto-tools__btn' });
  const paintTime = () => {
    const v = store.get().timeOverride || null;
    const name = v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Auto (clock)';
    timeBtn.innerHTML = `${icon(v || 'clock')}<span>Time: ${name}</span>`;
    timeBtn.setAttribute('aria-label', `Time of day: ${name}. Change`);
  };
  timeBtn.addEventListener('click', () => {
    const v = store.get().timeOverride || null;
    const next = ORDER[(ORDER.indexOf(v) + 1) % ORDER.length];
    store.set((d) => { d.timeOverride = next; d.served = null; d.ui = { ...d.ui, todayPick: null, swapSeen: null }; });
    paintTime();
    if (store.get().setupDone && store.get().session.signedIn) navigate('today', { reset: true, transition: 'fade' });
  });
  paintTime();

  const restart = h('button', { type: 'button', class: 'proto-tools__btn', html: `${icon('refresh')}<span>Restart prototype</span>` });
  restart.addEventListener('click', () => {
    confirmDialog({
      title: 'Restart the prototype?',
      body: 'This clears everything entered on this browser and starts again from the splash screen.',
      confirmLabel: 'Restart',
      onConfirm: () => {
        store.reset();
        deepLink = null;
        navigate('splash', { reset: true });
        toast('Prototype restarted', { iconName: 'success' });
      },
    });
  });
  const code = h('p', { class: 'proto-tools__note', text: 'Sign-in code: 482719' });

  // Simulate errors: each switch stays on until switched off, so a failure can be retried.
  const SIMS = [
    ['save', 'error', 'Saving fails', 'Logging a meal, “Served it”, the carer’s tap'],
    ['voice', 'mic', 'Voice not understood', 'Any mic button'],
    ['slow', 'clock', 'Slow loading', 'Ideas take a few seconds'],
    ['ideas', 'offline', 'Ideas fail to load', 'Ask, What’s at home'],
  ];
  const simBtns = SIMS.map(([k, ic, name, hint]) => {
    const b = h('button', { type: 'button', class: 'proto-tools__btn proto-tools__btn--toggle', title: hint });
    const paint = () => {
      const on = sim.on(k);
      b.innerHTML = `${icon(ic)}<span>${name}</span><span class="proto-tools__state">${on ? 'On' : 'Off'}</span>`;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `Simulate: ${name}. ${hint}. ${on ? 'On' : 'Off'}`);
    };
    b.addEventListener('click', () => { sim.set(k, !sim.on(k)); paint(); toast(`${name}: ${sim.on(k) ? 'on' : 'off'}`, { iconName: 'info' }); });
    paint();
    return b;
  });
  tools.append(h('span', { class: 'proto-tools__label', text: 'Prototype' }), code, timeBtn, themeBtn, offlineBtn, refusals, restart,
    h('span', { class: 'proto-tools__label proto-tools__label--gap', text: 'Simulate errors' }), ...simBtns);

  // Narrow windows: one button opens/closes the panel (Esc closes it too).
  const toggle = h('button', { type: 'button', class: 'proto-toggle', 'aria-controls': 'proto-tools', 'aria-expanded': 'false', html: `${icon('more')}<span>Prototype</span>` });
  const setOpen = (on) => { document.body.classList.toggle('tools-open', on); toggle.setAttribute('aria-expanded', String(on)); };
  toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('tools-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('tools-open')) setOpen(false); });
  tools.after(toggle);
}

/* ---------- Boot ---------- */
mountOverlayLayer(document.getElementById('overlays'));
mountToastRegion(document.getElementById('toasts'));
document.getElementById('status-icons').innerHTML = icon('signal') + icon('wifi') + icon('battery');
mountTools();
applyTheme();
fit();
initRouter({ el: viewport, table: routes, defaultRoute: 'welcome' });
navigate('splash', { reset: true });
