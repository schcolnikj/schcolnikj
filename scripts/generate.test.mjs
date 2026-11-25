import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fetchCalendar } from './generate.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/calendar.json', import.meta.url), 'utf8'));

test('fetchCalendar rejects GraphQL errors on HTTP 200', async () => {
  const fake = async () => new Response(JSON.stringify({ errors: [{ message: 'Bad credentials' }] }), { status: 200 });
  await assert.rejects(fetchCalendar('schcolnikj', 'x', fake), /Bad credentials/);
});
test('fetchCalendar returns the calendar', async () => {
  const body = { data: { user: { contributionsCollection: { contributionCalendar: fixture } } } };
  const cal = await fetchCalendar('schcolnikj', 'x', async () => new Response(JSON.stringify(body)));
  assert.equal(cal.totalContributions, 2440);
});
test('fixture run writes both svgs under 150 KB', () => {
  execFileSync('node', ['scripts/generate.mjs', '--fixture', 'scripts/fixtures/calendar.json']);
  for (const f of ['assets/sequencer.svg', 'assets/mixer.svg']) {
    const size = statSync(f).size; assert.ok(size > 1000 && size < 150_000, `${f} ${size}`);
    assert.ok(readFileSync(f, 'utf8').includes('SF Pro Display'));
  }
});
