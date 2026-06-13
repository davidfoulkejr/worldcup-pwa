// Normalized domain model for the World Cup 2026 fixtures viewer.
// Designed for filtering/sorting by city, group, nation, and date/time.

export type GroupLetter =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export type KnockoutRound =
  | "Round of 32"
  | "Round of 16"
  | "Quarter-final"
  | "Semi-final"
  | "Match for third place"
  | "Final";

/** A match is either part of the group stage or the knockout bracket. */
export type Stage =
  | { kind: "group"; group: GroupLetter; matchday: number }
  | { kind: "knockout"; round: KnockoutRound; matchNum: number };

/**
 * A team slot may be a confirmed nation (group stage and later filled
 * knockout matches) or a placeholder pending bracket resolution.
 *
 *  - groupRank:       "1A" / "2A"       — finishing position in a group
 *  - thirdPlaceFrom:  "3A/B/C/D/F"      — 3rd-placed team from one of these
 *                                          groups (FIFA "best 8 thirds" rule)
 *  - matchWinner:     "W101"            — winner of a previous match
 *  - matchLoser:      "L101"            — loser of a previous match
 *                                          (used by 3rd-place playoff)
 */
export type TeamSlot =
  | { kind: "team"; name: string }
  | { kind: "groupRank"; group: GroupLetter; rank: number }
  | { kind: "thirdPlaceFrom"; candidateGroups: GroupLetter[] }
  | { kind: "matchWinner"; matchNum: number }
  | { kind: "matchLoser"; matchNum: number }
  | { kind: "unknown"; raw: string };

/** A host city / stadium pair. `metro` is what most users sort & filter by. */
export interface Venue {
  /** Display label as published, e.g. "Boston (Foxborough)". */
  raw: string;
  /** Metro area, e.g. "Boston", "New York/New Jersey", "Guadalajara". */
  metro: string;
  /** Stadium suburb if disambiguated, e.g. "Foxborough", "East Rutherford". */
  suburb: string | undefined;
  /** Stable slug for routes / filters: "boston", "new-york-new-jersey". */
  slug: string;
  /** Host country derived from the metro. */
  country: HostCountry;
}

export type HostCountry = "USA" | "Mexico" | "Canada";

export interface Kickoff {
  /** Wall-clock local date as published, e.g. "2026-06-11". */
  localDate: string;
  /** Wall-clock local time as published, e.g. "13:00". */
  localTime: string;
  /** IANA-style offset string for the venue, e.g. "UTC-6". */
  utcOffset: string;
  /** Absolute moment of kickoff. Sort matches by this for a true timeline. */
  utc: Date;
}

export interface Score {
  fullTime: [number, number];
  halfTime?: [number, number];
  extraTime?: [number, number];
  penalties?: [number, number];
}

export interface Goal {
  scorer: string;
  /** Minute as published (may include stoppage notation like "45+5"). */
  minute: string;
  ownGoal: boolean;
  penalty: boolean;
}

export interface Match {
  /** Stable id, derived from stage + matchNum or stage + matchday + index. */
  id: string;
  stage: Stage;
  team1: TeamSlot;
  team2: TeamSlot;
  venue: Venue;
  kickoff: Kickoff;
  score?: Score;
  goals1: Goal[];
  goals2: Goal[];
  /** True if both team slots resolve to a concrete nation. */
  hasConfirmedTeams: boolean;
}

export interface Tournament {
  name: string;
  matches: Match[];
  /** Distinct venues, derived from matches. Sorted by metro. */
  venues: Venue[];
  /** Distinct nations appearing in any confirmed team slot. */
  nations: string[];
  /** Group letters present, in order. */
  groups: GroupLetter[];
}
