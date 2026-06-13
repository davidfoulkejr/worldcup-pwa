// Resolves knockout placeholder slots ("W73", "2A") to concrete team names
// as group standings settle and knockout results come in.
//
// This is intentionally a pure function over an array of matches so the UI
// can call it any time the data refreshes.

import type { GroupLetter, Match, TeamSlot } from "./model.js";
import { teamOrderByGroup } from "./standings.js";

export interface BracketResolution {
  /** Same matches but with team slots resolved to concrete nations when known. */
  matches: Match[];
  /** How many knockout slots remain unresolved. */
  unresolvedSlots: number;
}

export function resolveBracket(matches: Match[]): BracketResolution {
  const winnerByNum = new Map<number, string>();
  const loserByNum = new Map<number, string>();

  const inOrder = [...matches].sort(
    (a, b) => a.kickoff.utc.getTime() - b.kickoff.utc.getTime(),
  );
  for (const m of inOrder) {
    if (m.stage.kind !== "knockout" || !m.score) continue;
    const t1 = nameOrNull(m.team1);
    const t2 = nameOrNull(m.team2);
    if (!t1 || !t2) continue;
    const [s1, s2] = decisiveScore(m);
    if (s1 === s2) continue;
    const winner = s1 > s2 ? t1 : t2;
    const loser  = s1 > s2 ? t2 : t1;
    winnerByNum.set(m.stage.matchNum, winner);
    loserByNum.set(m.stage.matchNum, loser);
  }

  const standings = teamOrderByGroup(matches);

  let unresolved = 0;
  const resolved = matches.map((m) => {
    const t1 = resolve(m.team1, winnerByNum, loserByNum, standings);
    const t2 = resolve(m.team2, winnerByNum, loserByNum, standings);
    if (t1.kind !== "team") unresolved++;
    if (t2.kind !== "team") unresolved++;
    const next: Match = {
      ...m,
      team1: t1,
      team2: t2,
      hasConfirmedTeams: t1.kind === "team" && t2.kind === "team",
    };
    return next;
  });

  return { matches: resolved, unresolvedSlots: unresolved };
}

function resolve(
  slot: TeamSlot,
  winners: Map<number, string>,
  losers: Map<number, string>,
  standings: Map<GroupLetter, string[]>,
): TeamSlot {
  switch (slot.kind) {
    case "team":
    case "unknown":
      return slot;
    case "matchWinner": {
      const n = winners.get(slot.matchNum);
      return n ? { kind: "team", name: n } : slot;
    }
    case "matchLoser": {
      const n = losers.get(slot.matchNum);
      return n ? { kind: "team", name: n } : slot;
    }
    case "groupRank": {
      const table = standings.get(slot.group);
      const name = table?.[slot.rank - 1];
      return name ? { kind: "team", name } : slot;
    }
    case "thirdPlaceFrom": {
      // Pre-tournament we can't pick which one — and FIFA's "best 8 thirds"
      // assignment depends on which 8 of 12 groups produce qualifying 3rds.
      // Leave the slot as-is; the UI renders "3rd from A/B/C/D/F".
      return slot;
    }
  }
}

function nameOrNull(s: TeamSlot): string | null {
  return s.kind === "team" ? s.name : null;
}

/** Use penalties → ET → FT for knockout decisiveness. */
function decisiveScore(m: Match): [number, number] {
  if (!m.score) return [0, 0];
  return m.score.penalties ?? m.score.extraTime ?? m.score.fullTime;
}
