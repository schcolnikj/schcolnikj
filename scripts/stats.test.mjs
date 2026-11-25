import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeStats } from './stats.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/calendar.json', import.meta.url), 'utf8'));

const zeroed = {
  ...fixture,
  totalContributions: 0,
  weeks: fixture.weeks.map((w) => ({
    contributionDays: w.contributionDays.map((d) => ({ ...d, contributionCount: 0, contributionLevel: 'NONE' })),
  })),
};

// Builds a GraphQL-shaped calendar of dayCount days starting at startDate, 1 contribution each, 7 days per week.
function calendarFrom(startDate, dayCount) {
  const days = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(Date.parse(`${startDate}T00:00:00Z`) + i * 86400000);
    return { date: d.toISOString().slice(0, 10), contributionCount: 1, contributionLevel: 'FIRST_QUARTILE', weekday: d.getUTCDay() };
  });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push({ contributionDays: days.slice(i, i + 7) });
  return { totalContributions: dayCount, weeks };
}

test('real fixture stats', () => {
  const s = computeStats(fixture);
  assert.equal(s.total, 2440); assert.equal(s.weekCount, 53); assert.equal(s.perWeek, 46);
  assert.equal(s.activeDays, 177); assert.equal(s.longestStreak, 12); assert.equal(s.year, 2026);
  assert.equal(s.months.length, 13);
  assert.deepEqual(s.months[4], { key: '2026-03', label: 'Mar', total: 447 });
  assert.deepEqual(s.peak, { label: 'March', total: 447 });
});

test('zero calendar', () => {
  const s = computeStats(zeroed);
  assert.equal(s.longestStreak, 0); assert.equal(s.peak, null); assert.equal(s.perWeek, 0);
});

test('year rollover uses the last day', () => {
  assert.equal(computeStats(calendarFrom('2025-12-28', 10)).year, 2026);
});
