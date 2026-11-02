const root = document.documentElement;
const themeButton = document.querySelector('#theme-toggle');
// Keep persistent shell URLs stable after history.pushState changes the path.
document.querySelectorAll('header a[href], head link[href]').forEach(element => {
  element.href = new URL(element.getAttribute('href'), location.href).href;
});
const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

function syncPreferences() {
  const dark = root.dataset.theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeButton.querySelector('span').textContent = dark ? 'Light' : 'Dark';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1a1917' : '#ffffff';
}
syncPreferences();
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  // A switch made at night only lasts until morning; one made by day is kept as the daytime choice.
  if (window.ankTheme.isNight()) safeSet('ank-night-theme', `${window.ankTheme.nightKey()}|${root.dataset.theme}`);
  else safeSet('ank-theme', root.dataset.theme);
  syncPreferences();
});
// Follow the system setting and the clock: dark (and the dogs off to bed) at 10pm, light again at 6am.
const applyTheme = () => {
  const theme = window.ankTheme.pick();
  if (root.dataset.theme !== theme) { root.dataset.theme = theme; syncPreferences(); }
};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
setInterval(applyTheme, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) applyTheme(); });

// Each alternate home names its dog animation; modules load only on the page that uses them.
const dogModules = { side: './dogs-side.js', 'pixel-mini': './dogs-pixel-mini.js?v=7992ca386f' };
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
// content when JS is available.
const scriptUrl = new URL(import.meta.url);
const siteBase = new URL('../', scriptUrl);
const routeKey = url => {
  const pathname = new URL(url).pathname;
  const relative = pathname.startsWith(siteBase.pathname) ? pathname.slice(siteBase.pathname.length) : pathname;
  return relative.replace(/index\.html$/, '').replace(/\/$/, '') || 'home';
};
const routes = new Set(['home', 'research', 'about', 'projects']);
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
    document.querySelectorAll('header nav a').forEach(link => {
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
  if (url.href !== location.href) void navigate(url.href);
});
window.addEventListener('popstate', () => void navigate(location.href, false));
