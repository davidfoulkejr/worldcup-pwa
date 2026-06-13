// Loads the normalized fixtures into the running app.
//
// Strategy:
//   1. The build step bakes the latest normalized JSON into the bundle as a
//      static asset, so the very first paint has data even with no network.
//   2. Once the app is up we kick off a background fetch of the upstream
//      openfootball JSON, normalize it, and swap in the fresh copy if it
//      differs. The service worker handles the offline-cache layer for us.

import { normalizeTournament, type Tournament } from "@worldcup/data";
import type { RawTournament } from "@worldcup/data";
import bakedRaw from "@worldcup/data/fixtures.json";

const UPSTREAM =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

/** The fixtures we shipped with this build — normalized at build time. */
export function loadBakedTournament(): Tournament {
  const raw = bakedRaw as unknown as Tournament;
  return rehydrate(raw);
}

/** Fetches upstream + normalizes; resolves to a fresh Tournament or throws. */
export async function fetchLatestTournament(
  signal?: AbortSignal,
): Promise<Tournament> {
  const opts: RequestInit = { cache: "no-store" };
  if (signal) opts.signal = signal;
  const res = await fetch(UPSTREAM, opts);
  if (!res.ok) throw new Error(`Upstream fetch failed: ${res.status}`);
  const raw = (await res.json()) as RawTournament;
  return normalizeTournament(raw);
}

/** Restore Date objects on the kickoff field after JSON deserialization. */
function rehydrate(t: Tournament): Tournament {
  return {
    ...t,
    matches: t.matches.map((m) => ({
      ...m,
      kickoff: { ...m.kickoff, utc: new Date(m.kickoff.utc) },
    })),
  };
}
