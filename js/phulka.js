// Phulka, the roti on his little plate (Figma: Mascot · Meet Phulka).
// Four moods, each with its own face and disc tint:
//   happy     – wins and warm welcomes           (puff 1 → 1.08 → 1, one steam wisp)
//   calm      – the hardest moments (refusal)     (breathing 1 → 1.03 over 3 s, loops)
//   thinking  – while it works for her (loading)  (tilt ±6°, eyes glance, steam as dots)
//   searching – when nothing fits yet             (magnifier sweeps once in 600 ms)
// Plus "saved": happy with an 8 px hop. Reduced motion → he sits still.

const ROTI = 'M83.35 48.89A26.4 26.4 0 1 1 73.17 38.31A9 9 0 0 0 83.35 48.89Z';

const FACES = {
  happy: `
    <ellipse cx="44" cy="64.8" rx="3.5" ry="2.3" fill="var(--logo-cheek)" opacity=".55"/>
    <ellipse cx="74.8" cy="64.8" rx="3.5" ry="2.3" fill="var(--logo-cheek)" opacity=".55"/>
    <g class="phulka__eyes" fill="var(--logo-face)"><circle cx="51.6" cy="57.6" r="3.1"/><circle cx="67.2" cy="57.6" r="3.1"/></g>
    <path d="M50.2 69.2Q59.2 77 68.2 69.2" fill="none" stroke="var(--logo-face)" stroke-width="2.4" stroke-linecap="round"/>`,
  calm: `
    <ellipse cx="44" cy="65.5" rx="3.5" ry="2.3" fill="var(--logo-cheek)" opacity=".45"/>
    <ellipse cx="74.8" cy="65.5" rx="3.5" ry="2.3" fill="var(--logo-cheek)" opacity=".45"/>
    <g fill="none" stroke="var(--logo-face)" stroke-width="2.4" stroke-linecap="round">
      <path d="M47.6 57.4q4 3.4 8 0"/><path d="M63.2 57.4q4 3.4 8 0"/>
      <path d="M53.5 69.5q5.7 4 11.4 0"/>
    </g>`,
  thinking: `
    <g class="phulka__eyes" fill="var(--logo-face)"><circle cx="54.5" cy="55.5" r="3"/><circle cx="68.5" cy="55.5" r="3"/></g>
    <path d="M53 71.5 66.5 67.8" fill="none" stroke="var(--logo-face)" stroke-width="3.4" stroke-linecap="round"/>`,
  searching: `
    <ellipse cx="44" cy="64.8" rx="3.5" ry="2.3" fill="var(--logo-cheek)" opacity=".55"/>
    <ellipse cx="74.8" cy="64.8" rx="3.5" ry="2.3" fill="var(--logo-cheek)" opacity=".55"/>
    <g class="phulka__eyes" fill="var(--logo-face)"><circle cx="51.6" cy="57.6" r="3.1"/><circle cx="67.2" cy="57.6" r="3.1"/></g>
    <path d="M50.2 69.2Q59.2 77 68.2 69.2" fill="none" stroke="var(--logo-face)" stroke-width="2.4" stroke-linecap="round"/>`,
};

const STEAM = `
  <g class="phulka__steam" fill="none" stroke="var(--ink-400)" stroke-width="2.2" stroke-linecap="round">
    <path class="phulka__wisp phulka__wisp--1" d="M98 30q-3-4 0-8t0-8"/>
    <path class="phulka__wisp phulka__wisp--2" d="M106 32q-3-4 0-8t0-8"/>
    <path class="phulka__wisp phulka__wisp--3" d="M114 30q-3-4 0-8t0-8"/>
  </g>`;

const MAGNIFIER = `
  <g class="phulka__glass" fill="none" stroke="var(--logo-face)" stroke-linecap="round">
    <circle cx="96" cy="96" r="9.5" stroke-width="4" fill="var(--logo-plate)"/>
    <path d="M103 103l9 9" stroke-width="5"/>
  </g>`;

/**
 * Phulka markup.
 * @param {object} o
 * @param {'happy'|'calm'|'thinking'|'searching'|'saved'} o.mood
 * @param {number} o.size  – outer size in px (disc included)
 * @param {boolean} o.disc – draw the soft tinted disc
 * @param {boolean} o.animate – play the mood's motion
 * @param {string} o.label – accessible name ('' = decorative)
 */
export function phulka({ mood = 'happy', size = 120, disc = true, animate = false, label = '' } = {}) {
  const face = FACES[mood === 'saved' ? 'happy' : mood] || FACES.happy;
  const rim = mood === 'thinking' ? 5.4 : 3.2;
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  const steam = mood === 'happy' || mood === 'saved' || mood === 'thinking' ? STEAM : '';
  return `<span class="phulka phulka--${mood}${disc ? ' phulka--disc' : ''}${animate ? ' is-animated' : ''}" style="--phulka-size:${size}px" ${aria}>
    <svg class="phulka__svg" viewBox="-6 -6 132 132" focusable="false" aria-hidden="true">
      <g class="phulka__body">
        <circle cx="60" cy="60" r="55.2" fill="var(--logo-plate)" stroke="var(--logo-rim)" stroke-width="${rim}"/>
        <circle cx="60" cy="60" r="43.2" fill="none" stroke="var(--logo-inner-rim)" stroke-width="${mood === 'thinking' ? 3.4 : 2}"/>
        <g class="phulka__roti">
          <path d="${ROTI}" fill="var(--logo-roti)" stroke="var(--logo-face)" stroke-width="2.4" stroke-linejoin="round"/>
          <g class="phulka__face">${face}</g>
        </g>
      </g>
      ${steam}
      ${mood === 'searching' ? MAGNIFIER : ''}
    </svg>
  </span>`;
}
