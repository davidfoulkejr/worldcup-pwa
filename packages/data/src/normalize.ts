import type {
  GroupLetter,
  Match,
  Stage,
  Tournament,
  Venue,
} from "./model.js";
import type { RawMatch, RawScore, RawTournament } from "./raw-schema.js";
import { parseTeamSlot, GROUP_LETTERS } from "./teams.js";
import { parseVenue } from "./venues.js";
import { parseKickoff } from "./time.js";

const KNOCKOUT_ROUNDS = new Set([
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Match for third place",
  "Final",
]);

/** Pure transform: raw openfootball JSON → normalized Tournament. */
export function normalizeTournament(raw: RawTournament): Tournament {
  // First pass: count matchday positions so group-stage matches get a stable id.
  const matchdayCursor = new Map<string, number>();
  const matches: Match[] = raw.matches.map((m) => {
    const stage = parseStage(m);
    const venue = parseVenue(m.ground);
    const kickoff = parseKickoff(m.date, m.time);
    const team1 = parseTeamSlot(m.team1);
    const team2 = parseTeamSlot(m.team2);
    const id = buildId(stage, m, matchdayCursor);

    const match: Match = {
      id,
      stage,
      team1,
      team2,
      venue,
      kickoff,
      goals1: (m.goals1 ?? []).map((g) => ({
        scorer: g.name,
        minute: g.minute,
        ownGoal: g.owngoal === true,
        penalty: g.penalty === true,
      })),
      goals2: (m.goals2 ?? []).map((g) => ({
        scorer: g.name,
        minute: g.minute,
        ownGoal: g.owngoal === true,
        penalty: g.penalty === true,
      })),
      hasConfirmedTeams: team1.kind === "team" && team2.kind === "team",
    };
    const score = mapScore(m.score);
    if (score) match.score = score;
    return match;
  });

  matches.sort((a, b) => a.kickoff.utc.getTime() - b.kickoff.utc.getTime());

  return {
    name: raw.name,
    matches,
    venues: distinctVenues(matches),
    nations: distinctNations(matches),
    groups: distinctGroups(matches),
  };
}

function parseStage(m: RawMatch): Stage {
  if (m.group) {
    const letter = m.group.replace(/^Group\s+/, "") as GroupLetter;
    const matchday = matchdayNumber(m.round);
    if (matchday == null) {
      throw new Error(
        `Group-stage match has unexpected round: "${m.round}"`,
      );
    }
    return { kind: "group", group: letter, matchday };
  }
  if (!KNOCKOUT_ROUNDS.has(m.round)) {
    throw new Error(`Unknown round: "${m.round}"`);
  }
  if (m.num == null) {
    throw new Error(`Knockout match missing num: ${JSON.stringify(m)}`);
  }
  return {
    kind: "knockout",
    round: m.round as Stage extends { kind: "knockout"; round: infer R }
      ? R
      : never,
    matchNum: m.num,
  };
}

function matchdayNumber(round: string): number | null {
  const m = /^Matchday\s+(\d+)$/.exec(round);
  return m && m[1] ? Number(m[1]) : null;
}

function buildId(
  stage: Stage,
  raw: RawMatch,
  cursor: Map<string, number>,
): string {
  if (stage.kind === "knockout") return `ko-${stage.matchNum}`;
  // Group-stage matches have no num; use a per-group-per-matchday counter.
  const key = `${stage.group}-${stage.matchday}`;
  const next = (cursor.get(key) ?? 0) + 1;
  cursor.set(key, next);
  return `g-${stage.group}-md${stage.matchday}-${next}`;
}

function mapScore(s: RawScore | undefined) {
  if (!s) return undefined;
  const out: NonNullable<Match["score"]> = { fullTime: s.ft };
  if (s.ht) out.halfTime = s.ht;
  if (s.et) out.extraTime = s.et;
  if (s.p)  out.penalties = s.p;
  return out;
}

function distinctVenues(matches: Match[]): Venue[] {
  const byMetro = new Map<string, Venue>();
  for (const m of matches) {
    if (!byMetro.has(m.venue.metro)) byMetro.set(m.venue.metro, m.venue);
  }
  return [...byMetro.values()].sort((a, b) =>
    a.metro.localeCompare(b.metro),
  );
}

function distinctNations(matches: Match[]): string[] {
  const set = new Set<string>();
  for (const m of matches) {
    if (m.team1.kind === "team") set.add(m.team1.name);
    if (m.team2.kind === "team") set.add(m.team2.name);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function distinctGroups(matches: Match[]) {
  const present = new Set<GroupLetter>();
  for (const m of matches) {
    if (m.stage.kind === "group") present.add(m.stage.group);
  }
  return GROUP_LETTERS.filter((g) => present.has(g));
}
