export const TZ_COOKIE = "devboard_tz";

export function isValidTz(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();

/** YYYY-MM-DD of an instant as seen on the wall clock in `tz`. */
export function dayKey(when: Date | string | number, tz = "UTC"): string {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    fmtCache.set(tz, f);
  }
  return f.format(new Date(when));
}

/** Shift a YYYY-MM-DD key by whole days (calendar arithmetic, DST-proof). */
export function shiftDay(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday (YYYY-MM-DD) of the week containing `key`. */
export function weekStartKey(key: string): string {
  const dow = new Date(`${key}T00:00:00Z`).getUTCDay();
  return shiftDay(key, -((dow + 6) % 7));
}
