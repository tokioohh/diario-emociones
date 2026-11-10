export type Mood = { valence: number; energy: number }; // ambos en -1..1
export type QuadrantId = 'animado' | 'tenso' | 'apagado' | 'sereno';

export type Entry = {
  id: string;
  at: string; // ISO 8601 (UTC)
  day: string; // YYYY-MM-DD en hora local
  text: string;
  mood: Mood;
  labels: string[];
  source: 'phone' | 'watch';
};

export type DeliverableKind = 'proyecto' | 'examen' | 'tarea';

export type DeliverableStep = {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD en hora local
  completedAt: string | null;
  notificationId: string | null;
};

export type Deliverable = {
  id: string;
  title: string;
  kind: DeliverableKind;
  course: string;
  dueDate: string; // YYYY-MM-DD en hora local
  reminderHour: number;
  remindersEnabled: boolean;
  createdAt: string;
  completedAt: string | null;
  steps: DeliverableStep[];
};

export type DeliverableInput = Pick<Deliverable, 'title' | 'kind' | 'course' | 'dueDate' | 'reminderHour' | 'remindersEnabled'> & {
  stepTitles: string[];
};

export type DayClosing = {
  score: number; // 1..10
  headline: string;
  lines: string[];
  entryCount: number;
  closedAt: string;
};

export type MonthFile = {
  version: 1;
  month: string; // YYYY-MM
  entries: Entry[];
  closings: Record<string, DayClosing>;
};

export type Settings = {
  version: 1;
  lockEnabled: boolean;
  reminder: { enabled: boolean; hour: number; minute: number };
};

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  lockEnabled: false,
  reminder: { enabled: false, hour: 21, minute: 0 },
};
