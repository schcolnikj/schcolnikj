import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeStats } from './stats.mjs';
import { renderSequencer, renderMixer } from './svg.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/calendar.json', import.meta.url), 'utf8'));

const zeroed = {
  ...fixture,
  totalContributions: 0,
  weeks: fixture.weeks.map((w) => ({
    contributionDays: w.contributionDays.map((d) => ({ ...d, contributionCount: 0, contributionLevel: 'NONE' })),
  })),
};

// Single week whose first day is weekday 4 (Thursday), so only weekdays 4, 5, 6 exist.
const partial = {
  totalContributions: 3,
  weeks: [{
    contributionDays: [4, 5, 6].map((weekday, i) => ({
      date: `2026-01-0${i + 1}`, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE', weekday,
    })),
  }],
};

const profile = {
  name: 'Juan Schcolnik',
  tagline: 'Lead Engineer · Buenos Aires',
  stack: ['React', 'Next.js', 'Node', 'NestJS'],
  master: 'TypeScript',
  tracks: [['RIM', 'SUN'], ['KICK', 'MON'], ['SNARE', 'TUE'], ['CLAP', 'WED'], ['HAT', 'THU'], ['TOM', 'FRI'], ['CRASH', 'SAT']],
};

test('sequencer from real fixture', () => {
  const svg = renderSequencer({ calendar: fixture, stats: computeStats(fixture), profile });
  assert.match(svg, /^<svg[^>]+viewBox="0 0 830 490"/);
  for (const s of ['2,440', '46 / WK', 'STREAK 12', 'PATTERN 2026', '<title>', 'steps(53)']) assert.ok(svg.includes(s), s);
  assert.equal((svg.match(/class="pad/g) || []).length, 368);
  assert.equal((svg.match(/class="pad on"/g) || []).length, 177);
  assert.ok(!/(href|url\()\s*=?\s*["(]?https?:/.test(svg), 'no external refs');
});

test('partial first week uses weekday rows', () => {
  const svg = renderSequencer({ calendar: partial, stats: computeStats(partial), profile });
  assert.ok(svg.includes(`y="${252 + 4 * 28}"`));
  assert.ok(!svg.includes(`x="120.0" y="252"`)); // no pad in column 0, row 0
});

test('zero calendar renders without NaN', () => {
  const svgs = [renderSequencer({ calendar: zeroed, stats: computeStats(zeroed), profile }),
                renderMixer({ stats: computeStats(zeroed), profile })];
  for (const s of svgs) assert.ok(!s.includes('NaN'));
  assert.ok(svgs[0].includes('—'));
});

test('profile text is escaped', () => {
  const svg = renderSequencer({ calendar: fixture, stats: computeStats(fixture), profile: { ...profile, tagline: 'A & <B>' } });
  assert.ok(svg.includes('A &amp; &lt;B&gt;'));
});

test('mixer', () => {
  const svg = renderMixer({ stats: computeStats(fixture), profile });
  assert.match(svg, /viewBox="0 0 830 350"/);
  assert.equal((svg.match(/class="cap/g) || []).length, 13);
  assert.equal((svg.match(/class="cap peak"/g) || []).length, 1);
  for (const s of ['MASTER', 'TypeScript', ...profile.stack]) assert.ok(svg.includes(s), s);
});
