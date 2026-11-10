import { QUADRANTS, mean, quadrantOf, scoreFromValence } from './emotions';
import { formatTime } from './dates';
import type { Entry, QuadrantId } from './types';

export type DaySummary = { score: number; headline: string; lines: string[] };

export const sortByTime = (entries: Entry[]) => [...entries].sort((a, b) => a.at.localeCompare(b.at));

export function scoreOf(entries: Entry[]): number | null {
  if (!entries.length) return null;
  return scoreFromValence(mean(entries.map((e) => e.mood.valence)));
}

function headlineFor(score: number, spread: number, n: number): string {
  if (n >= 2 && spread >= 1.0) return 'Un día de altibajos';
  if (score >= 8) return 'Un día muy bueno';
  if (score >= 6.5) return 'Un buen día';
  if (score >= 4.5) return 'Un día regular';
  if (score >= 3) return 'Un día difícil';
  return 'Un día muy difícil';
}

const snippet = (e: Entry) => {
  const t = e.text.trim().replace(/\s+/g, ' ');
  const base = t ? (t.length > 60 ? `${t.slice(0, 57)}…` : t) : e.labels.join(', ') || QUADRANTS[quadrantOf(e.mood)].name;
  return base;
};

/** Resumen y puntuación calculados localmente con reglas simples (sin IA, sin red). */
export function buildDaySummary(entries: Entry[]): DaySummary {
  const list = sortByTime(entries);
  const n = list.length;
  const score = scoreOf(list) ?? 5.5;
  const valences = list.map((e) => e.mood.valence);
  const spread = n ? Math.max(...valences) - Math.min(...valences) : 0;
  const lines: string[] = [`Registraste ${n} ${n === 1 ? 'momento' : 'momentos'}.`];

  const q: Record<QuadrantId, number> = { animado: 0, tenso: 0, apagado: 0, sereno: 0 };
  list.forEach((e) => (q[quadrantOf(e.mood)] += 1));
  const ranked = (Object.keys(q) as QuadrantId[]).sort((a, b) => q[b] - q[a]);
  // en caso de empate, manda el ánimo medio del día
  const top = q[ranked[0]] === q[ranked[1]] ? quadrantOf({ valence: mean(valences), energy: mean(list.map((e) => e.mood.energy)) }) : ranked[0];
  lines.push(`Predominó un ánimo ${QUADRANTS[top].name.toLowerCase()}.`);

  const counts = new Map<string, number>();
  list.forEach((e) => e.labels.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1)));
  const labels = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (labels.length) lines.push(`Lo que más sentiste: ${labels.map(([l, c]) => (c > 1 ? `${l} (×${c})` : l)).join(', ')}.`);

  if (n >= 2) {
    const half = Math.floor(n / 2);
    const diff = mean(valences.slice(half)) - mean(valences.slice(0, half));
    lines.push(diff > 0.3 ? 'Tu ánimo fue mejorando a lo largo del día.' : diff < -0.3 ? 'Tu ánimo fue bajando a lo largo del día.' : 'Tu ánimo se mantuvo estable.');
  }

  if (n >= 2 && spread >= 0.4) {
    const best = list.reduce((a, b) => (b.mood.valence > a.mood.valence ? b : a));
    const worst = list.reduce((a, b) => (b.mood.valence < a.mood.valence ? b : a));
    lines.push(`Mejor momento (${formatTime(best.at)}): ${snippet(best)}`);
    lines.push(`Momento más difícil (${formatTime(worst.at)}): ${snippet(worst)}`);
  }

  const energy = mean(list.map((e) => e.mood.energy));
  lines.push(`Energía ${energy >= 0.25 ? 'alta' : energy <= -0.25 ? 'baja' : 'moderada'} durante el día.`);

  return { score, headline: headlineFor(score, spread, n), lines };
}
