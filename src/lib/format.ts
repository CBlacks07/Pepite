// Formats français, montants en francs CFA, dates à l'heure de Lomé (UTC).

import { DRAW } from '@/lib/rules';

const NB = ' ';
const group = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function num(n: number): string {
  return group.format(n).replace(/[\s ]/g, NB);
}

export function fcfa(n: number): string {
  return `${num(n)}${NB}F${NB}CFA`;
}

export function per(frequency: 'weekly' | 'monthly'): string {
  return frequency === 'weekly' ? 'par semaine' : 'par mois';
}

export function plural(n: number, one: string, many: string): string {
  return `${num(n)} ${n > 1 ? many : one}`;
}

/** "2026-11-27" -> Date à minuit UTC (Lomé est à UTC toute l'année). */
export function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...opts });
const longDay = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const shortDay = fmt({ day: 'numeric', month: 'short' });
const monthYear = fmt({ month: 'long', year: 'numeric' });
const dayNum = fmt({ day: 'numeric' });

export const dateLong = (day: string) => longDay.format(parseDay(day));
export const dateShort = (day: string) => shortDay.format(parseDay(day));
export const dayOfMonth = (day: string) => dayNum.format(parseDay(day));
export const monthOf = (iso: string) => monthYear.format(new Date(iso));

export function todayLome(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function relative(iso: string): string {
  const days = Math.floor((Date.parse(todayLome()) - Date.parse(new Date(iso).toISOString().slice(0, 10))) / 864e5);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  return shortDay.format(new Date(iso));
}

/** Numéro de ticket "48 213". */
export function ticketNo(n: number): string {
  const s = String(n);
  return `${s.slice(0, 2)}${NB}${s.slice(2)}`;
}

/** Temps restant avant le tirage du dimanche (Lomé = UTC). */
export function countdown(drawOn: string, now = Date.now()): { short: string; long: string } {
  const target = Date.parse(`${drawOn}T${String(DRAW.hour).padStart(2, '0')}:00:00Z`);
  const ms = Math.max(0, target - now);
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  const pad = (x: number) => String(x).padStart(2, '0');
  if (d > 0) return { short: `Tirage dans ${d} j ${pad(h)} h`, long: `${d} j ${pad(h)} h ${pad(m)} min` };
  return { short: `Tirage dans ${h} h ${pad(m)} min`, long: `${h} h ${pad(m)} min` };
}

export function initial(name: string | null | undefined): string {
  return (name ?? '?').trim().charAt(0).toUpperCase() || '?';
}
