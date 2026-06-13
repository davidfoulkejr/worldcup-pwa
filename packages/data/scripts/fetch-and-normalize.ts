// Fetches the latest openfootball 2026 fixtures, normalizes them, and
// writes both raw and normalized JSON snapshots into ./data.
//
// Usage:   npm run fetch

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeTournament } from "../src/normalize.js";
import type { RawTournament } from "../src/raw-schema.js";

const SOURCE =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

async function main() {
  await mkdir(dataDir, { recursive: true });

  console.log(`Fetching ${SOURCE}`);
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw = (await res.json()) as RawTournament;

  await writeFile(
    join(dataDir, "worldcup-2026.raw.json"),
    JSON.stringify(raw, null, 2),
    "utf8",
  );

  const tournament = normalizeTournament(raw);

  await writeFile(
    join(dataDir, "worldcup-2026.normalized.json"),
    JSON.stringify(tournament, null, 2),
    "utf8",
  );

  console.log("Snapshot written:");
  console.log(`  matches:  ${tournament.matches.length}`);
  console.log(`  venues:   ${tournament.venues.length}`);
  console.log(`  nations:  ${tournament.nations.length}`);
  console.log(`  groups:   ${tournament.groups.join(", ")}`);
  console.log(
    `  refreshed: ${new Date().toISOString()}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
