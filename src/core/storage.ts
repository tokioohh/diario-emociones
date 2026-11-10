import { Directory, File, Paths } from 'expo-file-system';
import { DEFAULT_SETTINGS, type Deliverable, type MonthFile, type Settings } from './types';

// Todo vive en <documentDirectory>/diary/: settings.json, YYYY-MM.json e inbox/ (entradas del reloj).
const root = () => new Directory(Paths.document, 'diary');

function ensureRoot() {
  const d = root();
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

function readJson<T>(file: File): T | null {
  try {
    return file.exists ? (JSON.parse(file.textSync()) as T) : null;
  } catch {
    return null; // archivo corrupto: se ignora en vez de tumbar la app
  }
}

function writeJson(file: File, data: unknown) {
  if (!file.exists) file.create({ intermediates: true });
  file.write(JSON.stringify(data));
}

export function loadSettings(): Settings {
  const s = readJson<Settings>(new File(ensureRoot(), 'settings.json'));
  return s ? { ...DEFAULT_SETTINGS, ...s, reminder: { ...DEFAULT_SETTINGS.reminder, ...s.reminder } } : DEFAULT_SETTINGS;
}

export function saveSettings(s: Settings) {
  writeJson(new File(ensureRoot(), 'settings.json'), s);
}

export function loadAllMonths(): MonthFile[] {
  const out: MonthFile[] = [];
  for (const f of ensureRoot().list()) {
    if (f instanceof File && /^\d{4}-\d{2}\.json$/.test(f.name)) {
      const m = readJson<MonthFile>(f);
      if (m && Array.isArray(m.entries)) out.push(m);
    }
  }
  return out;
}

export function saveMonth(m: MonthFile) {
  writeJson(new File(ensureRoot(), `${m.month}.json`), m);
}

export function loadDeliverables(): Deliverable[] {
  const saved = readJson<{ version: 1; deliverables: Deliverable[] }>(new File(ensureRoot(), 'planner.json'));
  return saved && Array.isArray(saved.deliverables) ? saved.deliverables : [];
}

export function saveDeliverables(deliverables: Deliverable[]) {
  writeJson(new File(ensureRoot(), 'planner.json'), { version: 1, deliverables });
}

export type InboxItem = { file: File; raw: unknown };

/** Lee (sin borrar) las entradas que dejó el servicio nativo del reloj. */
export function readInbox(): InboxItem[] {
  const dir = new Directory(Paths.document, 'diary', 'inbox');
  if (!dir.exists) return [];
  const items: InboxItem[] = [];
  for (const f of dir.list()) {
    if (f instanceof File && f.name.endsWith('.json')) {
      const raw = readJson<unknown>(f);
      items.push({ file: f, raw });
    }
  }
  return items;
}
