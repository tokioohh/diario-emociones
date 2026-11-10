const pad = (n: number) => String(n).padStart(2, '0');

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d: Date) => dayKey(d).slice(0, 7);
export const parseDay = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};
/** Lunes de la semana que contiene d. */
export const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
export const formatLong = (d: Date) => `${d.getDate()} de ${MESES[d.getMonth()]}`;
export const formatShort = (d: Date) => `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`;
export const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const pad2 = pad;
