// Resolves knockout placeholder slots ("W73", "2A") to concrete team names
// as group standings settle and knockout results come in.
//
// This is intentionally a pure function over an array of matches so the UI
// can call it any time the data refreshes.

import type { GroupLetter, Match, TeamSlot } from "./model.js";

export interface BracketResolution {
  /** Same matches but with team slots resolved to concrete nations when known. */
  matches: Match[];
  /** How many knockout slots remain unresolved. */
  unresolvedSlots: number;
}

export function resolveBracket(matches: Match[]): BracketResolution {
  const winnerByNum = new Map<number, string>();
  const loserByNum = new Map<number, string>();

  // First pass: walk in kickoff order, capture winners/losers of completed matches.
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

  // Group standings (very simple — 3/1/0 points, GD then GF tiebreak).
  const standings = computeGroupStandings(matches);

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

interface Row {
  team: string;
  p: number; w: number; d: number; l: number;
  gf: number; ga: number; pts: number;
}

function computeGroupStandings(matches: Match[]) {
  const tables = new Map<GroupLetter, Map<string, Row>>();
  for (const m of matches) {
    if (m.stage.kind !== "group" || !m.score) continue;
    if (m.team1.kind !== "team" || m.team2.kind !== "team") continue;
    const g = m.stage.group;
    const table = tables.get(g) ?? new Map<string, Row>();
    tables.set(g, table);
    const a = table.get(m.team1.name) ?? blank(m.team1.name);
    const b = table.get(m.team2.name) ?? blank(m.team2.name);
    const [s1, s2] = m.score.fullTime;
    a.p++; b.p++;
    a.gf += s1; a.ga += s2;
    b.gf += s2; b.ga += s1;
    if (s1 > s2) { a.w++; b.l++; a.pts += 3; }
    else if (s1 < s2) { b.w++; a.l++; b.pts += 3; }
    else { a.d++; b.d++; a.pts++; b.pts++; }
    table.set(a.team, a); table.set(b.team, b);
  }
  const ordered = new Map<GroupLetter, string[]>();
  for (const [g, table] of tables) {
    ordered.set(
      g,
      [...table.values()]
        .sort((x, y) =>
          y.pts - x.pts ||
          (y.gf - y.ga) - (x.gf - x.ga) ||
          y.gf - x.gf ||
          x.team.localeCompare(y.team),
        )
        .map((r) => r.team),
    );
  }
  return ordered;
}

function blank(team: string): Row {
  return { team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
}

function nameOrNull(s: TeamSlot): string | null {
  return s.kind === "team" ? s.name : null;
}

/** Use penalties → ET → FT for knockout decisiveness. */
function decisiveScore(m: Match): [number, number] {
  if (!m.score) return [0, 0];
  return m.score.penalties ?? m.score.extraTime ?? m.score.fullTime;
}
