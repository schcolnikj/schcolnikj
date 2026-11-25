export const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function computeStats(calendar) {
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const weekCount = calendar.weeks.length;
  const total = calendar.totalContributions;

  let activeDays = 0, longestStreak = 0, run = 0;
  const byMonth = new Map(); // Map keeps insertion order, so months stay oldest first
  for (const d of days) {
    if (d.contributionCount > 0) { activeDays++; run++; longestStreak = Math.max(longestStreak, run); } else run = 0;
    const key = d.date.slice(0, 7); // read from the string, never local time
    byMonth.set(key, (byMonth.get(key) ?? 0) + d.contributionCount);
  }

  const months = [...byMonth].map(([key, t]) => ({ key, label: MONTHS[+key.slice(5) - 1].slice(0, 3), total: t }));
  const busiest = months.reduce((best, m) => (m.total > best.total ? m : best), months[0]);

  return {
    total,
    weekCount,
    perWeek: Math.round(total / weekCount),
    activeDays,
    longestStreak,
    year: +days.at(-1).date.slice(0, 4),
    months,
    peak: total === 0 ? null : { label: MONTHS[+busiest.key.slice(5) - 1], total: busiest.total },
  };
}
