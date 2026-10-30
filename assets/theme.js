// Runs before styles are painted to avoid a flash of the wrong theme.
// From 10pm to 6am in the visitor's own time zone the site goes dark and the dogs go to bed, unless
// the visitor switched themes during that same night. By day it follows their saved choice or the system.
(() => {
  const get = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const isNight = date => date.getHours() >= 22 || date.getHours() < 6;
  // A night is named by the evening it started on, so 1am still belongs to the night before.
  const nightKey = date => { const evening = new Date(date); if (evening.getHours() < 6) evening.setDate(evening.getDate() - 1); return evening.toDateString(); };
  window.ankTheme = {
    isNight: () => isNight(new Date()),
    nightKey: () => nightKey(new Date()),
    pick() {
      // ?theme=dark|light previews a theme for this page load without saving it (used by the About page's version links).
      const forced = new URLSearchParams(location.search).get('theme');
      if (forced === 'dark' || forced === 'light') return forced;
      const now = new Date();
      if (isNight(now)) {
        const [key, theme] = (get('ank-night-theme') || '').split('|');
        return key === nightKey(now) && (theme === 'dark' || theme === 'light') ? theme : 'dark';
      }
      const saved = get('ank-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
  };
  document.documentElement.dataset.theme = window.ankTheme.pick();
})();
