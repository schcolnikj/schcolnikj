import { LEVELS } from './stats.mjs';

export const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif";
export const MONO = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";

const ACCENT = '#ef7200', INK = '#ece4d2', MUTED = '#9a9a92', PANEL = '#1e1f22', PAD_OFF = '#2c2d31';
const OPACITY = [1, 0.3, 0.55, 0.8, 1];
const X0 = 120, CW = 686 / 53, Y0 = 252, RH = 28;

export const escapeXml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const text = (x, y, font, size, fill, body, extra = '') =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}"${extra}>${escapeXml(body)}</text>`;

function knob(x, label, val, frac) {
  const a = ((-135 + clamp01(frac) * 270) * Math.PI) / 180;
  return `<circle cx="${x}" cy="160" r="20" fill="${PAD_OFF}" stroke="#44454b"/>
<line x1="${x}" y1="160" x2="${(x + 14 * Math.sin(a)).toFixed(1)}" y2="${(160 - 14 * Math.cos(a)).toFixed(1)}" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round"/>
${text(x, 200, MONO, 9, MUTED, label, ' text-anchor="middle" letter-spacing="1"')}
${text(x, 215, SANS, 12, INK, val, ' text-anchor="middle" font-weight="600"')}`;
}

export function renderSequencer({ calendar, stats, profile }) {
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weeks = calendar.weeks;

  // Month starts: the week holding the 1st of a month, read from the date string.
  const starts = [];
  weeks.forEach((w, wk) => w.contributionDays.forEach((d) => {
    if (d.date.endsWith('-01')) starts.push({ wk, label: MON[+d.date.slice(5, 7) - 1] });
  }));
  const bands = starts.filter((_, i) => i % 2 === 0).map((s, i) => {
    const endWk = starts[i * 2 + 1]?.wk ?? weeks.length;
    return `<rect x="${(X0 + s.wk * CW - 1.2).toFixed(1)}" y="238" width="${((endWk - s.wk) * CW).toFixed(1)}" height="216" rx="3" fill="#25272b"/>`;
  });
  const marks = starts.map((s) => text((X0 + s.wk * CW + 1).toFixed(1), 472, MONO, 9, MUTED, s.label));

  const leds = weeks.map((_, s) => `<circle cx="${(X0 + s * CW + 5.2).toFixed(1)}" cy="246" r="2" fill="#4a1d19"/>`);
  const tracks = profile.tracks.map(([name, day], k) =>
    text(28, Y0 + k * RH + 15, SANS, 11, INK, name, ' font-weight="600" letter-spacing="1"') +
    text(80, Y0 + k * RH + 15, MONO, 8, MUTED, day));
  const pads = weeks.flatMap((w, wk) => w.contributionDays.map((d) => {
    const lvl = LEVELS[d.contributionLevel] ?? 0;
    return `<rect class="${lvl ? 'pad on' : 'pad'}" x="${(X0 + wk * CW).toFixed(1)}" y="${Y0 + d.weekday * RH}" width="10.4" height="22" rx="2" fill="${lvl ? ACCENT : PAD_OFF}" fill-opacity="${OPACITY[lvl]}"/>`;
  }));

  const initials = profile.name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const peakLabel = stats.peak ? stats.peak.label : '—';
  const knobs = [
    knob(60, 'TEMPO', `${stats.perWeek}/wk`, stats.perWeek / 100),
    knob(150, 'STREAK', `${stats.longestStreak} days`, stats.longestStreak / 30),
    knob(240, 'PEAK', peakLabel, stats.peak ? stats.peak.total / 500 : 0),
    knob(330, 'DAYS ON', String(stats.activeDays), stats.activeDays / 365),
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 490" width="830" height="490" role="img">
<title>Step sequencer: each weekday is a drum track, each week a step, and lit pads are days with contributions</title>
<style>.run{animation:run 7s steps(53) infinite}@keyframes run{from{transform:translateX(0)}to{transform:translateX(686px)}}@media (prefers-reduced-motion: reduce){.run{animation:none}}</style>
<rect width="830" height="490" rx="14" fill="${PANEL}"/>
<line x1="14" x2="816" y1="1.5" y2="1.5" stroke="#34353a"/>
${text(28, 44, SANS, 13, ACCENT, `${initials}-${String(stats.year).slice(-2)} · STEP SEQUENCER`, ' font-weight="700" letter-spacing="3"')}
${text(26, 88, SANS, 44, INK, profile.name, ' font-weight="700"')}
${text(28, 112, MONO, 11, MUTED, profile.tagline)}
<rect x="560" y="28" width="242" height="78" rx="6" fill="#0d0e10" stroke="#34353a"/>
${text(574, 50, MONO, 9, MUTED, `PATTERN ${stats.year}`, ' letter-spacing="1"')}
${text(788, 50, MONO, 9, MUTED, `STREAK ${stats.longestStreak}`, ' text-anchor="end" letter-spacing="1"')}
${text(574, 90, SANS, 34, ACCENT, stats.total.toLocaleString('en-US'), ' font-weight="700"')}
${text(680, 90, MONO, 10, MUTED, 'HITS')}
${text(788, 90, MONO, 12, ACCENT, `${stats.perWeek} / WK`, ' text-anchor="end" font-weight="700"')}
${knobs.join('\n')}
<rect x="600" y="144" width="44" height="32" rx="4" fill="${PAD_OFF}"/>
<path d="M626 152 L614 160 L626 168 Z M636 152 L624 160 L636 168 Z" fill="${INK}"/>
<rect x="652" y="144" width="44" height="32" rx="4" fill="${ACCENT}"/>
<path d="M668 151 L682 160 L668 169 Z" fill="${PANEL}"/>
<rect x="704" y="144" width="44" height="32" rx="4" fill="${PAD_OFF}"/>
<rect x="719" y="153" width="14" height="14" fill="${INK}"/>
<rect x="756" y="144" width="44" height="32" rx="4" fill="${PAD_OFF}"/>
<circle cx="778" cy="160" r="7" fill="#ff3b30"/>
${text(600, 200, MONO, 9, MUTED, 'TRANSPORT', ' letter-spacing="1"')}
<line x1="28" x2="802" y1="230" y2="230" stroke="#2e2f34"/>
${bands.join('\n')}
${leds.join('\n')}
${tracks.join('\n')}
${pads.join('\n')}
<g class="run">
<rect x="119" y="252" width="12.4" height="198" rx="3" fill="#ffffff" fill-opacity="0.08"/>
<circle cx="125.2" cy="246" r="2.8" fill="#ff3b30"/>
</g>
${marks.join('\n')}
</svg>
`;
}

export function renderMixer({ stats, profile }) {
  const maxMonth = Math.max(0, ...stats.months.map((m) => m.total));
  const peakIdx = stats.peak ? stats.months.findIndex((m) => m.total === stats.peak.total) : -1;

  const pitch = Math.min(53, 700 / stats.months.length); // keeps every strip left of MASTER (x=728)
  const channels = stats.months.map((m, k) => {
    const cx = 28 + k * pitch + pitch / 2;
    const ky = 254 - (maxMonth ? m.total / maxMonth : 0) * 180 - 7;
    return `<rect x="${cx - 2}" y="74" width="4" height="180" rx="2" fill="#0d0e10"/>
<rect class="${k === peakIdx ? 'cap peak' : 'cap'}" x="${cx - 13}" y="${ky.toFixed(1)}" width="26" height="14" rx="3" fill="${k === peakIdx ? ACCENT : INK}"/>
<line x1="${cx - 13}" x2="${cx + 13}" y1="${(ky + 7).toFixed(1)}" y2="${(ky + 7).toFixed(1)}" stroke="${PANEL}" stroke-width="1.5"/>
${text(cx, 280, SANS, 11, INK, m.label, ' text-anchor="middle" font-weight="600"')}
${text(cx, 296, MONO, 10, ACCENT, m.total, ' text-anchor="middle"')}`;
  });

  let jx = 90; // jack spacing estimates text width at 6.2px per character
  const jacks = profile.stack.map((n) => {
    const out = `<circle cx="${jx + 5}" cy="330" r="5" fill="#0d0e10" stroke="${INK}" stroke-width="1.2"/>
${text(jx + 14, 334, MONO, 10, INK, n)}`;
    jx += 14 + n.length * 6.2 + 18;
    return out;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 350" width="830" height="350" role="img">
<title>Mixer: one fader per month set by that month's contributions, and the tech stack as input jacks</title>
<rect width="830" height="350" rx="14" fill="${PANEL}"/>
${text(28, 40, SANS, 13, ACCENT, 'MIXER', ' font-weight="700" letter-spacing="3"')}
${text(802, 40, MONO, 10, MUTED, 'one channel per month · fader = commits', ' text-anchor="end"')}
${channels.join('\n')}
<rect class="master" x="728" y="60" width="76" height="248" rx="8" fill="#17181b"/>
<rect x="764" y="74" width="4" height="180" rx="2" fill="#0d0e10"/>
<rect x="753" y="67" width="26" height="14" rx="3" fill="${ACCENT}"/>
${text(766, 280, SANS, 11, INK, 'MASTER', ' text-anchor="middle" font-weight="700" letter-spacing="1"')}
${text(766, 296, MONO, 9, MUTED, profile.master, ' text-anchor="middle"')}
${text(28, 334, MONO, 9, MUTED, 'INPUTS', ' font-weight="700" letter-spacing="2"')}
${jacks.join('\n')}
</svg>
`;
}
