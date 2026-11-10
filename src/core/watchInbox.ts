import { clamp } from './emotions';
import type { Entry } from './types';
import { dayKey } from './dates';

/** Valida una entrada rápida del reloj (dato externo: no se confía en su forma). */
export function parseWatchEntry(raw: unknown): Entry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const at = typeof r.at === 'string' ? new Date(r.at) : null;
  if (typeof r.id !== 'string' || !r.id || !at || Number.isNaN(at.getTime())) return null;
  if (typeof r.valence !== 'number' || typeof r.energy !== 'number') return null;
  const labels = Array.isArray(r.labels) ? r.labels.filter((l): l is string => typeof l === 'string').map((l) => l.slice(0, 40)).slice(0, 3) : [];
  return {
    id: `w-${r.id.slice(0, 64)}`,
    at: at.toISOString(),
    day: dayKey(at),
    text: '',
    mood: { valence: clamp(r.valence, -1, 1), energy: clamp(r.energy, -1, 1) },
    labels,
    source: 'watch',
  };
}
