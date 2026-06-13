// Maps openfootball nation names to country flag emoji.
//
// Most countries use the standard regional-indicator pair (e.g. "MX" -> 🇲🇽).
// England / Scotland / Wales use the special Unicode tag-sequence flags so
// they render properly on iOS/Android.
//
// The map is keyed by both the canonical name and any historical variants
// the upstream source has used (e.g. "United States" and "USA").

const ISO: Record<string, string> = {
  // Africa
  Algeria: "DZ",
  "Cape Verde": "CV",
  "Cote d'Ivoire": "CI",
  "Côte d'Ivoire": "CI",
  "Ivory Coast": "CI",
  "DR Congo": "CD",
  "DR Kongo": "CD",
  Egypt: "EG",
  Ghana: "GH",
  Morocco: "MA",
  Senegal: "SN",
  "South Africa": "ZA",
  Tunisia: "TN",

  // Americas
  Argentina: "AR",
  Brazil: "BR",
  Canada: "CA",
  Colombia: "CO",
  Curacao: "CW",
  "Curaçao": "CW",
  Ecuador: "EC",
  Haiti: "HT",
  Mexico: "MX",
  Panama: "PA",
  Paraguay: "PY",
  Uruguay: "UY",
  "United States": "US",
  "United States of America": "US",
  USA: "US",

  // Asia
  Iran: "IR",
  Iraq: "IQ",
  Japan: "JP",
  Jordan: "JO",
  Qatar: "QA",
  "Saudi Arabia": "SA",
  "South Korea": "KR",
  Uzbekistan: "UZ",

  // Europe (regular)
  Austria: "AT",
  Belgium: "BE",
  "Bosnia & Herzegovina": "BA",
  "Bosnia and Herzegovina": "BA",
  Croatia: "HR",
  "Czech Republic": "CZ",
  Czechia: "CZ",
  France: "FR",
  Germany: "DE",
  Netherlands: "NL",
  Norway: "NO",
  Portugal: "PT",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Turkey: "TR",
  Türkiye: "TR",

  // Oceania
  Australia: "AU",
  "New Zealand": "NZ",
};

// Special tag-sequence flags for UK subdivisions.
const SUBDIVISION_FLAGS: Record<string, string> = {
  England: "🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
  Scotland: "🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  Wales: "🏴\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
};

const REGIONAL_OFFSET = 0x1f1a5; // 'A' (0x41) -> 🇦 (0x1F1E6)

function iso2ToFlag(iso2: string): string {
  if (iso2.length !== 2) return "";
  const a = iso2.charCodeAt(0);
  const b = iso2.charCodeAt(1);
  return String.fromCodePoint(a + REGIONAL_OFFSET, b + REGIONAL_OFFSET);
}

/** Returns the flag emoji for a nation, or an empty string if unknown. */
export function flagFor(team: string): string {
  const sub = SUBDIVISION_FLAGS[team];
  if (sub) return sub;
  const iso = ISO[team];
  if (!iso) return "";
  return iso2ToFlag(iso);
}

/** "🇲🇽 Mexico" -- handy for inline labels. */
export function teamWithFlag(team: string): string {
  const f = flagFor(team);
  return f ? `${f} ${team}` : team;
}
