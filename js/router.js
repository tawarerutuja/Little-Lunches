// Screen stack with hash URLs (#/welcome) so refresh, deep links and the
// browser back button all work on GitHub Pages without server rewrites.
// Forward = slide in from the right, back = slide in from the left,
// replace = fade.

import { closeOverlay, hasOverlay } from './components.js';

let routes = {};
let viewport = null;
let stack = []; // [{ name, screen }]
let busy = false;
let fallback = 'welcome';

export function initRouter({ el, table, defaultRoute }) {
  viewport = el;
  routes = table;
  fallback = defaultRoute;
  window.addEventListener('popstate', onPop);
}

export function currentRoute() {
  return stack[stack.length - 1]?.name || null;
}

export function routeFromHash() {
  const name = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
  return routes[name] ? name : null;
}

/** Go to a route. opts.replace swaps the top of the stack (fade). opts.reset clears history. */
export function navigate(name, opts = {}) {
  if (!routes[name]) name = fallback;
  const redirect = routes[name].guard?.();
  if (redirect && redirect !== name) name = redirect;
  if (hasOverlay()) closeOverlay();

  const url = `#/${name}`;
  if (opts.replace || opts.reset || !stack.length) {
    history.replaceState({ lp: name }, '', url);
    const prev = opts.reset ? stack.splice(0) : stack.splice(-1);
    stack.push({ name });
    show(name, opts.transition || 'fade', prev);
  } else {
    history.pushState({ lp: name }, '', url);
    stack.push({ name });
    show(name, opts.transition || 'forward', []);
  }
}

export function back() {
  if (hasOverlay()) { closeOverlay(); return; }
  if (stack.length > 1) history.back();
}

function onPop() {
  if (hasOverlay()) closeOverlay();
  const name = routeFromHash() || fallback;
  if (stack.length > 1 && stack[stack.length - 2].name === name) {
    stack.pop();
    show(name, 'back', []);
  } else if (name !== currentRoute()) {
    // History from before a reset (e.g. the code screen after sign-in):
    // stay where we are instead of walking back into it.
    const top = currentRoute();
    if (top) history.pushState({ lp: top }, '', `#/${top}`);
  }
}

function show(name, transition, dropped) {
  const route = routes[name];
  const oldEl = viewport.querySelector('.screen.is-current');
  const oldCtl = oldEl?.__ctl;
  oldCtl?.onLeave?.();
  void dropped;

  const ctl = route.render({ transition });
  const el = ctl.el;
  el.__ctl = ctl;
  el.classList.add('screen', 'is-current');
  el.setAttribute('data-route', name);

  if (oldEl) {
    oldEl.classList.remove('is-current');
    oldEl.setAttribute('aria-hidden', 'true');
    oldEl.setAttribute('inert', '');
  }
  viewport.append(el);

  const inCls = `route-in-${transition}`;
  const outCls = `route-out-${transition}`;
  el.classList.add(inCls);
  if (oldEl) oldEl.classList.add(outCls);

  busy = true;
  const done = () => {
    el.classList.remove(inCls);
    if (oldEl) oldEl.remove();
    viewport.querySelectorAll('.screen:not(.is-current)').forEach((n) => n.remove());
    busy = false;
    ctl.onEnter?.();
    focusScreen(el, ctl);
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) done();
  else {
    let finished = false;
    const finish = () => { if (!finished) { finished = true; done(); } };
    el.addEventListener('animationend', (e) => { if (e.target === el) finish(); }, { once: false });
    setTimeout(finish, 450);
  }
}

function focusScreen(el, ctl) {
  if (ctl.autofocus) { ctl.autofocus(); return; }
  const h1 = el.querySelector('h1');
  if (h1) {
    h1.tabIndex = -1;
    h1.focus({ preventScroll: true });
  }
}

