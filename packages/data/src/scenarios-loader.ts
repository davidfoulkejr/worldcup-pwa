import bakedScenarios from "../data/scenarios/latest.json";

export interface TeamOption {
  team: string;
  probability: number;
}

export interface MatchupOption {
  team1: string;
  team2: string;
  probability: number;
}

export interface R32MatchScenario {
  match_num: number;
  date: string;
  time: string;
  ground: string;
  slot1: string;
  slot2: string;
  team1_options: TeamOption[];
  team2_options: TeamOption[];
  matchup_options: MatchupOption[];
  most_likely_matchup?: MatchupOption;
  confidence?: number;
}

export interface Scenarios {
  generated_at: string;
  version: string;
  simulations: number;
  model: string;
  fixtures_source: string;
  ratings_source: string;
  rating_fallback: number;
  missing_rating_teams: string[];
  r32_matches: R32MatchScenario[];
}

/** Scenario snapshot bundled at build time from packages/data/data/scenarios/latest.json. */
export function loadBakedScenarios(): Scenarios {
  return bakedScenarios as Scenarios;
}

/** Runtime override: fetch a newer scenarios file if your host exposes one. */
export async function fetchScenarios(path: string): Promise<Scenarios> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load scenarios: ${response.statusText}`);
  }
  return (await response.json()) as Scenarios;
}

export function getMatchScenario(
  scenarios: Scenarios,
  matchNumber: number,
): R32MatchScenario | undefined {
  return scenarios.r32_matches.find((m) => m.match_num === matchNumber);
}

export function getPossibleOutcomes(scenario: R32MatchScenario): MatchupOption[] {
  if (scenario.matchup_options.length > 0) {
    return [...scenario.matchup_options].sort((a, b) => b.probability - a.probability);
  }

  const outcomes: MatchupOption[] = [];
  for (const t1 of scenario.team1_options) {
    for (const t2 of scenario.team2_options) {
      outcomes.push({
        team1: t1.team,
        team2: t2.team,
        probability: t1.probability * t2.probability,
      });
    }
  }
  return outcomes.sort((a, b) => b.probability - a.probability);
}

export function getMostLikelyMatchup(
  scenario: R32MatchScenario,
): MatchupOption | null {
  if (scenario.most_likely_matchup) {
    return scenario.most_likely_matchup;
  }
  const outcomes = getPossibleOutcomes(scenario);
  return outcomes[0] ?? null;
}

export function getMatchConfidence(scenario: R32MatchScenario): number {
  if (typeof scenario.confidence === "number") {
    return scenario.confidence;
  }
  return getMostLikelyMatchup(scenario)?.probability ?? 0;
}

export function formatMatchupDisplay(scenario: R32MatchScenario): string {
  const matchup = getMostLikelyMatchup(scenario);
  if (!matchup) return "TBD";

  const pct = Math.round(getMatchConfidence(scenario) * 100);
  if (pct < 100) return `${matchup.team1} vs ${matchup.team2} (${pct}%)`;
  return `${matchup.team1} vs ${matchup.team2}`;
}
