import type { HostCountry, Venue } from "./model.js";

// Authoritative mapping from openfootball "ground" strings to host country.
// Source: openfootball/worldcup.json 2026 fixtures (16 host cities).
const COUNTRY_BY_METRO: Record<string, HostCountry> = {
  // USA — 11 venues
  Atlanta: "USA",
  Boston: "USA",
  Dallas: "USA",
  Houston: "USA",
  "Kansas City": "USA",
  "Los Angeles": "USA",
  Miami: "USA",
  "New York/New Jersey": "USA",
  Philadelphia: "USA",
  "San Francisco Bay Area": "USA",
  Seattle: "USA",
  // Mexico — 3 venues
  Guadalajara: "Mexico",
  "Mexico City": "Mexico",
  Monterrey: "Mexico",
  // Canada — 2 venues
  Toronto: "Canada",
  Vancouver: "Canada",
};

/** "Boston (Foxborough)" → metro "Boston", suburb "Foxborough". */
export function parseVenue(raw: string): Venue {
  const match = /^([^(]+?)\s*(?:\(([^)]+)\))?\s*$/.exec(raw);
  const metro = (match?.[1] ?? raw).trim();
  const suburb = match?.[2]?.trim();
  const country = COUNTRY_BY_METRO[metro];
  if (!country) {
    throw new Error(`Unknown host metro: "${metro}" (from ground "${raw}")`);
  }
  return {
    raw,
    metro,
    suburb: suburb ?? undefined,
    slug: slugify(metro),
    country,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
