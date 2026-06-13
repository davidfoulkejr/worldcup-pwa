import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVenue } from "./venues.js";
import { parseTeamSlot, formatSlot } from "./teams.js";
import { parseKickoff } from "./time.js";

test("parseVenue splits metro and suburb", () => {
  const v = parseVenue("Boston (Foxborough)");
  assert.equal(v.metro, "Boston");
  assert.equal(v.suburb, "Foxborough");
  assert.equal(v.slug, "boston");
  assert.equal(v.country, "USA");
});

test("parseVenue handles metro-only", () => {
  const v = parseVenue("Mexico City");
  assert.equal(v.metro, "Mexico City");
  assert.equal(v.suburb, undefined);
  assert.equal(v.slug, "mexico-city");
  assert.equal(v.country, "Mexico");
});

test("parseVenue keeps slashes in metro slug", () => {
  const v = parseVenue("New York/New Jersey (East Rutherford)");
  assert.equal(v.metro, "New York/New Jersey");
  assert.equal(v.suburb, "East Rutherford");
  assert.equal(v.slug, "new-york-new-jersey");
  assert.equal(v.country, "USA");
});

test("parseTeamSlot recognises group rank placeholders", () => {
  assert.deepEqual(parseTeamSlot("2A"), {
    kind: "groupRank", rank: 2, group: "A",
  });
  assert.deepEqual(parseTeamSlot("3L"), {
    kind: "groupRank", rank: 3, group: "L",
  });
});

test("parseTeamSlot recognises winner/loser placeholders", () => {
  assert.deepEqual(parseTeamSlot("W101"), {
    kind: "matchWinner", matchNum: 101,
  });
  assert.deepEqual(parseTeamSlot("L101"), {
    kind: "matchLoser", matchNum: 101,
  });
});

test("parseTeamSlot recognises FIFA best-thirds slot", () => {
  assert.deepEqual(parseTeamSlot("3A/B/C/D/F"), {
    kind: "thirdPlaceFrom", candidateGroups: ["A", "B", "C", "D", "F"],
  });
});

test("parseTeamSlot treats other strings as confirmed teams", () => {
  assert.deepEqual(parseTeamSlot("Mexico"), {
    kind: "team", name: "Mexico",
  });
  assert.deepEqual(parseTeamSlot("South Korea"), {
    kind: "team", name: "South Korea",
  });
});

test("formatSlot produces readable fallback labels", () => {
  assert.equal(formatSlot({ kind: "team", name: "USA" }), "USA");
  assert.equal(formatSlot({ kind: "groupRank", rank: 2, group: "A" }), "2nd A");
  assert.equal(formatSlot({ kind: "matchWinner", matchNum: 101 }), "Winner #101");
  assert.equal(
    formatSlot({
      kind: "thirdPlaceFrom",
      candidateGroups: ["A", "B", "C", "D", "F"],
    }),
    "3rd from A/B/C/D/F",
  );
});

test("parseKickoff converts local time + offset to UTC", () => {
  const k = parseKickoff("2026-06-11", "13:00 UTC-6");
  assert.equal(k.localDate, "2026-06-11");
  assert.equal(k.localTime, "13:00");
  assert.equal(k.utcOffset, "UTC-6");
  // 13:00 in UTC-6 == 19:00 UTC
  assert.equal(k.utc.toISOString(), "2026-06-11T19:00:00.000Z");
});

test("parseKickoff handles missing offset (assume UTC)", () => {
  const k = parseKickoff("2022-11-20", "19:00");
  assert.equal(k.utcOffset, "UTC");
  assert.equal(k.utc.toISOString(), "2022-11-20T19:00:00.000Z");
});
