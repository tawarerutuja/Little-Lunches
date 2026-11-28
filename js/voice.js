// Speech out (speechSynthesis) for the helper view: reads the screen in her language.
// Speech in (SpeechRecognition) lives in components.js micButton().
// Helpers who can't read use this, so it must never throw: no voice = it says nothing
// and the big picture buttons still work.

/** Her language → the voice we ask the phone for. */
export const SPEECH_LANG = { hi: 'hi-IN', en: 'en-IN', ne: 'ne-NP', mr: 'mr-IN' };
export const LANG_NAME = { hi: 'Hindi', en: 'English', ne: 'Nepali', mr: 'Marathi' };
/** If her language has no voice on this phone, the closest one we try next. */
const FALLBACK = { ne: ['hi'], mr: ['hi'], hi: ['en'], en: [] };

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

/** Voices load late on some phones: wait a moment for them. */
function voices() {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((res) => {
    const done = () => res(s.getVoices());
    s.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, 900);
  });
}

/**
 * The voice to use for `lang` ('hi' | 'en' | 'ne' | 'mr').
 * Returns { voice, lang, code, fellBack } — fellBack is the language we wanted when we had to use another.
 */
export async function pickVoice(lang) {
  const list = await voices();
  const find = (l) => {
    const code = SPEECH_LANG[l];
    return list.find((v) => v.lang === code) || list.find((v) => v.lang?.toLowerCase().startsWith(l));
  };
  const own = find(lang);
  if (own) return { voice: own, lang, code: SPEECH_LANG[lang], fellBack: null };
  for (const l of FALLBACK[lang] || []) {
    const v = find(l);
    if (v) return { voice: v, lang: l, code: SPEECH_LANG[l], fellBack: lang };
  }
  // No matching voice at all: still ask for her language; the phone may have a default.
  return { voice: null, lang, code: SPEECH_LANG[lang], fellBack: null };
}

let current = null; // { cancel }

export function stopSpeaking() {
  current?.cancel();
  current = null;
  try { synth()?.cancel(); } catch { /* ignore */ }
}

/**
 * Read lines one after another, highlighting each line's element while it is read.
 * lines: [{ text, el? }]. Calls onFallback({ wanted, used }) when her language has no voice.
 * Resolves when finished or stopped.
 */
export function speak(lines, { lang = 'hi', rate = 0.9, onFallback, onEnd } = {}) {
  stopSpeaking();
  const s = synth();
  const list = (Array.isArray(lines) ? lines : [{ text: lines }]).filter((l) => l && l.text);
  if (!s || !list.length) { onEnd?.(); return Promise.resolve(false); }
  let cancelled = false;
  let lit = null;
  const unlight = () => { lit?.classList.remove('is-reading'); lit = null; };
  const job = { cancel: () => { cancelled = true; unlight(); } };
  current = job;
  return pickVoice(lang).then((v) => {
    if (v.fellBack) onFallback?.({ wanted: v.fellBack, used: v.lang });
    return new Promise((resolve) => {
      let i = 0;
      const finish = () => { unlight(); if (current === job) current = null; onEnd?.(); resolve(!cancelled); };
      const next = () => {
        if (cancelled || i >= list.length) { finish(); return; }
        const line = list[i++];
        unlight();
        if (line.el) { lit = line.el; lit.classList.add('is-reading'); lit.scrollIntoView?.({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
        const u = new SpeechSynthesisUtterance(line.text);
        u.lang = v.code;
        try { if (v.voice) u.voice = v.voice; } catch { /* the lang code is enough */ }
        u.rate = rate;
        u.onend = () => setTimeout(next, 250);
        u.onerror = () => next();
        try { s.speak(u); } catch { next(); }
      };
      next();
    });
  });
}

/** One short line, no highlight (outcome labels, hints, read-back). */
export const say = (text, lang, opts = {}) => speak([{ text }], { lang, ...opts });
