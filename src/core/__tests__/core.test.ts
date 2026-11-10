import { dayKey, parseDay, startOfWeek } from '../dates';
import { EMOTION_OPTIONS, closestEmotion, emotionForLabel, mean, quadrantOf, scoreFromValence } from '../emotions';
import { buildWeekReport } from '../report';
import { buildDaySummary, scoreOf } from '../summary';
import { parseWatchEntry } from '../watchInbox';
import type { Entry } from '../types';

const entry = (id: string, at: string, valence: number, energy: number, labels: string[] = []): Entry => ({
  id,
  at,
  day: dayKey(new Date(at)),
  text: '',
  mood: { valence, energy },
  labels,
  source: 'phone',
});

describe('emotional scoring', () => {
  it('offers a concise emoji emotion set and maps old mood coordinates to the closest choice', () => {
    expect(EMOTION_OPTIONS).toHaveLength(8);
    expect(emotionForLabel('Ansioso')?.emoji).toBe('😰');
    expect(closestEmotion({ valence: -0.7, energy: 0.8 }).label).toBe('Ansioso');
  });

  it('maps mood from the full valence range into scores from 1 to 10', () => {
    expect(scoreFromValence(-1)).toBe(1);
    expect(scoreFromValence(1)).toBe(10);
    expect(scoreFromValence(-2)).toBe(1);
  });

  it('classifies all four mood quadrants and returns a neutral mean for an empty list', () => {
    expect(quadrantOf({ valence: 1, energy: 1 })).toBe('animado');
    expect(quadrantOf({ valence: -1, energy: 1 })).toBe('tenso');
    expect(quadrantOf({ valence: -1, energy: -1 })).toBe('apagado');
    expect(quadrantOf({ valence: 1, energy: -1 })).toBe('sereno');
    expect(mean([])).toBe(0);
  });
});

describe('date and summary behavior', () => {
  it('uses local calendar dates and starts the week on Monday', () => {
    const date = new Date(2026, 10, 10, 12);
    expect(dayKey(date)).toBe('2026-11-10');
    expect(dayKey(startOfWeek(date))).toBe('2026-11-09');
    expect(dayKey(parseDay('2026-11-10'))).toBe('2026-11-10');
  });

  it('summarizes entries in time order and counts repeated feeling labels', () => {
    const later = entry('later', '2026-11-10T20:00:00.000Z', 0.8, 0.7, ['Alegre']);
    const earlier = entry('earlier', '2026-11-10T08:00:00.000Z', 0.4, 0.2, ['Alegre']);
    expect(scoreOf([earlier, later])).toBe(8.2);
    const summary = buildDaySummary([later, earlier]);
    expect(summary.lines[0]).toBe('Registraste 2 momentos.');
    expect(summary.lines).toContain('Lo que más sentiste: Alegre (×2).');
    expect(summary.lines[1]).toBe('Predominó un ánimo animado.');
  });

  it('returns a seven day report for a Monday-based week', () => {
    const start = startOfWeek(new Date(2026, 10, 10));
    const day = dayKey(new Date(2026, 10, 10));
    const report = buildWeekReport(start, [entry('one', '2026-11-10T12:00:00.000Z', 1, 0.5)], {});
    expect(report.days).toHaveLength(7);
    expect(report.totalEntries).toBe(1);
    expect(report.days.find((item) => item.day === day)?.count).toBe(1);
    expect(report.avgScore).toBe(10);
  });
});

describe('watch entry validation', () => {
  it('rejects malformed data and clamps valid mood values', () => {
    expect(parseWatchEntry({ id: 'bad', at: 'yesterday' })).toBeNull();
    const parsed = parseWatchEntry({ id: 'watch-1', at: '2026-11-10T12:00:00.000Z', valence: 3, energy: -3, labels: ['calma'] });
    expect(parsed?.mood).toEqual({ valence: 1, energy: -1 });
    expect(parsed?.id).toBe('w-watch-1');
    expect(parsed?.source).toBe('watch');
  });
});
