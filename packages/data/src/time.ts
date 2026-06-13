import type { Kickoff } from "./model.js";

/**
 * Parse an openfootball kickoff like:
 *   date "2026-06-11", time "13:00 UTC-6"
 * into a Kickoff with both the local wall-clock and the absolute UTC instant.
 */
export function parseKickoff(date: string, time: string): Kickoff {
  const match = /^(\d{2}):(\d{2})(?:\s+UTC([+-]\d{1,2})(?::?(\d{2}))?)?$/
    .exec(time.trim());
  if (!match) {
    throw new Error(`Cannot parse time string: "${time}"`);
  }
  const [, hh, mm, offHours, offMins] = match;
  const localTime = `${hh}:${mm}`;
  const offsetHours = offHours ? Number(offHours) : 0;
  const offsetMins = offMins ? Number(offMins) * Math.sign(offsetHours || 1) : 0;
  const utcOffset = offHours
    ? `UTC${offHours}${offMins ? `:${offMins}` : ""}`
    : "UTC";

  // Build an ISO string that JS parses as the local wall-clock + offset.
  const sign = offsetHours >= 0 ? "+" : "-";
  const absH = String(Math.abs(offsetHours)).padStart(2, "0");
  const absM = String(Math.abs(offsetMins)).padStart(2, "0");
  const iso = `${date}T${hh}:${mm}:00${sign}${absH}:${absM}`;
  const utc = new Date(iso);
  if (Number.isNaN(utc.getTime())) {
    throw new Error(`Failed to build Date from "${iso}"`);
  }

  return { localDate: date, localTime, utcOffset, utc };
}
