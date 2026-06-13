// Walks through the filter/sort helpers with realistic queries so we can
// eyeball the model end-to-end. Run after `npm run fetch`.
//
// Usage:   npm run demo

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeTournament } from "../src/normalize.js";
import { filterMatches, sortMatches } from "../src/queries.js";
import { resolveBracket } from "../src/bracket.js";
import { formatSlot } from "../src/teams.js";
import type { Match } from "../src/model.js";
import type { RawTournament } from "../src/raw-schema.js";

const here = dirname(fileURLToPath(import.meta.url));
const rawPath = join(here, "..", "data", "worldcup-2026.raw.json");

async function main() {
  const raw = JSON.parse(await readFile(rawPath, "utf8")) as RawTournament;
  const t = normalizeTournament(raw);
  const { matches, unresolvedSlots } = resolveBracket(t.matches);
  const resolved = { ...t, matches };

  banner("Tournament snapshot");
  console.log(`  ${resolved.matches.length} matches across ${resolved.venues.length} host cities`);
  console.log(`  ${resolved.nations.length} confirmed nations`);
  console.log(`  ${unresolvedSlots} knockout slots still pending`);

  banner("All Boston (Foxborough) matches");
  const boston = sortMatches(
    filterMatches(resolved, { cities: ["Boston"] }),
    "kickoff",
  );
  printMatches(boston);

  banner("USA matches in Group D, chronological");
  const usaGroupD = sortMatches(
    filterMatches(resolved, { nations: ["United States"], groups: ["D"] }),
    "kickoff",
  );
  printMatches(usaGroupD);

  banner("First 5 knockout fixtures");
  const knockouts = sortMatches(
    filterMatches(resolved, { stages: ["knockout"] }),
    "kickoff",
  ).slice(0, 5);
  printMatches(knockouts);

  banner("Mexican host cities only, grouped by city");
  const mexico = sortMatches(
    filterMatches(resolved, { countries: ["Mexico"] }),
    "city",
  );
  printMatches(mexico);
}

function banner(title: string) {
  console.log(`\n=== ${title} ===`);
}

function printMatches(matches: Match[]) {
  if (matches.length === 0) {
    console.log("  (none)");
    return;
  }
  for (const m of matches) {
    const t1 = formatSlot(m.team1);
    const t2 = formatSlot(m.team2);
    const score = m.score
      ? ` ${m.score.fullTime[0]}-${m.score.fullTime[1]}`
      : "";
    const stage =
      m.stage.kind === "group"
        ? `Group ${m.stage.group} · MD${m.stage.matchday}`
        : `${m.stage.round} #${m.stage.matchNum}`;
    const venue = m.venue.suburb
      ? `${m.venue.metro} (${m.venue.suburb})`
      : m.venue.metro;
    console.log(
      `  ${m.kickoff.localDate} ${m.kickoff.localTime} ${m.kickoff.utcOffset}  ` +
      `${t1} v ${t2}${score}  ·  ${stage}  ·  ${venue}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
