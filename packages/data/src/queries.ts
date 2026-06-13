// Common query helpers — the building blocks for the UI's filter/sort UX.

import type { GroupLetter, Match, Tournament } from "./model.js";

export interface MatchFilter {
  cities?: string[];           // matched against venue.metro
  countries?: ("USA" | "Mexico" | "Canada")[];
  groups?: GroupLetter[];
  nations?: string[];          // any team in the match must be one of these
  from?: Date;                 // kickoff.utc >= from
  to?: Date;                   // kickoff.utc <= to
  stages?: ("group" | "knockout")[];
  hasConfirmedTeamsOnly?: boolean;
}

export type SortKey =
  | "kickoff"
  | "city"
  | "group"
  | "stage";

export function filterMatches(t: Tournament, f: MatchFilter = {}): Match[] {
  const cities = setOrNull(f.cities);
  const countries = setOrNull(f.countries);
  const groups = setOrNull(f.groups);
  const nations = setOrNull(f.nations);
  const stages = setOrNull(f.stages);

  return t.matches.filter((m) => {
    if (cities && !cities.has(m.venue.metro)) return false;
    if (countries && !countries.has(m.venue.country)) return false;
    if (stages && !stages.has(m.stage.kind)) return false;
    if (groups) {
      if (m.stage.kind !== "group" || !groups.has(m.stage.group)) return false;
    }
    if (nations) {
      const t1 = m.team1.kind === "team" ? m.team1.name : null;
      const t2 = m.team2.kind === "team" ? m.team2.name : null;
      if (!((t1 && nations.has(t1)) || (t2 && nations.has(t2)))) return false;
    }
    if (f.from && m.kickoff.utc < f.from) return false;
    if (f.to && m.kickoff.utc > f.to) return false;
    if (f.hasConfirmedTeamsOnly && !m.hasConfirmedTeams) return false;
    return true;
  });
}

export function sortMatches(matches: Match[], key: SortKey): Match[] {
  const copy = [...matches];
  switch (key) {
    case "kickoff":
      return copy.sort(
        (a, b) => a.kickoff.utc.getTime() - b.kickoff.utc.getTime(),
      );
    case "city":
      return copy.sort((a, b) =>
        a.venue.metro.localeCompare(b.venue.metro) ||
        a.kickoff.utc.getTime() - b.kickoff.utc.getTime(),
      );
    case "group":
      return copy.sort((a, b) => {
        const ga = a.stage.kind === "group" ? a.stage.group : "~";
        const gb = b.stage.kind === "group" ? b.stage.group : "~";
        return ga.localeCompare(gb) ||
          a.kickoff.utc.getTime() - b.kickoff.utc.getTime();
      });
    case "stage":
      return copy.sort((a, b) =>
        stageRank(a) - stageRank(b) ||
        a.kickoff.utc.getTime() - b.kickoff.utc.getTime(),
      );
  }
}

const STAGE_ORDER: Record<string, number> = {
  group: 0,
  "Round of 32": 1,
  "Round of 16": 2,
  "Quarter-final": 3,
  "Semi-final": 4,
  "Match for third place": 5,
  Final: 6,
};

function stageRank(m: Match): number {
  if (m.stage.kind === "group") return STAGE_ORDER.group ?? 0;
  return STAGE_ORDER[m.stage.round] ?? 99;
}

function setOrNull<T>(arr: readonly T[] | undefined): Set<T> | null {
  return arr && arr.length > 0 ? new Set(arr) : null;
}
