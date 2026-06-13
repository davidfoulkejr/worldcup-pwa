# World Cup 2026 — Data Model

A TypeScript data model + loader for World Cup 2026 fixtures, sourced from
[openfootball/worldcup.json](https://github.com/openfootball/worldcup.json).

Designed for filtering and sorting fixtures by host city, group, nation,
date/time, or stage.

## Layout

```
src/
  raw-schema.ts   Raw openfootball JSON types (1:1 mirror)
  model.ts        Normalized domain model (Match, Venue, TeamSlot, Stage, ...)
  venues.ts       "Boston (Foxborough)" -> metro + suburb + country + slug
  teams.ts        Resolves "2A" / "W101" placeholders to a TeamSlot
  time.ts         "13:00 UTC-6" -> Kickoff with local + UTC instant
  normalize.ts    Pure transform: RawTournament -> Tournament
  bracket.ts      Fills in knockout placeholders as results come in
  queries.ts      filterMatches() + sortMatches() helpers for the UI
  index.ts        Public surface

scripts/
  fetch-and-normalize.ts   Fetch upstream JSON, write data/ snapshots
  demo-queries.ts          Eyeball common queries end-to-end

data/                       Generated snapshots (gitignored in real life)
```

## Usage

```bash
npm install
npm run fetch     # downloads + normalizes upstream data
npm run demo      # runs a series of example queries
npm test          # runs unit tests for the normalizer
```

## Core types

A normalized `Match` looks like:

```ts
{
  id: "g-A-md1-1",
  stage: { kind: "group", group: "A", matchday: 1 },
  team1: { kind: "team", name: "Mexico" },
  team2: { kind: "team", name: "South Africa" },
  venue: {
    raw: "Mexico City",
    metro: "Mexico City",
    suburb: undefined,
    slug: "mexico-city",
    country: "Mexico",
  },
  kickoff: {
    localDate: "2026-06-11",
    localTime: "13:00",
    utcOffset: "UTC-6",
    utc: Date("2026-06-11T19:00:00.000Z"),
  },
  score: { fullTime: [2, 0], halfTime: [1, 0] },
  goals1: [{ scorer: "Julián Quiñones", minute: "9", ... }, ...],
  goals2: [],
  hasConfirmedTeams: true,
}
```

Knockout matches initially carry `TeamSlot` placeholders:

```ts
{ kind: "groupRank", group: "A", rank: 2 }   // "2A"
{ kind: "matchWinner", matchNum: 101 }       // "W101"
```

Call `resolveBracket(matches)` to fill those in as group standings finalize
and knockout results arrive.

## Filter & sort

```ts
import { normalizeTournament, filterMatches, sortMatches } from "./src";

const t = normalizeTournament(raw);

// Every match in Boston, chronologically.
sortMatches(filterMatches(t, { cities: ["Boston"] }), "kickoff");

// USA group-stage games.
filterMatches(t, { nations: ["United States"], stages: ["group"] });

// Everything happening on a given weekend.
filterMatches(t, {
  from: new Date("2026-06-19T00:00:00Z"),
  to:   new Date("2026-06-22T00:00:00Z"),
});
```
