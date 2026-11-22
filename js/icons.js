// Inline SVG icon map. Line icons on a 24 px grid, 2 px rounded strokes,
// matching the Little Plate iconography sheet. The only source of icons.

const line = (body, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${body}</svg>`;

const ICONS = {
  back: line('<path d="m15 18-6-6 6-6"/>'),
  forward: line('<path d="m9 18 6-6-6-6"/>'),
  down: line('<path d="m6 9 6 6 6-6"/>'),
  close: line('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  check: line('<path d="M20 6 9 17l-5-5"/>'),
  plus: line('<path d="M5 12h14"/><path d="M12 5v14"/>'),
  mic: line('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>'),
  search: line('<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>'),
  clock: line('<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>'),
  plan: line('<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M16 2.5v4"/><path d="M8 2.5v4"/><path d="M3 10h18"/>'),
  bowl: line('<path d="M3 11.5h18a9 9 0 0 1-18 0Z"/><path d="M9 4.5c-.6.8-.6 1.6 0 2.4s.6 1.6 0 2.4"/><path d="M15 4.5c-.6.8-.6 1.6 0 2.4s.6 1.6 0 2.4"/>'),
  pot: line('<path d="M4 10h16v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-6Z"/><path d="M2 10h20"/><path d="M8 6.5c.8-.8.8-1.7 0-2.5"/><path d="M12 6.5c.8-.8.8-1.7 0-2.5"/><path d="M16 6.5c.8-.8.8-1.7 0-2.5"/>'),
  allergy: line('<path d="M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
  backup: line('<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="m9 12 2 2 4-4"/>'),
  ban: line('<circle cx="12" cy="12" r="9.5"/><path d="m5.3 5.3 13.4 13.4"/>'),
  // Filled "never give" badge used on selected allergy chips: solid disc + light slash.
  banFilled: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 7l10 10" stroke="var(--error-bg)" stroke-width="2.4" stroke-linecap="round"/></svg>',
  shieldAlert: line('<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="M12 8v4.5"/><path d="M12 16h.01"/>'),
  info: line('<circle cx="12" cy="12" r="9.5"/><path d="M12 16v-4.5"/><path d="M12 8h.01"/>'),
  success: line('<circle cx="12" cy="12" r="9.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  error: line('<circle cx="12" cy="12" r="9.5"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'),
  refresh: line('<path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8"/><path d="M21 3v5h-5"/>'),
  edit: line('<path d="M21.2 6.8a2.8 2.8 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8L2 21.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5Z"/><path d="m15 5 4 4"/>'),
  trash: line('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  child: line('<circle cx="12" cy="12" r="9.5"/><path d="M8.5 14.5s1.3 1.8 3.5 1.8 3.5-1.8 3.5-1.8"/><path d="M9 9.5h.01"/><path d="M15 9.5h.01"/>'),
  user: line('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  people: line('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>'),
  today: line('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>'),
  moon: line('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  memory: line('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'),
  learn: line('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/>'),
  basket: line('<path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/>'),
  tip: line('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'),
  sugar: line('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>'),
  leaf: line('<path d="M12.7 19a2 2 0 0 0 1.4-.6l6.2-6.2a6 6 0 0 0-8.5-8.5l-6.2 6.2a2 2 0 0 0-.6 1.4V18a1 1 0 0 0 1 1Z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>'),
  cookie: line('<circle cx="12" cy="12" r="9.5"/><path d="M8.5 9h.01"/><path d="M15 8.5h.01"/><path d="M12 12.5h.01"/><path d="M8 15h.01"/><path d="M15.5 15.5h.01"/>'),
  store: line('<path d="M3 9.5 4.5 4h15L21 9.5"/><path d="M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-4h4v4"/>'),
  phone: line('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'),
  message: line('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>'),
  language: line('<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19"/>'),
  signout: line('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'),
  ai: line('<path d="M9.9 15.5A2 2 0 0 0 8.5 14l-6.1-1.6a.5.5 0 0 1 0-1L8.5 9.9A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1A2 2 0 0 0 15.5 9.9l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0Z"/>'),

  // Meals (tinted icons on Today, Plan, Memory)
  breakfast: line('<path d="M4 17h16"/><path d="M5.5 17a6.5 6.5 0 0 1 13 0"/><path d="M12 8.5v2"/><path d="M10.5 8.5h3"/><path d="M3 20h18"/>'),
  lunch: line('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>'),
  snack: line('<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5v2.5"/><path d="M12 3.5v2.5"/>'),
  dinner: line('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),

  // Outcome faces: different mouths so they read without colour
  ateWell: line('<circle cx="12" cy="12" r="9.5"/><path d="M8 14s1.5 2.2 4 2.2 4-2.2 4-2.2"/><path d="M9 9.5h.01"/><path d="M15 9.5h.01"/>'),
  ateSome: line('<circle cx="12" cy="12" r="9.5"/><path d="M8.5 15h7"/><path d="M9 9.5h.01"/><path d="M15 9.5h.01"/>'),
  didNotEat: line('<circle cx="12" cy="12" r="9.5"/><path d="M8 16.2s1.5-2.2 4-2.2 4 2.2 4 2.2"/><path d="M9 9.5h.01"/><path d="M15 9.5h.01"/>'),

  swap: line('<path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/>'),
  list: line('<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>'),
  bell: line('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4.5v15l12-7.5Z" fill="currentColor"/></svg>',
  share: line('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>'),
  more: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>',
  offline: line('<path d="M12 20h.01"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.8"/><path d="M19 12.9a10 10 0 0 0-2-1.5"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M22 8.8A15 15 0 0 0 11 4.9"/><path d="m2 2 20 20"/>'),
  help: line('<circle cx="12" cy="12" r="9.5"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
  tooth: line('<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7.5.5 3.5 1 6 2.5 6s1.8-3 2.5-5.5c.3-1 1.7-1 2 0 .7 2.5 1 5.5 2.5 5.5s2-2.5 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3Z"/>'),
  hand: line('<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>'),
  balls: line('<circle cx="7.5" cy="8" r="3.5"/><circle cx="16.5" cy="8" r="3.5"/><circle cx="12" cy="16.5" r="3.5"/>'),
  dalSide: line('<path d="M3 13h18a9 9 0 0 1-18 0Z"/><path d="M14 13 19 4"/>'),
  spoon: line('<ellipse cx="9" cy="8" rx="5" ry="6" transform="rotate(-45 9 8)"/><path d="m13 12 8 8"/>'),
  minus: line('<path d="M5 12h14"/>'),
  heart: line('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>'),
  external: line('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  lock: line('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),

  // Google "G" (brand mark, used only on "Continue with Google", as every app does)
  google: '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>',

  // Device chrome (filled)
  signal: '<svg viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
  wifi: '<svg viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .8 10.2 10.2 0 0 0 .9 3.6L2 4.8a8.6 8.6 0 0 1 6-2.4Z"/><path d="M8 5.6c1.4 0 2.7.5 3.7 1.4l1.1-1.2A7 7 0 0 0 8 4a7 7 0 0 0-4.8 1.8L4.3 7C5.3 6.1 6.6 5.6 8 5.6Z"/><path d="M8 8.8c.6 0 1.1.2 1.5.6L8 11.2 6.5 9.4c.4-.4.9-.6 1.5-.6Z"/></svg>',
  battery: '<svg viewBox="0 0 27 13" fill="none" aria-hidden="true"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4a2 2 0 0 0 0-4Z" fill="currentColor" opacity=".5"/></svg>',
};

/** Returns the markup for an icon by name. */
export function icon(name) {
  const svg = ICONS[name];
  if (!svg) {
    console.warn(`[icons] unknown icon "${name}"`);
    return '';
  }
  return svg;
}

/* --------------------------------------------------------------------------
   Logo symbol · A6 Sunday thali. Geometry from Figma node 2005:175
   (120 × 120). Parts carry classes so the splash can animate them.
   -------------------------------------------------------------------------- */
const ROTI_PATH = 'M83.35 48.89A26.4 26.4 0 1 1 73.17 38.31A9 9 0 0 0 83.35 48.89Z';

export function logo({ size = 40, label = 'Little Plate', detail = 'full', steam = false } = {}) {
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  if (detail === 'small') {
    return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 120 120" ${aria}>
      <circle cx="60" cy="60" r="56" fill="var(--logo-plate)"/>
      <path d="${ROTI_PATH}" transform="translate(-6 -6) scale(1.1)" fill="var(--logo-roti)"/>
    </svg>`;
  }
  return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 120 120" ${aria}>
    <g class="logo__plate">
      <circle cx="60" cy="60" r="55.2" fill="var(--logo-plate)"/>
      <circle class="logo__rim" cx="60" cy="60" r="55.2" fill="none" stroke="var(--logo-rim)" stroke-width="3.2" transform="rotate(-90 60 60)"/>
      <circle class="logo__inner-rim" cx="60" cy="60" r="43.2" fill="none" stroke="var(--logo-inner-rim)" stroke-width="2" transform="rotate(-90 60 60)"/>
    </g>
    <g class="logo__roti">
      <path d="${ROTI_PATH}" fill="var(--logo-roti)" stroke="var(--logo-face)" stroke-width="2.4" stroke-linejoin="round"/>
      <g class="logo__face">
        <ellipse class="logo__cheek" cx="44" cy="64.8" rx="3.5" ry="2.3" fill="var(--logo-cheek)" opacity=".55"/>
        <ellipse class="logo__cheek" cx="74.8" cy="64.8" rx="3.5" ry="2.3" fill="var(--logo-cheek)" opacity=".55"/>
        <g class="logo__eyes" fill="var(--logo-face)">
          <circle cx="51.6" cy="57.6" r="3.1"/>
          <circle cx="67.2" cy="57.6" r="3.1"/>
        </g>
        <path d="M50.2 69.2Q59.2 77 68.2 69.2" fill="none" stroke="var(--logo-face)" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    </g>
    ${steam ? `<g class="logo__steam" fill="none" stroke="var(--ink-400)" stroke-width="2" stroke-linecap="round">
      <path d="M100 26q-3-4 0-8t0-8"/><path d="M108 28q-3-4 0-8t0-8"/></g>` : ''}
  </svg>`;
}
