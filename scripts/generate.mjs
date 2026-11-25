import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { computeStats } from './stats.mjs';
import { renderSequencer, renderMixer } from './svg.mjs';

export const PROFILE = {
  name: 'Juan Schcolnik',
  tagline: 'Lead Engineer · MedVision · Buenos Aires',
  stack: ['React', 'Next.js', 'Node', 'NestJS', 'GraphQL', 'Supabase', 'Playwright', 'n8n'],
  master: 'TypeScript',
  tracks: [['RIM', 'SUN'], ['KICK', 'MON'], ['SNARE', 'TUE'], ['CLAP', 'WED'], ['HAT', 'THU'], ['TOM', 'FRI'], ['CRASH', 'SAT']],
};

const LOGIN = 'schcolnikj';
const QUERY = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount contributionLevel weekday } } } } } }`;

export async function fetchCalendar(login, token, fetchImpl = fetch) {
  const res = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'schcolnikj-readme-art' },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`GitHub API: ${json.errors.map((e) => e.message).join('; ')}`);
  const user = json.data?.user;
  if (!user) throw new Error(`GitHub user not found: ${login}`);
  return user.contributionsCollection.contributionCalendar;
}

async function main() {
  const i = process.argv.indexOf('--fixture');
  let calendar;
  if (i > 0) {
    calendar = JSON.parse(readFileSync(process.argv[i + 1], 'utf8'));
  } else {
    // || not ??: the workflow passes CONTRIB_TOKEN as '' when the secret is unset
    const token = process.env.CONTRIB_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) throw new Error('No token: set CONTRIB_TOKEN or GITHUB_TOKEN, or pass --fixture <path>');
    calendar = await fetchCalendar(LOGIN, token);
  }
  const stats = computeStats(calendar);
  const sequencer = renderSequencer({ calendar, stats, profile: PROFILE });
  const mixer = renderMixer({ stats, profile: PROFILE });
  mkdirSync('assets', { recursive: true });
  writeFileSync('assets/sequencer.svg', sequencer);
  writeFileSync('assets/mixer.svg', mixer);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
