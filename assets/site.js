import { render, CHORD, NOTES } from './guitar.js';
const root = document.documentElement;
const themeButton = document.querySelector('#theme-toggle');
const soundButton = document.querySelector('#sound-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Keep persistent shell URLs stable after history.pushState changes the path.
document.querySelectorAll('header a[href], head link[href]').forEach(element => {
  element.href = new URL(element.getAttribute('href'), location.href).href;
});
const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
let soundEnabled = safeGet('ank-sound') === 'on';
let context;

function syncPreferences() {
  const dark = root.dataset.theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeButton.querySelector('span').textContent = dark ? 'Light' : 'Dark';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1a1917' : '#f5f4f1';
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  soundButton.querySelector('span').textContent = soundEnabled ? 'Sound on' : 'Sound off';
}
syncPreferences();
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  safeSet('ank-theme', root.dataset.theme);
  syncPreferences();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (!safeGet('ank-theme')) { root.dataset.theme = event.matches ? 'dark' : 'light'; syncPreferences(); }
});

// Guitar synthesis lives in guitar.js; rendered buffers are cached per note.
// A link's data-note is 0 for the whole chord, otherwise the 1-based index of one of its notes.
const buffers = new Map();
function buffer(index) {
  const key = index;
  if (!buffers.has(key)) {
    const data = index ? render([NOTES[(index - 1) % NOTES.length]], context.sampleRate, { seconds: 2.4 }) : render(CHORD, context.sampleRate);
    const audio = context.createBuffer(1, data.length, context.sampleRate);
    audio.copyToChannel(data, 0);
    buffers.set(key, audio);
  }
  return buffers.get(key);
}
async function play(note = 0) {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Audio is unavailable');
    context ??= new AudioContext();
    if (context.state === 'suspended') await context.resume();
    const source = context.createBufferSource();
    source.buffer = buffer(note);
    const gain = context.createGain();
    gain.gain.value = note ? .32 : .42;
    source.connect(gain).connect(context.destination);
    source.start(context.currentTime + .01);
  } catch {
    soundEnabled = false;
    safeSet('ank-sound', 'off');
    syncPreferences();
    soundButton.title = 'Audio unavailable in this browser';
  }
}
soundButton.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  safeSet('ank-sound', soundEnabled ? 'on' : 'off');
  syncPreferences();
  if (soundEnabled) void play();
});

// Each alternate home names its dog animation; modules load only on the page that uses them.
const dogModules = { side: './dogs-side.js', 'pixel-mini': './dogs-pixel-mini.js' };
let stopDogs, dogRun = 0;
function setupPage() {
  stopDogs?.();
  stopDogs = null;
  const park = document.querySelector('canvas.dog-park');
  const run = ++dogRun;
  if (park && dogModules[park.dataset.dogs]) import(dogModules[park.dataset.dogs]).then(module => {
    if (run === dogRun) stopDogs = module.startDogs(park);
  });
  // The address is assembled only on click so it never appears in the HTML.
  document.querySelectorAll('[data-reveal-email]').forEach(button => button.addEventListener('click', () => {
    const out = button.nextElementSibling;
    const open = button.getAttribute('aria-expanded') !== 'true';
    out.textContent = open ? ['ank', 'a'].join(' ') + ' @ ' + 'stan' + 'ford' : '';
    button.setAttribute('aria-expanded', String(open));
  }));
}
setupPage();

// Real static pages remain usable without JS. Navigation swaps just the main
// content when JS is available so a plucked note can finish across page changes.
const scriptUrl = new URL(import.meta.url);
const siteBase = new URL('../', scriptUrl);
const routeKey = url => {
  const pathname = new URL(url).pathname;
  const relative = pathname.startsWith(siteBase.pathname) ? pathname.slice(siteBase.pathname.length) : pathname;
  return relative.replace(/index\.html$/, '').replace(/\/$/, '') || 'home';
};
const routes = new Set(['home', 'research', 'about']);
let navigation;
async function navigate(url, push = true) {
  navigation?.abort();
  const controller = new AbortController();
  navigation = controller;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Page load failed: ${response.status}`);
    const next = new DOMParser().parseFromString(await response.text(), 'text/html');
    const main = next.querySelector('main');
    if (!main) throw new Error('Missing main content');
    // Relative image links must be resolved against the destination, not the old page.
    main.querySelectorAll('[src]').forEach(element => element.setAttribute('src', new URL(element.getAttribute('src'), url).href));
    document.querySelector('main').replaceWith(main);
    document.title = next.title;
    for (const selector of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]']) {
      document.querySelector(selector).content = next.querySelector(selector).content;
    }
    document.body.dataset.page = next.body.dataset.page;
    const active = routeKey(url);
    document.querySelectorAll('header a[data-note]').forEach(link => {
      if (routeKey(link.href) === active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (push) history.pushState({}, '', url);
    setupPage();
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
  } catch (error) {
    if (error.name !== 'AbortError') location.assign(url);
  }
}
// Links with query parameters (version previews) and pages opened with them do full loads, so
// theme.js and the dog animation see the parameters fresh.
document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.hash || url.search || location.search || !url.pathname.startsWith(siteBase.pathname) || !routes.has(routeKey(url))) return;
  event.preventDefault();
  if (link.hasAttribute('data-note')) {
    void play(Number(link.dataset.note));
    if (!reducedMotion.matches && soundEnabled) {
      link.classList.remove('note-playing');
      requestAnimationFrame(() => link.classList.add('note-playing'));
      link.addEventListener('animationend', () => link.classList.remove('note-playing'), { once: true });
    }
  }
  if (url.href !== location.href) void navigate(url.href);
});
window.addEventListener('popstate', () => void navigate(location.href, false));
