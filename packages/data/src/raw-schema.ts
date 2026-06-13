// Mirrors the openfootball/worldcup.json schema as published upstream.
// Keep these types in lockstep with the raw JSON; do not enrich here.
// Source: https://github.com/openfootball/worldcup.json

export interface RawTournament {
  name: string;
  matches: RawMatch[];
}

export interface RawMatch {
  round: string;
  num?: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  score?: RawScore;
  goals1?: RawGoal[];
  goals2?: RawGoal[];
}

export interface RawScore {
  ft: [number, number];
  ht?: [number, number];
  et?: [number, number];
  p?: [number, number];
}

export interface RawGoal {
  name: string;
  minute: string;
  score?: [number, number];
  owngoal?: boolean;
  penalty?: boolean;
}
