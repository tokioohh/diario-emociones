import { buildDeliverable, completionPercent, defaultStepTitles, markStep, nextDeliverableStep, reviseDeliverable, scheduleStepDates } from '../planner';
import type { DeliverableInput } from '../types';

const input: DeliverableInput = {
  title: 'Proyecto final', kind: 'proyecto', course: 'Software', dueDate: '2026-11-20', reminderHour: 18, remindersEnabled: true,
  stepTitles: ['Definir alcance', 'Hacer prototipo', 'Revisar'],
};

describe('deliverable planning', () => {
  it('suggests the most useful starter steps for each deliverable type and deadline', () => {
    expect(defaultStepTitles('examen', '2026-11-10', '2026-11-10')).toEqual(['Repasar lo más importante']);
    expect(defaultStepTitles('tarea', '2026-11-11', '2026-11-10')).toEqual(['Definir el primer paso', 'Revisar y entregar']);
    expect(defaultStepTitles('proyecto', '2026-11-20', '2026-11-10')).toHaveLength(4);
  });

  it('distributes milestones from today through the deadline, including both endpoints', () => {
    expect(scheduleStepDates('2026-11-10', '2026-11-16', 4)).toEqual(['2026-11-10', '2026-11-12', '2026-11-14', '2026-11-16']);
    expect(scheduleStepDates('2026-11-10', '2026-11-10', 1)).toEqual(['2026-11-10']);
    expect(scheduleStepDates('2026-11-10', '2026-11-10', 0)).toEqual([]);
  });

  it('creates a local deliverable with clear progress and next step', () => {
    let serial = 0;
    const plan = buildDeliverable(input, new Date(2026, 10, 10, 12), () => `id-${++serial}`);
    expect(plan.id).toBe('id-1');
    expect(plan.steps.map((step) => step.dueDate)).toEqual(['2026-11-10', '2026-11-15', '2026-11-20']);
    expect(completionPercent(plan.steps)).toBe(0);
    expect(nextDeliverableStep(plan)?.title).toBe('Definir alcance');
    const updated = markStep(plan.steps, plan.steps[0].id, '2026-11-10T13:00:00.000Z');
    expect(completionPercent(updated)).toBe(33);
    expect(nextDeliverableStep({ ...plan, steps: updated })?.title).toBe('Hacer prototipo');
  });

  it('preserves completed steps when editing and keeps a completed plan complete', () => {
    const plan = buildDeliverable(input, new Date(2026, 10, 10, 12));
    const completedSteps = plan.steps.map((step) => ({ ...step, completedAt: '2026-11-10T13:00:00.000Z' }));
    const completedPlan = { ...plan, steps: completedSteps, completedAt: '2026-11-10T13:00:00.000Z' };
    const revised = reviseDeliverable(completedPlan, { ...input, title: 'Proyecto final revisado' }, new Date(2026, 10, 11, 12));
    expect(revised.id).toBe(plan.id);
    expect(revised.title).toBe('Proyecto final revisado');
    expect(revised.completedAt).toBe(completedPlan.completedAt);
    expect(revised.steps.every((step) => step.completedAt)).toBe(true);
    expect(completionPercent(revised.steps)).toBe(100);
    expect(nextDeliverableStep(revised)).toBeNull();
  });

  it('does not transfer a completed state when a neighboring step is removed', () => {
    const plan = buildDeliverable(input, new Date(2026, 10, 10, 12));
    const withMiddleComplete = { ...plan, steps: markStep(plan.steps, plan.steps[1].id, '2026-11-12T13:00:00.000Z') };
    const revised = reviseDeliverable(withMiddleComplete, { ...input, stepTitles: ['Definir alcance', 'Revisar'] });
    expect(revised.steps.map((step) => [step.title, !!step.completedAt])).toEqual([
      ['Definir alcance', false],
      ['Revisar', false],
    ]);
  });
});
