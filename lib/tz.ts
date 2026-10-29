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

/**
 * Window for re-counting days after `sinceISO`. Incremental syncs only fetch new commits, but a
 * day's count must be rebuilt from *all* its commits, so the query starts a day and a half early
 * (enough for any UTC offset) and only days from `firstDay` on are written back.
 */
export function recountWindow(sinceISO: string, tz: string) {
  return {
    queryFrom: new Date(new Date(sinceISO).getTime() - 36 * 3600_000).toISOString(),
    firstDay: dayKey(sinceISO, tz),
  };
}

const hourFmtCache = new Map<string, Intl.DateTimeFormat>();

/** Weekday (0 = Monday) and hour (0-23) of an instant on the wall clock in `tz`. */
export function weekdayHour(when: Date | string | number, tz = "UTC"): { day: number; hour: number } {
  let f = hourFmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", hourCycle: "h23" });
    hourFmtCache.set(tz, f);
  }
  const parts = f.formatToParts(new Date(when));
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  return { day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd), hour };
}
