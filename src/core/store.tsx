import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { dayKey, monthKey } from './dates';
import { applyReminder, cancelDeliverableReminders, cancelStepReminder, scheduleDeliverableReminders } from './notifications';
import { buildDeliverable, markStep, reviseDeliverable } from './planner';
import { loadAllMonths, loadDeliverables, loadSettings, readInbox, saveDeliverables, saveMonth, saveSettings } from './storage';
import { buildDaySummary, sortByTime } from './summary';
import { parseWatchEntry } from './watchInbox';
import type { DayClosing, Deliverable, DeliverableInput, Entry, Mood, Settings } from './types';

type State = { ready: boolean; settings: Settings; entries: Entry[]; closings: Record<string, DayClosing>; deliverables: Deliverable[] };

export type NewEntry = { text: string; mood: Mood; labels: string[] };

type Store = State & {
  addEntry: (e: NewEntry) => void;
  deleteEntry: (id: string) => void;
  closeDay: (day: string) => DayClosing | null;
  updateSettings: (patch: Partial<Settings>) => Promise<boolean>;
  entriesOf: (day: string) => Entry[];
  saveDeliverable: (input: DeliverableInput, id?: string) => Promise<boolean>;
  toggleDeliverableStep: (deliverableId: string, stepId: string) => Promise<boolean>;
  deleteDeliverable: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function persistMonths(months: string[], entries: Entry[], closings: Record<string, DayClosing>) {
  [...new Set(months)].forEach((month) =>
    saveMonth({
      version: 1,
      month,
      entries: entries.filter((e) => e.day.startsWith(month)),
      closings: Object.fromEntries(Object.entries(closings).filter(([d]) => d.startsWith(month))),
    }),
  );
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => ({ ready: false, settings: loadSettings(), entries: [], closings: {}, deliverables: loadDeliverables() }));
  const ref = useRef(state);
  const commit = useCallback((next: State, months: string[]) => {
    ref.current = next;
    setState(next);
    if (months.length) persistMonths(months, next.entries, next.closings);
  }, []);

  const commitDeliverables = useCallback((deliverables: Deliverable[]) => {
    const next = { ...ref.current, deliverables };
    ref.current = next;
    setState(next);
    saveDeliverables(deliverables);
  }, []);

  const importWatch = useCallback(() => {
    const items = readInbox();
    if (!items.length) return;
    const known = new Set(ref.current.entries.map((e) => e.id));
    const fresh = items.map((i) => parseWatchEntry(i.raw)).filter((e): e is Entry => !!e && !known.has(e.id));
    if (fresh.length) {
      const entries = sortByTime([...ref.current.entries, ...fresh]);
      commit({ ...ref.current, entries }, fresh.map((e) => monthKey(new Date(e.at))));
    }
    items.forEach((i) => {
      try {
        i.file.delete(); // se borra solo después de guardar el mes
      } catch {}
    });
  }, [commit]);

  useEffect(() => {
    const entries: Entry[] = [];
    const closings: Record<string, DayClosing> = {};
    loadAllMonths().forEach((m) => {
      entries.push(...m.entries);
      Object.assign(closings, m.closings);
    });
    commit({ ready: true, settings: ref.current.settings, entries: sortByTime(entries), closings, deliverables: ref.current.deliverables }, []);
    importWatch();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && importWatch());
    return () => sub.remove();
  }, [commit, importWatch]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      addEntry: ({ text, mood, labels }) => {
        const at = new Date();
        const entry: Entry = { id: newId(), at: at.toISOString(), day: dayKey(at), text: text.trim(), mood, labels, source: 'phone' };
        commit({ ...ref.current, entries: sortByTime([...ref.current.entries, entry]) }, [monthKey(at)]);
      },
      deleteEntry: (id) => {
        const target = ref.current.entries.find((e) => e.id === id);
        if (!target) return;
        commit({ ...ref.current, entries: ref.current.entries.filter((e) => e.id !== id) }, [target.day.slice(0, 7)]);
      },
      closeDay: (day) => {
        const list = ref.current.entries.filter((e) => e.day === day);
        if (!list.length) return null;
        const s = buildDaySummary(list);
        const closing: DayClosing = { ...s, entryCount: list.length, closedAt: new Date().toISOString() };
        commit({ ...ref.current, closings: { ...ref.current.closings, [day]: closing } }, [day.slice(0, 7)]);
        return closing;
      },
      updateSettings: async (patch) => {
        const settings = { ...ref.current.settings, ...patch };
        const ok = patch.reminder ? await applyReminder(settings.reminder) : true;
        if (!ok) settings.reminder = { ...settings.reminder, enabled: false };
        saveSettings(settings);
        commit({ ...ref.current, settings }, []);
        return ok;
      },
      entriesOf: (day) => state.entries.filter((e) => e.day === day),
      saveDeliverable: async (input, id) => {
        const existing = id ? ref.current.deliverables.find((item) => item.id === id) : undefined;
        if (existing) await cancelDeliverableReminders(existing);
        const created = existing ? reviseDeliverable(existing, input) : buildDeliverable(input);
        const next = existing
          ? ref.current.deliverables.map((item) => item.id === existing.id ? created : item)
          : [...ref.current.deliverables, created];
        commitDeliverables(next);
        const scheduled = await scheduleDeliverableReminders(created);
        const withReminders = next.map((item) => item.id === created.id ? scheduled.deliverable : item);
        commitDeliverables(withReminders);
        return scheduled.granted;
      },
      toggleDeliverableStep: async (deliverableId, stepId) => {
        const current = ref.current.deliverables.find((item) => item.id === deliverableId);
        const target = current?.steps.find((step) => step.id === stepId);
        if (!current || !target) return false;
        if (target.notificationId) {
          await cancelStepReminder(target.notificationId);
        }
        const completedAt = target.completedAt ? null : new Date().toISOString();
        const steps = markStep(current.steps, stepId, completedAt);
        const allDone = steps.length > 0 && steps.every((step) => step.completedAt);
        const updated: Deliverable = { ...current, steps, completedAt: allDone ? completedAt ?? new Date().toISOString() : null };
        commitDeliverables(ref.current.deliverables.map((item) => item.id === updated.id ? updated : item));
        if (completedAt || !updated.remindersEnabled) return true;
        const scheduled = await scheduleDeliverableReminders(updated);
        commitDeliverables(ref.current.deliverables.map((item) => item.id === updated.id ? scheduled.deliverable : item));
        return scheduled.granted;
      },
      deleteDeliverable: (id) => {
        const target = ref.current.deliverables.find((item) => item.id === id);
        if (!target) return;
        commitDeliverables(ref.current.deliverables.filter((item) => item.id !== id));
        void cancelDeliverableReminders(target);
      },
    }),
    [state, commit, commitDeliverables],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuera de StoreProvider');
  return v;
}
