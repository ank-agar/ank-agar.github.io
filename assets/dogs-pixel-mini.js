// Three golden doodle puppies (one cream, two black) roaming the page in side view as tiny flat
// pixel art: no outlines, one body color, one lighter shade, one darker shade for the far legs and
// ears, and single-pixel legs that swap between frames. Screen y is depth, so dogs lower on the
// page are drawn in front. Each dog has drifting moods that steer loosely weighted random choices
// (wander, sniff, sit, lie down, visit, invite another dog to play), and a tap or click on empty
// space sends them jogging over (some with tongues out). Clicking a dog's head brings down a hand
// to pat it. They get hungry now and then and eat from three steel bowls, often together. In dark
// mode it is night: the dogs curl up asleep on three beds above the bio. On rainy days in Palo Alto
// (or with ?weather=rain) they wear yellow raincoats with the hoods up, under a light drizzle.
// Now and then one gets the zoomies or two play tug-of-war, and in spring butterflies drift by.

// Sprite maps face right. The bottom row stands on the ground.
// B body, L lighter shade, D ears, F far legs, E eye, N nose,
// C front tip of the chin (white on one black dog), M muzzle side (a faint warm tint on that dog), p tongue slot.
const HEAD_WALK = [
  '.......BB...',
  '......BBBB..',
  '......BBBEB.',
  '......BDBMMN',
  '.BBBBBBDBBBC',
  '.BBBBBBBBBBp',
  '.BBBBBBB....',
];
const HEAD_SNIFF = [
  '............',
  '.......BB...',
  '......BBBB..',
  '......BBBEB.',
  '.BBBBBBDBMMN',
  '.BBBBBBDBBBC',
  '.BBBBBBBBBB.',
];
const HEAD_SNIFF2 = [...HEAD_SNIFF.slice(0, 4), '.BBBBBBDBMMB', '.BBBBBBDBBCN', HEAD_SNIFF[6]];
const legs = (head, a, b = a, c = b) => [...head, a, b, c];
// Each pose: frames, the anchor column the dog's position maps to, the tail root, and tail shapes.
// Tail shapes are [dx, dy] offsets from the root, a short two-pixel-thick plume off the rump.
const TAILS = {
  up: [[0, 0], [-1, 0], [0, -1], [-1, -1], [-1, -2], [-2, -3]],
  high: [[0, 0], [-1, 0], [0, -1], [-1, -1], [0, -2], [0, -3]],
  out: [[0, 0], [-1, 0], [0, -1], [-1, -1], [-2, -1], [-3, -1]],
  low: [[0, 0], [0, -1], [-1, 0], [-1, 1], [-2, 1], [-3, 1]],
  flat: [[0, 0], [-1, 0], [-2, 0], [-1, -1], [-3, 0]],
  sweep: [[0, 0], [-1, 0], [-1, -1], [-2, -1], [-3, -1]],
  tuck: [[-1, 0], [-2, 0], [-3, 0]],
  tuckB: [[-1, 0], [-1, -1], [-1, -2]],
  bowA: [[0, 0], [0, -1], [-1, -1], [-2, -2]],
  bowB: [[0, 0], [-1, 0], [-1, -1], [-1, -2]],
};
const POSES = {
  walk: {
    anchor: 4, tail: [0, 4], tails: ['up', 'out'], head: [6, 4], neck: [6, 5],
    frames: [
      legs(HEAD_WALK, '.B.F.F.B....'), legs(HEAD_WALK, '..BF.FB.....'),
      legs(HEAD_WALK, '.F.B.B.F....'), legs(HEAD_WALK, '..BF.FB.....'),
    ],
  },
  stand: { anchor: 4, tail: [0, 4], tails: ['up', 'high', 'out', 'low'], head: [6, 4], neck: [6, 5], frames: [legs(HEAD_WALK, '.B.F.F.B....')] },
  trot: {
    anchor: 4, tail: [0, 4], tails: ['out', 'up'], head: [6, 4], neck: [6, 5],
    // Extended stride, then the airborne beat: body up a pixel with the legs tucked.
    frames: [legs(HEAD_WALK, 'BB.F.F.BB...', 'B..F.F..B...', 'B..F.F..B...'), legs(HEAD_WALK, '..BF.FB.....', '..BF.FB.....', '............')],
  },
  sniff: {
    anchor: 4, tail: [0, 4], tails: ['up', 'high', 'out'], head: [6, 5], neck: [6, 6],
    frames: [legs(HEAD_SNIFF, '.B.F.F.B....'), legs(HEAD_SNIFF2, '.B.F.F.B....')],
  },
  sit: {
    anchor: 4, tail: [1, 9], tails: ['flat', 'sweep'], head: [5, 4], neck: [5, 5],
    // Rounded haunch on the ground, a small gap, then the front legs straight under the chest.
    frames: [[
      '......BB...',
      '.....BBBB..',
      '.....BBBEB.',
      '.....BDBMMN',
      '.....BDBBBC',
      '....BBBBBBp',
      '...BBBBBB..',
      '..BBBB.FB..',
      '.BBBBB.FB..',
      '.BBBBB.FB..',
    ]],
  },
  lie: {
    anchor: 5, tail: [0, 6], tails: ['tuck', 'tuckB'], head: [7, 4], neck: [6, 5],
    // A loaf: hip hump at the back, head up, short forepaws; the second frame has the eyes shut.
    frames: [[
      '........BB...',
      '.......BBBB..',
      '.......BBBEB.',
      '.BBB...BDBMMN',
      'BBBBBBBBDBBBC',
      'BBBBBBBBBBB..',
      'BBBBBBBBBFBB.',
    ], [
      '........BB...',
      '.......BBBB..',
      '.......BBBBB.',
      '.BBB...BDBMMN',
      'BBBBBBBBDBBBC',
      'BBBBBBBBBBB..',
      'BBBBBBBBBFBB.',
    ]],
  },
  bow: {
    anchor: 5, tail: [0, 0], tails: ['bowA', 'bowB'], head: [7, 5], neck: [4, 3],
    frames: [[
      '.BB.........',
      '.BBBB...BB..',
      '.BBBBBBBBBB.',
      '.BBBBBBBBEB.',
      '.B.F..BDBMMN',
      '.B.F..BDBBBC',
      '.B.F..FBBBBB',
    ]],
  },
};
// Asleep on a bed at night: eyes shut (e, a short closed-eye line), and the back rises a pixel on
// each slow breath. 'stir' lifts the head a pixel with the eyes open, for a tap or a pat.
const SLEEP = POSES.lie.frames[1].map((row, i) => i === 2 ? '.......BBeeB.' : row);
// Begging for a treat: sitting up straight on the haunches, torso upright under a raised head, with
// both front paws tucked up at the chest.
POSES.beg = {
  anchor: 4, tail: [1, 10], tails: ['flat', 'sweep'], head: [5, 4], neck: [5, 5],
  frames: [[
    '......BB...',
    '.....BBBB..',
    '.....BBBEB.',
    '.....BDBMMN',
    '.....BDBBBC',
    '.....BBBBBp',
    '....BBBBBDD',
    '....BBBBB..',
    '...BBBBBB..',
    '..BBBBBBB..',
    '..BBBBBBB..',
  ]],
};
POSES.sleep = {
  anchor: 5, tail: [0, 6], tails: ['tuck', 'tuckB'], head: [7, 4], neck: [6, 5],
  frames: [SLEEP, SLEEP.map((row, i) => i === 3 ? '.BBBB..BDBMMN' : row)],
};
POSES.stir = {
  anchor: 5, tail: [0, 8], tails: ['tuck', 'tuckB'], head: [7, 4], neck: [7, 5],
  frames: [[
    '........BB...',
    '.......BBBB..',
    '.......BBBoB.',
    '.......BDBMMN',
    '.......BDBBBC',
    '.BBB...BBBB..',
    'BBBBBBBBBBB..',
    'BBBBBBBBBBB..',
    'BBBBBBBBBFBB.',
  ]],
};
// A small hand reaching down from above: a wrist, a palm with a thumb nub, and fingers with gaps.
// A palm-down hand patting from above, in side profile like the dogs (think of the palm-down hand
// emoji). It is drawn at half the sprite pixel size (the one exception to the grid) so it can read
// as a hand at all. Drawn for a right-facing dog and mirrored with it: the wrist rises straight up
// off the top (fading out), the palm lies flat on the crown, the fingers reach forward with the tips
// drooping over the brow, and the thumb is tucked under at the back. k marks the gaps between fingers.
const HAND = [
  '.....hhhh.......',
  '.....hhhh.......',
  '.....hhhh.......',
  '....hhhhhhh.....',
  '...hhhhhhhhhhh..',
  '..hhhhhhhhhhhhh.',
  '..hhhhhhhkhhkhhh',
  '..khhhhhhkhhkhhk',
  '...hh....hk.hk..',
  '...kk...........',
];
const HAND_MID = 7; // Half-pixel column that sits over the middle of the head.
const HAND_FADE = [.45, .8]; // The wrist fades out upward, as if the arm continues off screen.
const HAND_COLORS = { h: '#e8bfa3', k: '#c4927a' }; // Light skin, a touch pinker than the cream coat so they separate.
// Eating: standing at a bowl with the head down in it; the second frame lifts the head a pixel.
POSES.eat = {
  anchor: 4, tail: [0, 4], tails: ['up', 'out', 'high'], head: [8, 8], neck: [5, 5],
  frames: [[
    '.............', '.............', '.............', '.............',
    '.BBBBBBB.....',
    '.BBBBBBBBBB..',
    '.BBBBBBBBBEB.',
    '.B.F.F.BDBBMN',
    '.B.F.F.BDBBBC',
    '.B.F.F.B.....',
  ], [
    '.............', '.............', '.............', '.............',
    '.BBBBBBBBBB..',
    '.BBBBBBBBBEB.',
    '.BBBBBBBDBBMN',
    '.B.F.F.BDBBBC',
    '.B.F.F.B.....',
    '.B.F.F.B.....',
  ]],
};
// A stainless steel bowl, 7 sprite pixels wide and deep, bottom row on the ground: R rim, I the shadowed
// inside, M the body, D the base, S the shaded side, w highlights. The top two rows draw behind an eating dog's head
// and the rest in front, so the muzzle dips into it.
const BOWL = ['RwwwRRR', 'RIIIIIR', '.MMMMS.', '.wMMMS.', '..DDD..'];
const BOWL_BACK_ROWS = 2, BOWL_SPACING = 20, BOWL_REACH = 7; // Bowl center sits 7 pixels ahead of the dog.
const BOWL_COLORS = {
  light: { R: '#b4bbc3', I: '#4f555d', M: '#959ca6', D: '#6d747d', S: '#5c626a', w: '#ffffff' },
  dark: { R: '#7c828a', I: '#25282c', M: '#575c63', D: '#41454b', S: '#33373c', w: '#c3c8ce' },
};
// Beds are 17 sprite pixels wide, centered on the sleeping dog's foot point.
const BED_HALF = 8, BED_GAP = 2;
// Rainy days: a slicker-yellow coat and hood, and a gentle drizzle of short slanted streaks.
const COAT = { light: { coat: '#e8b830', fold: '#b8891f' }, dark: { coat: '#b8923c', fold: '#8f6d2a' } };
const RAIN = { light: 'rgba(120,146,176,.6)', dark: 'rgba(74,90,112,.75)', splash: { light: 'rgba(120,146,176,.45)', dark: 'rgba(74,90,112,.6)' } };
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=37.4419&longitude=-122.1430&daily=precipitation_sum,precipitation_probability_max,weather_code,temperature_2m_max&timezone=America%2FLos_Angeles&forecast_days=1';

// Is it a rainy day in Palo Alto today (by the Los Angeles calendar)? Cached per day; any failure means no.
// Today's Palo Alto weather by the Los Angeles calendar: { rain, fog, hot }. Cached per day; any
// failure means a plain day. ?weather=rain|fog|hot|clear forces one.
async function weatherToday() {
  const forced = new URLSearchParams(location.search).get('weather');
  if (['rain', 'fog', 'hot', 'clear'].includes(forced)) return { rain: forced === 'rain', fog: forced === 'fog', hot: forced === 'hot' };
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
  try { const c = JSON.parse(localStorage.getItem('ank-weather-day') || 'null'); if (c && c.day === day) return c.w; } catch {}
  try {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(WEATHER_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    const d = (await res.json()).daily, mm = d.precipitation_sum?.[0] ?? 0, code = d.weather_code?.[0] ?? 0, tmax = d.temperature_2m_max?.[0] ?? 0;
    const rain = mm >= .5 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
    const w = { rain, fog: !rain && (code === 45 || code === 48), hot: !rain && tmax >= 27 };
    try { localStorage.setItem('ank-weather-day', JSON.stringify({ day, w })); } catch {}
    return w;
  } catch { return { rain: false, fog: false, hot: false }; }
}

// Which season it is in Los Angeles today: 'halloween' (Oct 24-31), 'winter' (Dec 15-Jan 1),
// 'spring' (Mar 20-May 31) or 'none'. ?season=halloween|winter|spring|none forces one.
function seasonToday() {
  const forced = new URLSearchParams(location.search).get('season');
  if (['halloween', 'winter', 'spring', 'none'].includes(forced)) return forced;
  const [m, d] = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'numeric', day: 'numeric' }).format(new Date()).split('/').map(Number);
  if (m === 10 && d >= 24) return 'halloween';
  if ((m === 12 && d >= 15) || (m === 1 && d === 1)) return 'winter';
  if ((m === 3 && d >= 20) || m === 4 || m === 5) return 'spring';
  return 'none';
}

// Dress a pose in the raincoat: the torso (not the legs, feet or tail) turns coat yellow with a
// darker hem, and the top of the head becomes the hood, leaving the face, ears and chin showing.
function wearCoat(out, colors, hood, floor = -1) {
  const body = new Set(out.filter(p => !p[4] && (p[3] === 'B' || p[3] === 'L') && p.length > 4).map(p => p[0] + ',' + p[1]));
  const head = out.filter(p => p[4]);
  const top = head.length ? Math.min(...head.map(p => p[1])) : 0, back = head.length ? Math.min(...head.map(p => p[0])) : 0;
  const coat = new Set(), dog = new Set(out.map(p => p[0] + ',' + p[1]));
  for (const p of out) {
    const k = p[0] + ',' + p[1];
    // The hood covers the crown and the back of the head, joining the coat at the neck.
    if (hood && p[4] && p[3] === 'B' && (p[1] <= top + 1 || p[0] <= back)) coat.add(k);
    // Torso, not one-pixel legs, and not the bottom two rows (so a sitting dog's haunch shows, not a cone).
    else if (body.has(k) && p[1] < floor && (body.has(p[0] - 1 + ',' + p[1]) || body.has(p[0] + 1 + ',' + p[1]))) coat.add(k);
  }
  // On the black coats, the fur just under the hood catches a lighter shade so the face doesn't merge into it.
  if (colors.under) for (const p of out) if (p[4] && !coat.has(p[0] + ',' + p[1]) && coat.has(p[0] + ',' + (p[1] - 1)) && p[3] === 'B') p[2] = colors.under;
  for (const p of out) {
    const k = p[0] + ',' + p[1];
    if (!coat.has(k)) continue;
    // Darker gold along the hem and where the coat meets the dog, so it stands off a cream coat too.
    const hem = !p[4] && !coat.has(p[0] + ',' + (p[1] + 1));
    const edge = [-1, 1].some(dx => { const n = p[0] + dx + ',' + p[1]; return dog.has(n) && !coat.has(n); });
    p[2] = hem || edge ? colors.fold : colors.coat;
  }
}

const PALETTES = {
  light: {
    blonde: { B: '#e2cba6', L: '#ecdcc0', D: '#d3b388', E: '#6b4a3a', N: '#7a4a3e', e: '#9c7a5a', o: '#6b4a3a' },
    blackA: { B: '#332d2a', L: '#48403b', D: '#433b37', E: '#121010', N: '#121010', e: '#121010', o: '#121010' },
    blackB: { B: '#312c29', L: '#46403b', D: '#413a36', E: '#121010', N: '#121010', C: '#aaa092', e: '#121010', o: '#121010' },
    far: { blonde: '#c9a77c', blackA: '#151211', blackB: '#141110' },
    P: '#e2868c',
  },
  dark: {
    blonde: { B: '#dcc39b', L: '#e8d6b6', D: '#c4a378', E: '#5e4134', N: '#6e4236', e: '#9c7a5a', o: '#5e4134' },
    blackA: { B: '#2c2622', L: '#4a4038', D: '#3e352f', E: '#1c1918', N: '#141110', e: '#5a4f47', o: '#8a8079' },
    blackB: { B: '#2a2421', L: '#483e37', D: '#3c332e', E: '#1c1918', N: '#141110', C: '#8f8982', e: '#584d45', o: '#8a8079' },
    far: { blonde: '#b8956b', blackA: '#221d1a', blackB: '#211c19' },
    P: '#d4848a', rim: true,
    bed: { bolster: '#7d7f84', top: '#93959a', cushion: '#686a6f', front: '#74767b' }, // Gray, like their real beds.
  },
};

// Compile string maps into pixel lists: [x, y, key, isHead] with y measured up from the ground row (0).
function compile(pose) {
  const [headCol, headRow] = pose.head;
  return pose.frames.map(rows => {
    const h = rows.length, px = [];
    rows.forEach((row, ry) => [...row].forEach((ch, cx) => {
      if (ch !== '.') px.push([cx - pose.anchor, ry - h + 1, ch, cx >= headCol && ry <= headRow]);
    }));
    return px;
  });
}
const COMPILED = Object.fromEntries(Object.entries(POSES).map(([k, p]) => [k, compile(p)]));

// The sprite footprint used for avoidance, in sprite pixels around the dog's foot point.
const FOOT = { left: 8, right: 9, up: 11 };

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function weighted(options) {
  const total = options.reduce((s, o) => s + Math.max(0, o[1]), 0);
  let r = Math.random() * total;
  for (const [name, w] of options) { r -= Math.max(0, w); if (r <= 0) return name; }
  return options[0][0];
}

export function startDogs(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, dpr = 1, P = 7, PD = 7, raf = 0, last = 0, stopped = false, frozen = false, sheet = null;
  let avoid = [], keepOut = [], avoidAge = Infinity, clock = 0;
  let dogs = [];
  // Night (dark theme): beds above the bio, and a zone around them exempt from the text margin.
  let night = null, beds = [], zone = null, lineBox = null, headBox = null, hand = null, cursorSet = false, bowls = [];
  let swallowClickUntil = 0; // A treat drag ends in a click; don't also treat it as a tap.
  // Bowls only show while a meal is on: they pop in when a dog sets off for them and fade a moment after the last one leaves.
  let bowlVis = 0, bowlLinger = 0, bowlsInUse = false;
  let raining = false, drops = [], weather = { rain: false, fog: false, hot: false };
  // Optional features (fog, heat, seasons, bird, fetch) plug in here; each lives in its own section below.
  const extras = [], cleanups = [];
  // Weather nudges: travel speed, a bias on energy, a pull toward lying down, and extra panting.
  const mods = { speed: 1, energy: 0, lie: 0, pant: 0 };

  // A fixed pool of raindrops, recycled from the top. Some land at the dogs' ground level and splash.
  function newDrop(drop, anywhere) {
    const grounds = dogs.map(d => d.y);
    drop.x = rand(0, width + 60);
    drop.ground = Math.random() < .25 && grounds.length > 0;
    drop.end = drop.ground ? pick(grounds) + rand(-3, 3) * P : rand(height * .1, height);
    drop.y = anywhere ? rand(-20, drop.end) : rand(-60, -10);
    drop.speed = rand(200, 260);
    drop.splash = 0;
    return drop;
  }
  function initRain() {
    const n = clamp(Math.round(40 * width * height / (1280 * 800)), 16, 70);
    drops = Array.from({ length: n }, () => newDrop({}, true));
  }
  function updateRain(dt) {
    for (const d of drops) {
      if (d.splash > 0) { if ((d.splash -= dt) <= 0) newDrop(d); continue; }
      d.y += d.speed * dt; d.x -= d.speed * dt * .35;
      if (d.y >= d.end) { if (d.ground) d.splash = .16; else newDrop(d); }
    }
  }
  function drawRain(dark) {
    const pad = 22, navBand = Math.max(0, ...avoid.filter(r => r.t < 120).map(r => r.b)) + 26; // Keep the whole nav band dry.
    const hidden = (x, y) => y < navBand || avoid.some(r => x > r.l - pad && x < r.r + pad && y > r.t - pad && y < r.b + pad);
    const step = reduced.matches ? 3 : 1;
    for (let i = 0; i < drops.length; i += step) {
      const d = drops[i];
      if (hidden(d.x, d.y)) continue;
      const gx = Math.round(d.x * dpr / PD), gy = Math.round(d.y * dpr / PD);
      if (d.splash > 0) {
        ctx.fillStyle = RAIN.splash[dark ? 'dark' : 'light'];
        ctx.fillRect(gx * PD, (gy - 1) * PD, PD, PD); // A one-pixel splash where it lands.
        continue;
      }
      // Every drop is the same short streak, one pixel wide, leaning with the wind (top pixel one to the right).
      ctx.fillStyle = RAIN[dark ? 'dark' : 'light'];
      for (let k = 0; k < 3; k++) ctx.fillRect((gx + (k === 2 ? 1 : 0)) * PD, (gy - 1 - k) * PD, PD, PD);
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Size from the canvas's actual box, the same coordinate space the text is measured in. (On iPhones
    // 100vh and innerHeight disagree while the toolbars slide, which stretched the dogs over the text.)
    const box = canvas.getBoundingClientRect();
    width = box.width || innerWidth; height = box.height || innerHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Small and unobtrusive, growing gently: 3px up to about half a laptop screen, 4-5px on a full one.
    P = width >= 1400 ? 5 : width >= 900 ? 4 : 3;
    PD = Math.max(1, Math.round(P * dpr)); // Whole device pixels per sprite pixel, so pixels stay square.
    avoidAge = Infinity;
  }

  function measureAvoid() {
    const m = 24;
    avoid = [...document.querySelectorAll('[data-dog-avoid]')].map(el => {
      const r = el.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom };
    }).filter(r => r.r - r.l > 4 && r.b - r.t > 4);
    // Regions the foot point must stay out of so the whole sprite clears each rect by m.
    keepOut = avoid.map(r => ({ l: r.l - m - FOOT.right * P, r: r.r + m + FOOT.left * P, t: r.t - m, b: r.b + m + FOOT.up * P }));
    avoidAge = 0;
    if (night) placeBeds();
    // Settle the bowls once the layout is known, and move them if the text grows over them.
    const over = b => avoid.some(r => b.x - 4 * P < r.r + 10 && b.x + 4 * P > r.l - 10 && b.y - 5 * P < r.b + 10 && b.y > r.t - 10);
    if (width && (!bowls.length || bowls.some(over))) placeBowls();
  }

  // The real extent of an element's first line of text (its box is wider than the words).
  function firstLine(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
    if (!rects.length) return null;
    const top = rects[0].top, line = rects.filter(r => Math.abs(r.top - top) < 3);
    return { l: Math.min(...line.map(r => r.left)), r: Math.max(...line.map(r => r.right)), t: Math.min(...line.map(r => r.top)), b: Math.max(...line.map(r => r.bottom)) };
  }

  // Three beds in a row just above the bio's first long line, reaching a little past its right end.
  function placeBeds() {
    const copy = document.querySelector('.home-alt-copy');
    const para = copy?.querySelector('p'), heading = copy?.querySelector('h1');
    lineBox = para && firstLine(para);
    headBox = heading && firstLine(heading);
    let baseY, rowL;
    const rowW = (3 * (2 * BED_HALF + 1) + 2 * BED_GAP) * P;
    if (lineBox) {
      baseY = lineBox.t - 14; // The row's bottom sits clearly above the first long line.
      rowL = lineBox.r + 16; // Starting just past that line's right end.
      if (headBox && headBox.b > baseY - 9 * P) rowL = Math.max(rowL, headBox.r + 3 * P);
    } else { baseY = height * .7; rowL = width * .6; }
    const edge = width < 600 ? 22 : 6; // On phones, keep the beds inside the same side margin as the text.
    rowL = Math.max(edge, Math.min(rowL, width - rowW - edge));
    const faces = [1, 1, -1];
    beds = [0, 1, 2].map(i => ({ x: rowL + (BED_HALF + i * (2 * BED_HALF + 1 + BED_GAP)) * P + P / 2, y: baseY, face: faces[i] }));
    zone = { l: rowL - 3 * P, r: rowL + rowW + 3 * P, t: baseY - Math.max(20 * P, 90), b: baseY + 2 };
    beds.forEach(b => { b.entry = { x: b.x, y: zone.t + 2 * P }; });
    // Dogs already asleep move with their beds when the layout shifts.
    for (const dog of dogs) if (dog.bed && dog.act?.type === 'sleep') { dog.bed = beds[dog.slot]; dog.x = dog.bed.x; dog.y = dog.bed.y; }
  }

  // A fixed spot for the three bowls in open space: clear of the text, the nav and the beds' zone,
  // with room for a dog to stand at each one. Dogs face the page's center while they eat.
  function placeBowls() {
    const keep = { beds, zone, lineBox, headBox };
    placeBeds();
    const bedZone = zone;
    ({ beds, zone, lineBox, headBox } = keep);
    const fits = (x, y, face) => {
      const pts = [0, 1, 2].map(i => ({ x: x + i * BOWL_SPACING * P * (face < 0 ? 1 : -1), y }));
      return pts.every(b => {
        const dx = b.x - BOWL_REACH * P * face;
        const box = { l: Math.min(b.x - 4 * P, dx - FOOT.left * P) - 10, r: Math.max(b.x + 4 * P, dx + FOOT.right * P) + 10, t: y - FOOT.up * P - 10, b: y + 10 };
        const clear = r => !(box.l < r.r && box.r > r.l && box.t < r.b && box.b > r.t);
        return !keepOut.some(r => inRect(dx, y, r)) && dx >= minX() && dx <= maxX() && y >= minY() && y <= maxY()
          && b.x - 4 * P > 0 && b.x + 4 * P < width && avoid.every(clear) && (!bedZone || clear(bedZone));
      }) && pts;
    };
    // Preferred spots first, then a finer sweep so narrow phone screens still find room for the row.
    const fxs = [.84, .78, .9, .7, .62, .3, .2, ...Array.from({ length: 17 }, (_, i) => .1 + i * .05)];
    for (const fy of [.4, .32, .5, .25, .6, .7, .2, .45, .35, .55, .3, .65])
      for (const fx of fxs) {
        const face = fx > .5 ? -1 : 1, x = width * fx, y = height * fy;
        const pts = fits(x, y, face);
        if (pts) {
          bowls = pts.sort((a, b) => a.x - b.x).map((b, i) => ({ ...b, face, i, dog: bowls[i]?.dog || null }));
          bowls.forEach(b => { b.spot = { x: b.x - BOWL_REACH * P * face, y: b.y }; });
          return;
        }
      }
    bowls = [];
  }

  const minX = () => FOOT.left * P + 6, maxX = () => width - FOOT.right * P - 6;
  const minY = () => FOOT.up * P + 8, maxY = () => height - 8;
  const inRect = (x, y, r) => x > r.l && x < r.r && y > r.t && y < r.b;
  const inZone = (x, y) => zone && x >= zone.l && x <= zone.r && y >= zone.t && y <= zone.b;
  const blocked = (x, y, r) => inRect(x, y, r) && !inZone(x, y);
  const valid = (x, y) => x >= minX() && x <= maxX() && y >= minY() && y <= maxY() && (inZone(x, y) || !keepOut.some(r => inRect(x, y, r)));
  function segHits(ax, ay, bx, by, r) {
    // Sample along the segment; rects are large relative to the step.
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 6) + 1;
    for (let i = 0; i <= n; i++) { const f = i / n; if (blocked(ax + (bx - ax) * f, ay + (by - ay) * f, r)) return true; }
    return false;
  }
  const clearPath = (ax, ay, bx, by) => !keepOut.some(r => segHits(ax, ay, bx, by, r));
  function nearestValid(x, y) {
    x = clamp(x, minX(), maxX()); y = clamp(y, minY(), maxY());
    if (valid(x, y)) return { x, y };
    for (let rad = 10; rad < 900; rad += 10) {
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2, px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad * .7;
        if (valid(px, py)) return { x: px, y: py };
      }
    }
    return { x, y };
  }
  // Too close to another dog's body or destination (an ellipse: wide sideways, shallow in depth).
  function crowded(dog, x, y, scale = 1) {
    if (bowlVis > 0 && bowls.some(b => Math.abs(b.x - x) < 9 * P && Math.abs(b.y - y) < 5 * P)) return true;
    return dogs.some(o => o !== dog && [o, o.dest || o].some(p => Math.hypot((p.x - x) / (16 * P * scale), (p.y - y) / (8 * P * scale)) < 1));
  }
  function randomSpot(dog, near, radius) {
    for (let i = 0; i < 40; i++) {
      const a = rand(0, Math.PI * 2), r = rand(radius * .3, radius);
      const x = near.x + Math.cos(a) * r, y = near.y + Math.sin(a) * r * .45; // Mostly sideways travel.
      if (valid(x, y) && !inZone(x, y) && !crowded(dog, x, y)) return { x, y };
    }
    return null;
  }

  // Route to a destination, detouring around a blocking rect through one of its corners.
  function route(dog, to) {
    if (clearPath(dog.x, dog.y, to.x, to.y)) return [to];
    let best = null;
    for (const r of keepOut) {
      if (!segHits(dog.x, dog.y, to.x, to.y, r)) continue;
      for (const [cx, cy] of [[r.l - 6, r.t - 6], [r.r + 6, r.t - 6], [r.l - 6, r.b + 6], [r.r + 6, r.b + 6]]) {
        if (!valid(cx, cy) || !clearPath(dog.x, dog.y, cx, cy) || !clearPath(cx, cy, to.x, to.y)) continue;
        const len = Math.hypot(cx - dog.x, cy - dog.y) + Math.hypot(to.x - cx, to.y - cy);
        if (!best || len < best.len) best = { len, pts: [{ x: cx, y: cy }, to] };
      }
    }
    return best ? best.pts : null;
  }

  function makeDog(coat, personality) {
    return {
      coat, x: 0, y: 0, face: Math.random() < .5 ? 1 : -1, pers: personality,
      mood: { energy: personality.energy, curiosity: personality.curiosity, social: personality.social, hunger: rand(0, .45) },
      appetite: rand(.75, .95), followEat: 0,
      act: null, path: [], dest: null, speed: 0, gait: rand(0, 4), wag: rand(0, 10), wagRate: 0,
      tongue: 0, pant: false, stir: 0, pat: null, playCooldown: rand(6, 14), lieClock: rand(0, 4), seed: rand(0, 1000),
    };
  }

  function spawn() {
    dogs = [
      makeDog('blonde', { energy: .72, curiosity: .7, social: .65 }),
      makeDog('blackA', { energy: .5, curiosity: .55, social: .45 }),
      makeDog('blackB', { energy: .6, curiosity: .45, social: .7 }),
    ];
    for (const dog of dogs) {
      let spot = null;
      for (let i = 0; i < 300 && !spot; i++) {
        const x = rand(width * .1, width * .9), y = rand(height * .25, height * .9);
        if (valid(x, y) && !crowded(dog, x, y, 1.3)) spot = { x, y };
      }
      spot ||= nearestValid(width / 2, height / 2);
      dog.x = spot.x; dog.y = spot.y;
      setAct(dog, pick(['stand', 'sit', 'sniff', 'wander']), true);
    }
    // Bed order: the blonde sleeps in the middle.
    dogs[1].slot = 0; dogs[0].slot = 1; dogs[2].slot = 2;
  }

  // A hungry dog heads for the bowls; the others are likely, not certain, to join it soon after.
  function startMeal(dog) {
    setAct(dog, 'eat');
    if (dog.act.type === 'eat') bowlVis = Math.max(bowlVis, .25); // The bowls appear as the trip starts.
    if (dog.act.type !== 'eat') return;
    for (const o of dogs) {
      if (o === dog || o.followEat > 0 || ['eat', 'pat', 'come', 'chase', 'bowback', 'zoomies', 'tug', 'beg', 'chew', 'treatgrab'].includes(o.act.type)) continue;
      if (Math.random() < .3 + .45 * o.mood.hunger + .2 * o.mood.social) o.followEat = rand(.8, 4.5);
    }
  }

  // Whether a dog feels like panting: re-rolled for each burst of excitement, so not every dog does.
  const rollPant = dog => { dog.pant = Math.random() < .1 + mods.pant + .5 * dog.mood.energy * (.5 + .6 * dog.mood.social); if (!dog.pant) dog.tongue = 0; };

  function setNight(on, instant) {
    night = on;
    if (on) {
      placeBeds();
      dogs.forEach((dog, i) => {
        dog.bed = beds[dog.slot]; dog.pant = false; dog.tongue = 0;
        if (instant) { dog.x = dog.bed.x; dog.y = dog.bed.y; dog.face = dog.bed.face; setAct(dog, 'sleep'); dog.act.t = rand(0, 20); }
        else setAct(dog, 'tobed', false, { delay: rand(0, .5) + i * rand(.1, .4) });
      });
    } else {
      // Morning: get up, step out of the bed area, and go back to roaming.
      dogs.forEach((dog, i) => { if (!instant) setAct(dog, 'wake', false, { delay: rand(.1, .9) + i * .2 }); dog.bed = null; });
    }
  }

  // ---- Activities -------------------------------------------------------------------------
  // An activity may walk somewhere first (dest), then holds a pose for a while.
  function goTo(dog, to, gait) {
    const path = to && route(dog, to);
    if (!path) return false;
    dog.path = path; dog.dest = path[path.length - 1]; dog.moveGait = gait;
    return true;
  }

  function setAct(dog, type, initial = false, extra = {}) {
    const m = dog.mood;
    if (dog.bowl && type !== 'eat' && type !== 'sniffbowl') { dog.bowl.dog = null; dog.bowl = null; }
    dog.act = { type, t: 0, hold: 0, ...extra };
    dog.path = []; dog.dest = null; dog.moveGait = 'walk';
    const a = dog.act;
    switch (type) {
      case 'wander': {
        const spot = randomSpot(dog, dog, rand(90, 160 + 260 * m.energy));
        if (!spot || !goTo(dog, spot, 'walk')) { a.type = 'stand'; a.hold = rand(1, 3); }
        else a.hold = Math.random() < .5 ? rand(.3, 1.5) : 0;
        break;
      }
      case 'sniff': {
        const spot = initial ? null : randomSpot(dog, dog, rand(40, 160));
        if (spot) goTo(dog, spot, 'walk');
        a.hold = rand(1.8, 3 + 5 * m.curiosity);
        a.nudge = rand(.8, 2);
        break;
      }
      case 'stand': a.hold = rand(.8, 3.5); break;
      case 'sit': a.hold = rand(3, 7 + 6 * (1 - m.energy)); break;
      case 'lie': a.hold = rand(8, 14 + 20 * (1 - m.energy)); break;
      case 'zoom': {
        const spot = randomSpot(dog, dog, rand(220, 420));
        if (!spot || !goTo(dog, spot, 'trot')) { a.type = 'stand'; a.hold = 1; }
        else a.hold = rand(.5, 1.5);
        break;
      }
      case 'visit': case 'play': {
        const friend = extra.friend;
        const side = Math.random() < .5 ? -1 : 1;
        const spot = nearestValid(friend.x + side * rand(13, 17) * P, friend.y + rand(-2, 2) * P);
        if (!goTo(dog, spot, type === 'play' ? 'trot' : 'walk')) { a.type = 'stand'; a.hold = 1; break; }
        a.hold = type === 'play' ? rand(1.4, 2.6) : rand(1.5, 4);
        break;
      }
      case 'chase': {
        // Short bursts of trotting around a playmate.
        const spot = randomSpot(dog, extra.friend, rand(60, 160));
        if (!spot || !goTo(dog, spot, 'trot')) { a.type = 'stand'; a.hold = 1; }
        else a.hold = rand(.2, .9);
        break;
      }
      case 'come': {
        goTo(dog, extra.spot, 'trot');
        if (Math.abs(extra.spot.x - dog.x) > 4) dog.face = extra.spot.x > dog.x ? 1 : -1; // Turn toward the tap at once.
        a.hold = rand(.4, 1.2);
        break;
      }
      case 'tobed': {
        const bed = dog.bed, path = inZone(dog.x, dog.y) ? [] : route(dog, bed.entry);
        if (!path) { a.hold = .5; break; } // Try again shortly.
        dog.path = [...path, { x: bed.x, y: bed.y }]; dog.dest = dog.path[dog.path.length - 1];
        dog.moveGait = Math.hypot(bed.x - dog.x, bed.y - dog.y) > 120 ? 'trot' : 'walk';
        a.hold = rand(.8, 2); // Lie there with the head up a moment before dozing off.
        break;
      }
      case 'sleep': a.hold = Infinity; break;
      case 'wake': {
        if (inZone(dog.x, dog.y)) { dog.path = [{ x: dog.x + rand(-4, 4) * P, y: zone.t + rand(-2, 1) * P }]; dog.dest = dog.path[0]; dog.moveGait = 'trot'; }
        a.hold = rand(.2, .8);
        break;
      }
      case 'pat': a.hold = 1.6; break;
      case 'eat': case 'sniffbowl': {
        // Take the nearest free bowl (a sniff goes to one a friend just left).
        const free = bowls.filter(b => !b.dog || b.dog === dog).sort((p, q) => Math.hypot(p.spot.x - dog.x, p.spot.y - dog.y) - Math.hypot(q.spot.x - dog.x, q.spot.y - dog.y));
        const bowl = type === 'sniffbowl' ? free.find(b => b !== dog.bowl) : free[0];
        if (dog.bowl && dog.bowl !== bowl) { dog.bowl.dog = null; dog.bowl = null; }
        if (!bowl || !goTo(dog, bowl.spot, Math.hypot(bowl.spot.x - dog.x, bowl.spot.y - dog.y) > 150 ? 'trot' : 'walk')) { a.type = 'stand'; a.hold = 1; break; }
        bowl.dog = dog; dog.bowl = bowl;
        a.hold = type === 'eat' ? rand(4, 7 + 6 * m.hunger) : rand(1.5, 3);
        if (type === 'eat') a.busy = true;
        break;
      }
      case 'mill': {
        const spot = randomSpot(dog, extra.center, rand(30, 90));
        if (spot) goTo(dog, spot, 'walk');
        a.hold = rand(1.2, 3.5);
        a.nudge = rand(.8, 2);
        break;
      }
    }
  }

  function chooseNext(dog) {
    const m = dog.mood, a = dog.act;
    if (night) {
      const home = dog.bed && Math.hypot(dog.x - dog.bed.x, dog.y - dog.bed.y) < 2;
      return setAct(dog, home ? 'sleep' : 'tobed');
    }
    if (a.type === 'pat') { m.social = clamp(m.social + .15, .05, .95); m.energy = clamp(m.energy + .1, .05, .95); }
    if (a.type === 'eat' && dog.bowl && !dog.path.length) {
      // Full. Sometimes check what the neighbor left behind, otherwise wander off content.
      m.hunger = 0; dog.appetite = rand(.75, .95);
      if (Math.random() < .25 && bowls.some(b => !b.dog)) return setAct(dog, 'sniffbowl');
      return setAct(dog, 'wander');
    }
    if (bowls.length && m.hunger > dog.appetite && !['come', 'mill', 'chase', 'bowback', 'play'].includes(a.type)) return startMeal(dog);
    // After a tap the dogs keep poking around the spot for a few beats before going back to normal.
    if ((a.type === 'come' || a.type === 'mill') && (a.left ?? 0) > 0) {
      return setAct(dog, 'mill', false, { center: a.center, left: a.left - 1 });
    }
    if (a.type === 'chase' && a.rounds > 0) return setAct(dog, 'chase', false, { friend: a.friend, rounds: a.rounds - 1 });
    if (a.type === 'play' && a.friend) {
      // The invitation: a play bow. Whether the friend joins depends on how it feels.
      const f = a.friend;
      if (!f.act.busy && Math.random() < .25 + .6 * f.mood.energy * f.mood.social) {
        const rounds = Math.floor(rand(2, 5));
        setAct(f, 'bowback', false, { friend: dog, rounds });
        rollPant(f);
        f.act.hold = rand(.6, 1.4);
        return setAct(dog, 'chase', false, { friend: f, rounds });
      }
    }
    if (a.type === 'bowback') return setAct(dog, 'chase', false, { friend: a.friend, rounds: a.rounds });
    const others = dogs.filter(o => o !== dog);
    const friend = others[Math.floor(Math.random() * others.length)];
    const settled = a.type === 'sit' || a.type === 'lie';
    const choice = weighted([
      ['wander', .9 + .7 * m.energy],
      ['sniff', .2 + 1.4 * m.curiosity],
      ['stand', .45],
      ['sit', .2 + .7 * (1 - m.energy) + (settled ? .3 : 0)],
      ['lie', (m.energy < .55 ? 1.4 * (1 - m.energy) ** 2 + (a.type === 'sit' ? .4 : 0) : .05) + mods.lie],
      ['visit', .7 * m.social],
      ['play', dog.playCooldown <= 0 ? 1.6 * m.social * m.energy ** 2 : 0],
      ['zoom', .5 * m.energy ** 3],
    ]);
    if (choice === 'zoom' || choice === 'play') rollPant(dog);
    if (choice === 'visit' || choice === 'play') {
      if (choice === 'play') dog.playCooldown = rand(18, 40);
      return setAct(dog, choice, false, { friend });
    }
    setAct(dog, choice);
  }

  // ---- Simulation -------------------------------------------------------------------------
  function driftMood(dog, dt) {
    const m = dog.mood, p = dog.pers, s = Math.sqrt(dt);
    for (const k of ['energy', 'curiosity', 'social']) m[k] = clamp(m[k] + (p[k] + (k === 'energy' ? mods.energy : 0) - m[k]) * .015 * dt + (Math.random() - .5) * .09 * s, .05, .95);
    const t = dog.act.type;
    if (dog.speed > 50) m.energy = clamp(m.energy - .012 * dt, .05, .95);
    if (t === 'lie') m.energy = clamp(m.energy + .012 * dt, .05, .95);
    if (t === 'sniff' || t === 'mill') m.curiosity = clamp(m.curiosity - .01 * dt, .05, .95);
    dog.playCooldown -= dt;
    // Hunger creeps up, faster for livelier dogs; it fills back to zero after a meal.
    if (t !== 'eat' && t !== 'sleep') m.hunger = Math.min(1, m.hunger + (.006 + .012 * m.energy) * dt);
  }

  function step(dog, dt) {
    driftMood(dog, dt);
    if (dog.followEat > 0 && (dog.followEat -= dt) <= 0 && !night && !['eat', 'pat', 'come', 'chase', 'bowback', 'sleep', 'tobed', 'fetch', 'bird', 'zoomies', 'tug', 'flutter', 'beg', 'chew', 'treatgrab'].includes(dog.act.type)) {
      setAct(dog, 'eat');
      if (dog.act.type === 'eat') bowlVis = Math.max(bowlVis, .25);
      if (dog.act.type === 'eat') dog.mood.hunger = Math.max(dog.mood.hunger, .5);
    }
    const a = dog.act;
    a.t += dt;
    let targetSpeed = 0;
    if (a.delay > 0) a.delay -= dt;
    else if (dog.path.length) {
      const wp = dog.path[0];
      const dx = wp.x - dog.x, dy = wp.y - dog.y, d = Math.hypot(dx, dy);
      const trot = dog.moveGait === 'trot';
      const cruise = (trot ? 150 + 45 * dog.mood.energy : 26 + 14 * dog.mood.energy) * mods.speed * (a.speedScale ?? 1);
      targetSpeed = Math.min(cruise, d * (trot ? 3 : 2.2) + 8);
      if (d < 3) {
        if (dog.path.length === 1 && ['tobed', 'wake', 'eat', 'sniffbowl'].includes(a.type)) { dog.x = wp.x; dog.y = wp.y; }
        dog.path.shift();
        if (!dog.path.length) { dog.dest = null; targetSpeed = 0; dog.speed = 0; if (a.onArrive) { const f = a.onArrive; a.onArrive = null; f(dog); } }
      } else {
        let vx = dx / d, vy = dy / d;
        // Ease around nearby dogs instead of walking through them.
        for (const o of dogs) {
          if (o === dog || ['tobed', 'wake', 'eat', 'sniffbowl'].includes(a.type)) continue;
          const ox = dog.x - o.x, oy = dog.y - o.y, e = Math.hypot(ox / (14 * P), oy / (5 * P));
          if (e < 1.2 && e > 0) { vy += Math.sign(oy || 1) * (1.2 - e) * 2; }
        }
        const vl = Math.hypot(vx, vy) || 1;
        dog.speed += (targetSpeed - dog.speed) * Math.min(1, dt * 4);
        const nx = dog.x + vx / vl * dog.speed * dt, ny = dog.y + vy / vl * dog.speed * dt;
        // Hard rule: the sprite never enters the content or leaves the screen.
        if (valid(nx, ny)) { dog.x = nx; dog.y = ny; }
        else if (valid(nx, dog.y)) dog.x = nx;
        else if (valid(dog.x, ny)) dog.y = ny;
        else { dog.path = []; dog.dest = null; }
        if (Math.abs(vx) > .25) dog.face = vx > 0 ? 1 : -1;
        dog.gait += dog.speed * dt / (P * (trot ? 2.4 : 1.6));
        if (!dog.path.length && a.type !== 'stand') dog.speed = 0;
      }
    } else {
      dog.speed = 0;
      a.hold -= dt;
      if (dog.bed && (a.type === 'tobed' || a.type === 'sleep')) dog.face = dog.bed.face;
      if (dog.bowl && (a.type === 'eat' || a.type === 'sniffbowl')) dog.face = dog.bowl.face;
      if (a.watch && Math.abs(a.watch.x - dog.x) > 3) dog.face = a.watch.x > dog.x ? 1 : -1; // Keep an eye on something.
      // Small life while stationary: a sniffing nose inches forward, a standing dog looks around.
      if ((a.type === 'sniff' || a.type === 'mill') && (a.nudge -= dt) <= 0) {
        a.nudge = rand(.8, 2.4);
        const nx = dog.x + dog.face * P;
        if (Math.random() < .6 && valid(nx, dog.y) && !crowded(dog, nx, dog.y, .8)) dog.x = nx;
        else if (Math.random() < .3) dog.face *= -1;
      }
      if (a.type === 'stand' && Math.random() < dt * .25) dog.face *= -1;
      if (a.hold <= 0) chooseNext(dog);
    }
    if (!valid(dog.x, dog.y)) { const p = nearestValid(dog.x, dog.y); dog.x = p.x; dog.y = p.y; dog.path = []; dog.dest = null; }

    // Tail wag speed and tongue follow excitement (the tongue only for dogs in a panting mood).
    const excited = dog.moveGait === 'trot' && dog.path.length && a.type !== 'tobed' || ['play', 'bowback', 'chase', 'come'].includes(a.type);
    if (excited && dog.pant && !night) dog.tongue = Math.max(dog.tongue, rand(3, 5));
    else dog.tongue = Math.max(0, dog.tongue - dt);
    dog.stir = Math.max(0, dog.stir - dt);
    if (dog.pat && (dog.pat.t += dt) > dog.pat.dur) dog.pat = null;
    const wagTarget = dog.pat || dog.stir > 0 ? 9 : a.type === 'eat' && !dog.path.length ? 1.6 : excited || a.type === 'mill' ? 7 : a.type === 'lie' || a.type === 'sleep' ? .4 : a.type === 'sit' ? 1.8 : dog.path.length ? 2.5 : 2.2 + 2 * dog.mood.social * Math.max(0, Math.sin(clock * .3 + dog.seed));
    dog.wagRate += (wagTarget - dog.wagRate) * Math.min(1, dt * 2);
    dog.wag += dt * dog.wagRate;
    dog.lieClock += dt;
  }

  // Nudge apart any dogs that ended up standing on top of each other.
  function separate() {
    for (const dog of dogs) {
      if (night || zone || dog.path.length || dog.act.delay > 0 || ['pat', 'eat', 'sniffbowl'].includes(dog.act.type)) continue;
      for (const o of dogs) {
        if (o === dog || o.path.length) continue;
        if (Math.hypot((o.x - dog.x) / (13 * P), (o.y - dog.y) / (8 * P)) < 1 && dogs.indexOf(dog) > dogs.indexOf(o)) {
          const spot = randomSpot(dog, dog, 140);
          if (spot) { dog.act = { type: 'stand', t: 0, hold: rand(.5, 2) }; goTo(dog, spot, 'walk'); }
        }
      }
    }
  }

  function update(dt) {
    clock += dt;
    for (const dog of dogs) step(dog, dt);
    separate();
    if (!night && zone && !dogs.some(d => inZone(d.x, d.y))) zone = null; // Everyone is out of bed.
    const inUse = dogs.some(d => d.bowl);
    if (inUse) bowlsInUse = true;
    else if (bowlsInUse) { bowlsInUse = false; bowlLinger = rand(1.5, 3); }
    bowlLinger = Math.max(0, bowlLinger - dt);
    bowlVis = clamp(bowlVis + (inUse || bowlLinger > 0 ? dt : -dt) / .3, 0, 1);
    for (const x of extras) x.update?.(dt);
  }

  // ---- Drawing ----------------------------------------------------------------------------
  function frameOf(dog) {
    const a = dog.act, moving = dog.path.length && !(a.delay > 0);
    if (a.type === 'sleep') return dog.pat || dog.stir > 0 ? ['stir', 0] : ['sleep', Math.sin(clock * 2.1 + dog.seed) > 0 ? 1 : 0];
    if (a.type === 'pat') return [a.pose || 'stand', 0];
    if (a.still && !moving) return [a.still, 0]; // A feature holding a pose (tug-of-war bow, watching a butterfly).
    if (a.type === 'tobed' && !moving) return ['lie', 0];
    if (a.type === 'bird' && moving && (a.speedScale ?? 1) < 1) return ['sniff', Math.floor(dog.gait) % 2]; // Stalking: head low, creeping.
    if (a.type === 'eat' && !moving && dog.bowl) return ['eat', (Math.floor(clock * 2.4 + dog.seed) % 3 === 0) ? 1 : 0];
    if (a.type === 'sniffbowl' && !moving) return ['sniff', Math.floor(clock * 3 + dog.seed) % 2];
    if (moving) {
      if (dog.moveGait === 'trot') return ['trot', Math.floor(dog.gait) % 2];
      return ['walk', Math.floor(dog.gait) % 4];
    }
    switch (a.type) {
      case 'sniff': case 'mill': return ['sniff', Math.floor(clock * 3.2 + dog.seed) % 2 && Math.sin(clock * 1.3 + dog.seed) > -.2 ? 1 : 0];
      case 'sit': return ['sit', 0];
      case 'lie': return ['lie', a.t > 5 && Math.sin(a.t * .15 + dog.seed) > -.3 ? 1 : 0];
      case 'play': case 'bowback': return ['bow', 0];
      default: return ['stand', 0];
    }
  }

  function tailFor(pose, dog) {
    const list = POSES[pose].tails;
    if (pose === 'walk' || pose === 'trot') return list[Math.floor(dog.wag) % list.length];
    // Wagging alternates between the first two shapes; the rest show up when the dog is calm.
    const calm = dog.wagRate < 2.5 && list.length > 2;
    const base = calm ? 2 + Math.floor(dog.seed) % (list.length - 2) : 0;
    return calm ? (Math.sin(dog.wag) > .6 ? list[0] : list[base]) : list[Math.floor(dog.wag) % 2];
  }

  // Build the colored pixels for a dog in a given pose and frame, relative to its foot point.
  function pixels(dog, pose, frame, pal, tongue, tailName) {
    const colors = pal[dog.coat], far = pal.far[dog.coat], out = [];
    const color = ch => {
      if (ch === 'C') return colors.C || colors.B; // Only black B has a white chin tip.
      if (ch === 'M') return colors.M || colors.B;
      if (ch === 'p') return tongue ? pal.P : null;
      if (ch === 'E' && dog.pat) return colors.B; // A happy squint while being patted.
      if (ch === 'F') return far;
      if (ch === 'L' && dog.coat !== 'blonde') return colors.B; // No belly band on the black coats.
      return colors[ch];
    };
    for (const [x, y, ch, head] of COMPILED[pose][frame]) {
      const c = color(ch);
      if (c) out.push([x, y, c, ch, head]);
    }
    const [tx, ty] = POSES[pose].tail;
    const anchor = POSES[pose].anchor, h = POSES[pose].frames[frame].length;
    const root = [tx - anchor, ty - h + 1];
    const tail = TAILS[tailName];
    tail.forEach(([dx, dy], i) => out.push([root[0] + dx, root[1] + dy, colors.B, i === tail.length - 1 ? 'tip' : 'B']));
    // In dark mode the black coats catch a little moonlight along their top edge, so their shapes read.
    if (pal.rim && dog.coat !== 'blonde') {
      const filled = new Set(out.map(p => p[0] + ',' + p[1]));
      for (const p of out) if (p[3] === 'B' && p.length > 4 && !filled.has(p[0] + ',' + (p[1] - 1))) p[2] = colors.L;
    }
    if (raining && !night) wearCoat(out, { ...COAT[pal.rim ? 'dark' : 'light'], under: dog.coat === 'blonde' ? null : colors.L }, pose !== 'sleep' && pose !== 'stir', pose === 'sit' ? -3 : -1); // No hood on the pillow; a sitting dog's haunch shows.
    for (const x of extras) x.dress?.(out, dog, pose, frame, !!pal.rim);
    return out;
  }

  function drawSprite(list, gx, gy, face) {
    for (const [x, y, c] of list) {
      ctx.fillStyle = c;
      ctx.fillRect((gx + x * face) * PD, (gy + y - 1) * PD, PD, PD);
    }
  }

  function screenBox(list, gx, gy, face) {
    let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
    for (const [x, y] of list) {
      const sx = (gx + x * face) * PD / dpr, sy = (gy + y - 1) * PD / dpr;
      l = Math.min(l, sx); r = Math.max(r, sx + PD / dpr); t = Math.min(t, sy); b = Math.max(b, sy + PD / dpr);
    }
    return { l, t, r, b };
  }

  function render(dog, pal) {
    const [pose, frame] = dog.forced || frameOf(dog);
    const list = pixels(dog, pose, frame, pal, dog.tongue > 0, dog.forcedTail || dog.act.tail || tailFor(pose, dog));
    const gx = Math.round(dog.x * dpr / PD), gy = Math.round(dog.y * dpr / PD);
    return { list, gx, gy, face: dog.face, pose };
  }

  // A bed: back rim and cushion behind the dog, then the front rim over its bottom row so it sinks in.
  function drawBed(bed, pal, front) {
    const gx = Math.round(bed.x * dpr / PD), gy = Math.round(bed.y * dpr / PD), c = pal.bed || PALETTES.dark.bed, H = BED_HALF;
    const row = (y, from, to, color) => { ctx.fillStyle = color; ctx.fillRect((gx + from) * PD, (gy + y - 1) * PD, (to - from + 1) * PD, PD); };
    if (front) return row(0, -H, H, c.front);
    // Raised bolsters at both ends, a back rim, and a soft cushion in the middle.
    // Rounded bolster ends, a plum cushion with a lighter top, and the front rim drawn over the dog.
    row(-3, -H + 1, -H + 1, c.bolster); row(-3, H - 1, H - 1, c.bolster);
    row(-2, -H, -H + 1, c.bolster); row(-2, H - 1, H, c.bolster);
    row(-2, -H + 2, H - 2, c.top);
    row(-1, -H + 1, H - 1, c.cushion);
    row(-1, -H, -H, c.bolster); row(-1, H, H, c.bolster);
  }

  function drawBowl(bowl, dark, front) {
    ctx.globalAlpha = Math.ceil(bowlVis * 4) / 4; // Fades in a few coarse steps, pixel style.
    const gx = Math.round(bowl.x * dpr / PD), gy = Math.round(bowl.y * dpr / PD), c = BOWL_COLORS[dark ? 'dark' : 'light'];
    BOWL.forEach((line, ry) => {
      if (front !== ry >= BOWL_BACK_ROWS) return;
      [...line].forEach((ch, cx) => {
        if (ch === '.') return;
        ctx.fillStyle = c[ch];
        ctx.fillRect((gx + cx - 3) * PD, (gy + ry - BOWL.length) * PD, PD, PD);
      });
    });
    ctx.globalAlpha = 1;
  }

  // The patting hand: comes down to just above the head, pats a few times, then lifts and fades.
  function drawHand(dog) {
    const r = dog.render, head = r && r.list.filter(p => p[4]);
    if (!head?.length) return;
    const { t, dur } = dog.pat, lift = 10;
    let off = 0, alpha = 1;
    if (t < .3) { off = -Math.round(lift * (1 - t / .3)); alpha = Math.min(1, t / .15); }
    else if (t > dur - .3) { const f = Math.min(1, (t - dur + .3) / .3); off = -Math.round(lift * f); alpha = 1 - f; }
    else off = ((t - .3) / ((dur - .6) / 3)) % 1 < .5 ? 1 : 0; // Each pat presses one pixel into the fur.
    const top = Math.min(...head.map(p => p[1]));
    const cx = Math.round(head.reduce((sum, p) => sum + p[0], 0) / head.length);
    const hp = Math.max(1, Math.round(PD / 2));
    const center = (r.gx + cx * r.face) * PD + PD / 2;
    const bottom = (r.gy + top + 1) * PD + off * PD; // The palm rests on the crown, fingers over the brow.
    HAND.forEach((line, ry) => [...line].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = HAND_COLORS[ch];
      ctx.globalAlpha = Math.max(0, alpha) * (HAND_FADE[ry] ?? 1);
      const x = Math.round(center + ((c + .5) - HAND_MID) * hp * r.face - hp / 2);
      ctx.fillRect(x, bottom - (HAND.length - ry) * hp, hp, hp);
    }));
    ctx.globalAlpha = 1;
  }

  // The dog whose head (plus a pixel of slop) is under a screen point, front-most first.
  function headAt(x, y) {
    const slop = P;
    for (const dog of [...dogs].sort((a, b) => b.y - a.y)) {
      const r = dog.render, head = r && r.list.filter(p => p[4]);
      if (!head?.length) continue;
      const box = screenBox(head, r.gx, r.gy, r.face);
      if (x >= box.l - slop && x <= box.r + slop && y >= box.t - slop && y <= box.b + slop) return dog;
    }
    return null;
  }

  function draw() {
    const dark = document.documentElement.dataset.theme === 'dark';
    const pal = PALETTES[dark ? 'dark' : 'light'];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (sheet) return drawSheet(pal);
    const items = dogs.map(dog => ({ y: dog.y, dog }));
    if (night && dark) for (const bed of beds) items.push({ y: bed.y - .5, bed }, { y: bed.y + .1, bed, front: true });
    if (bowlVis > 0) for (const bowl of bowls) items.push({ y: bowl.y - .5, bowl }, { y: bowl.y + .1, bowl, front: true });
    for (const x of extras) x.items?.(items, dark);
    for (const it of items.sort((a, b) => a.y - b.y)) {
      if (it.bed) { drawBed(it.bed, pal, it.front); continue; }
      if (it.bowl) { drawBowl(it.bowl, dark, it.front); continue; }
      if (it.draw) { it.draw(); continue; }
      const r = render(it.dog, pal);
      it.dog.render = r;
      it.dog.box = screenBox(r.list, r.gx, r.gy, r.face);
      drawSprite(r.list, r.gx, r.gy, r.face);
    }
    if (raining && !night) drawRain(dark); // Rain is a daytime scene; at night the dogs are asleep indoors.
    for (const x of extras) x.overlay?.(dark);
    for (const dog of dogs) if (dog.pat) drawHand(dog);
  }

  // Contact sheet of every pose, frame and tail for each dog (test hook only).
  function drawSheet(pal) {
    const keep = PD;
    PD = Math.max(1, Math.round((sheet.scale || 4) * dpr));
    const items = [];
    for (const pose of Object.keys(POSES)) POSES[pose].frames.forEach((_, f) => items.push([pose, f, POSES[pose].tails[0], pose === 'trot']));
    for (const tail of POSES.stand.tails.slice(1)) items.push(['stand', 0, tail, false]);
    items.push(['stand', 0, 'up', true]);
    dogs.forEach((dog, row) => items.forEach(([pose, f, tail, tongue], col) => {
      drawSprite(pixels(dog, pose, f, pal, tongue, tail), 4 + col * 16 + 8, Math.round(300 * dpr / PD) + row * 15 + 12, sheet.face || 1);
    }));
    PD = keep;
  }

  function frame(now) {
    if (stopped) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000);
    last = now;
    avoidAge += dt;
    if (avoidAge > .5) measureAvoid();
    const dark = document.documentElement.dataset.theme === 'dark';
    if (dark !== night) setNight(dark, night === null);
    if (!frozen) { update(dt); if (raining) updateRain(dt); }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function still() {
    measureAvoid();
    dogs.forEach(dog => { dog.pat = null; dog.stir = 0; dog.tongue = 0; dog.wagRate = 0; if (dog.bowl) { dog.bowl.dog = null; dog.bowl = null; } });
    bowlVis = 0; bowlLinger = 0; bowlsInUse = false;
    if (document.documentElement.dataset.theme === 'dark') setNight(true, true); // A sleeping scene.
    else {
      if (night) { setNight(false, true); zone = null; }
      const poses = ['sit', 'lie', 'stand'];
      dogs.forEach((dog, i) => {
        if (!valid(dog.x, dog.y)) Object.assign(dog, nearestValid(dog.x, dog.y + 200));
        dog.path = []; dog.dest = null; dog.act = { type: poses[i % 3], t: 0, hold: 99 };
      });
    }
    draw();
  }

  const onResize = () => { resize(); measureAvoid(); placeBowls(); if (raining) initRain(); for (const d of dogs) if (d.bowl && d.act.type === 'eat' && !d.path.length) Object.assign(d, d.bowl.spot); for (const d of dogs) if (!valid(d.x, d.y)) Object.assign(d, nearestValid(d.x, d.y)); if (reduced.matches) still(); };
  function startPat(dog) {
    dog.pat = { t: 0, dur: rand(1.3, 1.7) };
    if (['sleep', 'tobed', 'wake'].includes(dog.act.type)) return; // Stirs in bed.
    if (dog.act.type === 'eat' && dog.bowl && !dog.path.length) return; // Keeps eating while patted.
    const pose = frameOf(dog)[0];
    setAct(dog, 'pat');
    dog.act.pose = pose === 'sit' || pose === 'lie' ? pose : 'stand';
    dog.act.hold = dog.pat.dur + .2;
  }
  const ignored = target => target.closest?.('a, button, input, [data-dog-avoid]');
  const onControl = target => target.closest?.('a, button, input');
  const onPointer = event => {
    const ok = !reduced.matches && !onControl(event.target);
    const style = ok && (headAt(event.clientX, event.clientY) ? 'pointer' : extras.map(x => x.cursor?.(event.clientX, event.clientY)).find(Boolean));
    if (style) { document.body.style.cursor = style; cursorSet = true; }
    else if (cursorSet) { document.body.style.cursor = ''; cursorSet = false; }
  };
  const onClick = event => {
    if (reduced.matches || onControl(event.target) || performance.now() < swallowClickUntil) return;
    // A sleeping dog's bed sits inside the bio's box, so a head hit counts there too.
    const patted = headAt(event.clientX, event.clientY);
    if (patted) return startPat(patted);
    if (ignored(event.target)) return;
    const tap = { x: event.clientX, y: event.clientY };
    // A double click belongs to a feature (fetch), so hold a single tap a beat to tell them apart.
    const dbl = extras.find(x => x.dblclick);
    if (dbl && !night) {
      clearTimeout(pendingTap);
      if (event.detail >= 2) return dbl.dblclick(tap);
      pendingTap = setTimeout(() => doTap(tap), 240);
      return;
    }
    doTap(tap);
  };
  let pendingTap = 0;
  function doTap(tap) {
    if (stopped) return;
    if (night) {
      // At night the nearest dog just lifts its head and wags a moment, then dozes off again.
      const near = [...dogs].sort((a, b) => Math.hypot(a.x - tap.x, a.y - tap.y) - Math.hypot(b.x - tap.x, b.y - tap.y))[0];
      if (near) near.stir = rand(1.2, 2.2);
      return;
    }
    // Each dog notices at its own moment and claims its own patch of ground around the spot.
    const order = [...dogs].sort((a, b) => Math.hypot(a.x - tap.x, a.y - tap.y) - Math.hypot(b.x - tap.x, b.y - tap.y));
    // Slots a dog-width apart sideways and staggered in depth, so they gather without piling up.
    const slots = [[-1, -1], [0, 1], [1, 0]].sort(() => Math.random() - .5);
    order.forEach((dog, i) => {
      // A dog with its head in the bowl may not even look up.
      if (dog.act.type === 'eat' && dog.bowl && !dog.path.length && Math.random() < .2 + .6 * dog.mood.hunger) return;
      const [sx, sy] = slots[i];
      const want = nearestValid(tap.x + sx * rand(16, 19) * P, tap.y + sy * rand(7, 9) * P);
      setAct(dog, 'come', false, { spot: want, center: want, left: Math.floor(rand(2, 5)), delay: i * rand(.1, .35) + rand(0, .25) });
      rollPant(dog);
      dog.mood.energy = clamp(dog.mood.energy + .15, .05, .95);
      dog.mood.curiosity = clamp(dog.mood.curiosity + .2, .05, .95);
      dog.act.busy = true;
    });
  }
  const onMotion = () => { cancelAnimationFrame(raf); last = 0; if (reduced.matches) still(); else raf = requestAnimationFrame(frame); };


  // ==== Shared helper for neckwear (bandana, scarf) ==========================================
  // Recolors (or adds) pixels at a pose's neck anchor: pattern entries are [dx, dy, color].
  function wearAtNeck(out, pose, frame, pattern) {
    const def = POSES[pose], neck = def?.neck;
    if (!neck) return;
    const h = def.frames[frame].length, nx = neck[0] - def.anchor, ny = neck[1] - h + 1;
    const at = new Map(out.map(p => [p[0] + ',' + p[1], p]));
    for (const [dx, dy, color, addIfEmpty] of pattern) {
      const k = nx + dx + ',' + (ny + dy), p = at.get(k);
      if (p) p[2] = color;
      else if (addIfEmpty && ny + dy < 0) out.push([nx + dx, ny + dy, color, 'X', false]); // Never below the ground row.
    }
  }
  const pixelInText = (x, y) => avoid.some(r => x > r.l && x < r.r && y > r.t && y < r.b);

  // ==== Feature: fog days (Karl the Fog) =====================================================
  // Two or three soft, wide bands of pale pixel blocks drift sideways at low opacity, fading out
  // near the bio and nav. The dogs move a little slower and calmer. Flag: weather.fog.
  {
    let bands = null;
    extras.push({
      weather(w) {
        if (!w.fog) return;
        mods.speed *= .82; mods.energy -= .15;
        const n = Math.random() < .5 ? 2 : 3;
        // Bands stay in the dogs' open field, above the bio.
        const bioTop = Math.min(height, ...avoid.filter(r => r.t > 120).map(r => r.t));
        const span = clamp((bioTop - 90) / height - .14, .15, .8);
        bands = Array.from({ length: n }, (_, i) => ({ y: (.14 + span * (i + rand(.15, .85)) / n), h: Math.round(rand(4, 7)), speed: rand(5, 10) * (i % 2 ? -1 : 1), off: rand(0, 5000), seed: rand(0, 100) }));
      },
      update(dt) { if (bands) for (const b of bands) b.off += b.speed * dt; },
      overlay(dark) {
        if (!bands) return;
        const block = 4 * PD, cols = Math.ceil(canvas.width / block) + 1, max = dark ? .13 : .3;
        const bioTop = Math.min(height, ...avoid.filter(r => r.t > 120).map(r => r.t));
        for (const b of bands) {
          const cy = Math.round(b.y * canvas.height / block);
          for (let r = 0; r < b.h; r++) {
            const edge = 1 - Math.abs(r - (b.h - 1) / 2) / (b.h / 2 + .5);
            for (let c = 0; c < cols; c++) {
              const u = c + b.off * dpr / block;
              const n = .55 + .25 * Math.sin(u * .21 + b.seed) + .2 * Math.sin(u * .53 + r * 1.3 + b.seed * 2);
              let a = max * edge * n;
              const x = (c * block - (b.off * dpr % block)) / dpr, y = (cy + r - b.h / 2) * block / dpr;
              // Fade out within about 40px of the text and nav.
              const near = Math.min(...avoid.map(q => Math.hypot(Math.max(q.l - x - block / dpr, 0, x - q.r), Math.max(q.t - y - block / dpr, 0, y - q.b))), 999);
              a *= clamp(near / 40, 0, 1) * clamp((bioTop - 40 - y) / 60, 0, 1); // Gone by 40px above the bio.
              if (a < .01) continue;
              if (edge < .4 && (c + r + Math.floor(b.off / 20)) % 2) continue; // Dithered, ragged edges.
              const q = dark ? Math.round(a * 50) / 50 : Math.round(a / .07) * .07; // Day fog in a few clear steps.
              if (q < .01) continue;
              ctx.fillStyle = dark ? `rgba(190,196,206,${q.toFixed(2)})` : `rgba(196,200,208,${q.toFixed(2)})`;
              ctx.fillRect(c * block - Math.round(b.off * dpr % block), (cy + r - Math.round(b.h / 2)) * block, block, block);
            }
          }
        }
      },
    });
  }

  // ==== Feature: hot days =====================================================================
  // At 27C (about 80F) or more the dogs pant, slow down and like to lie around, under a small pixel
  // sun in the top corner. Daytime only. Flag: weather.hot.
  {
    let hot = false;
    extras.push({
      weather(w) { if (!w.hot) return; hot = true; mods.speed *= .85; mods.lie += .9; mods.pant += .35; mods.energy -= .1; },
      update() {
        if (!hot || night) return;
        // Resting dogs pant on and off.
        for (const d of dogs) if (!d.path.length && ['stand', 'sit', 'pat'].includes(d.act.type) && Math.sin(clock * .6 + d.seed) > -.2) d.tongue = Math.max(d.tongue, .3);
      },
      overlay(dark) {
        if (!hot || dark) return;
        // A small hard-edged pixel sun in the top corner: a round disc with eight short rays.
        const S = 2 * P, cx = width - 100, cy = 100, r = 3;
        const dot = (dx, dy, color) => {
          const x = cx + dx * S, y = cy + dy * S;
          if (pixelInText(x, y) || y < 0) return;
          ctx.fillStyle = color;
          ctx.fillRect(Math.round(x * dpr), Math.round(y * dpr), Math.round(S * dpr), Math.round(S * dpr));
        };
        for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (dx * dx + dy * dy <= r * r + 1) dot(dx, dy, 'rgba(244,176,52,.5)');
        const pulse = Math.sin(clock * .8) > 0 ? 1 : 0; // The rays breathe out a pixel and back.
        for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const d = ux && uy ? 4 : 5;
          for (let k = 0; k < 2; k++) dot(ux * (d + k + pulse), uy * (d + k + pulse), 'rgba(244,176,52,.38)');
        }
      },
    });
  }

  // ==== Feature: Halloween week (Oct 24-31) ===================================================
  // A small muted orange bandana on every dog, and one pixel jack-o'-lantern by the bowls' corner,
  // its face lit at night. Flag: season === 'halloween'.
  if (seasonToday() === 'halloween') {
    const BANDANA = { light: ['#c7793f', '#a8632f'], dark: ['#a8683a', '#8c552c'] };
    const PUMPKIN = ['...s...', '.oOoOo.', 'ooOoOoo', 'oeOoOeo', 'oOmmmOo', '.ooooo.'];
    extras.push({
      dress(out, dog, pose, frame, dark) {
        const [c, f] = BANDANA[dark ? 'dark' : 'light'];
        wearAtNeck(out, pose, frame, [[0, 0, c], [1, 0, c], [2, 0, c], [1, 1, f, true]]);
      },
      items(items, dark) {
        // Halloween week: by the beds at night, and by day at the end of the bowls' row.
        let x, y, alpha = 1;
        if (night && beds.length) {
          const half = 4 * P, l = zone ? zone.l : beds[0].x - 9 * P, r = zone ? zone.r : beds[2].x + 9 * P;
          y = beds[0].y;
          x = r + half <= width - 4 * P ? r + half : l - half;
          const nearHead = headBox && x + 4 * P > headBox.l - 12 && x - 4 * P < headBox.r + 12 && y > headBox.t - 12 && y - 7 * P < headBox.b + 12;
          if (nearHead || pixelInText(x, y - 3 * P)) return;
        } else {
          // By day it sits all week at the end of the bowls' spot (the bowls themselves come and go with meals).
          if (!bowls.length) return;
          const left = bowls[0].face < 0;
          x = left ? bowls[0].x - 8 * P : bowls[bowls.length - 1].x + 8 * P; y = bowls[0].y;
          if (pixelInText(x, y - 3 * P)) return;
        }
        items.push({ y: y - .2, draw: () => {
          ctx.globalAlpha = alpha;
          const gx = Math.round(x * dpr / PD), gy = Math.round(y * dpr / PD);
          const col = { s: '#6b6a3a', o: '#c8702e', O: '#b0612a', e: dark ? '#f0b45a' : '#4a2f1c', m: dark ? '#f0b45a' : '#4a2f1c' };
          PUMPKIN.forEach((line, ry) => [...line].forEach((ch, cx) => {
            if (ch === '.') return;
            ctx.fillStyle = col[ch];
            ctx.fillRect((gx + cx - 3) * PD, (gy + ry - PUMPKIN.length) * PD, PD, PD);
          }));
          ctx.globalAlpha = 1;
        } });
      },
    });
  }

  // ==== Feature: winter holidays (Dec 15-Jan 1) ===============================================
  // A muted red knit scarf on every dog, and a short string of six tiny twinkling lights on a sagging
  // wire above the beds at night. Flag: season === 'winter'.
  if (seasonToday() === 'winter') {
    const SCARF = { light: ['#a8453d', '#8b3933'], dark: ['#8f3e37', '#74322d'] };
    const BULBS = ['#e0483c', '#4fa65a', '#f2c230'];
    extras.push({
      dress(out, dog, pose, frame, dark) {
        const [a, b] = SCARF[dark ? 'dark' : 'light'];
        wearAtNeck(out, pose, frame, [[0, 0, a], [1, 0, b], [2, 0, a], [0, 1, b, true], [0, 2, a, true]]);
      },
      overlay(dark) {
        let x0, x1, y0;
        // Only at night, strung above the beds (by day a loose strand in midair read as a twig).
        if (!night || !beds.length) return;
        x0 = beds[0].x - 8 * P; x1 = beds[beds.length - 1].x + 8 * P; y0 = beds[0].y - 15 * P;
        // A thin dark wire sagging between two anchors, with six evenly spaced bulbs hanging from it.
        const blocked = (x, y) => night ? [headBox, lineBox].some(r => r && x > r.l - 4 && x < r.r + 4 && y > r.t - 4 && y < r.b + 4) : pixelInText(x, y);
        const g0 = Math.round(x0 * dpr / PD), g1 = Math.round(x1 * dpr / PD), gy0 = Math.round(y0 * dpr / PD), sag = 3;
        const wireY = g => gy0 + Math.round(sag * 4 * ((g - g0) / (g1 - g0)) * (1 - (g - g0) / (g1 - g0)));
        ctx.fillStyle = dark ? '#5a5048' : '#6e6258';
        for (let g = g0; g <= g1; g++) if (!blocked(g * PD / dpr, wireY(g) * PD / dpr)) ctx.fillRect(g * PD, wireY(g) * PD, PD, PD);
        for (let i = 0; i < 6; i++) {
          const g = Math.round(g0 + (g1 - g0) * (i + .5) / 6), y = wireY(g) + 1;
          if (blocked(g * PD / dpr, y * PD / dpr)) continue;
          const tw = .75 + .25 * Math.sin(clock * 1.2 + i * 2.1); // A gentle twinkle, never off.
          if (dark) { ctx.globalAlpha = .16 * tw; ctx.fillStyle = BULBS[i % 3]; ctx.fillRect((g - 1) * PD, (y - 1) * PD, 4 * PD, 4 * PD); }
          ctx.globalAlpha = tw;
          ctx.fillStyle = BULBS[i % 3];
          ctx.fillRect(g * PD, y * PD, 2 * PD, 2 * PD);
          ctx.globalAlpha = 1;
        }
      },
    });
  }

  // ==== Feature: a visiting bird ==============================================================
  // Every 2-4 minutes (or soon, with ?event=bird) a small bird flies in, lands in open space and
  // hops about. The dogs notice one by one, by mood: some freeze, some stalk, some trot over. The
  // bird leaves before they reach it, and they watch it go. Daytime only.
  {
    const forced = new URLSearchParams(location.search).get('event') === 'bird';
    // A little sparrow facing right: round head with a dot eye and a bright beak, a paler breast.
    const BIRD = {
      perch: ['...hh.', '..hehk', 'tbbbb.', '.rrb..', '..l...'],
      peck: ['......', '......', 'tbbbhh', '.rrbek', '..l...'],
      flyA: ['.ww...', '..wwhh', 'tbbbek', '......'],
      flyB: ['......', '....hh', 'tbbbek', '.ww...', '..w...'],
    };
    const BIRD_COLORS = { h: '#8b7664', b: '#8b7664', r: '#c9ab8c', t: '#6f5c4d', w: '#6f5c4d', e: '#2a211c', k: '#e8a634', l: '#6f5c4d' };
    let bird = null, wait = forced ? 3 : rand(120, 240);
    const near = (d, r) => Math.hypot(d.x - bird.x, d.y - bird.y) < r;
    function spawnBird() {
      let spot = null;
      for (let i = 0; i < 60 && !spot; i++) {
        const x = rand(.1, .9) * width, y = rand(.3, .9) * height;
        // Land well clear of the dogs; on a small phone screen "well clear" has to be closer.
        if (valid(x, y) && !inZone(x, y) && !pixelInText(x, y - 20) && dogs.every(d => Math.hypot(d.x - x, d.y - y) > Math.min(170, width * .22))) spot = { x, y };
      }
      if (!spot) { wait = 20; return; }
      const fromLeft = Math.random() < .5, alt = rand(140, 240);
      bird = { x: fromLeft ? -20 : width + 20, y: spot.y, z: alt, alt, tx: spot.x, sx: fromLeft ? -20 : width + 20, face: fromLeft ? 1 : -1, state: 'in', t: 0, hop: rand(.3, .9), z0: 0, stay: rand(5, 9), reactions: [] };
    }
    // The dogs notice in order of distance, each after its own delay and in its own way.
    function plan() {
      const order = [...dogs].sort((a, b) => Math.hypot(a.x - bird.x, a.y - bird.y) - Math.hypot(b.x - bird.x, b.y - bird.y));
      let at = rand(.2, 1.2);
      order.forEach((d, i) => {
        if (i > 0 && Math.random() > .25 + .6 * d.mood.curiosity) return;
        at += i ? rand(.4, 1.8) : 0;
        const how = weighted([['freeze', .3 + .4 * (1 - d.mood.energy)], ['stalk', .3 + .5 * d.mood.curiosity], ['trot', .2 + .6 * d.mood.energy]]);
        bird.reactions.push({ d, at: at * (1.4 - d.mood.curiosity * .6), how });
      });
    }
    function react(d, how) {
      if (['sleep', 'tobed', 'pat', 'fetch'].includes(d.act.type) || (d.act.type === 'eat' && d.mood.hunger > .4)) return;
      setAct(d, 'bird');
      d.act.watch = bird; d.act.hold = how === 'freeze' ? rand(1.2, 2.6) : 99;
      if (how !== 'trot') d.act.tail = 'out'; // Tail held stiff and straight.
      if (how === 'freeze') return;
      const side = d.x < bird.x ? -1 : 1, spot = nearestValid(bird.x + side * rand(30, 50), bird.y + rand(-8, 8));
      if (goTo(d, spot, how === 'trot' ? 'trot' : 'walk')) d.act.speedScale = how === 'stalk' ? .45 : 1;
    }
    function flyOff() {
      bird.state = 'out';
      const away = dogs.reduce((s, d) => s + Math.sign(bird.x - d.x), 0) || (Math.random() < .5 ? -1 : 1);
      bird.vx = Math.sign(away) * rand(140, 200); bird.vz = rand(100, 150); bird.face = Math.sign(bird.vx);
      for (const d of dogs) if (d.act.type === 'bird') { d.path = []; d.dest = null; d.act.hold = rand(1.5, 3.2); d.act.watch = bird; }
    }
    extras.push({
      update(dt) {
        if (!bird) {
          if (night || reduced.matches) return;
          if ((wait -= dt) <= 0) spawnBird();
          return;
        }
        bird.t += dt;
        if (bird.state === 'in') {
          const dir = Math.sign(bird.tx - bird.x), step = 120 * dt;
          bird.x = Math.abs(bird.tx - bird.x) <= step ? bird.tx : bird.x + dir * step;
          bird.z = bird.alt * Math.abs(bird.tx - bird.x) / Math.max(1, Math.abs(bird.tx - bird.sx));
          if (bird.x === bird.tx) { bird.state = 'hop'; bird.z = 0; bird.t = 0; plan(); }
        } else if (bird.state === 'hop') {
          for (const r of bird.reactions) if (!r.done && bird.t >= r.at) { r.done = true; react(r.d, r.how); }
          // Little hops and pecks, sometimes turning around.
          if ((bird.hop -= dt) <= 0) {
            bird.hop = rand(.35, 1.1);
            if (Math.random() < .3) bird.face *= -1;
            else if (Math.random() < .6) { const nx = bird.x + bird.face * rand(1, 2) * P; if (valid(nx, bird.y)) { bird.x = nx; bird.z0 = .18; } }
            else bird.peck = .3;
          }
          bird.z0 = Math.max(0, bird.z0 - dt); bird.peck = Math.max(0, (bird.peck || 0) - dt);
          bird.z = bird.z0 > 0 ? Math.sin(bird.z0 / .18 * Math.PI) * 2 * P : 0;
          if ((bird.stay -= dt) <= 0 || dogs.some(d => near(d, Math.min(95, width * .14))) || night) flyOff(); // A dog this close spooks it (closer on small screens).
        } else {
          bird.x += bird.vx * dt; bird.z += bird.vz * dt;
          if (bird.x < -40 || bird.x > width + 40 || bird.y - bird.z < -40) { bird = null; wait = forced ? rand(25, 45) : rand(120, 240); }
        }
      },
      items(items) {
        if (!bird) return;
        const b = bird, map = b.state === 'hop' ? (b.peck > 0 ? BIRD.peck : BIRD.perch) : (Math.floor(b.t * 9) % 2 ? BIRD.flyA : BIRD.flyB);
        items.push({ y: b.y, draw: () => {
          const gx = Math.round(b.x * dpr / PD), gy = Math.round((b.y - b.z) * dpr / PD);
          map.forEach((line, ry) => [...line].forEach((ch, cx) => {
            if (ch === '.') return;
            ctx.fillStyle = BIRD_COLORS[ch];
            ctx.fillRect((gx + (cx - 3) * b.face) * PD, (gy + ry - map.length) * PD, PD, PD);
          }));
        } });
      },
    });
    canvas.birdDebug = () => bird && { x: bird.x, y: bird.y, z: bird.z, state: bird.state, reactions: bird.reactions.map(r => [dogs.indexOf(r.d), r.how, !!r.done]) };
  }

  // ==== Feature: fetch ========================================================================
  // Double-click empty space to toss a small tennis ball; it arcs and bounces to the spot. The
  // keenest available dog runs to grab it, trots back toward where the cursor last was and drops
  // it; others may tag along. A single click and a head click keep their meanings.
  {
    let ball = null;
    const cursor = { x: innerWidth / 2, y: innerHeight / 2 };
    const track = e => { cursor.x = e.clientX; cursor.y = e.clientY; };
    addEventListener('pointermove', track);
    // A double click on empty space shouldn't select nearby text.
    const noSelect = e => { if (e.detail > 1 && !e.target.closest?.('a, button, input, [data-dog-avoid]')) e.preventDefault(); };
    addEventListener('mousedown', noSelect);
    cleanups.push(() => { removeEventListener('pointermove', track); removeEventListener('mousedown', noSelect); });
    const mouth = d => ({ x: d.x + d.face * 8 * P, y: d.y - 4 * P });
    function toss(tap) {
      if (night || reduced.matches) return;
      try { getSelection()?.removeAllRanges(); } catch {}
      const spot = nearestValid(tap.x, tap.y), dir = Math.random() < .5 ? -1 : 1;
      const from = { x: clamp(spot.x - dir * rand(70, 120), 10, width - 10), y: spot.y };
      // Arc in, then two shrinking bounces.
      ball = { x: from.x, y: spot.y, z: 0, from, to: spot, t: 0, hops: [[.7, 60], [.3, 14], [.18, 5]], hop: 0, rest: false, carried: null, life: 12 };
      const free = dogs.filter(d => !['sleep', 'tobed', 'pat'].includes(d.act.type));
      if (!free.length) return;
      const score = d => d.mood.energy * 1.2 + d.mood.social * .3 + Math.random() * .4 - Math.hypot(d.x - spot.x, d.y - spot.y) / 1500 - (d.act.type === 'eat' ? .6 : 0);
      const keen = free.sort((a, b) => score(b) - score(a))[0];
      const side = keen.x < spot.x ? -1 : 1;
      setAct(keen, 'fetch');
      keen.act.hold = 99; rollPant(keen);
      if (!goTo(keen, nearestValid(spot.x + side * 8 * P, spot.y), 'trot')) { keen.act.hold = 1; return; }
      keen.act.onArrive = d => { d.face = -side; d.act.waitBall = true; };
      for (const o of free) if (o !== keen && o.act.type !== 'eat' && Math.random() < .2 + .45 * o.mood.energy * o.mood.social) {
        const want = nearestValid(spot.x + rand(-20, 20) * P, spot.y + rand(-6, 6) * P);
        setAct(o, 'come', false, { spot: want, center: want, left: 1, delay: rand(.2, .9) });
        rollPant(o);
      }
    }
    extras.push({
      dblclick: toss,
      update(dt) {
        if (!ball) return;
        if (!ball.rest && !ball.carried) {
          const [T, H] = ball.hops[ball.hop];
          ball.t += dt;
          const f = Math.min(1, ball.t / T);
          if (ball.hop === 0) ball.x = ball.from.x + (ball.to.x - ball.from.x) * f;
          else ball.x += (ball.to.x - ball.from.x) * .08 * dt / T;
          ball.z = 4 * H * f * (1 - f);
          if (f >= 1) { ball.t = 0; ball.hop++; if (ball.hop >= ball.hops.length) { ball.rest = true; ball.z = 0; } }
        }
        const fetcher = dogs.find(d => d.act.type === 'fetch');
        if (fetcher && fetcher.act.waitBall && ball.rest && !ball.carried) {
          ball.carried = fetcher; fetcher.act.waitBall = false;
          // Back toward wherever the cursor last was, to drop it there. If the cursor is still right by
          // the ball, bring it a little way toward the middle of the page instead.
          const far = Math.hypot(cursor.x - ball.x, cursor.y - ball.y) > 90;
          const toward = far ? cursor : { x: ball.x + Math.sign(width / 2 - ball.x || 1) * rand(130, 190), y: ball.y + rand(-30, 30) };
          const back = nearestValid(toward.x, toward.y);
          if (!goTo(fetcher, back, 'trot')) { ball.carried = null; fetcher.act.hold = 1; return; }
          fetcher.act.onArrive = d => { const m = mouth(d); ball.carried = null; ball.x = m.x; ball.y = d.y + 1; ball.z = 0; ball.rest = true; ball.life = 10; d.act.hold = rand(1, 2.2); };
        }
        if (ball.carried && ball.carried.act.type !== 'fetch') ball.carried = null; // Distracted: dropped it.
        if (ball.carried) { const m = mouth(ball.carried); ball.x = m.x; ball.y = ball.carried.y + .5; ball.z = 4 * P; }
        else if (ball.rest && (ball.life -= dt) <= 0) ball = null;
      },
      items(items) {
        if (!ball) return;
        const b = ball;
        items.push({ y: b.y, draw: () => {
          const gx = Math.round(b.x * dpr / PD), gy = Math.round((b.y - b.z) * dpr / PD);
          ctx.globalAlpha = b.rest && !b.carried ? clamp(b.life / 1.5, 0, 1) : 1;
          ctx.fillStyle = '#c8d64a'; ctx.fillRect(gx * PD, (gy - 2) * PD, 2 * PD, 2 * PD);
          ctx.fillStyle = '#e9f08a'; ctx.fillRect(gx * PD, (gy - 2) * PD, PD, PD);
          ctx.fillStyle = '#9fae32'; ctx.fillRect((gx + 1) * PD, (gy - 1) * PD, PD, PD);
          ctx.globalAlpha = 1;
        } });
      },
    });
    canvas.ballDebug = () => ball && { x: ball.x, y: ball.y, z: ball.z, rest: ball.rest, carried: ball.carried ? dogs.indexOf(ball.carried) : -1 };
  }

  // ==== Shared helper for the play features below ===========================================
  // A dog that is free to be drawn into a game: awake, not eating, not already busy with something.
  const idleDog = d => !['sleep', 'tobed', 'wake', 'pat', 'eat', 'sniffbowl', 'fetch', 'bird', 'come', 'mill', 'zoomies', 'tug', 'flutter', 'beg', 'chew', 'treatgrab'].includes(d.act.type) && !(d.act.delay > 0) && !d.pat;
  const eventParam = new URLSearchParams(location.search).get('event');

  // ==== Feature: zoomies ======================================================================
  // Every 4-8 minutes (or soon, with ?event=zoomies) the liveliest free puppy gets the zoomies:
  // a string of fast laps back and forth across the field, kicking up little dust puffs at each
  // turn. The others, by mood, chase along behind it or sit and watch. It ends sitting, panting.
  {
    const forced = eventParam === 'zoomies';
    let run = null, wait = forced ? 3 : rand(240, 480);
    const puffs = [];
    function lapSpot(dog, side) {
      for (let i = 0; i < 30; i++) {
        const x = (side < 0 ? rand(.08, .32) : rand(.68, .92)) * width, y = rand(.28, .92) * height;
        if (valid(x, y) && !inZone(x, y) && route(dog, { x, y })) return { x, y };
      }
      return null;
    }
    function leg() {
      const d = run.dog, side = d.x < width / 2 ? 1 : -1, to = lapSpot(d, side);
      if (!to || !goTo(d, to, 'trot')) return finish();
      for (let i = 0; i < 3; i++) puffs.push({ x: d.x - side * rand(1, 4) * P, y: d.y + rand(-1, 1) * P, life: rand(.4, .7), max: .7 });
      d.act.speedScale = 1.55;
      d.act.onArrive = () => { if (--run.legs > 0) leg(); else finish(); };
      // Chasers make for the same corner, a little slower, so they tear along just behind it.
      run.chasers.forEach((c, i) => { if (c.act === c.d.act && goTo(c.d, nearestValid(to.x - side * (13 + 13 * i + rand(0, 3)) * P, to.y + rand(-2, 2) * P), 'trot')) c.d.act.speedScale = 1.3; });
    }
    function begin() {
      const free = dogs.filter(idleDog);
      if (!free.length) { wait = 15; return; }
      const d = free.sort((a, b) => b.mood.energy - a.mood.energy + rand(-.15, .15))[0];
      setAct(d, 'zoomies'); d.act.hold = 99; d.pant = true;
      run = { dog: d, act: d.act, legs: Math.floor(rand(4, 7)), chasers: [] };
      for (const o of free) {
        if (o === d) continue;
        if (Math.random() < .25 + .55 * o.mood.energy * o.mood.social) {
          setAct(o, 'zoomies'); o.act.hold = 99; o.act.delay = rand(.3, 1); rollPant(o);
          run.chasers.push({ d: o, act: o.act });
        } else if (Math.random() < .7) {
          setAct(o, Math.random() < .6 ? 'sit' : 'stand'); o.act.watch = d; o.act.hold = rand(5, 9);
        }
      }
      leg();
    }
    function finish() {
      if (!run) return;
      const d = run.dog;
      if (d.act === run.act) { setAct(d, 'sit'); d.act.hold = rand(4, 7); d.tongue = rand(5, 7); d.mood.energy = .2; }
      for (const c of run.chasers) if (c.d.act === c.act) { setAct(c.d, 'stand'); c.d.act.hold = rand(1, 2.5); c.d.act.watch = d; }
      run = null;
      wait = forced ? rand(25, 40) : rand(240, 480);
    }
    extras.push({
      update(dt) {
        for (let i = puffs.length - 1; i >= 0; i--) if ((puffs[i].life -= dt) <= 0) puffs.splice(i, 1);
        if (run && run.dog.path.length && (run.kick = (run.kick || 0) - dt) <= 0) {
          // A thin trail of dust kicked up behind the running pup.
          run.kick = .09;
          puffs.push({ x: run.dog.x - run.dog.face * rand(2, 4) * P, y: run.dog.y + rand(-.5, .5) * P, life: .45, max: .45 });
        }
        if (run) {
          // Interrupted (a tap, a pat, bedtime): just stop.
          if (run.dog.act !== run.act || night) {
            for (const c of [{ d: run.dog, act: run.act }, ...run.chasers]) if (c.d.act === c.act) setAct(c.d, 'stand');
            run = null; wait = forced ? 20 : rand(240, 480);
          }
          return;
        }
        if (night || reduced.matches) return;
        if ((wait -= dt) <= 0) begin();
      },
      items(items, dark) {
        for (const p of puffs) items.push({ y: p.y - .3, draw: () => {
          const gx = Math.round(p.x * dpr / PD), gy = Math.round(p.y * dpr / PD), grow = p.life < p.max * .5 ? 1 : 0;
          ctx.globalAlpha = clamp(p.life / p.max, 0, 1) * .7;
          ctx.fillStyle = dark ? '#5e574f' : '#c4b9a6';
          ctx.fillRect((gx - grow) * PD, (gy - 1) * PD, (2 + 2 * grow) * PD, PD); // Spreads along the ground as it fades.
          ctx.globalAlpha = 1;
        } });
      },
    });
    canvas.zoomDebug = () => run && { dog: dogs.indexOf(run.dog), legs: run.legs, chasers: run.chasers.map(c => dogs.indexOf(c.d)) };
  }

  // ==== Feature: tug-of-war ===================================================================
  // Every 3-5 minutes (or soon, with ?event=tug) a striped rope toy turns up and the two most
  // playful free puppies grab an end each. They play-bow and pull, the pair lurching a pixel this
  // way and that, until one wins and trots off with the rope to drop it; the third may sit and watch.
  {
    const forced = eventParam === 'tug';
    const ROPE = ['#3f7f86', '#e6dcc6'], KNOT = '#2f6268';
    let game = null, wait = forced ? 3 : rand(180, 300);
    const GAP = 11; // Dog pixels from the rope's middle to each dog's foot point.
    function begin() {
      const free = dogs.filter(idleDog);
      if (free.length < 2) { wait = 12; return; }
      free.sort((a, b) => (b.mood.energy + b.mood.social) - (a.mood.energy + a.mood.social) + rand(-.4, .4));
      const [a, b] = free, gap = GAP * P;
      let mid = null;
      for (let i = 0; i < 60 && !mid; i++) {
        const x = (a.x + b.x) / 2 + rand(-200, 200), y = (a.y + b.y) / 2 + rand(-90, 90);
        if ([-gap, 0, gap].every(o => valid(x + o, y) && !inZone(x + o, y)) && dogs.every(o => o === a || o === b || Math.hypot(o.x - x, o.y - y) > 20 * P) && !pixelInText(x, y - 20)) mid = { x, y };
      }
      if (!mid) { wait = 15; return; }
      const left = a.x < b.x ? a : b, right = left === a ? b : a;
      game = { rope: { x: mid.x, y: mid.y }, left, right, state: 'gather', ready: 0, shift: 0, beat: .4, bias: rand(.35, .65), dur: rand(6, 10), life: 8 };
      for (const [d, side] of [[left, -1], [right, 1]]) {
        setAct(d, 'tug'); d.act.hold = 99; d.act.watch = game.rope; rollPant(d);
        const end = { x: mid.x + side * gap, y: mid.y };
        if (!goTo(d, end, 'trot')) { drop(); return; }
        // Snap onto the exact end so both dogs share a ground line and the rope runs mouth to mouth.
        d.act.onArrive = dd => { if (!game) return; dd.x = end.x + game.shift * P; dd.y = end.y; dd.act.still = 'bow'; game.ready++; };
      }
      game.acts = [left.act, right.act];
      const third = dogs.find(o => o !== left && o !== right);
      if (third && idleDog(third) && Math.random() < .3 + .6 * third.mood.curiosity) { setAct(third, 'sit'); third.act.watch = game.rope; third.act.hold = rand(6, 11); }
    }
    // The rope ends up lying on the ground (where it is, or at a carrier's mouth) and fades away.
    function drop(at) {
      if (!game) return;
      for (const [i, d] of [game.left, game.right].entries()) if (d.act === game.acts?.[i] && game.state !== 'carry') { d.act.still = null; d.act.watch = null; d.act.hold = rand(.5, 1.5); }
      if (at) Object.assign(game.rope, at);
      game.state = 'rest'; game.life = 8;
      wait = forced ? rand(25, 40) : rand(180, 300);
    }
    const mouthOf = d => ({ x: d.x + d.face * 8 * P, y: d.y + .5 });
    function decide() {
      const winner = game.shift > 0 || (game.shift === 0 && Math.random() < .5) ? game.right : game.left;
      const loser = winner === game.left ? game.right : game.left;
      setAct(loser, Math.random() < .5 ? 'sit' : 'stand'); loser.act.watch = winner; loser.act.hold = rand(2, 4);
      winner.act.still = null; winner.act.watch = null; winner.pant = false; winner.tongue = 0; // Mouth full.
      const away = Math.sign(winner.x - loser.x) || 1;
      const to = randomSpot(winner, { x: winner.x + away * rand(150, 220), y: winner.y }, 90);
      if (!to || !goTo(winner, to, 'trot')) return drop(mouthOf(winner));
      game.state = 'carry'; game.carrier = winner; game.carryAct = winner.act;
      winner.act.onArrive = d => { drop(mouthOf(d)); d.act.still = 'sniff'; d.act.hold = rand(1.2, 2.2); }; // A last sniff at its prize.
    }
    extras.push({
      update(dt) {
        if (!game) {
          if (night || reduced.matches) return;
          if ((wait -= dt) <= 0) begin();
          return;
        }
        const g = game;
        if (g.state === 'rest') { if ((g.life -= dt) <= 0) game = null; return; }
        if (g.state === 'carry') { if (g.carrier.act !== g.carryAct || night) drop(mouthOf(g.carrier)); return; }
        // Either player wandered off (a tap, a pat, a meal, bedtime): the rope falls where it is.
        if (g.left.act !== g.acts[0] || g.right.act !== g.acts[1] || night) return drop();
        if (g.state === 'gather') { if (g.ready >= 2) g.state = 'pull'; return; }
        g.dur -= dt;
        if ((g.beat -= dt) <= 0) {
          g.beat = rand(.25, .65);
          // A lurch one way or the other, pulled back toward the middle when it strays far.
          let dir = Math.random() < g.bias ? 1 : -1;
          if (Math.abs(g.shift) >= 3) dir = -Math.sign(g.shift);
          const dx = dir * P;
          if (valid(g.left.x + dx, g.left.y) && valid(g.right.x + dx, g.right.y)) { g.left.x += dx; g.right.x += dx; g.rope.x += dx; g.shift += dir; }
        }
        if (g.dur <= 0) decide();
      },
      items(items) {
        if (!game) return;
        const g = game, px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * PD, y * PD, PD, PD); };
        if (g.state === 'pull' || (g.state === 'gather' && g.ready >= 2)) {
          // Taut between the two mouths, on the chin row of the bow pose.
          const L = g.left.render, R = g.right.render;
          if (!L || !R) return;
          items.push({ y: Math.max(g.left.y, g.right.y) + .2, draw: () => {
            const x0 = L.gx + 7, x1 = R.gx - 7, y = L.gy - 2;
            for (let x = x0; x <= x1; x++) px(x, y, Math.floor((x + g.shift) / 2) % 2 ? ROPE[0] : ROPE[1]);
          } });
        } else if (g.state === 'carry') {
          const c = g.carrier.render;
          if (!c) return;
          items.push({ y: g.carrier.y + .2, draw: () => {
            // Held in the mouth, both ends dangling.
            for (const [dx, dy, col] of [[8, -6, ROPE[0]], [8, -5, ROPE[1]], [9, -4, ROPE[0]], [9, -3, KNOT]]) px(c.gx + dx * c.face, c.gy + dy, col);
          } });
        } else {
          // Lying on the ground: a short striped rope with a knot at each end.
          items.push({ y: g.rope.y - .2, draw: () => {
            const gx = Math.round(g.rope.x * dpr / PD), gy = Math.round(g.rope.y * dpr / PD);
            ctx.globalAlpha = g.state === 'rest' ? clamp(g.life / 1.5, 0, 1) : 1;
            for (let x = -3; x <= 3; x++) px(gx + x, gy - 1, Math.abs(x) === 3 ? KNOT : x % 2 ? ROPE[0] : ROPE[1]);
            ctx.globalAlpha = 1;
          } });
        }
      },
    });
    canvas.tugDebug = () => game && { state: game.state, shift: game.shift, ready: game.ready, left: dogs.indexOf(game.left), right: dogs.indexOf(game.right), rope: { ...game.rope } };
  }

  // ==== Feature: butterflies (spring, plus a rare visitor) ===================================
  // Spring (Mar 20-May 31): two small butterflies, one yellow and one orange, flutter in loose loops
  // over the field by day. Now and then a dog notices one: it sits or stands and follows it with its
  // eyes, or trots under it and play-bows, and the butterfly lifts away.
  // Any time of year: when a puppy is lying down, a butterfly may come and land on its nose, slowly
  // open and close its wings a few times, and flutter off (a lone visitor every 6-12 minutes outside
  // spring, sooner with ?event=nose). Flags: season === 'spring', event === 'nose'.
  {
    const spring = seasonToday() === 'spring', forcedNose = eventParam === 'nose';
    // Smaller than a puppy's head: wings spread with dark tips, half raised, then folded up. The
    // bottom row is only the body, so on a nose just the body touches down.
    const OPEN = ['tw.wt', 'wwbww', '..b..'], HALF = ['.t.t.', '.wbw.', '..b..'], SHUT = ['.w.w.', '..b..'], PERCH_OPEN = OPEN;
    // The surprised "!" bubble that pops up over a puppy when one lands on its nose.
    const BANG = ['.ooooo.', 'owwwwwo', 'owwkwwo', 'owwkwwo', 'owwwwwo', 'owwkwwo', 'owwwwwo', '.ooooo.', '..o....'], BANG_COLORS = { o: '#3a3530', w: '#ffffff', k: '#3a3530' };
    // A warm brown body, so it still shows against a black nose.
    const COLORS = [{ w: '#e9b949', t: '#a8782a', b: '#7a5232', a: '#6b5848' }, { w: '#e58f4f', t: '#a65a2c', b: '#7a5232', a: '#6b5848' }];
    let flies = null, notice = rand(6, 14), visit = forcedNose ? 2 : rand(360, 720);
    function openSpot() {
      for (let i = 0; i < 60; i++) {
        const x = rand(.08, .92) * width, y = rand(.3, .92) * height;
        if (valid(x, y) && !inZone(x, y) && !pixelInText(x, y - 60)) return { x, y };
      }
      return nearestValid(width / 2, height * .6);
    }
    function init() {
      flies = spring ? COLORS.map(col => { const p = openSpot(), t = openSpot(); return { ...p, z: rand(35, 70), zt: 50, tx: t.x, ty: t.y, t: rand(0, 10), col, lift: 0, face: 1 }; }) : [];
    }
    // A puppy settled in for a proper lie-down, with time left before it gets up.
    const restingDog = () => dogs.filter(d => d.act.type === 'lie' && !d.path.length && d.act.hold > 5 && !d.pat && !flies.some(f => f.land?.dog === d))[0];
    // The nose point of a lying dog: the butterfly's ground spot and its height above the ground.
    const noseOf = d => ({ x: d.x + d.face * 7 * P, y: d.y, z: 4 * P });
    function land(f, d) {
      f.land = { dog: d, act: d.act, perched: false, stay: rand(3.5, 6) };
      const n = noseOf(d); f.tx = n.x; f.ty = n.y;
    }
    function takeOff(f) {
      f.land = null; f.lift = 2.5;
      if (f.visitor) { f.leaving = true; const side = f.x < width / 2 ? -1 : 1; f.tx = side < 0 ? -60 : width + 60; f.ty = f.y + rand(-80, 80); }
      else { const t = openSpot(); f.tx = t.x; f.ty = t.y; }
    }
    function spawnVisitor(d) {
      const fromLeft = d.x < width / 2, col = COLORS[Math.floor(Math.random() * COLORS.length)];
      const f = { x: fromLeft ? -40 : width + 40, y: clamp(d.y + rand(-120, 120), 60, height - 20), z: 90, zt: 90, tx: 0, ty: 0, t: 0, col, lift: 0, face: fromLeft ? 1 : -1, visitor: true };
      flies.push(f); land(f, d);
    }
    function react() {
      const resting = restingDog(), drifting = flies.filter(f => !f.land && !f.lift && !f.visitor);
      if (resting && drifting.length && Math.random() < .35) return land(drifting[Math.floor(Math.random() * drifting.length)], resting);
      const low = flies.filter(f => f.z < 70 && !f.lift && !f.land && !f.visitor);
      const free = dogs.filter(idleDog);
      if (!low.length || !free.length) return;
      const f = low[Math.floor(Math.random() * low.length)];
      const d = free.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0];
      if (Math.hypot(d.x - f.x, d.y - f.y) > 320) return;
      setAct(d, 'flutter'); d.act.watch = f;
      if (Math.random() < .25 + .55 * d.mood.energy) {
        // Trot under it and play-bow; it flutters up and off.
        const side = d.x < f.x ? -1 : 1, spot = nearestValid(f.x + side * rand(8, 11) * P, f.y + rand(-3, 3) * P);
        d.act.hold = 99; rollPant(d);
        if (!goTo(d, spot, 'trot')) { d.act.hold = 1; return; }
        d.act.onArrive = dd => { dd.act.still = 'bow'; dd.act.hold = rand(1, 1.8); f.lift = 2.5; const t = openSpot(); f.tx = t.x; f.ty = t.y; };
      } else {
        d.act.still = Math.random() < .6 ? 'sit' : null; d.act.hold = rand(3, 6);
      }
    }
    extras.push({
      update(dt) {
        if (night || reduced.matches) return;
        if (!flies) init();
        if (!flies.some(f => f.visitor) && (visit -= dt) <= 0) {
          const d = restingDog();
          if (d) { spawnVisitor(d); visit = forcedNose ? rand(30, 50) : rand(360, 720); }
          else visit = forcedNose ? 2 : 20;
        }
        for (const f of [...flies]) {
          f.t += dt; f.lift = Math.max(0, f.lift - dt);
          if (f.land) {
            const L = f.land, d = L.dog;
            if (d.act !== L.act) { takeOff(f); continue; } // The dog got up, or was patted or called.
            const n = noseOf(d);
            if (L.perched) {
              Object.assign(f, n); f.dist = 0;
              d.act.still = 'lie'; d.act.hold = Math.max(d.act.hold, 2); // Lies still, eyes open, cross-eyed with patience.
              if ((L.stay -= dt) <= 0) { d.act.still = null; d.act.hold = rand(2, 5); takeOff(f); }
              continue;
            }
            // Flutter in, slowing and steadying for the last stretch, and settle on the nose.
            f.tx = n.x; f.ty = n.y;
            const dx = n.x - f.x, dy = n.y - f.y, dist = Math.hypot(dx, dy), slow = clamp(dist / 80, .25, 1);
            f.dist = dist;
            if (Math.abs(dx) > 2) f.face = dx > 0 ? 1 : -1;
            d.act.hold = Math.max(d.act.hold, 3); // The puppy stays put while it comes in.
            const wob = Math.sin(f.t * 2.3) * .6 * slow, step = Math.min(dist, (dist > 150 ? 110 : 45 * slow) * dt);
            if (dist > .5) { f.x += (dx / dist - dy / dist * wob) * step; f.y += (dy / dist + dx / dist * wob) * step; }
            f.z += ((dist < 60 ? n.z : 70) - f.z) * Math.min(1, dt * 2);
            if (dist < 2 && Math.abs(f.z - n.z) < 2) { L.perched = true; L.t0 = f.t; }
            continue;
          }
          if (f.visitor) {
            // Off and away across the page, then gone.
            const dx = f.tx - f.x, dy = f.ty - f.y, dist = Math.hypot(dx, dy) || 1, wob = Math.sin(f.t * 2.3) * .8;
            f.x += (dx / dist - dy / dist * wob) * 60 * dt; f.y += (dy / dist + dx / dist * wob) * 36 * dt; f.dist = 99;
            if (Math.abs(dx) > 2) f.face = dx > 0 ? 1 : -1;
            f.z += (110 - f.z) * Math.min(1, dt * 1.2);
            if (f.x < -50 || f.x > width + 50) flies.splice(flies.indexOf(f), 1);
            continue;
          }
          f.dist = 99;
          const dx = f.tx - f.x, dy = f.ty - f.y, dist = Math.hypot(dx, dy);
          const other = flies.find(o => o !== f && Math.hypot(o.x - f.x, o.y - f.y) < 90);
          if (dist < 12 || (other && f === flies[0] && Math.random() < dt)) { const t = openSpot(); f.tx = t.x; f.ty = t.y; continue; }
          // Drifts toward its target with a sideways wobble; quicker and higher just after a pounce.
          const sp = f.lift ? 80 : 38, wob = Math.sin(f.t * 2.3) * .8;
          const nx = f.x + (dx / dist - dy / dist * wob) * sp * dt, ny = f.y + (dy / dist + dx / dist * wob) * sp * .6 * dt;
          if (valid(nx, ny) && !inZone(nx, ny)) { f.x = nx; f.y = ny; } else { const t = openSpot(); f.tx = t.x; f.ty = t.y; }
          if (Math.abs(dx) > 2) f.face = dx > 0 ? 1 : -1;
          f.zt = f.lift ? 110 : 45 + 20 * Math.sin(f.t * .6);
          f.z += (f.zt - f.z) * Math.min(1, dt * 1.2);
        }
        if ((notice -= dt) <= 0) { notice = rand(10, 22); react(); }
      },
      items(items) {
        if (!flies || night) return;
        for (const f of flies) items.push({ y: f.y + (f.land ? .3 : 0), draw: () => {
          // Perched: wings mostly folded, opening slowly now and then. Flying: a quick flap and a bob.
          const L = f.land, slowFlap = L?.perched ? Math.sin((f.t - L.t0) * 2.4 - Math.PI / 2) : 0;
          const map = L?.perched ? (slowFlap > .55 ? PERCH_OPEN : slowFlap > 0 ? HALF : SHUT) : [OPEN, OPEN, HALF, SHUT, HALF][Math.floor(f.t * 16) % 5], face = f.face;
          const gx = Math.round(f.x * dpr / PD), gy = Math.round((f.y - f.z + Math.sin(f.t * 5) * 3 * clamp(f.dist / 60, 0, 1)) * dpr / PD);
          map.forEach((line, ry) => [...line].forEach((ch, cx) => {
            if (ch === '.') return;
            const x = gx + (cx - 2) * face, y = gy + ry - map.length;
            if (pixelInText(x * PD / dpr, y * PD / dpr)) return;
            ctx.fillStyle = f.col[ch];
            ctx.fillRect(x * PD, y * PD, PD, PD);
          }));
        } });
      },
    });
    extras.push({
      items(items) {
        if (!flies || night) return;
        for (const f of flies) {
          const L = f.land, r = L?.dog.render, age = L?.perched ? f.t - L.t0 : 99;
          if (!r || age > 1.3) continue;
          items.push({ y: L.dog.y + .4, draw: () => {
            // Centered over the head, popping up a pixel higher for its first beat.
            const x0 = r.face > 0 ? r.gx + 1 : r.gx - 7, y0 = r.gy - 18 - (age < .12 ? 1 : 0);
            BANG.forEach((line, ry) => [...line].forEach((ch, cx) => {
              if (ch === '.' || pixelInText((x0 + cx) * PD / dpr, (y0 + ry) * PD / dpr)) return;
              ctx.fillStyle = BANG_COLORS[ch];
              ctx.fillRect((x0 + cx) * PD, (y0 + ry) * PD, PD, PD);
            }));
          } });
        }
      },
    });
    canvas.flyDebug = () => flies && flies.map(f => ({ x: f.x, y: f.y, z: f.z, lift: f.lift, visitor: !!f.visitor, land: f.land && { dog: dogs.indexOf(f.land.dog), perched: f.land.perched } }));
  }

  // ==== Feature: mealtime on demand ===========================================================
  // ?event=meal starts a meal a couple of seconds after the page opens, so it can be previewed.
  if (eventParam === 'meal') {
    let wait = 2;
    extras.push({ update(dt) { if (wait > 0 && (wait -= dt) <= 0 && !night && bowls.length) { const d = dogs.find(idleDog) || dogs[0]; d.mood.hunger = 1; startMeal(d); } } });
  }

  // ==== Feature: treats =======================================================================
  // By day a small blue bowl of bone treats sits in open ground. Press on it and drag a treat out:
  // the dogs come running and sit in a row under it, watching. Let go above a dog and it catches the
  // treat and chews; let go anywhere else and the treat drops, and the nearest dog trots over for it.
  {
    // Facing either way; the bottom row stands on the ground. T bone, t its shading, B rim, b bowl.
    const JAR = ['.T..T..', 'TtTTtT.', 'BBBBBBB', '.bbbbb.', '..bbb..'];
    const BONE = ['T...T', 'TTTTT', 'T...T'];
    // A toasty biscuit color, dark enough to stand out against the cream dog and the page.
    const COLORS = { T: '#c8924f', t: '#a87638', B: '#6a9ccc', b: '#4a7cab' };
    let jar = null, held = null, falling = [], line = null, lastLayout = '';
    const MOUTH_UP = 7; // A begging dog's mouth is about seven sprite pixels above its feet.
    const mouthOf = d => ({ x: d.x + d.face * 6.5 * P, y: d.y - MOUTH_UP * P });
    function placeJar() {
      const near = (x, y) => bowls.some(b => Math.abs(b.x - x) < 16 * P && Math.abs(b.y - y) < 10 * P);
      for (const fy of [.62, .5, .72, .4, .8, .3, .56, .68])
        for (const fx of [.14, .22, .3, .08, .4, .5, .6, .7, .8, .88]) {
          const x = width * fx, y = height * fy;
          const box = { l: x - 4 * P - 14, r: x + 4 * P + 14, t: y - 7 * P - 14, b: y + 10 };
          if (!valid(x, y) || inZone(x, y) || near(x, y)) continue;
          if (avoid.some(r => box.l < r.r && box.r > r.l && box.t < r.b && box.b > r.t)) continue;
          if (zone && box.l < zone.r && box.r > zone.l && box.t < zone.b && box.b > zone.t) continue;
          return { x, y };
        }
      return null;
    }
    const onJar = (x, y) => jar && !night && !reduced.matches && x > jar.x - 5 * P && x < jar.x + 5 * P && y > jar.y - 8 * P && y < jar.y + 2 * P;
    // The begging row: one sitting spot per dog, side by side a little below the treat.
    function formLine(at) {
      const diners = dogs.filter(d => ['beg', 'chew'].includes(d.act.type) || idleDog(d) || d.act.type === 'eat' || d.act.type === 'sniffbowl')
        .filter(d => !['sleep', 'tobed', 'wake'].includes(d.act.type));
      if (!diners.length) return;
      const gap = 20 * P, y = clamp(at.y + 22 * P, minY() + 10 * P, maxY() - 4);
      const cx = clamp(at.x, minX() + gap, maxX() - gap);
      line = { x: cx, y, t: 0 };
      diners.sort((a, b) => a.x - b.x).forEach((d, i) => {
        if (d.act.type === 'chew') return;
        const want = nearestValid(cx + (i - (diners.length - 1) / 2) * gap, y);
        setAct(d, 'beg'); d.act.hold = 99; d.act.watch = held || at;
        if (Math.hypot(want.x - d.x, want.y - d.y) > 6 && goTo(d, want, 'trot')) rollPant(d);
        d.act.onArrive = dd => { dd.act.still = 'beg'; };
        if (!d.path.length) d.act.still = 'beg';
      });
    }
    // Everyone still waiting goes back to their day after a little while.
    const release = (after = rand(2.5, 4)) => { for (const d of dogs) if (d.act.type === 'beg') { d.act.hold = after + rand(0, 1); d.act.watch = null; } };
    function chew(d) {
      setAct(d, 'chew'); d.act.still = 'beg'; d.act.hold = rand(1.6, 2.2); d.act.dur = d.act.hold; d.stir = d.act.hold;
      for (const o of dogs) if (o !== d && o.act.type === 'beg' && !held) o.act.watch = d; // The others watch the lucky one.
      d.mood.hunger = Math.max(0, d.mood.hunger - .15);
    }
    function drop() {
      const t = held; held = null;
      if (!t) return;
      // A seated, waiting dog whose mouth is just under the treat catches it.
      const catcher = dogs.filter(d => d.act.type === 'beg' && !d.path.length)
        .map(d => ({ d, m: mouthOf(d) }))
        .filter(({ m }) => Math.abs(t.x - m.x) < 8 * P && t.y < m.y + 2 * P)
        .sort((a, b) => Math.abs(t.x - a.m.x) - Math.abs(t.x - b.m.x))[0];
      const ground = catcher ? catcher.m.y : clamp(Math.max(t.y + 12 * P, line ? line.y + 6 * P : t.y + 20 * P), minY(), maxY());
      falling.push({ x: catcher ? catcher.m.x : t.x, y: t.y, vy: 0, to: ground, catcher: catcher?.d || null, rest: 0 });
      if (line) line.t = 0;
    }
    function grab(f) {
      // Nearest dog trots over to the treat on the ground and eats it.
      const d = dogs.filter(o => o.act.type === 'beg' || idleDog(o)).sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0];
      if (!d) { f.rest = 4; return; }
      const side = d.x < f.x ? -1 : 1;
      setAct(d, 'treatgrab'); d.act.hold = 99; f.taker = d;
      if (!goTo(d, nearestValid(f.x + side * 7 * P, f.y), 'trot')) { d.act.hold = 1; f.taker = null; f.rest = 4; return; }
      d.act.onArrive = dd => { dd.face = -side; dd.act.still = 'sniff'; dd.act.hold = 99; f.eatAt = .7; };
    }
    const down = e => {
      if (!onJar(e.clientX, e.clientY) || onControl(e.target)) return;
      e.preventDefault();
      held = { x: e.clientX, y: e.clientY };
      swallowClickUntil = performance.now() + 1e9; // Until the drag ends.
      formLine(held);
    };
    const move = e => {
      if (!held) return;
      held.x = e.clientX; held.y = e.clientY;
      // Let the row follow if the treat is carried somewhere else.
      if (line && line.t > .8 && (Math.abs(held.x - line.x) > 140 || Math.abs(held.y + 22 * P - line.y) > 110)) formLine(held);
    };
    const up = () => { if (!held) return; drop(); swallowClickUntil = performance.now() + 350; };
    const noSelect = e => { if (onJar(e.clientX, e.clientY)) e.preventDefault(); }; // No text selection while dragging a treat.
    const noTouchScroll = e => { const t = e.touches?.[0]; if (held || (t && onJar(t.clientX, t.clientY))) e.preventDefault(); };
    addEventListener('pointerdown', down);
    addEventListener('mousedown', noSelect);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    addEventListener('touchstart', noTouchScroll, { passive: false });
    addEventListener('touchmove', noTouchScroll, { passive: false });
    cleanups.push(() => {
      removeEventListener('pointerdown', down); removeEventListener('mousedown', noSelect); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      removeEventListener('touchstart', noTouchScroll); removeEventListener('touchmove', noTouchScroll);
    });
    extras.push({
      cursor: (x, y) => held ? 'grabbing' : onJar(x, y) ? 'grab' : null,
      update(dt) {
        const layout = `${width}x${height}:${avoid.map(r => Math.round(r.t)).join(',')}:${bowls.length}`;
        if (layout !== lastLayout) { lastLayout = layout; jar = placeJar(); }
        if (night) { if (held) held = null; falling = []; line = null; return; }
        if (line) line.t += dt;
        // Waiting dogs keep their eyes on the treat and wag hard.
        for (const d of dogs) {
          if (d.act.type === 'beg') { if (held) d.act.watch = held; if (!d.path.length) d.stir = Math.max(d.stir, .3); }
          if (d.act.type === 'chew' && Math.sin(clock * 14 + d.seed) > .3) d.tongue = .12; // Munching.
        }
        for (let i = falling.length - 1; i >= 0; i--) {
          const f = falling[i];
          if (f.y < f.to) {
            f.vy += 1400 * dt; f.y = Math.min(f.to, f.y + f.vy * dt);
            if (f.y >= f.to) {
              if (f.catcher && f.catcher.act.type === 'beg') { chew(f.catcher); falling.splice(i, 1); if (!held) release(); continue; }
              grab(f);
            }
            continue;
          }
          if (f.eatAt !== undefined && (f.eatAt -= dt) <= 0) { if (f.taker?.act.type === 'treatgrab') chew(f.taker); falling.splice(i, 1); if (!held) release(); continue; }
          if (f.taker && f.taker.act.type !== 'treatgrab' && f.eatAt === undefined) { f.taker = null; grab(f); }
          if (f.rest > 0 && (f.rest -= dt) <= 0) falling.splice(i, 1);
        }
        // Nobody's offering anything: drift off after a while.
        if (!held && !falling.length && line && line.t > 6) { release(); line = null; }
      },
      items(items) {
        if (!jar || night) return;
        const j = jar;
        items.push({ y: j.y, draw: () => {
          const gx = Math.round(j.x * dpr / PD), gy = Math.round(j.y * dpr / PD);
          JAR.forEach((row, ry) => [...row].forEach((ch, cx) => {
            if (ch === '.') return;
            ctx.fillStyle = COLORS[ch]; ctx.fillRect((gx + cx - 3) * PD, (gy + ry - JAR.length) * PD, PD, PD);
          }));
        } });
        for (const f of falling) items.push({ y: f.y >= f.to ? f.to : 1e9, draw: () => bone(f.x, f.y) });
        // The treat stays in a chewing dog's mouth, getting smaller bite by bite.
        for (const d of dogs) if (d.act.type === 'chew' && d.render) {
          const left = (d.act.dur - d.act.t) / d.act.dur, r = d.render;
          if (left <= .15) continue;
          items.push({ y: d.y + .3, draw: () => {
            const bob = Math.sin(clock * 14 + d.seed) > 0 ? 1 : 0; // Chomp, chomp.
            const mx = r.gx + 7 * r.face, my = r.gy - MOUTH_UP - 1 + bob, w = left > .6 ? 3 : left > .35 ? 2 : 1;
            ctx.fillStyle = COLORS.T;
            for (let k = 0; k < w; k++) ctx.fillRect((mx + k * r.face) * PD, my * PD, PD, PD);
            ctx.fillStyle = COLORS.t; ctx.fillRect((mx + (w - 1) * r.face) * PD, (my - 1) * PD, PD, PD); // A knob end.
          } });
        }
      },
      overlay() { if (held) bone(held.x, held.y); },
    });
    function bone(x, y) {
      const gx = Math.round(x * dpr / PD), gy = Math.round(y * dpr / PD);
      BONE.forEach((row, ry) => [...row].forEach((ch, cx) => {
        if (ch === '.') return;
        ctx.fillStyle = COLORS[ch]; ctx.fillRect((gx + cx - 2) * PD, (gy + ry - 2) * PD, PD, PD);
      }));
    }
    canvas.treatDebug = () => ({ jar, held, falling: falling.map(f => ({ x: f.x, y: f.y, to: f.to, catcher: f.catcher ? dogs.indexOf(f.catcher) : -1 })), line, acts: dogs.map(d => d.act.type) });
  }

  resize();
  measureAvoid();
  placeBowls();
  spawn();
  canvas.dogsDebug = {
    freeze: value => { frozen = value; },
    // Pose a dog for screenshots: place(i, x, y, pose?, frame?, face?, tail?, tongue?).
    place: (i, x, y, pose, f = 0, face = 1, tail, tongue = 0) => {
      const d = dogs[i];
      Object.assign(d, { x, y, face, path: [], dest: null, tongue, forced: pose ? [pose, f] : null, forcedTail: tail || null });
      d.act = { type: 'stand', t: 0, hold: 99 };
      draw();
    },
    sheet: opts => { sheet = opts || null; draw(); },
    hunger: (i, v) => { dogs[i].mood.hunger = v; },
    rain: on => { raining = on; if (on && !drops.length) initRain(); draw(); },
    // Put dog i at bowl b, eating (frame f of the eat pose is chosen by the clock unless frozen).
    eat: (i, b = i) => { const d = dogs[i], bowl = bowls[b]; if (!bowl) return; Object.assign(d, { ...bowl.spot, path: [], dest: null, forced: null }); setAct(d, 'eat'); d.path = []; d.dest = null; d.face = bowl.face; d.act.hold = 99; bowlVis = 1; draw(); },
    // Show dog i mid-pat at time t seconds into the pat (use with freeze).
    pat: (i, t = .6) => { dogs[i].pat = { t, dur: 1.5 }; draw(); },
    head: i => { const r = dogs[i].render; return r ? screenBox(r.list.filter(p => p[4]), r.gx, r.gy, r.face) : null; },
    poses: () => Object.fromEntries(Object.entries(POSES).map(([k, p]) => [k, { frames: p.frames.length, tails: p.tails }])),
  };
  canvas.dogs = () => ({
    dogs: dogs.map(d => ({ hunger: d.mood.hunger, coat: d.coat, x: d.x, y: d.y, act: d.act.type, pose: frameOf(d)[0], face: d.face, tongue: d.tongue, moving: d.path.length > 0, mood: { ...d.mood }, box: d.box })),
    avoid, pixel: P, width, height, night, bowlVis, raining, drops: drops.length, zone, lineBox, headBox,
    bowls: bowls.map(b => ({ x: b.x, y: b.y, l: b.x - 3 * P, r: b.x + 4 * P, t: b.y - 5 * P, b: b.y, dog: b.dog ? dogs.indexOf(b.dog) : -1 })),
    beds: beds.map(b => ({ x: b.x, y: b.y, l: b.x - BED_HALF * P, r: b.x + (BED_HALF + 1) * P, t: b.y - 4 * P, b: b.y })),
  });
  const themeWatch = new MutationObserver(() => { if (reduced.matches) still(); });
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('resize', onResize);
  visualViewport?.addEventListener('resize', onResize); // iPhone toolbars showing or hiding.
  addEventListener('click', onClick);
  addEventListener('pointermove', onPointer);
  reduced.addEventListener('change', onMotion);
  onMotion();
  weatherToday().then(w => {
    if (stopped) return;
    weather = w;
    if (w.rain) { raining = true; initRain(); }
    for (const x of extras) x.weather?.(w);
    if (reduced.matches) still();
  });

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    removeEventListener('resize', onResize);
    visualViewport?.removeEventListener('resize', onResize);
    removeEventListener('click', onClick);
    removeEventListener('pointermove', onPointer);
    reduced.removeEventListener('change', onMotion);
    themeWatch.disconnect();
    cleanups.forEach(f => f());
    if (cursorSet) document.body.style.cursor = '';
    delete canvas.dogs; delete canvas.dogsDebug;
  };
}
