import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
const script = fileURLToPath(new URL('./generate.mjs', import.meta.url));
const fixturePath = fileURLToPath(new URL('./fixtures/calendar.json', import.meta.url));
const tmp = () => mkdtempSync(join(tmpdir(), 'readme-art-'));

test('fixture run writes both svgs under 150 KB', () => {
  const cwd = tmp();
  const r = spawnSync('node', [script, '--fixture', fixturePath], { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const f of ['sequencer.svg', 'mixer.svg']) {
    const p = join(cwd, 'assets', f);
    const size = statSync(p).size; assert.ok(size > 1000 && size < 150_000, `${f} ${size}`);
    assert.ok(readFileSync(p, 'utf8').includes('SF Pro Display'));
  }
});
test('empty calendar exits 1 and writes nothing', () => {
  const cwd = tmp();
  const empty = structuredClone(fixture);
  empty.totalContributions = 0;
  for (const w of empty.weeks) for (const d of w.contributionDays) { d.contributionCount = 0; d.contributionLevel = 'NONE'; }
  const p = join(cwd, 'empty.json');
  writeFileSync(p, JSON.stringify(empty));
  const r = spawnSync('node', [script, '--fixture', p], { cwd, encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.ok(!existsSync(join(cwd, 'assets')));
});
