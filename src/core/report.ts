import { QUADRANT_ORDER, mean, quadrantOf } from './emotions';
import { addDays, dayKey } from './dates';
import { scoreOf, sortByTime } from './summary';
import type { DayClosing, Entry, QuadrantId } from './types';

export type WeekDay = { day: string; count: number; score: number | null; closed: boolean; quadrant: QuadrantId | null };
export type WeekReport = {
  start: string;
  end: string;
  days: WeekDay[];
  totalEntries: number;
  daysLogged: number;
  daysClosed: number;
  avgScore: number | null;
  avgEnergy: number | null;
  quadrantCounts: Record<QuadrantId, number>;
  topLabels: { label: string; count: number }[];
  heavy: Entry[];
  uplifting: Entry[];
  lowestPart: string | null;
};

const partOf = (iso: string) => {
  const h = new Date(iso).getHours();
  return h >= 5 && h < 12 ? 'la mañana' : h >= 12 && h < 19 ? 'la tarde' : 'la noche';
};

export function buildWeekReport(weekStart: Date, all: Entry[], closings: Record<string, DayClosing>): WeekReport {
  const keys = Array.from({ length: 7 }, (_, i) => dayKey(addDays(weekStart, i)));
  const entries = sortByTime(all.filter((e) => keys.includes(e.day)));

  const days: WeekDay[] = keys.map((day) => {
    const list = entries.filter((e) => e.day === day);
    const avgMood = list.length ? { valence: mean(list.map((e) => e.mood.valence)), energy: mean(list.map((e) => e.mood.energy)) } : null;
    return { day, count: list.length, score: scoreOf(list), closed: !!closings[day], quadrant: avgMood ? quadrantOf(avgMood) : null };
  });

  const quadrantCounts = { animado: 0, tenso: 0, apagado: 0, sereno: 0 } as Record<QuadrantId, number>;
  entries.forEach((e) => (quadrantCounts[quadrantOf(e.mood)] += 1));

  const labelCounts = new Map<string, number>();
  entries.forEach((e) => e.labels.forEach((l) => labelCounts.set(l, (labelCounts.get(l) ?? 0) + 1)));
  const topLabels = [...labelCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, count]) => ({ label, count }));

  const withText = entries.filter((e) => e.text.trim());
  const heavy = [...withText].sort((a, b) => a.mood.valence - b.mood.valence).filter((e) => e.mood.valence < 0).slice(0, 3);
  const uplifting = [...withText].sort((a, b) => b.mood.valence - a.mood.valence).filter((e) => e.mood.valence > 0).slice(0, 3);

  const scored = days.filter((d) => d.score !== null).map((d) => d.score as number);
  const overall = mean(entries.map((e) => e.mood.valence));
  const parts = new Map<string, number[]>();
  entries.forEach((e) => parts.set(partOf(e.at), [...(parts.get(partOf(e.at)) ?? []), e.mood.valence]));
  let lowestPart: string | null = null;
  let lowest = Infinity;
  parts.forEach((vs, name) => {
    if (vs.length >= 2 && mean(vs) < overall - 0.15 && mean(vs) < lowest) {
      lowest = mean(vs);
      lowestPart = name;
    }
  });

  return {
    start: keys[0],
    end: keys[6],
    days,
    totalEntries: entries.length,
    daysLogged: days.filter((d) => d.count > 0).length,
    daysClosed: days.filter((d) => d.closed).length,
    avgScore: scored.length ? Math.round(mean(scored) * 10) / 10 : null,
    avgEnergy: entries.length ? mean(entries.map((e) => e.mood.energy)) : null,
    quadrantCounts,
    topLabels,
    heavy,
    uplifting,
    lowestPart,
  };
}

export { QUADRANT_ORDER };
