// Runs before styles are painted to avoid a flash of the wrong theme.
(() => {
  let preference;
  try { preference = localStorage.getItem('ank-theme'); } catch {}
  // ?theme=dark|light previews a theme for this page load without saving it (used by the About page's version links).
  const forced = new URLSearchParams(location.search).get('theme');
  if (forced === 'dark' || forced === 'light') preference = forced;
  const dark = preference ? preference === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
