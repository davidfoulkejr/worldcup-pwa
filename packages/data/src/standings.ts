// Group-stage standings: simple 3 / 1 / 0 points with goal-difference and
// goals-for tiebreakers. Matches with no score or with unresolved teams are
// ignored so the table reflects only completed, confirmed fixtures.

import type { GroupLetter, Match } from "./model.js";
import { GROUP_LETTERS } from "./teams.js";

export interface StandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupTable {
  group: GroupLetter;
  rows: StandingRow[];
  /** True if every team in the group has finished their three games. */
  complete: boolean;
}

/**
 * Build standings for every group present in the schedule.
 * Always emits an entry for each group in `GROUP_LETTERS`; pre-tournament
 * rows are empty (all zeros) so the UI can render the table header + names.
 */
export function computeAllStandings(matches: Match[]): GroupTable[] {
  const tables = new Map<GroupLetter, Map<string, StandingRow>>();
  // Seed every team that appears in any group-stage fixture so the table has
  // all rows even before any matches are played.
  for (const m of matches) {
    if (m.stage.kind !== "group") continue;
    const t = tables.get(m.stage.group) ?? new Map<string, StandingRow>();
    if (m.team1.kind === "team" && !t.has(m.team1.name)) {
      t.set(m.team1.name, blank(m.team1.name));
    }
    if (m.team2.kind === "team" && !t.has(m.team2.name)) {
      t.set(m.team2.name, blank(m.team2.name));
    }
    tables.set(m.stage.group, t);
  }
  for (const m of matches) {
    if (m.stage.kind !== "group" || !m.score) continue;
    if (m.team1.kind !== "team" || m.team2.kind !== "team") continue;
    const table = tables.get(m.stage.group)!;
    const a = table.get(m.team1.name)!;
    const b = table.get(m.team2.name)!;
    const [s1, s2] = m.score.fullTime;
    a.played++; b.played++;
    a.goalsFor += s1; a.goalsAgainst += s2;
    b.goalsFor += s2; b.goalsAgainst += s1;
    if (s1 > s2) { a.won++; b.lost++; a.points += 3; }
    else if (s1 < s2) { b.won++; a.lost++; b.points += 3; }
    else { a.drawn++; b.drawn++; a.points++; b.points++; }
  }
  for (const t of tables.values()) {
    for (const r of t.values()) {
      r.goalDifference = r.goalsFor - r.goalsAgainst;
    }
  }
  return GROUP_LETTERS.flatMap((g) => {
    const table = tables.get(g);
    if (!table) return [];
    const rows = [...table.values()].sort(compareRows);
    const complete = rows.length === 4 && rows.every((r) => r.played === 3);
    return [{ group: g, rows, complete }];
  });
}

/** Convenience: just the ordered team names per group (for bracket resolution). */
export function teamOrderByGroup(matches: Match[]): Map<GroupLetter, string[]> {
  const out = new Map<GroupLetter, string[]>();
  for (const t of computeAllStandings(matches)) {
    out.set(t.group, t.rows.map((r) => r.team));
  }
  return out;
}

function compareRows(x: StandingRow, y: StandingRow): number {
  return (
    y.points - x.points ||
    y.goalDifference - x.goalDifference ||
    y.goalsFor - x.goalsFor ||
    x.team.localeCompare(y.team)
  );
}

function blank(team: string): StandingRow {
  return {
    team,
    played: 0, won: 0, drawn: 0, lost: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
  };
}
