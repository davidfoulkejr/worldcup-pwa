import type { GroupLetter, TeamSlot } from "./model.js";

const GROUP_LETTERS: GroupLetter[] = [
  "A","B","C","D","E","F","G","H","I","J","K","L",
];
const GROUP_LETTER_SET = new Set<string>(GROUP_LETTERS);

/**
 * Resolve a raw team string from openfootball.
 *
 * Group-stage matches have real nation names ("Mexico", "South Korea").
 * Knockout matches use placeholders until the bracket fills in:
 *   "1A", "2A", "3A" — finishing position in a group
 *   "W73", "W101"    — winner of a previous match number
 *   "L101"           — loser of a previous match number (3rd-place playoff)
 */
export function parseTeamSlot(raw: string): TeamSlot {
  const groupRank = /^([1-3])([A-L])$/.exec(raw);
  if (groupRank) {
    return {
      kind: "groupRank",
      rank: Number(groupRank[1]),
      group: groupRank[2] as GroupLetter,
    };
  }
  // FIFA "best 8 third-placed teams" R32 slots, e.g. "3A/B/C/D/F".
  const thirds = /^3([A-L](?:\/[A-L])+)$/.exec(raw);
  if (thirds && thirds[1]) {
    const letters = thirds[1].split("/") as GroupLetter[];
    return { kind: "thirdPlaceFrom", candidateGroups: letters };
  }
  const winner = /^W(\d+)$/.exec(raw);
  if (winner) return { kind: "matchWinner", matchNum: Number(winner[1]) };

  const loser = /^L(\d+)$/.exec(raw);
  if (loser) return { kind: "matchLoser", matchNum: Number(loser[1]) };

  // A single uppercase letter A-L would be ambiguous; openfootball does not
  // use that form. Anything else we treat as a confirmed nation name.
  if (raw.length === 1 && GROUP_LETTER_SET.has(raw)) {
    return { kind: "unknown", raw };
  }
  return { kind: "team", name: raw };
}

/** Renders a TeamSlot for UI fallback when bracket isn't yet resolved. */
export function formatSlot(slot: TeamSlot): string {
  switch (slot.kind) {
    case "team": return slot.name;
    case "groupRank": return `${ordinal(slot.rank)} ${slot.group}`;
    case "thirdPlaceFrom":
      return `3rd from ${slot.candidateGroups.join("/")}`;
    case "matchWinner": return `Winner #${slot.matchNum}`;
    case "matchLoser": return `Loser #${slot.matchNum}`;
    case "unknown": return slot.raw;
  }
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export { GROUP_LETTERS };
