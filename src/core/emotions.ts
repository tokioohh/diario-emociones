import type { Mood, QuadrantId } from './types';

export type EmotionOption = { label: string; emoji: string; mood: Mood };

/** A short, familiar set for quick mood check-ins. */
export const EMOTION_OPTIONS: EmotionOption[] = [
  { label: 'Feliz', emoji: '😊', mood: { valence: 0.8, energy: 0.55 } },
  { label: 'Tranquilo', emoji: '😌', mood: { valence: 0.65, energy: -0.55 } },
  { label: 'Emocionado', emoji: '🤩', mood: { valence: 0.8, energy: 0.9 } },
  { label: 'Neutral', emoji: '😐', mood: { valence: 0, energy: 0 } },
  { label: 'Triste', emoji: '😢', mood: { valence: -0.8, energy: -0.55 } },
  { label: 'Ansioso', emoji: '😰', mood: { valence: -0.65, energy: 0.8 } },
  { label: 'Enojado', emoji: '😠', mood: { valence: -0.8, energy: 0.7 } },
  { label: 'Cansado', emoji: '😴', mood: { valence: -0.35, energy: -0.85 } },
];

export const emotionForLabel = (label: string) => EMOTION_OPTIONS.find((option) => option.label === label);

export function closestEmotion(mood: Mood) {
  return EMOTION_OPTIONS.reduce((closest, option) => {
    const distance = Math.hypot(option.mood.valence - mood.valence, option.mood.energy - mood.energy);
    const closestDistance = Math.hypot(closest.mood.valence - mood.valence, closest.mood.energy - mood.energy);
    return distance < closestDistance ? option : closest;
  }, EMOTION_OPTIONS[0]);
}

export const QUADRANTS: Record<QuadrantId, { name: string; hint: string; color: string; labels: string[] }> = {
  animado: { name: 'Animado', hint: 'Agradable · energía alta', color: '#FFC857', labels: ['Alegre', 'Emocionado', 'Entusiasmado', 'Orgulloso', 'Motivado', 'Optimista'] },
  tenso: { name: 'Tenso', hint: 'Desagradable · energía alta', color: '#FF6B81', labels: ['Ansioso', 'Enojado', 'Estresado', 'Frustrado', 'Preocupado', 'Irritado'] },
  apagado: { name: 'Apagado', hint: 'Desagradable · energía baja', color: '#6F8FE8', labels: ['Triste', 'Cansado', 'Solo', 'Desanimado', 'Aburrido', 'Decepcionado'] },
  sereno: { name: 'Sereno', hint: 'Agradable · energía baja', color: '#7FD6B8', labels: ['Tranquilo', 'Agradecido', 'Contento', 'Relajado', 'En paz', 'Satisfecho'] },
};

export const QUADRANT_ORDER: QuadrantId[] = ['animado', 'sereno', 'apagado', 'tenso'];

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function quadrantOf(m: Mood): QuadrantId {
  if (m.valence >= 0) return m.energy >= 0 ? 'animado' : 'sereno';
  return m.energy >= 0 ? 'tenso' : 'apagado';
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Valencia -1..1 → puntuación 1..10 (con un decimal). */
export const scoreFromValence = (v: number) => Math.round((1 + ((clamp(v, -1, 1) + 1) / 2) * 9) * 10) / 10;
