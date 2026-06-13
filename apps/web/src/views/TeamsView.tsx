import { useMemo, useState } from "react";
import {
  filterMatches,
  sortMatches,
  type GroupLetter,
  type Match,
  type Tournament,
} from "@worldcup/data";
import { FixtureCard } from "../components/FixtureCard";
import { flagFor } from "../lib/flags";

interface Props {
  tournament: Tournament;
}

interface TeamRow {
  name: string;
  group?: GroupLetter;
}

export function TeamsView({ tournament }: Props) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const teamGroups = useMemo(() => {
    const m = new Map<string, GroupLetter>();
    for (const match of tournament.matches) {
      if (match.stage.kind !== "group") continue;
      if (match.team1.kind === "team")
        m.set(match.team1.name, match.stage.group);
      if (match.team2.kind === "team")
        m.set(match.team2.name, match.stage.group);
    }
    return m;
  }, [tournament.matches]);

  const rows: TeamRow[] = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return tournament.nations
      .filter((n) => !lowered || n.toLowerCase().includes(lowered))
      .map((n) => {
        const g = teamGroups.get(n);
        return g ? { name: n, group: g } : { name: n };
      });
  }, [tournament.nations, teamGroups, query]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white/5 border border-white/5 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${tournament.nations.length} nations…`}
          className="w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none"
        />
      </div>

      <ul className="space-y-2">
        {rows.map((row) => {
          const isOpen = expanded === row.name;
          return (
            <li
              key={row.name}
              className="rounded-xl bg-white/5 border border-white/5 overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.04]"
                onClick={() => setExpanded(isOpen ? null : row.name)}
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-3">
                  {flagFor(row.name) && (
                    <span className="text-2xl leading-none">
                      {flagFor(row.name)}
                    </span>
                  )}
                  <span className="font-medium">{row.name}</span>
                  {row.group && (
                    <span className="text-xs rounded-full bg-pitch/30 px-2 py-0.5 text-white/80">
                      Group {row.group}
                    </span>
                  )}
                </span>
                <span className="text-white/40">{isOpen ? "▴" : "▾"}</span>
              </button>
              {isOpen && <TeamFixtures tournament={tournament} team={row.name} />}
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="rounded-xl bg-white/5 border border-white/5 p-6 text-center text-white/60">
            No teams match "{query}".
          </li>
        )}
      </ul>
    </div>
  );
}

function TeamFixtures({
  tournament,
  team,
}: {
  tournament: Tournament;
  team: string;
}) {
  const matches: Match[] = useMemo(
    () =>
      sortMatches(filterMatches(tournament, { nations: [team] }), "kickoff"),
    [tournament, team],
  );

  if (matches.length === 0) {
    return (
      <div className="px-4 pb-4 text-sm text-white/60">
        No fixtures yet (team may still be pending bracket resolution).
      </div>
    );
  }

  return (
    <ul className="space-y-3 px-4 pb-4 border-t border-white/5 pt-3">
      {matches.map((m) => (
        <li key={m.id}>
          <FixtureCard match={m} />
        </li>
      ))}
    </ul>
  );
}
