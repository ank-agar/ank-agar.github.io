// Plucked-guitar synthesis, rendered to plain sample arrays so the same code
// runs in the browser (played through an AudioBuffer) and in Node (WAV preview).
//
// Each string is an extended Karplus-Strong loop: a softened, pick-shaped noise
// burst circulates through a delay line with a decay filter and a fractional-
// delay allpass, so every string is exactly in tune. The mix then goes through
// a small guitar-body EQ, gentle tube-style saturation, and a short room reverb.

// F barre chord, strummed low to high: E1 A3 D3 G2 B1 e1 = F2 C3 F3 A3 C4 F4.
export const CHORD = [87.31, 130.81, 174.61, 220.00, 261.63, 349.23];
// Single tones from it for the six nav links.
export const NOTES = [130.81, 174.61, 220.00, 261.63, 349.23, 440.00];

function string(out, start, sr, freq, velocity, seed) {
  let rand = seed;
  const noise = () => {
    rand = (rand * 1664525 + 1013904223) >>> 0;
    return rand / 2147483648 - 1;
  };

  // Decay filter y = (1 - b) * x + b * prev: b = 0.5 is the classic averaging filter. Higher strings
  // use a smaller b so their upper harmonics survive and they keep ringing bright through the chord.
  const b = 0.5 - 0.28 * Math.min(1, Math.max(0, Math.log2(freq / 82.41) / 2.1));
  // Loop length: the decay filter adds b samples of delay, the allpass supplies the rest.
  const period = sr / freq;
  const length = Math.floor(period - b);
  const frac = period - length - b;
  const ap = (1 - frac) / (1 + frac);

  // Per-period loss: a long ring (about 7s to silence), the treble strings a little longer than the
  // bass so the top of the chord keeps singing after the low notes settle.
  const t60 = 6.5 + Math.log2(freq / 82.41) * 0.5;
  const loss = Math.pow(0.001, 1 / (freq * t60));

  // Excitation: noise softened by a one-pole lowpass (a pick, not a hiss),
  // then a comb notch for plucking ~1/8 of the way along the string.
  const burst = new Float32Array(length);
  let lp = 0;
  const bright = 0.35 + 0.35 * velocity;
  for (let i = 0; i < length; i++) {
    lp += bright * (noise() - lp);
    burst[i] = lp;
  }
  const pickAt = Math.max(1, Math.round(length * 0.13));
  const line = new Float32Array(length);
  let mean = 0;
  for (let i = 0; i < length; i++) {
    line[i] = burst[i] - (i >= pickAt ? burst[i - pickAt] : 0);
    mean += line[i];
  }
  mean /= length;
  let peak = 0;
  for (let i = 0; i < length; i++) { line[i] -= mean; peak = Math.max(peak, Math.abs(line[i])); }
  for (let i = 0; i < length; i++) line[i] *= velocity / (peak || 1);

  let idx = 0, prev = 0, apIn = 0, apOut = 0;
  for (let n = start; n < out.length; n++) {
    const y = line[idx];
    out[n] += y;
    const averaged = loss * ((1 - b) * y + b * prev);
    prev = y;
    apOut = ap * (averaged - apOut) + apIn;
    apIn = averaged;
    line[idx] = apOut;
    idx = (idx + 1) % length;
  }
}

function biquad(data, sr, type, freq, q, gainDb = 0) {
  const w = 2 * Math.PI * freq / sr, cos = Math.cos(w), alpha = Math.sin(w) / (2 * q);
  const A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lowpass') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else { b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cos; a2 = 1 - alpha / A; }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    data[i] = y;
  }
}

// Small Schroeder room: parallel damped combs into series allpasses.
function room(data, sr, mix) {
  const wet = new Float32Array(data.length);
  for (const ms of [29.7, 37.1, 41.1, 43.7]) {
    const len = Math.round(sr * ms / 1000), buf = new Float32Array(len);
    let i = 0, damp = 0;
    for (let n = 0; n < data.length; n++) {
      const y = buf[i];
      damp += 0.35 * (y - damp);
      buf[i] = data[n] + damp * 0.78;
      wet[n] += y * 0.25;
      i = (i + 1) % len;
    }
  }
  for (const ms of [5.0, 1.7]) {
    const len = Math.round(sr * ms / 1000), buf = new Float32Array(len);
    let i = 0;
    for (let n = 0; n < wet.length; n++) {
      const z = buf[i], x = wet[n];
      const y = -0.7 * x + z;
      buf[i] = x + 0.7 * y;
      wet[n] = y;
      i = (i + 1) % len;
    }
  }
  for (let n = 0; n < data.length; n++) data[n] = data[n] * (1 - mix) + wet[n] * mix;
}

export function render(freqs, sr, { strum = 0.024, seconds = 6 } = {}) {
  const out = new Float32Array(Math.round(sr * seconds));
  let seed = 12345;
  freqs.forEach((freq, i) => {
    const jitter = i ? (Math.sin(i * 12.9898) * 0.5) * 0.006 : 0;
    const start = Math.round(sr * (i * strum + jitter));
    // Even strum, so the treble strings come through instead of fading under the bass.
    const velocity = 1;
    string(out, Math.max(0, start), sr, freq, velocity, seed += 7919);
  });

  // Guitar body: trim rumble and fizz, add warmth around the body resonance.
  biquad(out, sr, 'highpass', 70, 0.7);
  biquad(out, sr, 'peaking', 110, 1.1, 0.5);
  biquad(out, sr, 'peaking', 3000, 0.8, 3);
  biquad(out, sr, 'lowpass', 9000, 0.7);

  // Gentle saturation, level-matched so it only rounds the peaks.
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const drive = 1.6, norm = Math.tanh(drive);
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(drive * out[i] / (peak || 1)) / norm;

  room(out, sr, 0.16);

  // Normalize, then fade the tail so nothing is cut off mid-ring.
  peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const fade = Math.round(sr * 1.6);
  for (let i = 0; i < out.length; i++) {
    out[i] *= 0.8 / (peak || 1);
    const left = out.length - i;
    if (left < fade) out[i] *= left / fade;
  }
  return out;
}
