import { addDays, dayKey, parseDay } from './dates';
import type { Deliverable, DeliverableInput, DeliverableKind, DeliverableStep } from './types';

const templates: Record<DeliverableKind, string[]> = {
  proyecto: ['Definir qué vas a entregar', 'Preparar un primer avance', 'Completar el proyecto', 'Revisar y entregar'],
  examen: ['Anotar los temas', 'Repasar los temas clave', 'Practicar preguntas', 'Repasar lo más difícil'],
  tarea: ['Definir el primer paso', 'Avanzar en la tarea', 'Revisar y entregar'],
};

const daysBetween = (from: string, to: string) => {
  const start = parseDay(from);
  const end = parseDay(to);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.round((endUtc - startUtc) / 86_400_000));
};

export function defaultStepTitles(kind: DeliverableKind, dueDate: string, today = dayKey(new Date())): string[] {
  const availableDays = daysBetween(today, dueDate);
  const full = templates[kind];
  if (availableDays === 0) return [kind === 'examen' ? 'Repasar lo más importante' : 'Dar el primer avance y revisar'];
  if (availableDays === 1) return [full[0], full[full.length - 1]];
  if (availableDays <= 3 && full.length > 3) return [full[0], full[Math.floor(full.length / 2)], full[full.length - 1]];
  return [...full];
}

export function scheduleStepDates(startDate: string, dueDate: string, count: number): string[] {
  if (count <= 0) return [];
  const totalDays = daysBetween(startDate, dueDate);
  if (count === 1) return [dueDate];
  return Array.from({ length: count }, (_, index) => dayKey(addDays(parseDay(startDate), Math.round((index * totalDays) / (count - 1)))));
}

export function buildDeliverable(input: DeliverableInput, now = new Date(), idFactory = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`): Deliverable {
  const createdDate = dayKey(now);
  const titles = input.stepTitles.map((title) => title.trim()).filter(Boolean);
  const safeTitles = titles.length ? titles : defaultStepTitles(input.kind, input.dueDate, createdDate);
  const dates = scheduleStepDates(createdDate, input.dueDate, safeTitles.length);
  return {
    id: idFactory(),
    title: input.title.trim(),
    kind: input.kind,
    course: input.course.trim(),
    dueDate: input.dueDate,
    reminderHour: input.reminderHour,
    remindersEnabled: input.remindersEnabled,
    createdAt: now.toISOString(),
    completedAt: null,
    steps: safeTitles.map((title, index) => ({ id: idFactory(), title, dueDate: dates[index], completedAt: null, notificationId: null })),
  };
}

export function reviseDeliverable(existing: Deliverable, input: DeliverableInput, now = new Date()): Deliverable {
  const fresh = buildDeliverable(input, now);
  const previousByIndex = existing.steps;
  const matchedIds = new Set<string>();
  const steps = fresh.steps.map((step, index) => ({
    ...step,
    ...(() => {
      const sameTitle = previousByIndex.find((previous) => !matchedIds.has(previous.id) && previous.title === step.title);
      const samePosition = previousByIndex.length === fresh.steps.length ? previousByIndex[index] : undefined;
      const previous = sameTitle ?? (samePosition && !matchedIds.has(samePosition.id) ? samePosition : undefined);
      if (previous) matchedIds.add(previous.id);
      return { id: previous?.id ?? step.id, completedAt: previous?.completedAt ?? null };
    })(),
    notificationId: null,
  }));
  const allDone = steps.length > 0 && steps.every((step) => step.completedAt);
  return {
    ...fresh,
    id: existing.id,
    createdAt: existing.createdAt,
    completedAt: allDone ? existing.completedAt ?? now.toISOString() : null,
    steps,
  };
}

export function completionPercent(steps: DeliverableStep[]): number {
  if (!steps.length) return 0;
  return Math.round((steps.filter((step) => step.completedAt).length / steps.length) * 100);
}

export function nextDeliverableStep(deliverable: Deliverable): DeliverableStep | null {
  if (deliverable.completedAt) return null;
  return deliverable.steps.find((step) => !step.completedAt) ?? null;
}

export function markStep(steps: DeliverableStep[], stepId: string, completedAt: string | null): DeliverableStep[] {
  return steps.map((step) => step.id === stepId ? { ...step, completedAt, notificationId: null } : step);
}
